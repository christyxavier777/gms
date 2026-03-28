"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("../config/env");
const client_1 = require("../cache/client");
const logger_1 = require("../utils/logger");
const wearable_webhook_retention_1 = require("../observability/wearable-webhook-retention");
const subscription_expiry_1 = require("./subscription-expiry");
function startRecurringJob(job) {
    let running = false;
    const tick = async () => {
        if (running) {
            (0, logger_1.logInfo)("job_tick_skipped", {
                job: job.name,
                reason: "already_running",
            });
            return;
        }
        running = true;
        try {
            await job.run();
        }
        finally {
            running = false;
        }
    };
    (0, logger_1.logInfo)("job_scheduled", {
        job: job.name,
        intervalMs: job.intervalMs,
    });
    void tick();
    const timer = setInterval(() => {
        void tick();
    }, job.intervalMs);
    timer.unref();
    return () => clearInterval(timer);
}
const jobs = [
    {
        name: "subscription_expiry",
        intervalMs: env_1.env.subscriptionExpiryIntervalMs,
        run: () => (0, subscription_expiry_1.runSubscriptionExpiryJob)(),
    },
    {
        name: "wearable_audit_cleanup",
        intervalMs: env_1.env.wearableAuditCleanupIntervalMs,
        run: () => (0, wearable_webhook_retention_1.runWearableWebhookAuditCleanup)(env_1.env.wearableAuditRetentionDays),
    },
];
(0, client_1.logCacheUnavailableIfNeeded)();
(0, logger_1.logInfo)("job_worker_started", {
    jobCount: jobs.length,
    jobs: jobs.map((job) => ({
        name: job.name,
        intervalMs: job.intervalMs,
    })),
});
const stopJobs = jobs.map(startRecurringJob);
function shutdown(signal) {
    (0, logger_1.logInfo)("job_worker_shutdown", {
        signal,
        message: "stopping_jobs",
    });
    for (const stopJob of stopJobs) {
        stopJob();
    }
    (0, logger_1.logInfo)("job_worker_shutdown", {
        message: "jobs_stopped_cleanly",
    });
    process.exit(0);
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
//# sourceMappingURL=worker.js.map