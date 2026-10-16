import { Router } from 'express';
import authRoutes from './auth.routes.js';
import stockRoutes from './stock.routes.js';
import tradeRoutes from './trade.routes.js';
import portfolioRoutes from './portfolio.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/stocks', stockRoutes);
router.use('/trades', tradeRoutes);
router.use('/portfolio', portfolioRoutes);

export default router;
