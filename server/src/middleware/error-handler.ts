import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { HttpError } from "./http-error";

// Final error boundary for unhandled application errors.
export function errorHandlerMiddleware(
  err: unknown,
  _req: Request,
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
    console.error("[error]", err);
  } else {
    console.error("[error] unexpected server error");
  }

  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Unexpected server error",
    },
  });
}
