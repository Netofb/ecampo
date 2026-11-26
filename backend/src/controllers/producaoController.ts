import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../database';

export const getOpcoesProducao = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await db('usuarios').select('ibge').where('id_usuario', userId).first();
    const atividades = await db('tb_atividades')
      .select('id_atividade', 'co_atividade', 'nome_atividade')
      .orderBy('nome_atividade', 'asc');

    const distinctProductionValues = async (column: string): Promise<string[]> => {
      const rows = await db('producao')
        .select(column)
        .where('id_usuario', userId)
        .whereRaw("LOWER(TRIM(status::text)) = 'ativo'")
        .whereNotNull(column)
        .whereRaw('TRIM(CAST(?? AS TEXT)) <> ?', [column, ''])
        .distinct(column)
        .orderBy(column, 'asc');
      return rows.map((row: Record<string, unknown>) => String(row[column]));
    };

    const distinctActiveTypes = async (table: string, typeColumn: string, ibgeColumn: string): Promise<string[]> => {
      const query = db(table)
        .select(db.raw('TRIM(CAST(?? AS TEXT)) AS tipo', [typeColumn]))
        .whereRaw('LOWER(TRIM(CAST(status AS TEXT))) = ?', ['ativo'])
        .whereRaw('?? IS NOT NULL', [typeColumn])
        .whereRaw('TRIM(CAST(?? AS TEXT)) <> ?', [typeColumn, ''])
        .distinct()
        .orderBy('tipo', 'asc');
      if (user?.ibge) query.whereRaw('TRIM(CAST(?? AS TEXT)) = ?', [ibgeColumn, String(user.ibge).trim()]);
      const rows = await query;
      return rows.map((row: Record<string, unknown>) => String(row.tipo).trim()).filter(Boolean);
    };

    const activeLarvicidas = async () => {
      const query = db('tb_larvicidas')
        .select('id_larvicida')
        .select(db.raw('TRIM(CAST(tipo_larvicida AS TEXT)) AS tipo_larvicida'))
        .select(db.raw('TRIM(CAST(nome_larvicida AS TEXT)) AS nome_larvicida'))
        .whereRaw('LOWER(TRIM(CAST(status AS TEXT))) = ?', ['ativo'])
        .whereNotNull('nome_larvicida')
        .whereRaw('TRIM(CAST(nome_larvicida AS TEXT)) <> ?', [''])
        .orderBy('nome_larvicida', 'asc');
      if (user?.ibge) query.whereRaw('TRIM(CAST(ibge_larvicida AS TEXT)) = ?', [String(user.ibge).trim()]);
      return query;
    };

    const [ciclosExistentes, tipos, zonasConcluidas, visitas, pendencias, imoveisInspecionados, larvicidas, adulticidas] = await Promise.all([
      distinctProductionValues('ciclo_ano'),
      distinctProductionValues('cabecalho_tipo'),
      distinctProductionValues('cabecalho_zona_concluida'),
      distinctProductionValues('visita_n_r'),
      distinctProductionValues('pendencia'),
      distinctProductionValues('imovel_insp'),
      activeLarvicidas(),
      distinctActiveTypes('tb_adulticidas', 'tipo_adulticida', 'ibge_adulticida'),
    ]);

    const anosCiclo = new Set<number>([new Date().getFullYear()]);
    ciclosExistentes.forEach((ciclo) => {
      const ano = ciclo.match(/(?:19|20)\d{2}/)?.[0];
      if (ano) anosCiclo.add(Number(ano));
    });
    const ciclos = Array.from(anosCiclo)
      .sort((a, b) => b - a)
      .flatMap((ano) => Array.from({ length: 6 }, (_, index) => `${String(index + 1).padStart(2, '0')}/${ano}`));

    return res.json({ atividades, ciclos, tipos, zonasConcluidas, visitas, pendencias, imoveisInspecionados, larvicidas, adulticidas });
  } catch (error) {
    console.error('Get production options error:', error);
    return res.status(500).json({ error: 'Não foi possível carregar as opções de produção' });
  }
};

