import { Router } from "express";
import { healthRouter } from "./health";
import { authRouter } from "./auth";
import { meRouter } from "./me";
import { usersRouter } from "./users";

// Registers all application routes in one place.
export const routes = Router();

routes.use(healthRouter);
routes.use("/auth", authRouter);
routes.use(meRouter);
routes.use(usersRouter);
