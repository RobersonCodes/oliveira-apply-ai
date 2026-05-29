import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';
import logger from '../utils/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-06-20' });

const PLAN_PRICES: Record<string, string> = {
  STARTER: process.env.STRIPE_STARTER_PRICE_ID || 'price_starter',
  PRO: process.env.STRIPE_PRO_PRICE_ID || 'price_pro',
  ENTERPRISE: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise',
};

export const billingController = {
  async createCheckoutSession(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { plan } = req.body;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new AppError('Usuário não encontrado', 404);

      const priceId = PLAN_PRICES[plan];
      if (!priceId) throw new AppError('Plano inválido', 400);

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer_email: user.email,
        line_items: [{ price: priceId, quantity: 1 }],
        subscription_data: {
          trial_period_days: plan === 'PRO' ? 7 : undefined,
          metadata: { userId, plan },
        },
        success_url: `${process.env.FRONTEND_URL}/dashboard/settings?tab=billing&success=true`,
        cancel_url: `${process.env.FRONTEND_URL}/pricing`,
        metadata: { userId, plan },
      });

      res.json({ success: true, data: { url: session.url } });
    } catch (err) { next(err); }
  },

  async createPortalSession(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const sub = await prisma.subscription.findUnique({ where: { userId } });
      if (!sub?.stripeCustomerId) throw new AppError('Sem assinatura ativa', 400);

      const session = await stripe.billingPortal.sessions.create({
        customer: sub.stripeCustomerId,
        return_url: `${process.env.FRONTEND_URL}/dashboard/settings?tab=billing`,
      });

      res.json({ success: true, data: { url: session.url } });
    } catch (err) { next(err); }
  },

  async handleWebhook(req: Request, res: Response, next: NextFunction) {
    const sig = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET || '',
      );
    } catch (err: any) {
      logger.error('Stripe webhook error', { err: err.message });
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.CheckoutSession;
        const { userId, plan } = session.metadata || {};
        if (userId && plan) {
          await prisma.subscription.upsert({
            where: { userId },
            update: {
              plan: plan as any,
              status: 'ACTIVE',
              stripeSubscriptionId: session.subscription as string,
              stripeCustomerId: session.customer as string,
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
            create: {
              userId,
              plan: plan as any,
              status: 'ACTIVE',
              stripeSubscriptionId: session.subscription as string,
              stripeCustomerId: session.customer as string,
              amount: 0,
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: { status: 'CANCELED', plan: 'FREE' },
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        logger.warn('Payment failed', { customer: invoice.customer });
        break;
      }
    }

    res.json({ received: true });
  },

  async getSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const sub = await prisma.subscription.findUnique({ where: { userId } });
      res.json({ success: true, data: sub });
    } catch (err) { next(err); }
  },
};
