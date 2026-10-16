import { Router } from 'express';
import { getPortfolio } from '../controllers/portfolioController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/', getPortfolio);

export default router;
