import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';
import crypto from 'crypto';

const router = Router();
router.use(authenticate);

const ENCRYPTION_KEY = Buffer.from(
  (process.env.ENCRYPTION_KEY || 'oliveira-encrypt-key-32chars!!!').padEnd(32, '0').slice(0, 32)
);
const IV_LENGTH = 16;

function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = Buffer.from(parts[1], 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

router.get('/connections', async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    const connections: Record<string, any> = {};

    // Get LinkedIn account
    const linkedinAccount = await prisma.linkedinAccount.findUnique({ where: { userId } });
    if (linkedinAccount) {
      connections['linkedin'] = { email: linkedinAccount.email, connected: true };
    }

    // Get other platform connections from JSON
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { platformConnections: true },
    });
    if (user?.platformConnections) {
      const data = user.platformConnections as any;
      Object.keys(data).forEach(platform => {
        if (platform !== 'linkedin') {
          connections[platform] = { email: data[platform].email, connected: true };
        }
      });
    }

    res.json({ success: true, data: connections });
  } catch (err) { next(err); }
});

router.post('/connections', async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    const { platform, email, password } = req.body;
    if (!platform || !email || !password) throw new AppError('Plataforma, email e senha são obrigatórios', 400);

    if (platform === 'linkedin') {
      // Save LinkedIn to dedicated table
      await prisma.linkedinAccount.upsert({
        where: { userId },
        create: { userId, email, password: encrypt(password) },
        update: { email, password: encrypt(password) },
      });
    } else {
      // Save other platforms to JSON
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { platformConnections: true } });
      const existing = (user?.platformConnections as any) ?? {};
      existing[platform] = { email, password: encrypt(password) };
      await prisma.user.update({ where: { id: userId }, data: { platformConnections: existing } });
    }

    res.json({ success: true, data: { platform, email, connected: true } });
  } catch (err) { next(err); }
});

router.delete('/connections/:platform', async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    const { platform } = req.params;

    if (platform === 'linkedin') {
      await prisma.linkedinAccount.deleteMany({ where: { userId } });
    } else {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { platformConnections: true } });
      const existing = (user?.platformConnections as any) ?? {};
      delete existing[platform];
      await prisma.user.update({ where: { id: userId }, data: { platformConnections: existing } });
    }

    res.json({ success: true, message: 'Plataforma desconectada' });
  } catch (err) { next(err); }
});

export default router;