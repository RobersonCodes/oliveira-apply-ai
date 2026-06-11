// src/routes/onboarding.routes.ts
import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { onboardingController } from '../controllers/onboarding.controller';

const router = Router();
router.use(authenticate);

router.get('/status',      onboardingController.getStatus);
router.post('/complete',   onboardingController.complete);
router.put('/preferences', onboardingController.updatePreferences);

export default router;
