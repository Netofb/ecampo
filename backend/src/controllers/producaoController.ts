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

    const [ciclos, tipos, zonasConcluidas, visitas, pendencias, imoveisInspecionados, larvicidas, adulticidas] = await Promise.all([
      distinctProductionValues('ciclo_ano'),
      distinctProductionValues('cabecalho_tipo'),
      distinctProductionValues('cabecalho_zona_concluida'),
      distinctProductionValues('visita_n_r'),
      distinctProductionValues('pendencia'),
      distinctProductionValues('imovel_insp'),
      distinctActiveTypes('tb_larvicidas', 'tipo_larvicida', 'ibge_larvicida'),
      distinctActiveTypes('tb_adulticidas', 'tipo_adulticida', 'ibge_adulticida'),
    ]);

    return res.json({ atividades, ciclos, tipos, zonasConcluidas, visitas, pendencias, imoveisInspecionados, larvicidas, adulticidas });
  } catch (error) {
    console.error('Get production options error:', error);
    return res.status(500).json({ error: 'Não foi possível carregar as opções de produção' });
  }
};
