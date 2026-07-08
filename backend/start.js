const REQUIRED_SECRETS = ["JWT_SECRET", "JWT_REFRESH_SECRET", "ENCRYPTION_KEY"];
const missingSecrets = REQUIRED_SECRETS.filter((name) => !process.env[name]);
if (missingSecrets.length > 0) {
  console.error(
    `FATAL: variáveis de ambiente obrigatórias ausentes: ${missingSecrets.join(", ")}. ` +
    "Configure-as no Railway (painel do backend) antes de subir o servidor."
  );
  process.exit(1);
}

process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
process.env.STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || "";
process.env.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
process.env.SERPAPI_KEY = process.env.SERPAPI_KEY || "";
process.env.SMTP_HOST = process.env.SMTP_HOST || "smtp-mail.outlook.com";
process.env.SMTP_PORT = process.env.SMTP_PORT || "587";
process.env.SMTP_USER = process.env.SMTP_USER || "";
process.env.SMTP_PASS = process.env.SMTP_PASS || "";
process.env.FROM_EMAIL = process.env.FROM_EMAIL || "";

process.on("uncaughtException", (e) => { console.error("UNCAUGHT:", e); process.exit(1); });
process.on("unhandledRejection", (e) => { console.error("UNHANDLED:", e); process.exit(1); });

const { execSync } = require("child_process");
try {
  console.log("Generating Prisma Client...");
  execSync("npx prisma generate", { stdio: "inherit" });
  console.log("Prisma Client generated OK");
} catch (e) {
  console.error("prisma generate failed:", e.message);
  process.exit(1);
}

const dbUrl = process.env.DATABASE_URL || "NOT SET";
const dbUrlSafe = dbUrl.replace(/:([^@]+)@/, ":***@");
console.log("DATABASE_URL:", dbUrlSafe);

require("ts-node/register/transpile-only");
require("./src/server.ts");
process.env.JSEARCH_API_KEY = process.env.JSEARCH_API_KEY || "";
