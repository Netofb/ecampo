import { Request, Response } from 'express';
import db from '../database';

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

export const updateLocalidade = async (req: any, res: Response) => {
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

export const deleteLocalidade = async (req: any, res: Response) => {
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

export const createZona = async (req: any, res: Response) => {
  try {
    const { nome, descricao } = req.body;

    if (!nome) {
      return res.status(400).json({ error: 'Nome is required' });
    }

    const [id] = await db('tb_zonas').insert({
      nome,
      descricao,
      created_at: new Date(),
    });

    res.status(201).json({
      id,
      message: 'Zona created successfully',
    });
  } catch (error) {
    console.error('Create zona error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
