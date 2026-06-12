process.env.JWT_SECRET = process.env.JWT_SECRET || "oliveira-super-secret-jwt-2024";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "oliveira-refresh-secret-2024";
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "oliveira-encrypt-key-32chars!!!";
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
