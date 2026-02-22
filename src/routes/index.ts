import { Router } from "express";
import { healthRouter } from "./health";
import { authRouter } from "./auth";
import { meRouter } from "./me";
import { usersRouter } from "./users";
import { workoutPlansRouter } from "./workout-plans";
import { dietPlansRouter } from "./diet-plans";

// Registers all application routes in one place.
export const routes = Router();

routes.use(healthRouter);
routes.use("/auth", authRouter);
routes.use(meRouter);
routes.use(usersRouter);
routes.use(workoutPlansRouter);
routes.use(dietPlansRouter);
