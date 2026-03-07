import { NextFunction, Request, Response } from "express";
import { logInfo } from "../utils/logger";

// Minimal request logging for method + path + status without sensitive payloads.
export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startedAt = Date.now();
  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    logInfo("http_request", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      userId: req.auth?.userId,
      role: req.auth?.role,
      ip: req.ip,
    });
  });
  next();
}
