import { Router } from "express";
import { ZodError } from "zod";
import { HttpError } from "../middleware/http-error";
import { requireAuth } from "../middleware/require-auth";
import {
  assignWorkoutPlanSchema,
  createWorkoutPlanSchema,
  updateWorkoutPlanSchema,
  workoutPlanIdParamSchema,
} from "../plans/workout-schemas";
import {
  assignWorkoutPlan,
  createWorkoutPlan,
  deleteWorkoutPlan,
  getWorkoutPlanById,
  listWorkoutPlans,
  updateWorkoutPlan,
} from "../plans/workout-service";

// Workout plan CRUD and assignment endpoints.
export const workoutPlansRouter = Router();

workoutPlansRouter.post("/workout-plans", requireAuth, async (req, res) => {
  try {
    if (!req.auth) throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
    const payload = createWorkoutPlanSchema.parse(req.body);
    const plan = await createWorkoutPlan(req.auth, payload);
    res.status(201).json({ plan });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new HttpError(400, "VALIDATION_ERROR", "Request payload is invalid", error.flatten());
    }
    throw error;
  }
});

workoutPlansRouter.get("/workout-plans", requireAuth, async (req, res) => {
  if (!req.auth) throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
  const plans = await listWorkoutPlans(req.auth);
  res.status(200).json({ plans });
});

workoutPlansRouter.get("/workout-plans/:id", requireAuth, async (req, res) => {
  try {
    if (!req.auth) throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
    const params = workoutPlanIdParamSchema.parse(req.params);
    const plan = await getWorkoutPlanById(req.auth, params.id);
    res.status(200).json({ plan });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new HttpError(400, "VALIDATION_ERROR", "Path parameters are invalid", error.flatten());
    }
    throw error;
  }
});

workoutPlansRouter.patch("/workout-plans/:id", requireAuth, async (req, res) => {
  try {
    if (!req.auth) throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
    const params = workoutPlanIdParamSchema.parse(req.params);
    const payload = updateWorkoutPlanSchema.parse(req.body);
    const plan = await updateWorkoutPlan(req.auth, params.id, payload);
    res.status(200).json({ plan });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new HttpError(400, "VALIDATION_ERROR", "Request is invalid", error.flatten());
    }
    throw error;
  }
});

workoutPlansRouter.delete("/workout-plans/:id", requireAuth, async (req, res) => {
  try {
    if (!req.auth) throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
    const params = workoutPlanIdParamSchema.parse(req.params);
    await deleteWorkoutPlan(req.auth, params.id);
    res.status(204).send();
  } catch (error) {
    if (error instanceof ZodError) {
      throw new HttpError(400, "VALIDATION_ERROR", "Path parameters are invalid", error.flatten());
    }
    throw error;
  }
});

workoutPlansRouter.post("/workout-plans/:id/assign", requireAuth, async (req, res) => {
  try {
    if (!req.auth) throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
    const params = workoutPlanIdParamSchema.parse(req.params);
    const payload = assignWorkoutPlanSchema.parse(req.body);
    const plan = await assignWorkoutPlan(req.auth, params.id, payload.memberId);
    res.status(200).json({ plan });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new HttpError(400, "VALIDATION_ERROR", "Request is invalid", error.flatten());
    }
    throw error;
  }
});
