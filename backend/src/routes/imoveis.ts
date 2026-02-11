import { Router } from 'express';
import {
  listImoveis,
  createImovel,
  updateImovel,
  deleteImovel,
} from '../controllers/imovelController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, listImoveis);
router.post('/', authMiddleware, createImovel);
router.put('/:id', authMiddleware, updateImovel);
router.delete('/:id', authMiddleware, deleteImovel);

export default router;
