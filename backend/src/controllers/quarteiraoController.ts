import { Request, Response } from 'express';
import db from '../database';

// ===== QUARTEIRÕES =====
export const listQuarteiroes = async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    
    const quarteiroes = await db('tb_quarteiroes as q')
      .leftJoin('tb_localidades as l', 'q.id_localidade', 'l.id_localidade')
      .leftJoin('tb_zonas as z', 'q.id_zona', 'z.id_zona')
      .leftJoin(
        db('producao')
          .select('id_quarteirao')
          .count('* as total_producoes')
          .groupBy('id_quarteirao')
          .as('p'),
        'q.id_quadra',
        'p.id_quarteirao'
      )
      .where('q.id_usuario', userId)
      .select(
        'q.*',
        'l.nome_localidade',
        'z.nome_zona',
        db.raw('COALESCE(p.total_producoes, 0) as total_producoes')
      )
      .orderBy('q.id_quadra', 'asc');
    res.json(quarteiroes);
  } catch (error: any) {
    console.error('Erro ao listar quarteirões:', error.message);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

export const createQuarteirao = async (req: any, res: Response) => {
  try {
    const { numero, nome, id_localidade, id_zona, status, poligono_geojson, latitude, longitude, cor_poligono } = req.body;
    const userId = req.userId;

    if (!numero || !nome) {
      return res.status(400).json({ error: 'Numero and nome are required' });
    }

    const [result] = await db('tb_quarteiroes').insert({
      numero_quadra: numero,
      nome_quadra: nome,
      id_localidade,
      id_zona,
      id_usuario: userId,
      status: status || 'Ativo',
      poligono_geojson,
      latitude_quadra: latitude,
      longitude_quadra: longitude,
      cor_poligono: cor_poligono || '#3388ff',
    }).returning('id_quadra');

    res.status(201).json({
      id: result,
      message: 'Quarteirao created successfully',
    });
  } catch (error) {
    console.error('Create quarteirao error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateQuarteirao = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { numero, nome, id_localidade, id_zona, status, poligono_geojson, latitude, longitude, cor_poligono } = req.body;

    const quarteirao = await db('tb_quarteiroes')
      .where('id_quadra', id)
      .first();

    if (!quarteirao) {
      return res.status(404).json({ error: 'Quarteirao not found' });
    }

    await db('tb_quarteiroes').where('id_quadra', id).update({
      numero_quadra: numero,
      nome_quadra: nome,
      id_localidade,
      id_zona,
      status,
      poligono_geojson,
      latitude_quadra: latitude,
      longitude_quadra: longitude,
      cor_poligono,
    });

    res.json({ message: 'Quarteirao updated successfully' });
  } catch (error) {
    console.error('Update quarteirao error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteQuarteirao = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    const quarteirao = await db('tb_quarteiroes')
      .where('id_quadra', id)
      .first();

    if (!quarteirao) {
      return res.status(404).json({ error: 'Quarteirao not found' });
    }

    await db('tb_quarteiroes').where('id_quadra', id).delete();

    res.json({ message: 'Quarteirao deleted successfully' });
  } catch (error) {
    console.error('Delete quarteirao error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ===== FACES =====
export const listFaces = async (req: any, res: Response) => {
  try {
    const faces = await db('tb_faces')
      .orderBy('id', 'asc');

    res.json(faces);
  } catch (error) {
    console.error('List faces error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createFace = async (req: any, res: Response) => {
  try {
    const { quarteirao_id, numero, lado_id, descricao } = req.body;

    if (!quarteirao_id || !numero) {
      return res.status(400).json({ error: 'Quarteirao ID and numero are required' });
    }

    const [id] = await db('tb_faces').insert({
      quarteirao_id,
      numero,
      lado_id,
      descricao,
      created_at: new Date(),
    });

    res.status(201).json({
      id,
      message: 'Face created successfully',
    });
  } catch (error) {
    console.error('Create face error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ===== IMÓVEIS =====
export const listImoveis = async (req: any, res: Response) => {
  try {
    const imoveis = await db('tb_imoveis')
      .orderBy('id', 'asc');

    res.json(imoveis);
  } catch (error) {
    console.error('List imoveis error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createImovel = async (req: any, res: Response) => {
  try {
    const { face_id, numero, logradouro_id, proprietario, status, descricao } = req.body;

    if (!face_id || !numero) {
      return res.status(400).json({ error: 'Face ID and numero are required' });
    }

    const [id] = await db('tb_imoveis').insert({
      face_id,
      numero,
      logradouro_id,
      proprietario,
      status: status || 'Ativo',
      descricao,
      created_at: new Date(),
    });

    res.status(201).json({
      id,
      message: 'Imovel created successfully',
    });
  } catch (error) {
    console.error('Create imovel error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ===== LOCALIDADES =====
export const listLocalidades = async (req: any, res: Response) => {
  try {
    const localidades = await db('tb_localidades')
      .orderBy('id', 'asc');

    res.json(localidades);
  } catch (error) {
    console.error('List localidades error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createLocalidade = async (req: any, res: Response) => {
  try {
    const { nome, descricao } = req.body;

    if (!nome) {
      return res.status(400).json({ error: 'Nome is required' });
    }

    const [id] = await db('tb_localidades').insert({
      nome,
      descricao,
      created_at: new Date(),
    });

    res.status(201).json({
      id,
      message: 'Localidade created successfully',
    });
  } catch (error) {
    console.error('Create localidade error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ===== ZONAS =====
export const listZonas = async (req: any, res: Response) => {
  try {
    const zonas = await db('tb_zonas')
      .orderBy('id', 'asc');

    res.json(zonas);
  } catch (error) {
    console.error('List zonas error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
