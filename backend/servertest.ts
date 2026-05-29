process.on("uncaughtException", (e) => { console.error("UNCAUGHT:", e.message); process.exit(1); });
process.on("unhandledRejection", (e: any) => { console.error("UNHANDLED:", e?.message || e); process.exit(1); });
import("./src/server.ts").then(() => console.log("server importado")).catch(e => { console.error("IMPORT ERRO:", e.message); process.exit(1); });
