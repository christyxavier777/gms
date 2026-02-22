import { Router } from "express";
import { getSafeUserById } from "../auth/service";
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
