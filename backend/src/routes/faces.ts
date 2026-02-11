import { Router } from 'express';
import {
  listFaces,
  createFace,
  updateFace,
  deleteFace,
} from '../controllers/faceController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, listFaces);
router.post('/', authMiddleware, createFace);
router.put('/:id', authMiddleware, updateFace);
router.delete('/:id', authMiddleware, deleteFace);

export default router;
