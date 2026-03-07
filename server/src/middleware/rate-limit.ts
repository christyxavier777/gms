import { Request } from "express";
import { env } from "../config/env";
import { createDistributedRateLimiter } from "./distributed-rate-limit";

// Rate limit for authentication endpoints to reduce brute-force attempts.
export const authRateLimiter = createDistributedRateLimiter({
  namespace: "auth",
  windowMs: env.authRateLimitWindowMs,
  max: env.authRateLimitMax,
  message: "Too many authentication requests. Please try again later.",
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
