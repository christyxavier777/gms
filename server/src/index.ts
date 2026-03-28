import { createApp } from "./app";
import { env } from "./config/env";
import { createPrismaClient } from "./prisma/client";
import { logInfo } from "./utils/logger";
import { logCacheUnavailableIfNeeded } from "./cache/client";
import { logPerformanceSummaryAndReset } from "./observability/perf-metrics";

const app = createApp();
void createPrismaClient;
logCacheUnavailableIfNeeded();

const server = app.listen(env.port, () => {
  logInfo("bootstrap", {
    nodeEnv: env.nodeEnv,
    port: env.port,
    message: "server_started",
  });
});

const perfTimer = setInterval(() => {
  logPerformanceSummaryAndReset();
}, 60_000);
perfTimer.unref();

process.on("SIGTERM", () => {
  logInfo("shutdown", { signal: "SIGTERM", message: "closing_server" });
  clearInterval(perfTimer);
  server.close(() => {
    logInfo("shutdown", { message: "server_stopped_cleanly" });
    process.exit(0);
  });
});
