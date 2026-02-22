import { Router } from "express";
import { healthRouter } from "./health";

// Registers all application routes in one place.
export const routes = Router();

routes.use(healthRouter);
