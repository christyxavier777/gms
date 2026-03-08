"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const client_1 = require("./prisma/client");
const logger_1 = require("./utils/logger");
const client_2 = require("./cache/client");
const perf_metrics_1 = require("./observability/perf-metrics");
const wearable_webhook_retention_1 = require("./observability/wearable-webhook-retention");
const app = (0, app_1.createApp)();
void client_1.createPrismaClient;
(0, client_2.logCacheUnavailableIfNeeded)();
const server = app.listen(env_1.env.port, () => {
    (0, logger_1.logInfo)("bootstrap", {
        nodeEnv: env_1.env.nodeEnv,
        port: env_1.env.port,
        message: "server_started",
    });
});
const perfTimer = setInterval(() => {
    (0, perf_metrics_1.logPerformanceSummaryAndReset)();
}, 60_000);
perfTimer.unref();
const wearableAuditCleanupTimer = setInterval(() => {
    void (0, wearable_webhook_retention_1.runWearableWebhookAuditCleanup)(env_1.env.wearableAuditRetentionDays);
}, env_1.env.wearableAuditCleanupIntervalMs);
wearableAuditCleanupTimer.unref();
process.on("SIGTERM", () => {
    (0, logger_1.logInfo)("shutdown", { signal: "SIGTERM", message: "closing_server" });
    clearInterval(perfTimer);
    clearInterval(wearableAuditCleanupTimer);
    server.close(() => {
        (0, logger_1.logInfo)("shutdown", { message: "server_stopped_cleanly" });
        process.exit(0);
    });
});
//# sourceMappingURL=index.js.map