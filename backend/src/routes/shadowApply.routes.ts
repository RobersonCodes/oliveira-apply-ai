import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requirePlan } from '../middlewares/plan.middleware';
import { shadowApplyController } from '../controllers/shadowApply.controller';

const router = Router();
router.use(authenticate);
router.use(requirePlan('PRO'));

router.post('/persona', shadowApplyController.generatePersona);
router.post('/receptivity', shadowApplyController.analyzeReceptivity);
router.post('/full-analysis', shadowApplyController.fullAnalysis);

export default router;
