import { Request, Response } from 'express';
import db from '../database';

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

    if (!quarteirao_id || numero === undefined) {
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

export const updateFace = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { numero, lado_id, descricao } = req.body;

    const face = await db('tb_faces').where('id', id).first();

    if (!face) {
      return res.status(404).json({ error: 'Face not found' });
    }

    await db('tb_faces').where('id', id).update({
      numero,
      lado_id,
      descricao,
      updated_at: new Date(),
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

    const face = await db('tb_faces').where('id', id).first();

    if (!face) {
      return res.status(404).json({ error: 'Face not found' });
    }

    await db('tb_faces').where('id', id).delete();

    res.json({ message: 'Face deleted successfully' });
  } catch (error) {
    console.error('Delete face error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
