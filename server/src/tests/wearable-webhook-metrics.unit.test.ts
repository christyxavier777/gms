import test from "node:test";
import assert from "node:assert/strict";
import { getWearableWebhookAuditSnapshot, recordWearableWebhookAudit } from "../observability/wearable-webhook-metrics";

test("wearable webhook metrics aggregates status and provider counts", () => {
  recordWearableWebhookAudit("RECEIVED", "FITBIT");
  recordWearableWebhookAudit("PROCESSED", "FITBIT");
  recordWearableWebhookAudit("FAILED", "APPLE_WATCH");

  const snapshot = getWearableWebhookAuditSnapshot(60);
  assert.ok(snapshot.totalEvents >= 3);
  assert.ok((snapshot.byStatus.RECEIVED ?? 0) >= 1);
  assert.ok((snapshot.byStatus.PROCESSED ?? 0) >= 1);
  assert.ok((snapshot.byProvider.FITBIT?.total ?? 0) >= 2);
});
