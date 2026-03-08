import { createPrismaClient } from "../prisma/client";
import { logError, logInfo } from "../utils/logger";

const prisma = createPrismaClient();

function cutoffDate(retentionDays: number): Date {
  const now = Date.now();
  const days = Math.max(1, Math.floor(retentionDays));
  return new Date(now - days * 24 * 60 * 60 * 1000);
}

export async function cleanupWearableWebhookAuditEvents(retentionDays: number): Promise<{
  retentionDays: number;
  deletedCount: number;
}> {
  const days = Math.max(1, Math.floor(retentionDays));
  const cutoff = cutoffDate(days);
  const result = await prisma.wearableWebhookAuditEvent.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
  return { retentionDays: days, deletedCount: result.count };
}

export async function runWearableWebhookAuditCleanup(retentionDays: number): Promise<void> {
  try {
    const result = await cleanupWearableWebhookAuditEvents(retentionDays);
    logInfo("wearable_webhook_audit_cleanup", result);
  } catch (error) {
    logError("wearable_webhook_audit_cleanup_failed", {
      error: error instanceof Error ? error.message : "unknown",
      retentionDays,
    });
  }
}
