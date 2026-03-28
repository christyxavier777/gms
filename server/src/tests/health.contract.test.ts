import test from "node:test";
import assert from "node:assert/strict";
import { AddressInfo } from "node:net";
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

test("health live endpoint returns liveness metadata", async () => {
  const { server, baseUrl } = await startServer();

  try {
    const response = await fetch(`${baseUrl}/health/live`);
    const body = (await response.json()) as {
      status: string;
      service: string;
      timestamp: string;
      uptimeSec: number;
    };

    assert.equal(response.status, 200);
    assert.equal(body.status, "ok");
    assert.equal(body.service, "gms-server");
    assert.equal(typeof body.timestamp, "string");
    assert.equal(typeof body.uptimeSec, "number");
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test("health endpoint exposes structured dependency status", async () => {
  const { server, baseUrl } = await startServer();

  try {
    const response = await fetch(`${baseUrl}/health`);
    const body = (await response.json()) as {
      status: string;
      database: string;
      cache: string;
      dependencies: {
        database: { ready: boolean };
        cache: { ready: boolean; configured: boolean };
      };
    };

    assert.ok(response.status === 200 || response.status === 503);
    assert.ok(body.status === "ok" || body.status === "degraded");
    assert.ok(body.database === "up" || body.database === "down");
    assert.ok(body.cache === "up" || body.cache === "down" || body.cache === "fallback");
    assert.equal(typeof body.dependencies.database.ready, "boolean");
    assert.equal(typeof body.dependencies.cache.ready, "boolean");
    assert.equal(typeof body.dependencies.cache.configured, "boolean");
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
