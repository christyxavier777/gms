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

test("payment creation validates invalid UPI handles before reaching the service layer", async () => {
  const { server, baseUrl } = await startServer();

  try {
    const memberToken = issueAccessToken({
      userId: "11111111-1111-1111-1111-111111111111",
      role: Role.MEMBER,
    });

    const response = await fetch(`${baseUrl}/payments/upi`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${memberToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: "11111111-1111-1111-1111-111111111111",
        amount: 499,
        upiId: "bad-handle",
      }),
    });

    assert.equal(response.status, 400);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test("payment creation validates oversized proof references before reaching the service layer", async () => {
  const { server, baseUrl } = await startServer();

  try {
    const memberToken = issueAccessToken({
      userId: "11111111-1111-1111-1111-111111111111",
      role: Role.MEMBER,
    });

    const response = await fetch(`${baseUrl}/payments/upi`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${memberToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: "11111111-1111-1111-1111-111111111111",
        amount: 499,
        upiId: "member@okaxis",
        proofReference: "x".repeat(501),
      }),
    });

    assert.equal(response.status, 400);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test("payment review updates remain admin-only", async () => {
  const { server, baseUrl } = await startServer();

  try {
    const memberToken = issueAccessToken({
      userId: "22222222-2222-2222-2222-222222222222",
      role: Role.MEMBER,
    });

    const response = await fetch(`${baseUrl}/payments/33333333-3333-3333-3333-333333333333/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${memberToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "SUCCESS",
        verificationNotes: "Looks good",
      }),
    });

    assert.equal(response.status, 403);

    const payload = (await response.json()) as { error?: { code?: string } };
    assert.equal(payload.error?.code, "PAYMENT_REVIEW_FORBIDDEN");
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test("members cannot create payments for another user", async () => {
  const { server, baseUrl } = await startServer();

  try {
    const memberToken = issueAccessToken({
      userId: "66666666-6666-6666-6666-666666666666",
      role: Role.MEMBER,
    });

    const response = await fetch(`${baseUrl}/payments/upi`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${memberToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: "77777777-7777-7777-7777-777777777777",
        amount: 499,
        upiId: "member@okaxis",
      }),
    });

    assert.equal(response.status, 403);

    const payload = (await response.json()) as { error?: { code?: string } };
    assert.equal(payload.error?.code, "PAYMENT_CREATE_FORBIDDEN");
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test("payment review note length is validated before hitting the service layer", async () => {
  const { server, baseUrl } = await startServer();

  try {
    const adminToken = issueAccessToken({
      userId: "44444444-4444-4444-4444-444444444444",
      role: Role.ADMIN,
    });

    const response = await fetch(`${baseUrl}/payments/55555555-5555-5555-5555-555555555555/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "FAILED",
        verificationNotes: "x".repeat(241),
      }),
    });

    assert.equal(response.status, 400);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
