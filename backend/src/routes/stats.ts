import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import db from '../database';

const router = Router();

router.get('/', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.userId;

    const [quarteiroes, faces, imoveis, localidades] = await Promise.all([
      db('tb_quarteiroes').where('id_usuario', userId).count('* as count').first(),
      db('tb_faces').where('id_usuario', userId).count('* as count').first(),
      db('tb_imoveis').where('id_usuario', userId).count('* as count').first(),
      db('tb_localidades').where('id_usuario', userId).count('* as count').first(),
    ]);

    res.json({
      quarteiroes: Number(quarteiroes?.count || 0),
      faces: Number(faces?.count || 0),
      imoveis: Number(imoveis?.count || 0),
      localidades: Number(localidades?.count || 0),
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
