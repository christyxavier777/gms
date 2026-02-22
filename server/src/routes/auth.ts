import { Router } from "express";
import { ZodError } from "zod";
import { loginSchema, registerSchema } from "../auth/schemas";
import { loginUser, registerUser } from "../auth/service";
import { HttpError } from "../middleware/http-error";

// Authentication endpoints for registration and credential login.
export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  try {
    const payload = registerSchema.parse(req.body);
    const user = await registerUser(payload);
    res.status(201).json({ user });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new HttpError(400, "VALIDATION_ERROR", "Request payload is invalid", error.flatten());
    }
    throw error;
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const payload = loginSchema.parse(req.body);
    const token = await loginUser(payload);
    res.status(200).json({ token });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new HttpError(400, "VALIDATION_ERROR", "Request payload is invalid", error.flatten());
    }
    throw error;
  }
});
