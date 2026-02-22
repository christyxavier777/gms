import { NextFunction, Request, Response } from "express";

// Minimal request logging for method + path + status without sensitive payloads.
export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startedAt = Date.now();
  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    console.log(`[request] ${req.method} ${req.path} -> ${res.statusCode} (${durationMs}ms)`);
  });
  next();
}
