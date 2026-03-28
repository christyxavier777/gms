"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const client_1 = require("@prisma/client");
const lifecycle_1 = require("../subscriptions/lifecycle");
(0, node_test_1.default)("effective subscription status marks overdue active subscriptions as expired", () => {
    const now = new Date("2026-03-28T10:00:00.000Z");
    const yesterday = new Date("2026-03-27T00:00:00.000Z");
    const status = (0, lifecycle_1.getEffectiveSubscriptionStatus)(client_1.SubscriptionStatus.ACTIVE, yesterday, now);
    strict_1.default.equal(status, client_1.SubscriptionStatus.EXPIRED);
});
(0, node_test_1.default)("effective subscription status keeps subscriptions active through their end date", () => {
    const now = new Date("2026-03-28T10:00:00.000Z");
    const today = (0, lifecycle_1.todayUtc)(now);
    const status = (0, lifecycle_1.getEffectiveSubscriptionStatus)(client_1.SubscriptionStatus.ACTIVE, today, now);
    strict_1.default.equal(status, client_1.SubscriptionStatus.ACTIVE);
});
(0, node_test_1.default)("effective subscription status keeps scheduled cancellations visible until the period ends", () => {
    const now = new Date("2026-03-28T10:00:00.000Z");
    const tomorrow = new Date("2026-03-29T00:00:00.000Z");
    const yesterday = new Date("2026-03-27T00:00:00.000Z");
    strict_1.default.equal((0, lifecycle_1.getEffectiveSubscriptionStatus)(client_1.SubscriptionStatus.CANCELLED_AT_PERIOD_END, tomorrow, now), client_1.SubscriptionStatus.CANCELLED_AT_PERIOD_END);
    strict_1.default.equal((0, lifecycle_1.getEffectiveSubscriptionStatus)(client_1.SubscriptionStatus.CANCELLED_AT_PERIOD_END, yesterday, now), client_1.SubscriptionStatus.CANCELLED);
    strict_1.default.equal((0, lifecycle_1.getEffectiveSubscriptionStatus)(client_1.SubscriptionStatus.PENDING_ACTIVATION, tomorrow, now), client_1.SubscriptionStatus.PENDING_ACTIVATION);
});
(0, node_test_1.default)("status filter helper returns derived lifecycle where clauses", () => {
    const now = new Date("2026-03-28T10:00:00.000Z");
    strict_1.default.deepEqual((0, lifecycle_1.getActiveSubscriptionWhere)(now), {
        status: {
            in: [client_1.SubscriptionStatus.ACTIVE, client_1.SubscriptionStatus.CANCELLED_AT_PERIOD_END],
        },
        endDate: { gte: new Date("2026-03-28T00:00:00.000Z") },
    });
    strict_1.default.deepEqual((0, lifecycle_1.getExpiredSubscriptionWhere)(now), {
        OR: [
            { status: client_1.SubscriptionStatus.EXPIRED },
            {
                status: client_1.SubscriptionStatus.ACTIVE,
                endDate: { lt: new Date("2026-03-28T00:00:00.000Z") },
            },
        ],
    });
    strict_1.default.deepEqual((0, lifecycle_1.getCancelledAtPeriodEndSubscriptionWhere)(now), {
        status: client_1.SubscriptionStatus.CANCELLED_AT_PERIOD_END,
        endDate: { gte: new Date("2026-03-28T00:00:00.000Z") },
    });
    strict_1.default.deepEqual((0, lifecycle_1.getCancelledSubscriptionWhere)(now), {
        OR: [
            { status: client_1.SubscriptionStatus.CANCELLED },
            {
                status: client_1.SubscriptionStatus.CANCELLED_AT_PERIOD_END,
                endDate: { lt: new Date("2026-03-28T00:00:00.000Z") },
            },
        ],
    });
    strict_1.default.deepEqual((0, lifecycle_1.getOverlapBlockingSubscriptionWhere)(new Date("2026-03-28T00:00:00.000Z"), new Date("2026-04-27T00:00:00.000Z")), {
        status: {
            in: [
                client_1.SubscriptionStatus.ACTIVE,
                client_1.SubscriptionStatus.CANCELLED_AT_PERIOD_END,
                client_1.SubscriptionStatus.PENDING_ACTIVATION,
            ],
        },
        startDate: { lte: new Date("2026-04-27T00:00:00.000Z") },
        NOT: { endDate: { lt: new Date("2026-03-28T00:00:00.000Z") } },
    });
    strict_1.default.deepEqual((0, lifecycle_1.getSubscriptionStatusWhere)(client_1.SubscriptionStatus.CANCELLED_AT_PERIOD_END, now), {
        status: client_1.SubscriptionStatus.CANCELLED_AT_PERIOD_END,
        endDate: { gte: new Date("2026-03-28T00:00:00.000Z") },
    });
    strict_1.default.deepEqual((0, lifecycle_1.getSubscriptionStatusWhere)(client_1.SubscriptionStatus.CANCELLED, now), {
        OR: [
            { status: client_1.SubscriptionStatus.CANCELLED },
            {
                status: client_1.SubscriptionStatus.CANCELLED_AT_PERIOD_END,
                endDate: { lt: new Date("2026-03-28T00:00:00.000Z") },
            },
        ],
    });
});
//# sourceMappingURL=subscriptions-lifecycle.unit.test.js.map