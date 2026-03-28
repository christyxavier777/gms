import { env } from "../config/env";
import { logCacheUnavailableIfNeeded } from "../cache/client";
import { logInfo } from "../utils/logger";
import { runWearableWebhookAuditCleanup } from "../observability/wearable-webhook-retention";
import { runSubscriptionExpiryJob } from "./subscription-expiry";

type JobDefinition = {
  name: string;
  intervalMs: number;
  run: () => Promise<void>;
};

type StopJob = () => void;

function startRecurringJob(job: JobDefinition): StopJob {
  let running = false;

  const tick = async () => {
    if (running) {
      logInfo("job_tick_skipped", {
        job: job.name,
        reason: "already_running",
      });
      return;
    }

    running = true;
    try {
      await job.run();
    } finally {
      running = false;
    }
  };

  logInfo("job_scheduled", {
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

const jobs: JobDefinition[] = [
  {
    name: "subscription_expiry",
    intervalMs: env.subscriptionExpiryIntervalMs,
    run: () => runSubscriptionExpiryJob(),
  },
  {
    name: "wearable_audit_cleanup",
    intervalMs: env.wearableAuditCleanupIntervalMs,
    run: () => runWearableWebhookAuditCleanup(env.wearableAuditRetentionDays),
  },
];

logCacheUnavailableIfNeeded();
logInfo("job_worker_started", {
  jobCount: jobs.length,
  jobs: jobs.map((job) => ({
    name: job.name,
    intervalMs: job.intervalMs,
  })),
});

const stopJobs = jobs.map(startRecurringJob);

function shutdown(signal: "SIGTERM" | "SIGINT") {
  logInfo("job_worker_shutdown", {
    signal,
    message: "stopping_jobs",
  });

  for (const stopJob of stopJobs) {
    stopJob();
  }

  logInfo("job_worker_shutdown", {
    message: "jobs_stopped_cleanly",
  });

  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
