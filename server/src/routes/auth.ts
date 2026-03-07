import { Router } from "express";
import { ZodError } from "zod";
import { loginSchema, registerSchema } from "../auth/schemas";
import { loginUser, registerUser } from "../auth/service";
import { extractSessionToken, getSessionCookieName, revokeSession } from "../auth/session";
import { HttpError } from "../middleware/http-error";

export const authRouter = Router();

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

authRouter.post("/login", async (req, res) => {
  try {
    const payload = loginSchema.parse(req.body);
    const loginMeta: { userAgent?: string; ipAddress?: string } = {};
    const userAgent = req.header("user-agent");
    if (userAgent) loginMeta.userAgent = userAgent;
    if (req.ip) loginMeta.ipAddress = req.ip;

    const session = await loginUser(payload, loginMeta);

    res.cookie(getSessionCookieName(), session.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: session.expiresAt,
      path: "/",
    });

    res.status(200).json({ user: session.user });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new HttpError(400, "VALIDATION_ERROR", "Request payload is invalid", error.flatten());
    }
    throw error;
  }
});

authRouter.post("/logout", async (req, res) => {
  const sessionToken = extractSessionToken(req.header("cookie"));
  if (sessionToken) {
    await revokeSession(sessionToken);
  }
  res.clearCookie(getSessionCookieName(), { path: "/" });
  res.status(204).send();
});
