import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { billingController } from '../controllers/billing.controller';

const router = Router();

// O webhook (POST /api/billing/webhook) é registrado direto em server.ts, antes
// do express.json() global, porque precisa do corpo cru pra validar a assinatura
// da Stripe. Não duplicar a rota aqui.

router.use(authenticate);
router.post('/checkout', billingController.createCheckoutSession);
router.post('/portal', billingController.createPortalSession);
router.get('/subscription', billingController.getSubscription);

export default router;
