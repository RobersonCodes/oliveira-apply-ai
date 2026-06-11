import passport from 'passport';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import { prisma } from './database';

export function setupLinkedInOAuth() {
  const clientID = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const callbackURL = process.env.LINKEDIN_CALLBACK_URL;

  if (!clientID || !clientSecret || !callbackURL) {
    console.warn('LinkedIn OAuth not configured — skipping setup');
    return;
  }

  passport.use(new LinkedInStrategy({
    clientID,
    clientSecret,
    callbackURL,
    scope: ['profile', 'email', 'openid'],
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      const linkedinId = profile.id;
      const name = profile.displayName;

      let user = await prisma.user.findFirst({
        where: { OR: [{ email: email || '' }] },
      });

      if (!user && email) {
        user = await prisma.user.create({
          data: {
            email,
            name,
            password: '',
            profile: { create: {} },
            subscription: { create: { plan: 'FREE', applicationsLimit: 10 } },
          },
        });
      }

      return done(null, { user, accessToken, linkedinId });
    } catch (err) {
      return done(err);
    }
  }));
}