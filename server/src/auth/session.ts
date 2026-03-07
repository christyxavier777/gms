import crypto from "crypto";
import { createPrismaClient } from "../prisma/client";
import { HttpError } from "../middleware/http-error";
import { cacheGet, cacheSet } from "../cache/client";

const prisma = createPrismaClient();

const SESSION_COOKIE = "gms_session";
const SESSION_TTL_DAYS = 7;
const SESSION_REVOKE_PREFIX = "session:revoked:";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function revokedCacheKey(tokenHash: string): string {
  return `${SESSION_REVOKE_PREFIX}${tokenHash}`;
}

function parseCookieHeader(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, part) => {
      const idx = part.indexOf("=");
      if (idx <= 0) return acc;
      acc[part.slice(0, idx)] = decodeURIComponent(part.slice(idx + 1));
      return acc;
    }, {});
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE;
}

export function extractSessionToken(cookieHeader: string | undefined): string | null {
  const cookies = parseCookieHeader(cookieHeader);
  return cookies[SESSION_COOKIE] ?? null;
}

export async function createSession(params: {
  userId: string;
  userAgent?: string;
  ipAddress?: string;
}): Promise<{ token: string; expiresAt: Date }> {
  const token = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId: params.userId,
      tokenHash: hashToken(token),
      userAgent: params.userAgent?.slice(0, 512) ?? null,
      ipAddress: params.ipAddress?.slice(0, 128) ?? null,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function validateSession(sessionToken: string): Promise<{ userId: string; role: string }> {
  const tokenHash = hashToken(sessionToken);
  const revokedCached = await cacheGet(revokedCacheKey(tokenHash));
  if (revokedCached === "1") {
    throw new HttpError(401, "INVALID_SESSION", "Session is invalid or expired");
  }

  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session || session.revokedAt || session.expiresAt <= new Date()) {
    if (session?.revokedAt) {
      const ttlSec = Math.max(60, Math.floor((session.expiresAt.getTime() - Date.now()) / 1000));
      await cacheSet(revokedCacheKey(tokenHash), "1", ttlSec);
    }
    throw new HttpError(401, "INVALID_SESSION", "Session is invalid or expired");
  }

  if (session.user.status !== "ACTIVE") {
    throw new HttpError(403, "ACCOUNT_INACTIVE", "Account is inactive");
  }

  return { userId: session.userId, role: session.user.role };
}

export async function revokeSession(sessionToken: string): Promise<void> {
  const tokenHash = hashToken(sessionToken);
  const existing = await prisma.session.findUnique({
    where: { tokenHash },
    select: { expiresAt: true, revokedAt: true },
  });

  await prisma.session.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  if (existing) {
    const ttlSec = Math.max(60, Math.floor((existing.expiresAt.getTime() - Date.now()) / 1000));
    await cacheSet(revokedCacheKey(tokenHash), "1", ttlSec);
  }
}
