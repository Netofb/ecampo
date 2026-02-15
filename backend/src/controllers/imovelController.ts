import { Request, Response } from 'express';
import db from '../database';

// ===== IMÓVEIS =====
export const listImoveis = async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    
    const imoveis = await db('tb_imoveis as i')
      .leftJoin('tb_faces as f', 'i.id_face', 'f.id_face')
      .leftJoin('tb_quarteiroes as q', 'f.id_quarteirao', 'q.id_quadra')
      .where('i.id_usuario', userId)
      .select(
        'i.*',
        'f.numero_face',
        'q.nome_quadra',
        'q.numero_quadra'
      )
      .orderBy('i.id_imovel', 'asc');

    res.json(imoveis);
  } catch (error) {
    console.error('List imoveis error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createImovel = async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    const { id_face, seq1, nome_logradouro, numero, seq, tipo, status } = req.body;

    if (!id_face || !seq1) {
      return res.status(400).json({ error: 'Face e sequência são obrigatórios' });
    }

    const userIbge = await db('usuarios').where('id_usuario', userId).first();

    const [imovel] = await db('tb_imoveis').insert({
      id_face,
      seq1,
      nome_logradouro,
      numero,
      seq,
      tipo,
      status: status || 'Ativo',
      ibge_imovel: userIbge?.ibge,
      id_usuario: userId,
    }).returning('*');

    res.status(201).json(imovel);
  } catch (error) {
    console.error('Create imovel error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateImovel = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { id_face, seq1, nome_logradouro, numero, seq, tipo, status } = req.body;

    const imovel = await db('tb_imoveis').where({ id_imovel: id, id_usuario: userId }).first();

    if (!imovel) {
      return res.status(404).json({ error: 'Imóvel não encontrado' });
    }

    await db('tb_imoveis').where('id_imovel', id).update({
      id_face,
      seq1,
      nome_logradouro,
      numero,
      seq,
      tipo,
      status,
    });

    res.json({ message: 'Imóvel atualizado com sucesso' });
  } catch (error) {
    console.error('Update imovel error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteImovel = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const imovel = await db('tb_imoveis').where({ id_imovel: id, id_usuario: userId }).first();

    if (!imovel) {
      return res.status(404).json({ error: 'Imóvel não encontrado' });
    }

    await db('tb_imoveis').where('id_imovel', id).delete();

    res.json({ message: 'Imóvel excluído com sucesso' });
  } catch (error) {
    console.error('Delete imovel error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
