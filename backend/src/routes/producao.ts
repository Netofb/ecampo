import { Router } from 'express';
import { getOpcoesProducao } from '../controllers/producaoController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/opcoes', authMiddleware, getOpcoesProducao);

export default router;
