import { Response } from 'express';

const isProd = process.env.NODE_ENV === 'production';

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  const common = {
    httpOnly: true,
    secure: isProd,
    // Frontend (Vercel) e backend (Railway) são domínios diferentes em produção,
    // então o cookie só é enviado cross-site com SameSite=None (exige Secure).
    // Em dev, front e back estão ambos em "localhost" (mesmo site, portas diferentes),
    // onde Lax já é suficiente e não exige HTTPS.
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
  };
  res.cookie('accessToken', accessToken, { ...common, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, { ...common, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
}
