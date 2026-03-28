import test from "node:test";
import assert from "node:assert/strict";
import { SubscriptionStatus } from "@prisma/client";
import {
  getActiveSubscriptionWhere,
  getCancelledAtPeriodEndSubscriptionWhere,
  getCancelledSubscriptionWhere,
  getEffectiveSubscriptionStatus,
  getExpiredSubscriptionWhere,
  getOverlapBlockingSubscriptionWhere,
  getSubscriptionStatusWhere,
  todayUtc,
} from "../subscriptions/lifecycle";

test("effective subscription status marks overdue active subscriptions as expired", () => {
  const now = new Date("2026-03-28T10:00:00.000Z");
  const yesterday = new Date("2026-03-27T00:00:00.000Z");

  const status = getEffectiveSubscriptionStatus(SubscriptionStatus.ACTIVE, yesterday, now);

  assert.equal(status, SubscriptionStatus.EXPIRED);
});

test("effective subscription status keeps subscriptions active through their end date", () => {
  const now = new Date("2026-03-28T10:00:00.000Z");
  const today = todayUtc(now);

  const status = getEffectiveSubscriptionStatus(SubscriptionStatus.ACTIVE, today, now);

  assert.equal(status, SubscriptionStatus.ACTIVE);
});

test("effective subscription status keeps scheduled cancellations visible until the period ends", () => {
  const now = new Date("2026-03-28T10:00:00.000Z");
  const tomorrow = new Date("2026-03-29T00:00:00.000Z");
  const yesterday = new Date("2026-03-27T00:00:00.000Z");

  assert.equal(
    getEffectiveSubscriptionStatus(SubscriptionStatus.CANCELLED_AT_PERIOD_END, tomorrow, now),
    SubscriptionStatus.CANCELLED_AT_PERIOD_END,
  );
  assert.equal(
    getEffectiveSubscriptionStatus(SubscriptionStatus.CANCELLED_AT_PERIOD_END, yesterday, now),
    SubscriptionStatus.CANCELLED,
  );
  assert.equal(
    getEffectiveSubscriptionStatus(SubscriptionStatus.PENDING_ACTIVATION, tomorrow, now),
    SubscriptionStatus.PENDING_ACTIVATION,
  );
});

test("status filter helper returns derived lifecycle where clauses", () => {
  const now = new Date("2026-03-28T10:00:00.000Z");

  assert.deepEqual(getActiveSubscriptionWhere(now), {
    status: {
      in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELLED_AT_PERIOD_END],
    },
    endDate: { gte: new Date("2026-03-28T00:00:00.000Z") },
  });
  assert.deepEqual(getExpiredSubscriptionWhere(now), {
    OR: [
      { status: SubscriptionStatus.EXPIRED },
      {
        status: SubscriptionStatus.ACTIVE,
        endDate: { lt: new Date("2026-03-28T00:00:00.000Z") },
      },
    ],
  });
  assert.deepEqual(getCancelledAtPeriodEndSubscriptionWhere(now), {
    status: SubscriptionStatus.CANCELLED_AT_PERIOD_END,
    endDate: { gte: new Date("2026-03-28T00:00:00.000Z") },
  });
  assert.deepEqual(getCancelledSubscriptionWhere(now), {
    OR: [
      { status: SubscriptionStatus.CANCELLED },
      {
        status: SubscriptionStatus.CANCELLED_AT_PERIOD_END,
        endDate: { lt: new Date("2026-03-28T00:00:00.000Z") },
      },
    ],
  });
  assert.deepEqual(getOverlapBlockingSubscriptionWhere(
    new Date("2026-03-28T00:00:00.000Z"),
    new Date("2026-04-27T00:00:00.000Z"),
  ), {
    status: {
      in: [
        SubscriptionStatus.ACTIVE,
        SubscriptionStatus.CANCELLED_AT_PERIOD_END,
        SubscriptionStatus.PENDING_ACTIVATION,
      ],
    },
    startDate: { lte: new Date("2026-04-27T00:00:00.000Z") },
    NOT: { endDate: { lt: new Date("2026-03-28T00:00:00.000Z") } },
  });
  assert.deepEqual(getSubscriptionStatusWhere(SubscriptionStatus.CANCELLED_AT_PERIOD_END, now), {
    status: SubscriptionStatus.CANCELLED_AT_PERIOD_END,
    endDate: { gte: new Date("2026-03-28T00:00:00.000Z") },
  });
  assert.deepEqual(getSubscriptionStatusWhere(SubscriptionStatus.CANCELLED, now), {
    OR: [
      { status: SubscriptionStatus.CANCELLED },
      {
        status: SubscriptionStatus.CANCELLED_AT_PERIOD_END,
        endDate: { lt: new Date("2026-03-28T00:00:00.000Z") },
      },
    ],
  });
});
