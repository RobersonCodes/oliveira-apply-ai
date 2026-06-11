import { Router } from 'express';
import passport from 'passport';
import { authService } from '../services/auth.service';

const router = Router();

router.get('/linkedin', passport.authenticate('linkedin', { session: false }));

router.get('/linkedin/callback',
  passport.authenticate('linkedin', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/auth/login?error=linkedin` }),
  async (req, res) => {
    try {
      const { user, accessToken: linkedinToken, linkedinId } = req.user as any;
      const tokens = await authService.generateTokens(user.id);

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/callback?token=${tokens.accessToken}&refresh=${tokens.refreshToken}`);
    } catch {
      res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=oauth`);
    }
  }
);

export default router;
