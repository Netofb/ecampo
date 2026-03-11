import { Router } from 'express';
import { syncPush, syncPull } from '../controllers/syncController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/push', authMiddleware, syncPush);
router.get('/pull', authMiddleware, syncPull);

export default router;
