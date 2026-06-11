import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const adminPassword = await bcrypt.hash('Admin@123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@oliveira-apply.ai' },
    update: {},
    create: {
      name: 'Admin Oliveira',
      email: 'admin@oliveira-apply.ai',
      password: adminPassword,
      role: 'ADMIN',
      emailVerified: true,
      isActive: true,
      profile: {
        create: {
          location: 'São Paulo, SP',
          bio: 'Administrador da plataforma Oliveira Apply AI',
        },
      },
      subscription: {
        create: {
          plan: 'ENTERPRISE',
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          applicationsLimit: 999999,
        },
      },
    },
  });

  const demoPassword = await bcrypt.hash('Demo@123', 12);
  const demo = await prisma.user.upsert({
    where: { email: 'demo@oliveira-apply.ai' },
    update: {},
    create: {
      name: 'João Demo',
      email: 'demo@oliveira-apply.ai',
      password: demoPassword,
      role: 'USER',
      emailVerified: true,
      isActive: true,
      profile: {
        create: {
          location: 'Remoto, Brasil',
          bio: 'Desenvolvedor apaixonado por tecnologia',
          desiredSalaryMin: 15000,
          skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker'],
          desiredRoles: ['Senior Full Stack Developer'],
          remoteOnly: true,
        },
      },
      subscription: {
        create: {
          plan: 'PRO',
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          applicationsLimit: 500,
        },
      },
    },
  });

  const companies = [
    { company: 'Nubank',        jobTitle: 'Senior Backend Engineer', status: 'INTERVIEW', salaryMin: 16000, salaryMax: 20000, aiScore: 94 },
    { company: 'Mercado Livre', jobTitle: 'Full Stack Developer',     status: 'APPLIED',   salaryMin: 14000, salaryMax: 18000, aiScore: 87 },
    { company: 'iFood',         jobTitle: 'Software Engineer',        status: 'VIEWED',    salaryMin: 12000, salaryMax: 16000, aiScore: 82 },
    { company: 'PagSeguro',     jobTitle: 'Node.js Developer',        status: 'OFFER',     salaryMin: 15000, salaryMax: 19000, aiScore: 91 },
    { company: 'Stone',         jobTitle: 'Backend Developer',        status: 'REJECTED',  salaryMin: 13000, salaryMax: 17000, aiScore: 76 },
    { company: 'Creditas',      jobTitle: 'TypeScript Engineer',      status: 'APPLIED',   salaryMin: 14000, salaryMax: 19000, aiScore: 88 },
    { company: 'Loft',          jobTitle: 'React Developer',          status: 'INTERVIEW', salaryMin: 11000, salaryMax: 15000, aiScore: 85 },
    { company: 'QuintoAndar',   jobTitle: 'Full Stack Engineer',      status: 'VIEWED',    salaryMin: 13000, salaryMax: 18000, aiScore: 89 },
  ];

  for (const app of companies) {
    await prisma.application.create({
      data: {
        userId: demo.id,
        company: app.company,
        jobTitle: app.jobTitle,
        status: app.status as any,
        salaryMin: app.salaryMin,
        salaryMax: app.salaryMax,
        aiScore: app.aiScore,
        platform: 'LINKEDIN',
        location: 'Remote',
        appliedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        jobType: 'FULL_TIME',
        seniorityLevel: 'SENIOR',
      },
    });
  }

  console.log('✅ Seed completed!');
  console.log('   Admin: admin@oliveira-apply.ai / Admin@123');
  console.log('   Demo:  demo@oliveira-apply.ai  / Demo@123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());