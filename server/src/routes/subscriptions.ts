import { Role } from "@prisma/client";
import { Router } from "express";
import { ZodError } from "zod";
import { HttpError } from "../middleware/http-error";
import { requireAuth } from "../middleware/require-auth";
import { requireRole } from "../middleware/require-role";
import {
  createOnboardingSubscriptionSchema,
  createSubscriptionSchema,
  listSubscriptionsQuerySchema,
  subscriptionIdParamSchema,
} from "../subscriptions/schemas";
import {
  cancelSubscription,
  createOnboardingSubscription,
  createSubscription,
  listMembershipPlans,
  getMySubscription,
  getSubscriptionById,
  listSubscriptions,
} from "../subscriptions/service";

// Subscription lifecycle endpoints.
export const subscriptionsRouter = Router();

subscriptionsRouter.get("/membership-plans", async (_req, res) => {
  const plans = await listMembershipPlans();
  res.status(200).json({ plans });
});

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

subscriptionsRouter.post(
  "/me/subscription/onboarding",
  requireAuth,
  requireRole(Role.MEMBER),
  async (req, res) => {
    try {
      if (!req.auth) throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
      const payload = createOnboardingSubscriptionSchema.parse(req.body);
      const subscription = await createOnboardingSubscription(req.auth.userId, payload.planId);
      res.status(201).json({ subscription });
    } catch (error) {
      if (error instanceof ZodError) {
        throw new HttpError(400, "VALIDATION_ERROR", "Request payload is invalid", error.flatten());
      }
      throw error;
    }
  },
);

subscriptionsRouter.get("/subscriptions", requireAuth, requireRole(Role.ADMIN), async (req, res) => {
  try {
    const query = listSubscriptionsQuerySchema.parse(req.query);
    const result = await listSubscriptions(query);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new HttpError(400, "VALIDATION_ERROR", "Query parameters are invalid", error.flatten());
    }
    throw error;
  }
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
