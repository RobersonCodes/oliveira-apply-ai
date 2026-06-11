# Oliveira Apply AI — Pacote de Comercialização

## Arquivos gerados (copiar para o projeto)

### Frontend — copiar para `frontend/src/`

| Arquivo gerado | Destino no projeto |
|---|---|
| `frontend/src/app/dashboard/recruiter-vision/page.tsx` | `frontend/src/app/dashboard/recruiter-vision/page.tsx` (novo) |
| `frontend/src/app/dashboard/shadow-apply/page.tsx` | `frontend/src/app/dashboard/shadow-apply/page.tsx` (novo) |
| `frontend/src/app/dashboard/vaga-radar/page.tsx` | `frontend/src/app/dashboard/vaga-radar/page.tsx` (novo) |
| `frontend/src/app/dashboard/conexao-cirurgica/page.tsx` | `frontend/src/app/dashboard/conexao-cirurgica/page.tsx` (novo) |
| `frontend/src/app/dashboard/settings/page.tsx` | **Substituir** o arquivo existente |
| `frontend/src/app/dashboard/layout.tsx` | **Substituir** o arquivo existente |
| `frontend/src/app/termos/page.tsx` | `frontend/src/app/termos/page.tsx` (novo) |
| `frontend/src/app/privacidade/page.tsx` | `frontend/src/app/privacidade/page.tsx` (novo) |

### Backend — copiar para `backend/src/`

| Arquivo gerado | Destino no projeto |
|---|---|
| `backend/src/middlewares/plan.middleware.ts` | `backend/src/middlewares/plan.middleware.ts` (novo) |
| `backend/src/routes/recruiterVision.routes.ts` | **Substituir** o arquivo existente |
| `backend/src/routes/shadowApply.routes.ts` | **Substituir** o arquivo existente |
| `backend/src/routes/vagaRadar.routes.ts` | **Substituir** o arquivo existente |
| `backend/src/routes/conexaoCirurgica.routes.ts` | **Substituir** o arquivo existente |

---

## O que foi implementado

### ✅ 4 módulos PRO com frontend completo
- **Recruiter Vision** — detecção de ATS + otimização de currículo
- **Shadow Apply** — persona sintética + análise de receptividade
- **Vaga Radar** — sinais de mercado (funding, expansão, etc.)
- **Conexão Cirúrgica** — estratégia 14 dias + gerador de comentários

### ✅ Billing funcional com Stripe real
- Settings page conectada à API de subscription
- Botão "Gerenciar assinatura" → Stripe Customer Portal
- Botão "Assinar" → Stripe Checkout Session
- Exibe plano real do banco de dados
- Exibe uso (candidaturas usadas / limite)

### ✅ Sidebar atualizada
- 4 novos módulos na seção "Módulos IA" com badge PRO

### ✅ Controle de acesso por plano
- Middleware `requirePlan('PRO')` nos 4 módulos
- Retorna erro 403 com mensagem clara para planos inferiores

### ✅ LGPD — Páginas legais
- `/termos` — Termos de Uso completos
- `/privacidade` — Política de Privacidade (LGPD)

---

## Próximos passos (fazer manualmente)

### 1. Rodar Prisma migrate no Railway
Ver arquivo `PRISMA_DEPLOY.md`

### 2. Adicionar links legais no rodapé da landing page
Em `frontend/src/app/page.tsx`, adicionar no rodapé:
```tsx
<Link href="/termos">Termos de Uso</Link>
<Link href="/privacidade">Política de Privacidade</Link>
```

### 3. Adicionar links legais no Stripe Checkout
No `billing.controller.ts`, a sessão de checkout já vai para o frontend.
Adicione nas configurações do produto no Stripe Dashboard:
- Terms of Service URL: `https://oliveira-apply-ai-okbt.vercel.app/termos`
- Privacy Policy URL: `https://oliveira-apply-ai-okbt.vercel.app/privacidade`

### 4. Confirmar STRIPE_WEBHOOK_SECRET no Railway
No Stripe Dashboard > Developers > Webhooks > seu endpoint, copie o "Signing secret"
e adicione como `STRIPE_WEBHOOK_SECRET` no Railway.

O endpoint do webhook é:
`https://oliveira-apply-ai-production.up.railway.app/api/billing/webhook`

### 5. Push e deploy
```powershell
cd "D:\Usuario\Documents\Oliveira Apply AI"
git add .
git commit -m "feat: comercialização — módulos PRO, billing Stripe, LGPD, plan middleware"
git push origin main
```
