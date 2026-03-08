"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupWearableWebhookAuditEvents = cleanupWearableWebhookAuditEvents;
exports.runWearableWebhookAuditCleanup = runWearableWebhookAuditCleanup;
const client_1 = require("../prisma/client");
const logger_1 = require("../utils/logger");
const prisma = (0, client_1.createPrismaClient)();
function cutoffDate(retentionDays) {
    const now = Date.now();
    const days = Math.max(1, Math.floor(retentionDays));
    return new Date(now - days * 24 * 60 * 60 * 1000);
}
async function cleanupWearableWebhookAuditEvents(retentionDays) {
    const days = Math.max(1, Math.floor(retentionDays));
    const cutoff = cutoffDate(days);
    const result = await prisma.wearableWebhookAuditEvent.deleteMany({
        where: { createdAt: { lt: cutoff } },
    });
    return { retentionDays: days, deletedCount: result.count };
}
async function runWearableWebhookAuditCleanup(retentionDays) {
    try {
        const result = await cleanupWearableWebhookAuditEvents(retentionDays);
        (0, logger_1.logInfo)("wearable_webhook_audit_cleanup", result);
    }
    catch (error) {
        (0, logger_1.logError)("wearable_webhook_audit_cleanup_failed", {
            error: error instanceof Error ? error.message : "unknown",
            retentionDays,
        });
    }
}
//# sourceMappingURL=wearable-webhook-retention.js.map