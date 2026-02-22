import { Role } from "@prisma/client";
import { Router } from "express";
import { ZodError } from "zod";
import { HttpError } from "../middleware/http-error";
import { requireAuth } from "../middleware/require-auth";
import { requireRole } from "../middleware/require-role";
import { createSubscriptionSchema, subscriptionIdParamSchema } from "../subscriptions/schemas";
import {
  cancelSubscription,
  createSubscription,
  getMySubscription,
  getSubscriptionById,
  listSubscriptions,
} from "../subscriptions/service";

// Subscription lifecycle endpoints.
export const subscriptionsRouter = Router();

subscriptionsRouter.post("/subscriptions", requireAuth, requireRole(Role.ADMIN), async (req, res) => {
  try {
    const payload = createSubscriptionSchema.parse(req.body);
    const subscription = await createSubscription(payload);
    res.status(201).json({ subscription });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new HttpError(400, "VALIDATION_ERROR", "Request payload is invalid", error.flatten());
    }
    throw error;
  }
});

subscriptionsRouter.get("/subscriptions", requireAuth, requireRole(Role.ADMIN), async (_req, res) => {
  const subscriptions = await listSubscriptions();
  res.status(200).json({ subscriptions });
});

subscriptionsRouter.get("/subscriptions/:id", requireAuth, async (req, res) => {
  try {
    if (!req.auth) throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
    const params = subscriptionIdParamSchema.parse(req.params);
    const subscription = await getSubscriptionById(req.auth, params.id);
    res.status(200).json({ subscription });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new HttpError(400, "VALIDATION_ERROR", "Path parameters are invalid", error.flatten());
    }
    throw error;
  }
});

subscriptionsRouter.get("/me/subscription", requireAuth, requireRole(Role.MEMBER), async (req, res) => {
  if (!req.auth) throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
  const subscription = await getMySubscription(req.auth.userId);
  res.status(200).json({ subscription });
});

subscriptionsRouter.post(
  "/subscriptions/:id/cancel",
  requireAuth,
  requireRole(Role.ADMIN),
  async (req, res) => {
    try {
      const params = subscriptionIdParamSchema.parse(req.params);
      const subscription = await cancelSubscription(params.id);
      res.status(200).json({ subscription });
    } catch (error) {
      if (error instanceof ZodError) {
        throw new HttpError(400, "VALIDATION_ERROR", "Path parameters are invalid", error.flatten());
      }
      throw error;
    }
  },
);
