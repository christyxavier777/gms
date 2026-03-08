import test from "node:test";
import assert from "node:assert/strict";
import { AddressInfo } from "node:net";
import { Role } from "@prisma/client";
import { createApp } from "../app";
import { issueAccessToken } from "../auth/jwt";
import { recordWearableWebhookAudit } from "../observability/wearable-webhook-metrics";

async function startServer() {
  const app = createApp();
  const server = await new Promise<import("node:http").Server>((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = (server.address() as AddressInfo).port;
  return { server, baseUrl: `http://127.0.0.1:${port}` };
}

test("wearable audit endpoint is admin-only", async () => {
  const { server, baseUrl } = await startServer();
  try {
    const memberToken = issueAccessToken({
      userId: "11111111-1111-1111-1111-111111111111",
      role: Role.MEMBER,
    });

    const response = await fetch(`${baseUrl}/dashboard/admin/integrations/wearables/audit`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });

    assert.equal(response.status, 403);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test("wearable audit endpoint returns aggregated snapshot for admins", async () => {
  const { server, baseUrl } = await startServer();
  try {
    recordWearableWebhookAudit("RECEIVED", "FITBIT");
    recordWearableWebhookAudit("PROCESSED", "FITBIT");

    const adminToken = issueAccessToken({
      userId: "00000000-0000-0000-0000-000000000000",
      role: Role.ADMIN,
    });

    const response = await fetch(`${baseUrl}/dashboard/admin/integrations/wearables/audit?windowMinutes=60`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      audit: {
        windowMinutes: number;
        totalEvents: number;
        byStatus: Record<string, number>;
        byProvider: Record<string, { total: number; byStatus: Record<string, number> }>;
      };
    };

    assert.equal(typeof body.audit.windowMinutes, "number");
    assert.equal(typeof body.audit.totalEvents, "number");
    assert.ok((body.audit.byStatus.RECEIVED ?? 0) >= 1);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
