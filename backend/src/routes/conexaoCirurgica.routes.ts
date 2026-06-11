import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requirePlan } from '../middlewares/plan.middleware';
import { conexaoCirurgicaController } from '../controllers/conexaoCirurgica.controller';

const router = Router();
router.use(authenticate);
router.use(requirePlan('PRO'));

router.post('/strategy', conexaoCirurgicaController.createStrategy);
router.post('/comment', conexaoCirurgicaController.generateComment);

export default router;
