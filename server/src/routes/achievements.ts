import { Role } from "@prisma/client";
import { Router } from "express";
import { ZodError } from "zod";
import { getMemberAchievements, canReadAchievements } from "../achievements/service";
import { HttpError } from "../middleware/http-error";
import { requireAuth } from "../middleware/require-auth";
import { requireRole } from "../middleware/require-role";
import { userIdParamSchema } from "../users/schemas";

export const achievementsRouter = Router();

achievementsRouter.get("/me/achievements", requireAuth, requireRole(Role.MEMBER), async (req, res) => {
  if (!req.auth) throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
  const achievements = await getMemberAchievements(req.auth.userId);
  res.status(200).json({ achievements });
});

achievementsRouter.get(
  "/users/:id/achievements",
  requireAuth,
  requireRole(Role.ADMIN, Role.TRAINER),
  async (req, res) => {
    try {
      if (!req.auth) throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
      const params = userIdParamSchema.parse(req.params);
      const allowed = await canReadAchievements(req.auth, params.id);
      if (!allowed) {
        throw new HttpError(403, "FORBIDDEN", "You are not allowed to view this member achievements");
      }
      const achievements = await getMemberAchievements(params.id);
      res.status(200).json({ achievements });
    } catch (error) {
      if (error instanceof ZodError) {
        throw new HttpError(400, "VALIDATION_ERROR", "Path parameters are invalid", error.flatten());
      }
      throw error;
    }
  },
);
