import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requirePlan } from '../middlewares/plan.middleware';
import { recruiterVisionController } from '../controllers/recruiterVision.controller';

const router = Router();
router.use(authenticate);
router.use(requirePlan('PRO'));

router.post('/analyze', recruiterVisionController.analyze);
router.post('/detect', recruiterVisionController.detect);
router.post('/score', recruiterVisionController.score);
router.get('/ats-list', recruiterVisionController.getSupportedATS);

export default router;
