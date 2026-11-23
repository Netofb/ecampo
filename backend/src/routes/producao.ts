import { Router } from 'express';
import { getOpcoesProducao, getRelatorioProducao } from '../controllers/producaoController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/opcoes', authMiddleware, getOpcoesProducao);
router.get('/relatorio', authMiddleware, getRelatorioProducao);

export default router;
