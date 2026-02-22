import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AuthTokenPayload } from "./types";

// Creates signed JWT access tokens for authenticated users.
export function issueAccessToken(payload: AuthTokenPayload): string {
  const expiresIn = env.jwtExpiresIn as NonNullable<jwt.SignOptions["expiresIn"]>;
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn,
  });
}

// Verifies and decodes JWT tokens used by request auth middleware.
export function verifyAccessToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.jwtSecret) as AuthTokenPayload;
}
