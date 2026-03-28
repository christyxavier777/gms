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

test("member onboarding subscription endpoint requires authentication", async () => {
  const { server, baseUrl } = await startServer();

  try {
    const response = await fetch(`${baseUrl}/me/subscription/onboarding`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: "pro-quarterly" }),
    });

    assert.equal(response.status, 401);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test("member onboarding subscription endpoint is member-only", async () => {
  const { server, baseUrl } = await startServer();

  try {
    const trainerToken = issueAccessToken({
      userId: "22222222-2222-2222-2222-222222222222",
      role: Role.TRAINER,
    });

    const response = await fetch(`${baseUrl}/me/subscription/onboarding`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${trainerToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ planId: "pro-quarterly" }),
    });

    assert.equal(response.status, 403);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test("member onboarding subscription endpoint validates required plan identifiers before hitting the service layer", async () => {
  const { server, baseUrl } = await startServer();

  try {
    const memberToken = issueAccessToken({
      userId: "33333333-3333-3333-3333-333333333333",
      role: Role.MEMBER,
    });

    const response = await fetch(`${baseUrl}/me/subscription/onboarding`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${memberToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ planId: "" }),
    });

    assert.equal(response.status, 400);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
