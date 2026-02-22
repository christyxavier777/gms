import { Router } from "express";
import { healthRouter } from "./health";
import { authRouter } from "./auth";
import { meRouter } from "./me";

// Registers all application routes in one place.
export const routes = Router();

routes.use(healthRouter);
routes.use("/auth", authRouter);
routes.use(meRouter);
