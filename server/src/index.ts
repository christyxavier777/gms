import { createApp } from "./app";
import { env } from "./config/env";
import { createPrismaClient } from "./prisma/client";

const app = createApp();
void createPrismaClient;

const server = app.listen(env.port, () => {
  console.log(`[bootstrap] environment loaded: NODE_ENV=${env.nodeEnv}`);
  console.log(`[bootstrap] prisma client generation validated (Phase 0, no DB connection)`);
  console.log(`[bootstrap] server listening on http://localhost:${env.port}`);
});

process.on("SIGTERM", () => {
  console.log("[shutdown] SIGTERM received, closing resources");
  server.close(() => {
    console.log("[shutdown] server stopped cleanly");
    process.exit(0);
  });
});
