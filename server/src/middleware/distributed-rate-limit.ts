import { NextFunction, Request, Response } from "express";
import { cacheIncrWindow } from "../cache/client";

type DistributedRateLimitOptions = {
  namespace: string;
  windowMs: number;
  max: number;
  message: string;
  skip?: (req: Request) => boolean;
};

function clientIdentity(req: Request): string {
  const raw = req.ip || req.socket.remoteAddress || "unknown";
  return raw.replace(/[^a-zA-Z0-9:._-]/g, "_");
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

    const key = `rl:${options.namespace}:${clientIdentity(req)}`;
    const count = await cacheIncrWindow(key, windowSec);

    res.setHeader("X-RateLimit-Limit", String(options.max));
    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, options.max - count)));

    if (count > options.max) {
      res.setHeader("Retry-After", String(windowSec));
      res.status(429).json({
        error: {
          code: "RATE_LIMITED",
          message: options.message,
        },
      });
      return;
    }

    next();
  };
}

