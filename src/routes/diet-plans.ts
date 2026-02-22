import { Router } from "express";
import { ZodError } from "zod";
import { HttpError } from "../middleware/http-error";
import { requireAuth } from "../middleware/require-auth";
import {
  assignDietPlanSchema,
  createDietPlanSchema,
  dietPlanIdParamSchema,
  updateDietPlanSchema,
} from "../plans/diet-schemas";
import {
  assignDietPlan,
  createDietPlan,
  deleteDietPlan,
  getDietPlanById,
  listDietPlans,
  updateDietPlan,
} from "../plans/diet-service";

// Diet plan CRUD and assignment endpoints.
export const dietPlansRouter = Router();

dietPlansRouter.post("/diet-plans", requireAuth, async (req, res) => {
  try {
    if (!req.auth) throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
    const payload = createDietPlanSchema.parse(req.body);
    const plan = await createDietPlan(req.auth, payload);
    res.status(201).json({ plan });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new HttpError(400, "VALIDATION_ERROR", "Request payload is invalid", error.flatten());
    }
    throw error;
  }
});

dietPlansRouter.get("/diet-plans", requireAuth, async (req, res) => {
  if (!req.auth) throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
  const plans = await listDietPlans(req.auth);
  res.status(200).json({ plans });
});

dietPlansRouter.get("/diet-plans/:id", requireAuth, async (req, res) => {
  try {
    if (!req.auth) throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
    const params = dietPlanIdParamSchema.parse(req.params);
    const plan = await getDietPlanById(req.auth, params.id);
    res.status(200).json({ plan });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new HttpError(400, "VALIDATION_ERROR", "Path parameters are invalid", error.flatten());
    }
    throw error;
  }
});

dietPlansRouter.patch("/diet-plans/:id", requireAuth, async (req, res) => {
  try {
    if (!req.auth) throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
    const params = dietPlanIdParamSchema.parse(req.params);
    const payload = updateDietPlanSchema.parse(req.body);
    const plan = await updateDietPlan(req.auth, params.id, payload);
    res.status(200).json({ plan });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new HttpError(400, "VALIDATION_ERROR", "Request is invalid", error.flatten());
    }
    throw error;
  }
});

dietPlansRouter.delete("/diet-plans/:id", requireAuth, async (req, res) => {
  try {
    if (!req.auth) throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
    const params = dietPlanIdParamSchema.parse(req.params);
    await deleteDietPlan(req.auth, params.id);
    res.status(204).send();
  } catch (error) {
    if (error instanceof ZodError) {
      throw new HttpError(400, "VALIDATION_ERROR", "Path parameters are invalid", error.flatten());
    }
    throw error;
  }
});

dietPlansRouter.post("/diet-plans/:id/assign", requireAuth, async (req, res) => {
  try {
    if (!req.auth) throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
    const params = dietPlanIdParamSchema.parse(req.params);
    const payload = assignDietPlanSchema.parse(req.body);
    const plan = await assignDietPlan(req.auth, params.id, payload.memberId);
    res.status(200).json({ plan });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new HttpError(400, "VALIDATION_ERROR", "Request is invalid", error.flatten());
    }
    throw error;
  }
});
