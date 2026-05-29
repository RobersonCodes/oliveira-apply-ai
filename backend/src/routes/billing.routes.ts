import { Router } from 'express';
import express from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { billingController } from '../controllers/billing.controller';

const router = Router();

// Stripe webhook needs raw body
router.post('/webhook', express.raw({ type: 'application/json' }), billingController.handleWebhook);

router.use(authenticate);
router.post('/checkout', billingController.createCheckoutSession);
router.post('/portal', billingController.createPortalSession);
router.get('/subscription', billingController.getSubscription);

export default router;
