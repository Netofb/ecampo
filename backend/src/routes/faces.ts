import { Router } from 'express';
import { listFaces, createFace, updateFace, deleteFace } from '../controllers/faceController';
import { getFacesMap } from '../controllers/mapController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, listFaces);
router.post('/', authMiddleware, createFace);
router.put('/:id', authMiddleware, updateFace);
router.delete('/:id', authMiddleware, deleteFace);
router.get('/map', authMiddleware, getFacesMap);

export default router;
