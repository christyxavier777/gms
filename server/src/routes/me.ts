import { Router } from "express";
import { getSafeUserById } from "../auth/service";
import { extractSessionToken, getSessionCookieName, listUserSessions, revokeUserSessions } from "../auth/session";
import { env } from "../config/env";
import { HttpError } from "../middleware/http-error";
import { requireAuth } from "../middleware/require-auth";

// Authenticated profile endpoint.
export const meRouter = Router();

meRouter.get("/me", requireAuth, async (req, res) => {
  if (!req.auth) {
    throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
  }
  const user = await getSafeUserById(req.auth.userId);
  res.status(200).json({ user });
});

meRouter.get("/me/sessions", requireAuth, async (req, res) => {
  if (!req.auth) {
    throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
  }

  const currentSessionToken = extractSessionToken(req.header("cookie"));
  const sessions = await listUserSessions({
    userId: req.auth.userId,
    currentSessionToken,
  });

  res.status(200).json({ sessions });
});

meRouter.post("/me/sessions/revoke-others", requireAuth, async (req, res) => {
  if (!req.auth) {
    throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
  }

  const currentSessionToken = extractSessionToken(req.header("cookie"));
  if (!currentSessionToken) {
    throw new HttpError(
      400,
      "SESSION_CONTEXT_REQUIRED",
      "Signing out other sessions requires a session-backed request",
    );
  }

  const result = await revokeUserSessions({
    userId: req.auth.userId,
    excludeSessionToken: currentSessionToken,
  });

  res.status(200).json(result);
});

meRouter.post("/me/sessions/revoke-all", requireAuth, async (req, res) => {
  if (!req.auth) {
    throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
  }

  const result = await revokeUserSessions({
    userId: req.auth.userId,
  });

  res.clearCookie(getSessionCookieName(), {
    path: "/",
    ...(env.cookie.domain ? { domain: env.cookie.domain } : {}),
  });

  res.status(200).json(result);
});
