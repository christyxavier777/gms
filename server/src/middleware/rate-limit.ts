import { Request } from "express";
import { env } from "../config/env";
import { createDistributedRateLimiter } from "./distributed-rate-limit";

function normalizeRateLimitKeyPart(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9:._-]/g, "_").slice(0, 160) || "unknown";
}

function buildLoginIdentity(req: Request): string {
  const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
  const email = typeof req.body?.email === "string" ? req.body.email : "";

  return `${normalizeRateLimitKeyPart(ipAddress)}:${normalizeRateLimitKeyPart(email || "anonymous")}`;
}

// Rate limit for authentication endpoints to reduce brute-force attempts.
export const authRateLimiter = createDistributedRateLimiter({
  namespace: "auth",
  windowMs: env.authRateLimitWindowMs,
  max: env.authRateLimitMax,
  message: "Too many authentication requests. Please try again later.",
  code: "AUTH_THROTTLED",
  skip: (req: Request) => req.path === "/login",
  buildDetails: ({ limit, retryAfterSec, windowSec }) => ({
    throttleScope: "auth",
    retryAfterSeconds: retryAfterSec,
    limit,
    windowSeconds: windowSec,
  }),
});

// Dedicated login limiter with retry metadata for lockout-like feedback.
export const loginRateLimiter = createDistributedRateLimiter({
  namespace: "login",
  windowMs: env.authRateLimitWindowMs,
  max: env.authRateLimitMax,
  message: "Too many login attempts. Please wait before trying again.",
  code: "AUTH_LOGIN_THROTTLED",
  key: buildLoginIdentity,
  buildDetails: ({ limit, retryAfterSec, windowSec }) => ({
    throttleScope: "login",
    retryAfterSeconds: retryAfterSec,
    limit,
    windowSeconds: windowSec,
  }),
});

// Rate limit mutating requests while allowing read traffic.
export const mutationRateLimiter = createDistributedRateLimiter({
  namespace: "mutation",
  windowMs: env.mutationRateLimitWindowMs,
  max: env.mutationRateLimitMax,
  skip: (req: Request) => {
    if (req.path.startsWith("/auth")) return true;
    return ["GET", "HEAD", "OPTIONS"].includes(req.method.toUpperCase());
  },
  message: "Too many write requests. Please slow down and retry.",
});

// Dedicated limiter for wearable sync ingestion bursts.
export const wearableSyncRateLimiter = createDistributedRateLimiter({
  namespace: "wearable_sync",
  windowMs: env.wearableSyncRateLimitWindowMs,
  max: env.wearableSyncRateLimitMax,
  message: "Too many wearable sync requests. Please retry shortly.",
});
