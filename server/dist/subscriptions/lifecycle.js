"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startOfUtcDay = startOfUtcDay;
exports.todayUtc = todayUtc;
exports.addUtcDays = addUtcDays;
exports.buildSubscriptionPeriod = buildSubscriptionPeriod;
exports.getEffectiveSubscriptionStatus = getEffectiveSubscriptionStatus;
exports.getActiveSubscriptionWhere = getActiveSubscriptionWhere;
exports.getExpiredSubscriptionWhere = getExpiredSubscriptionWhere;
exports.getCancelledAtPeriodEndSubscriptionWhere = getCancelledAtPeriodEndSubscriptionWhere;
exports.getCancelledSubscriptionWhere = getCancelledSubscriptionWhere;
exports.getOverlapBlockingSubscriptionWhere = getOverlapBlockingSubscriptionWhere;
exports.getSubscriptionStatusWhere = getSubscriptionStatusWhere;
const client_1 = require("@prisma/client");
function startOfUtcDay(date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
function todayUtc(now = new Date()) {
    return startOfUtcDay(now);
}
function addUtcDays(date, days) {
    const next = new Date(date);
    next.setUTCDate(next.getUTCDate() + days);
    return startOfUtcDay(next);
}
function buildSubscriptionPeriod(durationDays, startDate = new Date()) {
    const normalizedStart = startOfUtcDay(startDate);
    return {
        startDate: normalizedStart,
        endDate: addUtcDays(normalizedStart, durationDays),
    };
}
function getEffectiveSubscriptionStatus(status, endDate, now = new Date()) {
    const today = todayUtc(now);
    if (status === client_1.SubscriptionStatus.ACTIVE) {
        return endDate < today ? client_1.SubscriptionStatus.EXPIRED : client_1.SubscriptionStatus.ACTIVE;
    }
    if (status === client_1.SubscriptionStatus.CANCELLED_AT_PERIOD_END) {
        return endDate < today ? client_1.SubscriptionStatus.CANCELLED : client_1.SubscriptionStatus.CANCELLED_AT_PERIOD_END;
    }
    return status;
}
function getActiveSubscriptionWhere(now = new Date()) {
    return {
        status: {
            in: [
                client_1.SubscriptionStatus.ACTIVE,
                client_1.SubscriptionStatus.CANCELLED_AT_PERIOD_END,
            ],
        },
        endDate: { gte: todayUtc(now) },
    };
}
function getExpiredSubscriptionWhere(now = new Date()) {
    return {
        OR: [
            { status: client_1.SubscriptionStatus.EXPIRED },
            {
                status: client_1.SubscriptionStatus.ACTIVE,
                endDate: { lt: todayUtc(now) },
            },
        ],
    };
}
function getCancelledAtPeriodEndSubscriptionWhere(now = new Date()) {
    return {
        status: client_1.SubscriptionStatus.CANCELLED_AT_PERIOD_END,
        endDate: { gte: todayUtc(now) },
    };
}
function getCancelledSubscriptionWhere(now = new Date()) {
    return {
        OR: [
            { status: client_1.SubscriptionStatus.CANCELLED },
            {
                status: client_1.SubscriptionStatus.CANCELLED_AT_PERIOD_END,
                endDate: { lt: todayUtc(now) },
            },
        ],
    };
}
function getOverlapBlockingSubscriptionWhere(startDate, endDate) {
    return {
        status: {
            in: [
                client_1.SubscriptionStatus.ACTIVE,
                client_1.SubscriptionStatus.CANCELLED_AT_PERIOD_END,
                client_1.SubscriptionStatus.PENDING_ACTIVATION,
            ],
        },
        startDate: { lte: endDate },
        NOT: { endDate: { lt: startDate } },
    };
}
function getSubscriptionStatusWhere(status, now = new Date()) {
    if (!status) {
        return {};
    }
    if (status === client_1.SubscriptionStatus.ACTIVE) {
        return getActiveSubscriptionWhere(now);
    }
    if (status === client_1.SubscriptionStatus.EXPIRED) {
        return getExpiredSubscriptionWhere(now);
    }
    if (status === client_1.SubscriptionStatus.CANCELLED_AT_PERIOD_END) {
        return getCancelledAtPeriodEndSubscriptionWhere(now);
    }
    if (status === client_1.SubscriptionStatus.CANCELLED) {
        return getCancelledSubscriptionWhere(now);
    }
    return { status };
}
//# sourceMappingURL=lifecycle.js.map