export const getRelatorioProducao = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await db('usuarios')
      .select('nome_usuario', 'ibge')
      .where('id_usuario', userId)
      .first();

    const query = db('producao as p')
      .leftJoin('tb_atividades as a', db.raw("a.id_atividade::text = TRIM(p.atividade::text) AND TRIM(a.ibge_atividade::text) = TRIM(p.ibge_producao::text)"))
      .leftJoin('tb_quarteiroes as q', db.raw("q.id_quadra = p.id_quarteirao AND TRIM(q.ibge_quadra::text) = TRIM(p.ibge_producao::text)"))
      .leftJoin('tb_faces as f', db.raw("f.id_face = p.id_face AND TRIM(f.ibge_face::text) = TRIM(p.ibge_producao::text)"))
      .leftJoin('tb_imoveis as i', db.raw("i.id_imovel = p.id_imovel AND TRIM(i.ibge_imovel::text) = TRIM(p.ibge_producao::text)"))
      .leftJoin('tb_localidades as l', db.raw("l.id_localidade = p.id_localidade AND TRIM(l.ibge_localidade::text) = TRIM(p.ibge_producao::text)"))
      .leftJoin('tb_zonas as z', db.raw("z.id_zona = p.id_zona AND TRIM(z.ibge_zona::text) = TRIM(p.ibge_producao::text)"))
      .where('p.id_usuario', userId)
      .whereRaw("LOWER(TRIM(p.status::text)) = 'ativo'")
      .select(
        'p.*',
        'a.nome_atividade',
        'q.numero_quadra',
        'q.nome_quadra',
        'f.numero_face',
        'i.nome_logradouro',
        'i.numero as numero_imovel',
        'i.seq as seq_imovel',
        'i.complemento',
        'i.tipo as tipo_imovel',
        'l.co_localidade',
        'l.nome_localidade',
        'z.co_zona',
        'z.nome_zona'
      )
      .orderBy('p.data_atividade', 'asc')
      .orderBy('p.hora_visita', 'asc')
      .orderBy('p.id_producao', 'asc');

    if (user?.ibge) query.whereRaw('TRIM(p.ibge_producao::text) = ?', [String(user.ibge).trim()]);

    const { ano, ciclo, atividade, quarteirao, face, imovel, dataInicial, dataFinal } = req.query;
    if (ano) {
      if (!/^\d{4}$/.test(String(ano))) return res.status(400).json({ error: 'Ano inválido' });
      query.whereRaw('RIGHT(TRIM(p.ciclo_ano::text), 4) = ?', [String(ano)]);
    }
    if (ciclo) query.whereRaw('TRIM(p.ciclo_ano::text) = ?', [String(ciclo).trim()]);
    if (atividade) query.whereRaw('TRIM(p.atividade::text) = ?', [String(atividade).trim()]);
    if (quarteirao) {
      if (!/^\d+$/.test(String(quarteirao))) return res.status(400).json({ error: 'Quarteirão inválido' });
      query.where('p.id_quarteirao', Number(quarteirao));
    }
    if (face) {
      if (!/^\d+$/.test(String(face))) return res.status(400).json({ error: 'Face inválida' });
      query.where('p.id_face', Number(face));
    }
    if (imovel) {
      if (!/^\d+$/.test(String(imovel))) return res.status(400).json({ error: 'Imóvel inválido' });
      query.where('p.id_imovel', Number(imovel));
    }
    if (dataInicial) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dataInicial))) return res.status(400).json({ error: 'Data inicial inválida' });
      query.where('p.data_atividade', '>=', String(dataInicial));
    }
    if (dataFinal) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dataFinal))) return res.status(400).json({ error: 'Data final inválida' });
      query.where('p.data_atividade', '<=', String(dataFinal));
    }

    const registros = await query;
    return res.json({ registros, agente: user?.nome_usuario || '', ibge: user?.ibge || '' });
  } catch (error) {
    console.error('Get production report error:', error);
    return res.status(500).json({ error: 'Não foi possível gerar o relatório de atividades' });
  }
};
