import test from "node:test";
import assert from "node:assert/strict";
import { cacheDel, cacheGet, cacheSetIfAbsent } from "../cache/client";

test("cacheSetIfAbsent allows first write and blocks duplicates", async () => {
  const key = `test:idempotency:${Date.now()}:a`;
  const first = await cacheSetIfAbsent(key, "1", 60);
  const second = await cacheSetIfAbsent(key, "2", 60);
  const stored = await cacheGet(key);

  assert.equal(first, true);
  assert.equal(second, false);
  assert.equal(stored, "1");
  await cacheDel(key);
});

test("cacheDel removes reserved idempotency key", async () => {
  const key = `test:idempotency:${Date.now()}:b`;
  await cacheSetIfAbsent(key, "in_flight", 60);
  const removed = await cacheDel(key);
  const missing = await cacheGet(key);

  assert.equal(removed, 1);
  assert.equal(missing, null);
});
