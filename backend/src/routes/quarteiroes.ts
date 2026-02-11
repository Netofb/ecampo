import { Router } from 'express';
import {
  listQuarteiroes,
  createQuarteirao,
  updateQuarteirao,
  deleteQuarteirao,
} from '../controllers/quarteiraoController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Quarteirões
router.get('/', authMiddleware, listQuarteiroes);
router.post('/', authMiddleware, createQuarteirao);
router.put('/:id', authMiddleware, updateQuarteirao);
router.delete('/:id', authMiddleware, deleteQuarteirao);

export default router;
