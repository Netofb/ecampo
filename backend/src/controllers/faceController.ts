import { Request, Response } from 'express';
import db from '../database';

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
      .orderBy('f.numero_face', 'asc');

    res.json(faces);
  } catch (error) {
    console.error('List faces error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createFace = async (req: any, res: Response) => {
  try {
    const { numero_face, id_quarteirao, nome_linha, status, linha_geojson, cor_linha, latitude, longitude } = req.body;
    const userId = req.userId;

    if (!numero_face || !id_quarteirao) {
      return res.status(400).json({ error: 'Numero da face e quarteirão são obrigatórios' });
    }

    const user = await db('usuarios').where('id_usuario', userId).first();
    const ibgeUsuario = user?.ibge || null;

    const [result] = await db('tb_faces').insert({
      numero_face,
      id_quarteirao,
      nome_linha,
      id_usuario: userId,
      status: status || 'Ativo',
      ibge_face: ibgeUsuario,
      linha_geojson: linha_geojson ? JSON.stringify(linha_geojson) : null,
      cor_linha: cor_linha || '#3987F6',
      latitude: latitude ?? null,
      longitude: longitude ?? null,
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
    const userId = req.userId;
    const { numero_face, id_quarteirao, nome_linha, status, linha_geojson, cor_linha, latitude, longitude } = req.body;

    const face = await db('tb_faces').where({ id_face: id, id_usuario: userId }).first();

    if (!face) {
      return res.status(404).json({ error: 'Face not found' });
    }

    await db('tb_faces').where({ id_face: id, id_usuario: userId }).update({
      numero_face,
      id_quarteirao,
      nome_linha,
      status,
      linha_geojson: linha_geojson ? JSON.stringify(linha_geojson) : null,
      cor_linha: cor_linha || '#3987F6',
      latitude: latitude ?? null,
      longitude: longitude ?? null,
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
    const userId = req.userId;

    const face = await db('tb_faces').where({ id_face: id, id_usuario: userId }).first();

    if (!face) {
      return res.status(404).json({ error: 'Face not found' });
    }

    await db('tb_faces').where({ id_face: id, id_usuario: userId }).delete();

    res.json({ message: 'Face deleted successfully' });
  } catch (error) {
    console.error('Delete face error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
