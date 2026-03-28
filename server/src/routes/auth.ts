import { Request, Router } from "express";
import { ZodError } from "zod";
import { loginSchema, registerSchema } from "../auth/schemas";
import { loginUser, registerUser } from "../auth/service";
import { extractSessionToken, getSessionCookieName, revokeSession } from "../auth/session";
import { env } from "../config/env";
import { HttpError } from "../middleware/http-error";
import { loginRateLimiter } from "../middleware/rate-limit";

export const authRouter = Router();

function getLoginThrottleDetails(req: Request) {
  const loginThrottle = req.rateLimits?.login;
  if (!loginThrottle) {
    return null;
  }

  return {
    throttleScope: "login",
    remainingAttempts: loginThrottle.remaining,
    limit: loginThrottle.limit,
    retryAfterSeconds: loginThrottle.retryAfterSec,
    windowSeconds: loginThrottle.windowSec,
    resetAtUnix: loginThrottle.resetAtUnix,
  };
}

authRouter.post("/register", async (req, res) => {
  try {
    const payload = registerSchema.parse(req.body);
    const user = await registerUser(payload);
    res.status(201).json({ user });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new HttpError(400, "VALIDATION_ERROR", "Request payload is invalid", error.flatten());
    }
    throw error;
  }
});

authRouter.post("/login", loginRateLimiter, async (req, res) => {
  try {
    const payload = loginSchema.parse(req.body);
    const loginMeta: { userAgent?: string; ipAddress?: string } = {};
    const userAgent = req.header("user-agent");
    if (userAgent) loginMeta.userAgent = userAgent;
    if (req.ip) loginMeta.ipAddress = req.ip;

    const session = await loginUser(payload, loginMeta);

    res.cookie(getSessionCookieName(), session.sessionToken, {
      httpOnly: true,
      secure: env.cookie.secure,
      sameSite: env.cookie.sameSite,
      ...(env.cookie.domain ? { domain: env.cookie.domain } : {}),
      expires: session.expiresAt,
      path: "/",
    });

    res.status(200).json({ user: session.user });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new HttpError(400, "VALIDATION_ERROR", "Request payload is invalid", error.flatten());
    }
    if (error instanceof HttpError && error.code === "INVALID_CREDENTIALS") {
      const throttleDetails = getLoginThrottleDetails(req);
      if (throttleDetails) {
        const existingDetails =
          error.details && typeof error.details === "object" ? (error.details as Record<string, unknown>) : {};

        throw new HttpError(error.status, error.code, error.message, {
          ...existingDetails,
          ...throttleDetails,
        });
      }
    }
    throw error;
  }
});

authRouter.post("/logout", async (req, res) => {
  const sessionToken = extractSessionToken(req.header("cookie"));
  if (sessionToken) {
    await revokeSession(sessionToken);
  }
  res.clearCookie(getSessionCookieName(), {
    path: "/",
    ...(env.cookie.domain ? { domain: env.cookie.domain } : {}),
  });
  res.status(204).send();
});
