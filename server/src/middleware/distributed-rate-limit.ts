import { NextFunction, Request, Response } from "express";
import { cacheIncrWindow } from "../cache/client";

type DistributedRateLimitOptions = {
  namespace: string;
  windowMs: number;
  max: number;
  message: string;
  skip?: (req: Request) => boolean;
  key?: (req: Request) => string;
  code?: string;
  buildDetails?: (context: {
    req: Request;
    count: number;
    limit: number;
    remaining: number;
    retryAfterSec: number;
    windowSec: number;
  }) => unknown;
};

function sanitizeRateLimitKeyPart(value: string): string {
  return value.replace(/[^a-zA-Z0-9:._-]/g, "_").slice(0, 160) || "unknown";
}

function clientIdentity(req: Request): string {
  const raw = req.ip || req.socket.remoteAddress || "unknown";
  return sanitizeRateLimitKeyPart(raw);
}

function buildRateLimitKey(namespace: string, req: Request, keyBuilder?: (req: Request) => string): string {
  const identity = keyBuilder?.(req) ?? clientIdentity(req);
  return `rl:${namespace}:${sanitizeRateLimitKeyPart(identity)}`;
}

export function createDistributedRateLimiter(options: DistributedRateLimitOptions) {
  const windowSec = Math.max(1, Math.floor(options.windowMs / 1000));

  return async function distributedRateLimitMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    if (options.skip?.(req)) {
      next();
      return;
    }

    const key = buildRateLimitKey(options.namespace, req, options.key);
    const { count, retryAfterSec } = await cacheIncrWindow(key, windowSec);
    const remaining = Math.max(0, options.max - count);
    const resetAtUnix = Math.ceil((Date.now() + retryAfterSec * 1000) / 1000);
    req.rateLimits = {
      ...(req.rateLimits ?? {}),
      [options.namespace]: {
        count,
        limit: options.max,
        remaining,
        retryAfterSec,
        windowSec,
        resetAtUnix,
      },
    };

    res.setHeader("X-RateLimit-Limit", String(options.max));
    res.setHeader("X-RateLimit-Remaining", String(remaining));
    res.setHeader("X-RateLimit-Reset", String(resetAtUnix));

    if (count > options.max) {
      res.setHeader("Retry-After", String(retryAfterSec));
      res.status(429).json({
        error: {
          code: options.code ?? "RATE_LIMITED",
          message: options.message,
          ...(options.buildDetails
            ? {
                details: options.buildDetails({
                  req,
                  count,
                  limit: options.max,
                  remaining,
                  retryAfterSec,
                  windowSec,
                }),
              }
            : {}),
        },
      });
      return;
    }

    next();
  };
}
