import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
p.$connect().then(() => console.log('DB OK')).catch((e: any) => console.error('DB ERRO:', e.message)).finally(() => process.exit());
