import { Router } from 'express';
import {
  listLocalidades,
  createLocalidade,
  updateLocalidade,
  deleteLocalidade,
  listZonas,
  createZona,
} from '../controllers/localidadeController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Localidades
router.get('/', authMiddleware, listLocalidades);
router.post('/', authMiddleware, createLocalidade);
router.put('/:id', authMiddleware, updateLocalidade);
router.delete('/:id', authMiddleware, deleteLocalidade);

// Zonas
router.get('/zonas', authMiddleware, listZonas);
router.post('/zonas', authMiddleware, createZona);

export default router;
