import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../auth/jwt";
import { HttpError } from "./http-error";

// Ensures a valid Bearer token is present and attaches auth context to request.
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authorizationHeader = req.header("authorization");
  if (!authorizationHeader) {
    throw new HttpError(401, "AUTH_REQUIRED", "Authorization header is required");
  }

  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new HttpError(401, "INVALID_AUTH_HEADER", "Authorization header must be Bearer token");
  }

  try {
    const payload = verifyAccessToken(token);
    if (!payload.userId || !payload.role) {
      throw new HttpError(401, "INVALID_TOKEN", "Token payload is invalid");
    }
    req.auth = { userId: payload.userId, role: payload.role };
    next();
  } catch {
    throw new HttpError(401, "INVALID_TOKEN", "Invalid or expired token");
  }
}
