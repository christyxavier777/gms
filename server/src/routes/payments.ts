import { PaymentStatus, Role } from "@prisma/client";
import { Router } from "express";
import { ZodError, z } from "zod";
import { HttpError } from "../middleware/http-error";
import { requireAuth } from "../middleware/require-auth";
import { createPaymentSchema, paymentIdParamSchema } from "../payments/schemas";
import { createPayment, getPaymentById, listPayments, updatePaymentStatus } from "../payments/service";

const updatePaymentStatusSchema = z
  .object({
    status: z.enum([PaymentStatus.PENDING, PaymentStatus.SUCCESS, PaymentStatus.FAILED]),
  })
  .strict();

export const paymentsRouter = Router();

paymentsRouter.post("/payments/upi", requireAuth, async (req, res) => {
  try {
    if (!req.auth) throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
    const payload = createPaymentSchema.parse(req.body);
    const payment = await createPayment(req.auth, payload);
    res.status(201).json({ payment });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new HttpError(400, "VALIDATION_ERROR", "Request payload is invalid", error.flatten());
    }
    throw error;
  }
});

paymentsRouter.get("/payments", requireAuth, async (req, res) => {
  if (!req.auth) throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
  const payments = await listPayments(req.auth);
  res.status(200).json({ payments });
});

paymentsRouter.get("/payments/:id", requireAuth, async (req, res) => {
  try {
    if (!req.auth) throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
    const params = paymentIdParamSchema.parse(req.params);
    const payment = await getPaymentById(req.auth, params.id);
    res.status(200).json({ payment });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new HttpError(400, "VALIDATION_ERROR", "Path parameters are invalid", error.flatten());
    }
    throw error;
  }
});

paymentsRouter.patch("/payments/:id/status", requireAuth, async (req, res) => {
  try {
    if (!req.auth) throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
    if (req.auth.role !== Role.ADMIN) {
      throw new HttpError(403, "FORBIDDEN", "Only admins can update payment status");
    }
    const params = paymentIdParamSchema.parse(req.params);
    const payload = updatePaymentStatusSchema.parse(req.body);
    const payment = await updatePaymentStatus(req.auth, params.id, payload.status as PaymentStatus);
    res.status(200).json({ payment });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new HttpError(400, "VALIDATION_ERROR", "Request payload is invalid", error.flatten());
    }
    throw error;
  }
});
