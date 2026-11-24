import { Request, Response } from 'express';
import db from '../database';

export const syncPush = async (req: Request, res: Response) => {
  try {
    const { op_id, entity, op, server_id, base_version, payload } = req.body;
    const userId = (req as any).userId;

    if (entity === 'face') {
      if (!['create', 'update'].includes(op)) {
        return res.status(400).json({ status: 'error', message: 'Operação de face inválida' });
      }
      if (!payload?.numero_face || !payload?.id_quarteirao) {
        return res.status(400).json({ status: 'error', message: 'Número da face e quarteirão são obrigatórios' });
      }
      const quarteirao = await db('tb_quarteiroes').where({ id_quadra: payload.id_quarteirao, id_usuario: userId }).first();
      if (!quarteirao) return res.status(400).json({ status: 'error', message: 'O quarteirão da face não pertence ao usuário' });
      const user = await db('usuarios').select('ibge').where('id_usuario', userId).first();
      const faceData = {
        numero_face: Number(payload.numero_face),
        id_quarteirao: Number(payload.id_quarteirao),
        nome_linha: payload.nome_linha || null,
        status: payload.status || 'Ativo',
        linha_geojson: payload.linha_geojson ? JSON.stringify(payload.linha_geojson) : null,
        cor_linha: payload.cor_linha || '#3987F6',
        latitude: payload.latitude ?? null,
        longitude: payload.longitude ?? null,
      };

      if (op === 'create') {
        const [face] = await db('tb_faces').insert({
          ...faceData,
          id_usuario: userId,
          ibge_face: user?.ibge || null,
        }).returning('id_face');
        return res.json({ status: 'applied', server_id: face.id_face ?? face });
      }

      const currentFace = await db('tb_faces').where({ id_face: server_id, id_usuario: userId }).first();
      if (!currentFace) return res.status(404).json({ status: 'error', message: 'Face não encontrada para atualização' });
      await db('tb_faces').where({ id_face: server_id, id_usuario: userId }).update(faceData);
      return res.json({ status: 'applied', server_id });
    }

    if (entity === 'producao') {
      if (op !== 'create') return res.status(400).json({ status: 'error', message: 'Operação de atividade inválida' });
      if (!payload?.id_quarteirao || !payload?.atividade || !payload?.data_atividade || !payload?.ciclo_ano) {
        return res.status(400).json({ status: 'error', message: 'Quarteirão, atividade, data e ciclo/ano são obrigatórios' });
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(payload.data_atividade))) {
        return res.status(400).json({ status: 'error', message: 'Data da atividade inválida' });
      }
      const quarteirao = await db('tb_quarteiroes').where({ id_quadra: payload.id_quarteirao, id_usuario: userId }).first();
      if (!quarteirao) return res.status(400).json({ status: 'error', message: 'O quarteirão da atividade não pertence ao usuário' });
      if (payload.id_face) {
        const face = await db('tb_faces').where({ id_face: payload.id_face, id_quarteirao: payload.id_quarteirao, id_usuario: userId }).first();
        if (!face) return res.status(400).json({ status: 'error', message: 'A face selecionada não pertence ao quarteirão' });
      }
      if (payload.id_imovel) {
        const imovelQuery = db('tb_imoveis as i')
          .join('tb_faces as f', 'i.id_face', 'f.id_face')
          .where('i.id_imovel', payload.id_imovel)
          .where('i.id_usuario', userId)
          .where('f.id_quarteirao', payload.id_quarteirao)
          .where('f.id_usuario', userId);
        if (payload.id_face) imovelQuery.where('i.id_face', payload.id_face);
        const imovel = await imovelQuery.first();
        if (!imovel) return res.status(400).json({ status: 'error', message: 'O imóvel selecionado não pertence ao usuário' });
      }

      const user = await db('usuarios').select('ibge').where('id_usuario', userId).first();
      const productionData: Record<string, unknown> = {
        id_quarteirao: Number(payload.id_quarteirao),
        seq: payload.seq == null ? null : Number(payload.seq),
        id_face: payload.id_face == null ? null : Number(payload.id_face),
        id_imovel: payload.id_imovel == null ? null : Number(payload.id_imovel),
        hora_visita: payload.hora_visita || null,
        visita_n_r: payload.visita_n_r || null,
        pendencia: payload.pendencia || null,
        imovel_insp: payload.imovel_insp ?? null,
        nu_amostra_ini: Number(payload.nu_amostra_ini) || 0,
        nu_amostra_fim: Number(payload.nu_amostra_fim) || 0,
        qtd_tubitos: Number(payload.qtd_tubitos) || 0,
        depositos_eliminados: Number(payload.depositos_eliminados) || 0,
        a1: Number(payload.a1) || 0,
        a2: Number(payload.a2) || 0,
        b: Number(payload.b) || 0,
        c: Number(payload.c) || 0,
        d1: Number(payload.d1) || 0,
        d2: Number(payload.d2) || 0,
        e: Number(payload.e) || 0,
        imoveis_tratados: Number(payload.imoveis_tratados) || 0,
        larvicida_tipo: payload.larvicida_tipo || null,
        larvicida_qtd_carga: Number(payload.larvicida_qtd_carga) || 0,
        larvicida_qtd_dep_trat: Number(payload.larvicida_qtd_dep_trat) || 0,
        adulticida_tipo: payload.adulticida_tipo || null,
        adulticida_qtd_carga: Number(payload.adulticida_qtd_carga) || 0,
        id_zona: payload.id_zona == null ? quarteirao.id_zona ?? null : Number(payload.id_zona),
        atividade: String(payload.atividade),
        data_atividade: String(payload.data_atividade),
        ciclo_ano: String(payload.ciclo_ano),
        cabecalho_tipo: payload.cabecalho_tipo ?? null,
        cabecalho_zona_concluida: payload.cabecalho_zona_concluida ?? null,
        ibge_producao: user?.ibge || null,
        id_usuario: userId,
        status: 'Ativo',
        latitude: payload.latitude ?? null,
        longitude: payload.longitude ?? null,
        id_localidade: payload.id_localidade == null ? quarteirao.id_localidade ?? null : Number(payload.id_localidade),
      };
      const [production] = await db('producao').insert(productionData).returning('id_producao');
      return res.json({ status: 'applied', server_id: production.id_producao ?? production });
    }

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
