# Deploy Prisma no Railway — Instruções

## Opção 1 — Via Railway CLI (recomendado)

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Entrar no projeto
railway link

# Rodar migrate em produção
railway run npx prisma migrate deploy
```

## Opção 2 — Adicionar ao start.js (automático no deploy)

Edite o `backend/start.js` para rodar migrate antes de subir o servidor:

```js
process.on("uncaughtException", (e) => { console.error("UNCAUGHT:", e); process.exit(1); });
process.on("unhandledRejection", (e) => { console.error("UNHANDLED:", e); process.exit(1); });

const { execSync } = require("child_process");
try {
  console.log("Running prisma migrate deploy...");
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
  console.log("Migrations OK");
} catch (e) {
  console.error("Migration failed:", e.message);
  process.exit(1);
}

require("ts-node/register/transpile-only");
require("./src/server.ts");
```

## Opção 3 — Via Console do Railway

No Railway > seu serviço > aba Console, execute:
```
npx prisma migrate deploy
```

## Verificar se funcionou

Depois de rodar o migrate, verifique no console:
```
npx prisma studio
```
Ou cheque os logs do Railway para confirmar as migrações aplicadas.
