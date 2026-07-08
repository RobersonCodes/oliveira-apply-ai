import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import axios from 'axios';
import { prisma } from '../config/database';
import { authService } from '../services/auth.service';
import { AppError } from '../utils/AppError';
import { setAuthCookies } from '../utils/authCookies';
import logger from '../utils/logger';

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || '';
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET || '';
const LINKEDIN_CALLBACK_URL = process.env.LINKEDIN_CALLBACK_URL || 'https://oliveira-apply-ai-production.up.railway.app/api/auth/linkedin/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://oliveira-apply-ai-okbt.vercel.app';

const SCOPES = ['openid', 'profile', 'email'].join(' ');

export const linkedinController = {
  // Step 1: Redirect user to LinkedIn OAuth
  redirect(req: Request, res: Response) {
    const state = crypto.randomBytes(24).toString('hex');
    res.cookie('li_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 5 * 60 * 1000,
    });

    const url = new URL('https://www.linkedin.com/oauth/v2/authorization');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', LINKEDIN_CLIENT_ID);
    url.searchParams.set('redirect_uri', LINKEDIN_CALLBACK_URL);
    url.searchParams.set('scope', SCOPES);
    url.searchParams.set('state', state);
    res.redirect(url.toString());
  },

  // Step 2: Handle OAuth callback
  async callback(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, error, state } = req.query;
      const expectedState = req.cookies?.li_oauth_state;
      res.clearCookie('li_oauth_state');

      if (error || !code) {
        return res.redirect(`${FRONTEND_URL}/auth/login?error=linkedin_denied`);
      }

      if (!expectedState || state !== expectedState) {
        logger.warn('LinkedIn OAuth state mismatch — possible CSRF attempt');
        return res.redirect(`${FRONTEND_URL}/auth/login?error=linkedin_invalid_state`);
      }

      // Exchange code for access token
      const tokenRes = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
        params: {
          grant_type: 'authorization_code',
          code,
          redirect_uri: LINKEDIN_CALLBACK_URL,
          client_id: LINKEDIN_CLIENT_ID,
          client_secret: LINKEDIN_CLIENT_SECRET,
        },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const accessToken = tokenRes.data.access_token;

      // Fetch user profile via OpenID Connect userinfo
      const userRes = await axios.get('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const { sub, name, email, picture } = userRes.data;
      if (!email) throw new AppError('Email não disponível no LinkedIn', 400);

      // Find or create user
      let user = await prisma.user.findFirst({
        where: { OR: [{ linkedinId: sub }, { email }] },
      });

      if (user) {
        // Update LinkedIn data
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            linkedinId: sub,
            avatar: picture || user.avatar,
            linkedinData: { accessToken, profile: userRes.data },
          },
        });
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            email,
            name: name || email.split('@')[0],
            password: null,
            avatar: picture || null,
            linkedinId: sub,
            linkedinData: { accessToken, profile: userRes.data },
          },
        });
      }

      // Generate JWT tokens
      const tokens = await authService.generateTokens(user.id);
      logger.info(`LinkedIn login: ${user.email}`);

      // Tokens vão em cookies httpOnly (nunca expostos ao JS/URL) — o frontend só
      // precisa saber que deu certo e então chama /auth/me pra puxar user + csrfToken.
      setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
      res.redirect(`${FRONTEND_URL}/auth/callback?linkedin=success`);
    } catch (err) {
      logger.error('LinkedIn OAuth error:', err);
      res.redirect(`${FRONTEND_URL}/auth/login?error=linkedin_failed`);
    }
  },

  // Import LinkedIn profile into resume
  async importProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user?.linkedinData) throw new AppError('Conta LinkedIn não conectada', 400);

      const { accessToken } = user.linkedinData as any;
      const profileRes = await axios.get('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const profile = profileRes.data;
      const profileText = [
        `Nome: ${profile.name}`,
        `Email: ${profile.email}`,
        profile.locale ? `Localização: ${profile.locale.country}` : '',
      ].filter(Boolean).join('\n');

      res.json({
        success: true,
        data: {
          name: profile.name,
          email: profile.email,
          picture: profile.picture,
          profileText,
          raw: profile,
        },
      });
    } catch (err) { next(err); }
  },

  // Check if LinkedIn is connected
  async status(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { linkedinId: true, linkedinData: true, avatar: true },
      });
      const connected = !!user?.linkedinId;
      const profile = connected ? (user?.linkedinData as any)?.profile : null;
      res.json({ success: true, data: { connected, profile } });
    } catch (err) { next(err); }
  },

  // Disconnect LinkedIn
  async disconnect(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      await prisma.user.update({
        where: { id: userId },
        data: { linkedinId: null, linkedinData: null },
      });
      res.json({ success: true, message: 'LinkedIn desconectado' });
    } catch (err) { next(err); }
  },
};