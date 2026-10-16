import { Router } from 'express';
import { placeTrade, getTradeHistory } from '../controllers/tradeController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.post('/', placeTrade);
router.get('/history', getTradeHistory);

export default router;
