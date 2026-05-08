import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../database';

// ===== LOCALIDADES =====
export const listLocalidades = async (req: AuthRequest, res: Response) => {
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

export const createLocalidade = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id_usuario, ...payload } = req.body;

    if (!payload.nome) {
      return res.status(400).json({ error: 'Nome is required' });
    }

    const [row] = await db('tb_localidades')
      .insert({ ...payload, id_usuario: userId })
      .returning('*');

    return res.status(201).json(row);
  } catch (error) {
    console.error('Create localidade error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateLocalidade = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { nome, descricao } = req.body;

    const localidade = await db('tb_localidades').where('id', id).first();

    if (!localidade) {
      return res.status(404).json({ error: 'Localidade not found' });
    }

    await db('tb_localidades').where('id', id).update({
      nome,
      descricao,
      updated_at: new Date(),
    });

    res.json({ message: 'Localidade updated successfully' });
  } catch (error) {
    console.error('Update localidade error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteLocalidade = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const localidade = await db('tb_localidades').where('id', id).first();

    if (!localidade) {
      return res.status(404).json({ error: 'Localidade not found' });
    }

    await db('tb_localidades').where('id', id).delete();

    res.json({ message: 'Localidade deleted successfully' });
  } catch (error) {
    console.error('Delete localidade error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ===== ZONAS =====
export const listZonas = async (req: AuthRequest, res: Response) => {
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

export const createZona = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id_usuario, ...payload } = req.body;

    if (!payload.nome) {
      return res.status(400).json({ error: 'Nome is required' });
    }

    const [row] = await db('tb_zonas')
      .insert({ ...payload, id_usuario: userId })
      .returning('*');

    return res.status(201).json(row);
  } catch (error) {
    console.error('Create zona error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
