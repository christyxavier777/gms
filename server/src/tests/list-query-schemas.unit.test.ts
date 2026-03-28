import test from "node:test";
import assert from "node:assert/strict";
import { listUsersQuerySchema } from "../users/schemas";
import { listPaymentsQuerySchema } from "../payments/schemas";
import { listSubscriptionsQuerySchema } from "../subscriptions/schemas";
import { listProgressQuerySchema } from "../progress/schemas";

test("list users query schema applies defaults and accepts role filters", () => {
  const query = listUsersQuerySchema.parse({
    search: "member",
    role: "MEMBER",
    status: "ACTIVE",
  });

  assert.equal(query.page, 1);
  assert.equal(query.pageSize, 20);
  assert.equal(query.search, "member");
  assert.equal(query.role, "MEMBER");
  assert.equal(query.status, "ACTIVE");
  assert.equal(query.sortBy, "createdAt");
  assert.equal(query.sortOrder, "desc");
});

test("list payments query schema rejects oversized pages", () => {
  assert.throws(() =>
    listPaymentsQuerySchema.parse({
      pageSize: 101,
    }),
  );
});

test("list subscriptions query schema accepts status and sort overrides", () => {
  const query = listSubscriptionsQuerySchema.parse({
    status: "CANCELLED_AT_PERIOD_END",
    sortBy: "endDate",
    sortOrder: "asc",
  });

  assert.equal(query.status, "CANCELLED_AT_PERIOD_END");
  assert.equal(query.sortBy, "endDate");
  assert.equal(query.sortOrder, "asc");
});

test("list progress query schema validates diet category filters", () => {
  const query = listProgressQuerySchema.parse({
    search: "coach",
    dietCategory: "NORMAL",
  });

  assert.equal(query.search, "coach");
  assert.equal(query.dietCategory, "NORMAL");

  assert.throws(() =>
    listProgressQuerySchema.parse({
      dietCategory: "INVALID",
    }),
  );
});
