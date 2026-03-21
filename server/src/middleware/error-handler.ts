import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { HttpError } from "./http-error";
import { logError, logInfo } from "../utils/logger";
import { recordWearableWebhookAudit } from "../observability/wearable-webhook-metrics";

// Final error boundary for unhandled application errors.
export function errorHandlerMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err && typeof err === "object" && "type" in err && (err as { type?: string }).type === "entity.too.large") {
    res.status(413).json({
      error: {
        code: "PAYLOAD_TOO_LARGE",
        message: "Request payload exceeds allowed size",
      },
    });
    return;
  }

  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({
      error: {
        code: "INVALID_JSON",
        message: "Malformed JSON payload",
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request payload is invalid",
        details: err.flatten(),
      },
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const status = err.code === "P2025" ? 404 : 400;
    const code = err.code === "P2025" ? "RESOURCE_NOT_FOUND" : "DATABASE_ERROR";
    res.status(status).json({
      error: {
        code,
        message: "Database operation failed",
      },
    });
    return;
  }

  if (
    err instanceof Prisma.PrismaClientInitializationError ||
    err instanceof Prisma.PrismaClientRustPanicError
  ) {
    res.status(503).json({
      error: {
        code: "DATABASE_UNAVAILABLE",
        message: "Database is unavailable. Verify DATABASE_URL and database service status.",
      },
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    res.status(500).json({
      error: {
        code: "DATABASE_ERROR",
        message: "Database operation failed",
      },
    });
    return;
  }

  if (err instanceof jwt.TokenExpiredError) {
    res.status(401).json({
      error: {
        code: "TOKEN_EXPIRED",
        message: "Token has expired",
      },
    });
    return;
  }

  if (err instanceof jwt.JsonWebTokenError) {
    res.status(401).json({
      error: {
        code: "INVALID_TOKEN",
        message: "Invalid token",
      },
    });
    return;
  }

  if (err instanceof HttpError) {
    if (req.path === "/integrations/wearables/webhook") {
      const provider = req.header("x-wearable-provider");
      const eventId = req.header("x-wearable-event-id") ?? undefined;
      if (provider === "FITBIT" || provider === "APPLE_WATCH" || provider === "GENERIC") {
        recordWearableWebhookAudit("REJECTED", provider, {
          requestId: req.requestId,
          eventId,
          errorCode: err.code,
          message: err.message,
        });
      } else {
        recordWearableWebhookAudit("REJECTED", "UNKNOWN", {
          requestId: req.requestId,
          eventId,
          errorCode: err.code,
          message: err.message,
        });
      }
      logInfo("wearable_webhook_rejected", {
        requestId: req.requestId,
        code: err.code,
        status: err.status,
        provider: req.header("x-wearable-provider") ?? null,
        eventId: req.header("x-wearable-event-id") ?? null,
      });
    }
    if (err.status >= 500) {
      logError("http_error", {
        requestId: req.requestId,
        code: err.code,
        status: err.status,
        message: err.message,
        path: req.originalUrl,
        method: req.method,
      });
    }
    res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    });
    return;
  }

  if (env.nodeEnv !== "production") {
    logError("http_error_unhandled", {
      requestId: req.requestId,
      path: req.originalUrl,
      method: req.method,
      error: err instanceof Error ? err.message : "unknown",
    });
    console.error("[error]", err);
  } else {
    logError("http_error_unhandled", {
      requestId: req.requestId,
      path: req.originalUrl,
      method: req.method,
    });
  }

  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Unexpected server error",
    },
  });
}
