"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expireOverdueSubscriptions = expireOverdueSubscriptions;
exports.runSubscriptionExpiryJob = runSubscriptionExpiryJob;
const client_1 = require("@prisma/client");
const cache_1 = require("../dashboard/cache");
const client_2 = require("../prisma/client");
const lifecycle_1 = require("../subscriptions/lifecycle");
const logger_1 = require("../utils/logger");
const prisma = (0, client_2.createPrismaClient)();
async function expireOverdueSubscriptions(now = new Date()) {
    const cutoff = (0, lifecycle_1.todayUtc)(now);
    const [expiredResult, cancelledResult] = await prisma.$transaction([
        prisma.subscription.updateMany({
            where: {
                status: client_1.SubscriptionStatus.ACTIVE,
                endDate: { lt: cutoff },
            },
            data: {
                status: client_1.SubscriptionStatus.EXPIRED,
            },
        }),
        prisma.subscription.updateMany({
            where: {
                status: client_1.SubscriptionStatus.CANCELLED_AT_PERIOD_END,
                endDate: { lt: cutoff },
            },
            data: {
                status: client_1.SubscriptionStatus.CANCELLED,
            },
        }),
    ]);
    if (expiredResult.count > 0 || cancelledResult.count > 0) {
        await (0, cache_1.invalidateDashboardCache)("subscription_expiry_job");
    }
    return {
        checkedAt: now.toISOString(),
        expiredCount: expiredResult.count,
        cancelledCount: cancelledResult.count,
    };
}
async function runSubscriptionExpiryJob(now = new Date()) {
    try {
        const result = await expireOverdueSubscriptions(now);
        (0, logger_1.logInfo)("subscription_expiry_job", result);
    }
    catch (error) {
        (0, logger_1.logError)("subscription_expiry_job_failed", {
            error: error instanceof Error ? error.message : "unknown",
        });
    }
}
//# sourceMappingURL=subscription-expiry.js.map