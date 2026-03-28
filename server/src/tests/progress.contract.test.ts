import test from "node:test";
import assert from "node:assert/strict";
import { AddressInfo } from "node:net";
import { Role } from "@prisma/client";
import { createApp } from "../app";
import { issueAccessToken } from "../auth/jwt";

async function startServer() {
  const app = createApp();
  const server = await new Promise<import("node:http").Server>((resolve) => {
    const startedServer = app.listen(0, () => resolve(startedServer));
  });
  const port = (server.address() as AddressInfo).port;

  return {
    server,
    baseUrl: `http://127.0.0.1:${port}`,
  };
}

test("members cannot create progress entries", async () => {
  const { server, baseUrl } = await startServer();

  try {
    const memberToken = issueAccessToken({
      userId: "11111111-1111-1111-1111-111111111111",
      role: Role.MEMBER,
    });

    const response = await fetch(`${baseUrl}/progress`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${memberToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: "11111111-1111-1111-1111-111111111111",
        weight: 72,
        height: 1.75,
        recordedAt: new Date().toISOString(),
      }),
    });

    assert.equal(response.status, 403);

    const payload = (await response.json()) as { error?: { code?: string } };
    assert.equal(payload.error?.code, "PROGRESS_CREATE_FORBIDDEN");
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
