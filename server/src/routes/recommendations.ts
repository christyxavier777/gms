import { Role } from "@prisma/client";
import { Router } from "express";
import { ZodError } from "zod";
import { canReadRecommendations, getMemberRecommendation } from "../recommendations/service";
import { HttpError } from "../middleware/http-error";
import { requireAuth } from "../middleware/require-auth";
import { requireRole } from "../middleware/require-role";
import { userIdParamSchema } from "../users/schemas";

export const recommendationsRouter = Router();

recommendationsRouter.get("/me/recommendations", requireAuth, requireRole(Role.MEMBER), async (req, res) => {
  if (!req.auth) throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
  const result = await getMemberRecommendation(req.auth.userId);
  res.status(200).json(result);
});

recommendationsRouter.get(
  "/users/:id/recommendations",
  requireAuth,
  requireRole(Role.ADMIN, Role.TRAINER),
  async (req, res) => {
    try {
      if (!req.auth) throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
      const params = userIdParamSchema.parse(req.params);
      const allowed = await canReadRecommendations(req.auth, params.id);
      if (!allowed) {
        throw new HttpError(403, "FORBIDDEN", "You are not allowed to view this member recommendations");
      }
      const result = await getMemberRecommendation(params.id);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new HttpError(400, "VALIDATION_ERROR", "Path parameters are invalid", error.flatten());
      }
      throw error;
    }
  },
);
