import { NextFunction, Request, Response } from "express";
import crypto from "crypto";

// Assigns stable request id for tracing and returns it in response headers.
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingRequestId = req.header("x-request-id")?.trim();
  const requestId = incomingRequestId && incomingRequestId.length > 0 ? incomingRequestId : crypto.randomUUID();

  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);
  next();
}

