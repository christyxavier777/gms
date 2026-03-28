import { PaymentStatus, Role } from "@prisma/client";
import { Router } from "express";
import { ZodError } from "zod";
import { HttpError } from "../middleware/http-error";
import { requireAuth } from "../middleware/require-auth";
import {
  createPaymentSchema,
  listPaymentsQuerySchema,
  paymentIdParamSchema,
  updatePaymentStatusSchema,
} from "../payments/schemas";
import { createPayment, getPaymentById, listPayments, updatePaymentStatus } from "../payments/service";

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
  try {
    if (!req.auth) throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
    const query = listPaymentsQuerySchema.parse(req.query);
    const result = await listPayments(req.auth, query);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new HttpError(400, "VALIDATION_ERROR", "Query parameters are invalid", error.flatten());
    }
    throw error;
  }
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
      throw new HttpError(403, "PAYMENT_REVIEW_FORBIDDEN", "Only admins can update payment status");
    }
    const params = paymentIdParamSchema.parse(req.params);
    const payload = updatePaymentStatusSchema.parse(req.body);
    const payment = await updatePaymentStatus(req.auth, params.id, {
      status: payload.status as PaymentStatus,
      verificationNotes: payload.verificationNotes,
    });
    res.status(200).json({ payment });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new HttpError(400, "VALIDATION_ERROR", "Request payload is invalid", error.flatten());
    }
    throw error;
  }
});
