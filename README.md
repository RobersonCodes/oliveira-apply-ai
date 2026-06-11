# 🚀 Oliveira Apply AI

> Plataforma SaaS premium de automação inteligente de candidaturas a vagas de emprego, potencializada por IA.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-15-black)

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Stack Tecnológica](#stack-tecnológica)
- [Arquitetura](#arquitetura)
- [Funcionalidades](#funcionalidades)
- [Setup Local](#setup-local)
- [Deploy](#deploy)
- [API Docs](#api-docs)
- [Monetização](#monetização)

---

## 🎯 Visão Geral

O **Oliveira Apply AI** é uma plataforma enterprise de automação de candidaturas a vagas de emprego. Ela combina automação via Playwright com IA (OpenAI/Ollama) para:

- Automatizar candidaturas no LinkedIn e outras plataformas
- Reescrever currículos adaptativamente para cada vaga
- Gerar cover letters personalizadas
- Monitorar métricas de sucesso em tempo real
- Escalar candidaturas com segurança anti-detecção

---

## 🛠 Stack Tecnológica

### Frontend
| Tecnologia | Versão | Uso |
|---|---|---|
| Next.js | 15 | Framework React SSR/SSG |
| React | 19 | UI Library |
| Tailwind CSS | 3.4 | Styling |
| Framer Motion | 11 | Animações |
| Shadcn/UI | latest | Componentes |
| Recharts | 2.x | Gráficos |
| Zustand | 4.x | Estado global |

### Backend
| Tecnologia | Versão | Uso |
|---|---|---|
| Node.js | 18+ | Runtime |
| Express | 4.x | Framework HTTP |
| PostgreSQL | 15 | Banco de dados |
| Prisma | 5.x | ORM |
| Playwright | 1.x | Automação web |
| OpenAI SDK | 4.x | IA generativa |
| Ollama | local | IA local |
| BullMQ | 4.x | Filas de jobs |
| Redis | 7.x | Cache/Filas |

### Infraestrutura
- **Docker** — Containerização
- **Vercel** — Deploy frontend
- **Railway** — Deploy backend
- **Stripe** — Pagamentos

---

## 🏗 Arquitetura

```
oliveira-apply-ai/
├── frontend/               # Next.js 15 App
│   ├── src/
│   │   ├── app/            # App Router (páginas)
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── lib/            # Utilities e configs
│   │   ├── hooks/          # Custom React hooks
│   │   ├── stores/         # Zustand stores
│   │   └── types/          # TypeScript types
│   └── public/
│
├── backend/                # Node.js + Express API
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic
│   │   ├── repositories/   # Data access layer
│   │   ├── middlewares/    # Express middlewares
│   │   ├── validations/    # Zod schemas
│   │   ├── dtos/           # Data Transfer Objects
│   │   ├── utils/          # Helpers
│   │   ├── jobs/           # Background jobs
│   │   ├── queues/         # BullMQ queues
│   │   └── routes/         # API routes
│   └── prisma/             # Schema e migrations
│
├── docs/                   # Documentação técnica
└── docker-compose.yml
```

### Fluxo da Automação

```
Usuário configura filtros
        ↓
Job enfileirado no BullMQ
        ↓
Worker inicia Playwright (headless)
        ↓
Login seguro no LinkedIn
        ↓
Busca vagas com filtros
        ↓
Para cada vaga:
  ├── IA analisa descrição
  ├── Adapta currículo
  ├── Gera cover letter
  ├── Aplica com delays humanos
  └── Registra resultado
        ↓
Atualiza métricas no dashboard
```

---

## ⚙️ Setup Local

### Pré-requisitos
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15
- Redis 7

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/oliveira-apply-ai.git
cd oliveira-apply-ai
```

### 2. Configure as variáveis de ambiente

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env.local
```

Edite os arquivos `.env` com suas credenciais.

### 3. Suba os serviços com Docker

```bash
docker-compose up -d postgres redis
```

### 4. Configure o banco de dados

```bash
cd backend
npm install
npx prisma migrate dev
npx prisma db seed
```

### 5. Instale e rode o backend

```bash
cd backend
npm install
npm run dev
# API disponível em http://localhost:3001
```

### 6. Instale e rode o frontend

```bash
cd frontend
npm install
npm run dev
# App disponível em http://localhost:3000
```

---

## 🚀 Deploy

### Deploy com Docker Compose (Produção)

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Deploy Frontend → Vercel

```bash
cd frontend
vercel deploy --prod
```

### Deploy Backend → Railway

```bash
# Conecte o repositório no Railway
# Configure as env vars no painel
railway up
```

### Variáveis de Ambiente Necessárias

```bash
# Backend (.env)
DATABASE_URL="postgresql://user:pass@host:5432/oliveira_apply"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="sua-chave-super-secreta"
JWT_REFRESH_SECRET="outra-chave-secreta"
OPENAI_API_KEY="sk-..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
ENCRYPTION_KEY="32-char-key"

# Frontend (.env.local)
NEXT_PUBLIC_API_URL="https://api.oliveira-apply.com"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
```

---

## 📊 Monetização

### Planos

| Plano | Preço | Candidaturas/mês | IA | Suporte |
|---|---|---|---|---|
| Free | Grátis | 10 | Básica | Community |
| Starter | R$49/mês | 100 | Avançada | Email |
| Pro | R$149/mês | 500 | Premium | Prioritário |
| Enterprise | R$499/mês | Ilimitado | Dedicada | 24/7 |

### Trial
- 7 dias grátis no plano Pro
- Sem necessidade de cartão de crédito

---

## 📄 Licença

MIT © Oliveira Apply AI
