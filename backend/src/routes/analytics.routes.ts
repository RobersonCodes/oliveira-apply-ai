import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { analyticsController } from '../controllers/analytics.controller';

const router = Router();
router.use(authenticate);

router.get('/dashboard', analyticsController.getDashboard.bind(analyticsController));
router.get('/trend', analyticsController.getApplicationTrend.bind(analyticsController));

export default router;