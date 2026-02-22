import { Role } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { HttpError } from "./http-error";

// Enforces role-based authorization on already authenticated requests.
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
    }

    if (!roles.includes(req.auth.role)) {
      throw new HttpError(403, "FORBIDDEN", "You are not allowed to access this resource");
    }

    next();
  };
}
