import { Request, Response } from 'express';
import db from '../database';

export const syncPush = async (req: Request, res: Response) => {
  try {
    const { op_id, entity, op, server_id, base_version, payload } = req.body;
    const userId = (req as any).userId;

    if (entity !== 'quarteirao') {
      return res.status(400).json({ status: 'error', message: 'Entidade não suportada' });
    }

    let quarteiraoData: Record<string, unknown> | null = null;
    if (op === 'create' || op === 'update') {
      const localidadeId = payload.id_localidade || (payload.localidade_nome
        ? (await db('tb_localidades')
          .where('id_usuario', userId)
          .whereRaw('LOWER(nome_localidade) = LOWER(?)', [payload.localidade_nome])
          .first())?.id_localidade
        : null);
      const zonaId = payload.id_zona || (payload.zona_nome
        ? (await db('tb_zonas')
          .where('id_usuario', userId)
          .whereRaw('LOWER(nome_zona) = LOWER(?)', [payload.zona_nome])
          .first())?.id_zona
        : null);

      if (!payload.nome || !payload.numero || !localidadeId || !zonaId) {
        return res.status(400).json({ status: 'error', message: 'Dados do quarteirão incompletos' });
      }

      quarteiraoData = {
        numero_quadra: payload.numero,
        nome_quadra: payload.nome,
        id_localidade: localidadeId,
        id_zona: zonaId,
        status: payload.status || 'Ativo',
        poligono_geojson: payload.poligono_geojson || null,
        latitude_quadra: payload.latitude ?? null,
        longitude_quadra: payload.longitude ?? null,
        cor_poligono: payload.cor_poligono || '#3388ff',
      };
    }

    if (op === 'create') {
      const result = await db('tb_quarteiroes').insert({
        ...quarteiraoData,
        id_usuario: userId,
        version: 1,
        updated_at: db.fn.now()
      }).returning(['id_quadra', 'version']);

      return res.json({
        status: 'applied',
        server_id: result[0].id_quadra,
        version: result[0].version
      });
    }

    if (op === 'update') {
      const current = await db('tb_quarteiroes')
        .where({ id_quadra: server_id, id_usuario: userId })
        .first();

      if (!current) {
        return res.status(404).json({ status: 'error', message: 'Quarteirão não encontrado' });
      }

      if (base_version < current.version) {
        return res.json({
          status: 'conflict',
          message: 'Versão desatualizada. Sincronize antes de editar.',
          current_version: current.version
        });
      }

      await db('tb_quarteiroes')
        .where({ id_quadra: server_id, id_usuario: userId })
        .update({
          ...quarteiraoData,
          version: db.raw('version + 1'),
          updated_at: db.fn.now()
        });

      const updated = await db('tb_quarteiroes').where({ id_quadra: server_id, id_usuario: userId }).first();

      return res.json({
        status: 'applied',
        server_id: updated.id_quadra,
        version: updated.version
      });
    }

    if (op === 'delete') {
      await db('tb_quarteiroes')
        .where({ id_quadra: server_id, id_usuario: userId })
        .delete();

      return res.json({ status: 'applied' });
    }

    res.status(400).json({ status: 'error', message: 'Operação inválida' });
  } catch (error: any) {
    console.error('Sync push error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const syncPull = async (req: Request, res: Response) => {
  try {
    const { since = '0' } = req.query;
    const userId = (req as any).userId;

    const changes = await db('tb_quarteiroes')
      .where('id_usuario', userId)
      .where('updated_at', '>', new Date(parseInt(since as string)))
      .orderBy('updated_at', 'asc')
      .limit(100);

    const cursor = changes.length > 0
      ? new Date(changes[changes.length - 1].updated_at).getTime().toString()
      : since;

    res.json({
      changes: changes.map(q => ({
        op: 'upsert',
        server_id: q.id_quadra,
        data: {
          id_quadra: q.id_quadra,
          nome_quadra: q.nome_quadra,
          numero_quadra: q.numero_quadra,
          id_localidade: q.id_localidade,
          id_zona: q.id_zona,
          status: q.status,
          poligono_geojson: q.poligono_geojson,
          latitude_quadra: q.latitude_quadra,
          longitude_quadra: q.longitude_quadra,
          cor_poligono: q.cor_poligono,
          version: q.version || 0,
          updated_at: q.updated_at
        }
      })),
      cursor
    });
  } catch (error: any) {
    console.error('Sync pull error:', error);
    res.status(500).json({ error: error.message });
  }
};
