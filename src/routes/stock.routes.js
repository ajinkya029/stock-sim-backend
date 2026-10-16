import { Router } from 'express';
import { listStocks, getStock } from '../controllers/stockController.js';

const router = Router();

router.get('/', listStocks);
router.get('/:symbol', getStock);

export default router;
