import { Request } from "express";
import { env } from "../config/env";

const rateLimit = require("express-rate-limit");

// Rate limit for authentication endpoints to reduce brute-force attempts.
export const authRateLimiter = rateLimit({
  windowMs: env.authRateLimitWindowMs,
  max: env.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: "RATE_LIMITED",
      message: "Too many authentication requests. Please try again later.",
    },
  },
});

// Rate limit mutating requests while allowing read traffic.
export const mutationRateLimiter = rateLimit({
  windowMs: env.mutationRateLimitWindowMs,
  max: env.mutationRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    if (req.path.startsWith("/auth")) return true;
    return ["GET", "HEAD", "OPTIONS"].includes(req.method.toUpperCase());
  },
  message: {
    error: {
      code: "RATE_LIMITED",
      message: "Too many write requests. Please slow down and retry.",
    },
  },
});
