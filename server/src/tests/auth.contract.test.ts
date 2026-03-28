import test from "node:test";
import assert from "node:assert/strict";
import { AddressInfo } from "node:net";
import { Role } from "@prisma/client";
import { issueAccessToken } from "../auth/jwt";
import { env } from "../config/env";
import { createApp } from "../app";

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

test("login throttling returns auth-specific retry metadata", async () => {
  const { server, baseUrl } = await startServer();

  try {
    let response: Response | null = null;
    const body = JSON.stringify({
      email: "throttle.contract",
      password: "x",
    });

    for (let attempt = 0; attempt <= env.authRateLimitMax; attempt += 1) {
      response = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
    }

    assert.ok(response);
    assert.equal(response.status, 429);
    assert.equal(response.headers.get("X-RateLimit-Remaining"), "0");

    const retryAfter = Number(response.headers.get("Retry-After"));
    assert.equal(Number.isFinite(retryAfter) && retryAfter > 0, true);

    const payload = (await response.json()) as {
      error: {
        code: string;
        details?: {
          throttleScope?: string;
          retryAfterSeconds?: number;
          limit?: number;
          windowSeconds?: number;
        };
      };
    };

    assert.equal(payload.error.code, "AUTH_LOGIN_THROTTLED");
    assert.equal(payload.error.details?.throttleScope, "login");
    assert.equal(payload.error.details?.limit, env.authRateLimitMax);
    assert.equal(payload.error.details?.retryAfterSeconds, retryAfter);
    assert.equal(typeof payload.error.details?.windowSeconds, "number");
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test("login validation failures still expose remaining throttle headers", async () => {
  const { server, baseUrl } = await startServer();

  try {
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "visibility.contract",
        password: "x",
      }),
    });

    assert.equal(response.status, 400);
    assert.equal(response.headers.get("X-RateLimit-Limit"), String(env.authRateLimitMax));
    assert.equal(response.headers.get("X-RateLimit-Remaining"), String(env.authRateLimitMax - 1));
    assert.equal(Number.isFinite(Number(response.headers.get("X-RateLimit-Reset"))), true);

    const payload = (await response.json()) as { error: { code: string } };
    assert.equal(payload.error.code, "VALIDATION_ERROR");
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test("session visibility endpoint requires authentication", async () => {
  const { server, baseUrl } = await startServer();

  try {
    const response = await fetch(`${baseUrl}/me/sessions`);

    assert.equal(response.status, 401);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test("revoke other sessions requires a cookie-backed session context", async () => {
  const { server, baseUrl } = await startServer();

  try {
    const accessToken = issueAccessToken({
      userId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      role: Role.MEMBER,
    });

    const response = await fetch(`${baseUrl}/me/sessions/revoke-others`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    assert.equal(response.status, 400);

    const payload = (await response.json()) as { error?: { code?: string } };
    assert.equal(payload.error?.code, "SESSION_CONTEXT_REQUIRED");
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
