import { Request, Response } from 'express';
import db from '../database';

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

    if (!face_id || numero === undefined) {
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

export const updateImovel = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { numero, logradouro_id, proprietario, status, descricao } = req.body;

    const imovel = await db('tb_imoveis').where('id', id).first();

    if (!imovel) {
      return res.status(404).json({ error: 'Imovel not found' });
    }

    await db('tb_imoveis').where('id', id).update({
      numero,
      logradouro_id,
      proprietario,
      status,
      descricao,
      updated_at: new Date(),
    });

    res.json({ message: 'Imovel updated successfully' });
  } catch (error) {
    console.error('Update imovel error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteImovel = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    const imovel = await db('tb_imoveis').where('id', id).first();

    if (!imovel) {
      return res.status(404).json({ error: 'Imovel not found' });
    }

    await db('tb_imoveis').where('id', id).delete();

    res.json({ message: 'Imovel deleted successfully' });
  } catch (error) {
    console.error('Delete imovel error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
