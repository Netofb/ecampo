import { Request, Response } from 'express';
import db from '../database';

// Retry helper para erros de conexão terminada
const withRetry = async <T>(fn: () => Promise<T>, retries = 2): Promise<T> => {
  try {
    return await fn();
  } catch (err: any) {
    const isConnErr = err.message?.includes('Connection terminated') ||
      err.message?.includes('connection timeout') ||
      err.code === 'ECONNRESET';
    if (isConnErr && retries > 0) {
      await new Promise(r => setTimeout(r, 300));
      return withRetry(fn, retries - 1);
    }
    throw err;
  }
};

// ===== QUARTEIRÕES =====
export const listQuarteiroes = async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    const quarteiroes = await withRetry(() =>
      db('tb_quarteiroes as q')
        .leftJoin('tb_localidades as l', 'q.id_localidade', 'l.id_localidade')
        .leftJoin('tb_zonas as z', 'q.id_zona', 'z.id_zona')
        .where('q.id_usuario', userId)
        .select('q.*', 'l.nome_localidade', 'z.nome_zona')
        .orderBy('q.id_quadra', 'asc')
    );
    res.json(quarteiroes);
  } catch (error: any) {
    console.error('Erro ao listar quarteirões:', error.message);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

export const createQuarteirao = async (req: any, res: Response) => {
  try {
    const { numero, nome, id_localidade, id_zona, localidade_nome, zona_nome, status, poligono_geojson, latitude, longitude, cor_poligono } = req.body;
    const userId = req.userId;

    if (!numero || !nome) {
      return res.status(400).json({ error: 'Numero e nome são obrigatórios' });
    }

    let localidadeId = id_localidade;
    let zonaId = id_zona;

    // Se recebeu nome da localidade, buscar o ID
    if (localidade_nome && !id_localidade) {
      const localidade = await db('tb_localidades')
        .whereRaw('LOWER(nome_localidade) = LOWER(?)', [localidade_nome])
        .where('id_usuario', userId)
        .first();
      
      if (localidade) {
        localidadeId = localidade.id_localidade;
      }
    }

    // Se recebeu nome da zona, buscar o ID
    if (zona_nome && !id_zona) {
      const zona = await db('tb_zonas')
        .whereRaw('LOWER(nome_zona) = LOWER(?)', [zona_nome])
        .where('id_usuario', userId)
        .first();
      
      if (zona) {
        zonaId = zona.id_zona;
      }
    }

    if (!localidadeId || !zonaId) {
      return res.status(400).json({ error: 'Localidade ou zona não encontrada' });
    }

    // Buscar IBGE do usuário
    const user = await db('usuarios').where('id_usuario', userId).first();
    const ibgeUsuario = user?.ibge || null;

    const [result] = await db('tb_quarteiroes').insert({
      numero_quadra: numero,
      nome_quadra: nome,
      id_localidade: localidadeId,
      id_zona: zonaId,
      id_usuario: userId,
      status: status || 'Ativo',
      ibge_quadra: ibgeUsuario,
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
    const userId = req.userId;

    const quarteirao = await db('tb_quarteiroes')
      .where('id_quadra', id)
      .first();

    if (!quarteirao) {
      return res.status(404).json({ error: 'Quarteirao not found' });
    }

    // Buscar IBGE do usuário (mantém o IBGE original ou atualiza se necessário)
    const user = await db('usuarios').where('id_usuario', userId).first();
    const ibgeUsuario = user?.ibge || quarteirao.ibge_quadra;

    await db('tb_quarteiroes').where('id_quadra', id).update({
      numero_quadra: numero,
      nome_quadra: nome,
      id_localidade,
      id_zona,
      status,
      ibge_quadra: ibgeUsuario,
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
    const userId = req.userId;
    
    const faces = await db('tb_faces as f')
      .leftJoin('tb_quarteiroes as q', 'f.id_quarteirao', 'q.id_quadra')
      .where('f.id_usuario', userId)
      .select(
        'f.*',
        'q.nome_quadra',
        'q.numero_quadra'
      )
      .orderBy('f.id_face', 'asc');

    res.json(faces);
  } catch (error) {
    console.error('List faces error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createFace = async (req: any, res: Response) => {
  try {
    const { numero_face, id_quarteirao, status } = req.body;
    const userId = req.userId;

    if (!numero_face || !id_quarteirao) {
      return res.status(400).json({ error: 'Numero da face e quarteirão são obrigatórios' });
    }

    const user = await db('usuarios').where('id_usuario', userId).first();
    const ibgeUsuario = user?.ibge || null;

    const [result] = await db('tb_faces').insert({
      numero_face,
      id_quarteirao,
      id_usuario: userId,
      status: status || 'Ativo',
      ibge_face: ibgeUsuario,
    }).returning('id_face');

    res.status(201).json({
      id: result,
      message: 'Face created successfully',
    });
  } catch (error) {
    console.error('Create face error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateFace = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { numero_face, id_quarteirao, status } = req.body;
    const userId = req.userId;

    const face = await db('tb_faces').where('id_face', id).first();

    if (!face) {
      return res.status(404).json({ error: 'Face not found' });
    }

    await db('tb_faces').where('id_face', id).update({
      numero_face,
      id_quarteirao,
      status,
    });

    res.json({ message: 'Face updated successfully' });
  } catch (error) {
    console.error('Update face error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteFace = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    const face = await db('tb_faces').where('id_face', id).first();

    if (!face) {
      return res.status(404).json({ error: 'Face not found' });
    }

    await db('tb_faces').where('id_face', id).delete();

    res.json({ message: 'Face deleted successfully' });
  } catch (error) {
    console.error('Delete face error:', error);
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
    const userId = req.userId;
    const localidades = await db('tb_localidades')
      .where('id_usuario', userId)
      .orderBy('nome_localidade', 'asc');

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
    const userId = req.userId;
    const zonas = await db('tb_zonas')
      .where('id_usuario', userId)
      .orderBy('nome_zona', 'asc');

    res.json(zonas);
  } catch (error) {
    console.error('List zonas error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
