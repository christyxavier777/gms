import { Role } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { verifyAccessToken } from "../auth/jwt";
import { extractSessionToken, validateSession } from "../auth/session";
import { HttpError } from "./http-error";

// Ensures a valid session cookie or fallback bearer token is present.
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const sessionToken = extractSessionToken(req.header("cookie"));

  if (sessionToken) {
    const auth = await validateSession(sessionToken);
    req.auth = { userId: auth.userId, role: auth.role as Role };
    next();
    return;
  }

  const authorizationHeader = req.header("authorization");
  if (!authorizationHeader) {
    throw new HttpError(401, "AUTH_REQUIRED", "A valid session is required");
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
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new HttpError(401, "TOKEN_EXPIRED", "Token has expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new HttpError(401, "INVALID_TOKEN", "Invalid token");
    }
    throw error;
  }
}
