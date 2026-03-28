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

test("schedule workspace requires authentication", async () => {
  const { server, baseUrl } = await startServer();

  try {
    const response = await fetch(`${baseUrl}/schedule`);
    assert.equal(response.status, 401);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test("members cannot create scheduled sessions", async () => {
  const { server, baseUrl } = await startServer();

  try {
    const memberToken = issueAccessToken({
      userId: "11111111-1111-1111-1111-111111111111",
      role: Role.MEMBER,
    });

    const response = await fetch(`${baseUrl}/schedule`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${memberToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Morning conditioning",
        sessionType: "CLASS",
        startsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        capacity: 10,
      }),
    });

    assert.equal(response.status, 403);

    const payload = (await response.json()) as { error?: { code?: string } };
    assert.equal(payload.error?.code, "SCHEDULE_SESSION_CREATE_FORBIDDEN");
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test("scheduled session payload is validated before hitting the service layer", async () => {
  const { server, baseUrl } = await startServer();

  try {
    const trainerToken = issueAccessToken({
      userId: "22222222-2222-2222-2222-222222222222",
      role: Role.TRAINER,
    });

    const response = await fetch(`${baseUrl}/schedule`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${trainerToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "AB",
        sessionType: "CLASS",
        startsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        endsAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        capacity: 0,
      }),
    });

    assert.equal(response.status, 400);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test("booking a session is member-only", async () => {
  const { server, baseUrl } = await startServer();

  try {
    const trainerToken = issueAccessToken({
      userId: "33333333-3333-3333-3333-333333333333",
      role: Role.TRAINER,
    });

    const response = await fetch(`${baseUrl}/schedule/44444444-4444-4444-4444-444444444444/book`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${trainerToken}`,
      },
    });

    assert.equal(response.status, 403);

    const payload = (await response.json()) as { error?: { code?: string } };
    assert.equal(payload.error?.code, "SCHEDULE_BOOKING_CREATE_FORBIDDEN");
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test("trainers cannot create sessions on behalf of another trainer", async () => {
  const { server, baseUrl } = await startServer();

  try {
    const trainerToken = issueAccessToken({
      userId: "77777777-7777-7777-7777-777777777777",
      role: Role.TRAINER,
    });

    const response = await fetch(`${baseUrl}/schedule`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${trainerToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Trainer-led assessment",
        sessionType: "ASSESSMENT",
        trainerId: "88888888-8888-8888-8888-888888888888",
        startsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        capacity: 4,
      }),
    });

    assert.equal(response.status, 403);

    const payload = (await response.json()) as { error?: { code?: string } };
    assert.equal(payload.error?.code, "SCHEDULE_TRAINER_SCOPE_FORBIDDEN");
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test("schedule booking updates validate status values", async () => {
  const { server, baseUrl } = await startServer();

  try {
    const adminToken = issueAccessToken({
      userId: "55555555-5555-5555-5555-555555555555",
      role: Role.ADMIN,
    });

    const response = await fetch(`${baseUrl}/schedule/bookings/66666666-6666-6666-6666-666666666666`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "BOOKED" }),
    });

    assert.equal(response.status, 400);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
