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

test("members cannot create workout plans", async () => {
  const { server, baseUrl } = await startServer();

  try {
    const memberToken = issueAccessToken({
      userId: "11111111-1111-1111-1111-111111111111",
      role: Role.MEMBER,
    });

    const response = await fetch(`${baseUrl}/workout-plans`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${memberToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Upper body strength",
        description: "Push and pull split",
      }),
    });

    assert.equal(response.status, 403);

    const payload = (await response.json()) as { error?: { code?: string } };
    assert.equal(payload.error?.code, "WORKOUT_PLAN_CREATE_FORBIDDEN");
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test("members cannot create diet plans", async () => {
  const { server, baseUrl } = await startServer();

  try {
    const memberToken = issueAccessToken({
      userId: "22222222-2222-2222-2222-222222222222",
      role: Role.MEMBER,
    });

    const response = await fetch(`${baseUrl}/diet-plans`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${memberToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Recovery meals",
        description: "High-protein daily meal plan",
      }),
    });

    assert.equal(response.status, 403);

    const payload = (await response.json()) as { error?: { code?: string } };
    assert.equal(payload.error?.code, "DIET_PLAN_CREATE_FORBIDDEN");
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
