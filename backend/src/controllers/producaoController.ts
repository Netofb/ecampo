import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../database';

export const getOpcoesProducao = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await db('usuarios').select('ibge').where('id_usuario', userId).first();
    const activitiesQuery = db('tb_atividades')
      .select('id_atividade', 'co_atividade', 'nome_atividade')
      .orderBy('nome_atividade', 'asc');
    if (user?.ibge) activitiesQuery.where('ibge_atividade', user.ibge);

    const distinctProductionValues = async (column: string): Promise<string[]> => {
      const rows = await db('producao')
        .select(column)
        .where('id_usuario', userId)
        .whereNotNull(column)
        .whereRaw('TRIM(CAST(?? AS TEXT)) <> ?', [column, ''])
        .distinct(column)
        .orderBy(column, 'asc');
      return rows.map((row: Record<string, unknown>) => String(row[column]));
    };

    const [atividades, ciclos, tipos, zonasConcluidas, visitas, pendencias] = await Promise.all([
      activitiesQuery,
      distinctProductionValues('ciclo_ano'),
      distinctProductionValues('cabecalho_tipo'),
      distinctProductionValues('cabecalho_zona_concluida'),
      distinctProductionValues('visita_n_r'),
      distinctProductionValues('pendencia'),
    ]);

    return res.json({ atividades, ciclos, tipos, zonasConcluidas, visitas, pendencias });
  } catch (error) {
    console.error('Get production options error:', error);
    return res.status(500).json({ error: 'Não foi possível carregar as opções de produção' });
  }
};
