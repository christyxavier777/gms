import { Role } from "@prisma/client";
import { Router } from "express";
import { ZodError } from "zod";
import { HttpError } from "../middleware/http-error";
import { requireAuth } from "../middleware/require-auth";
import {
  createScheduleSessionSchema,
  scheduleBookingIdParamSchema,
  scheduleSessionIdParamSchema,
  updateScheduleBookingSchema,
} from "../schedule/schemas";
import {
  bookScheduleSession,
  createScheduleSession,
  listScheduleWorkspace,
  updateScheduleBookingStatus,
} from "../schedule/service";

export const scheduleRouter = Router();

scheduleRouter.get("/schedule", requireAuth, async (req, res) => {
  if (!req.auth) throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
  const workspace = await listScheduleWorkspace(req.auth);
  res.status(200).json({ workspace });
});

scheduleRouter.post("/schedule", requireAuth, async (req, res) => {
  try {
    if (!req.auth) throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
    if (req.auth.role !== Role.ADMIN && req.auth.role !== Role.TRAINER) {
      throw new HttpError(
        403,
        "SCHEDULE_SESSION_CREATE_FORBIDDEN",
        "You are not allowed to create scheduled sessions",
      );
    }
    const payload = createScheduleSessionSchema.parse(req.body);
    const session = await createScheduleSession(req.auth, payload);
    res.status(201).json({ session });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new HttpError(400, "VALIDATION_ERROR", "Request payload is invalid", error.flatten());
    }
    throw error;
  }
});

scheduleRouter.post("/schedule/:sessionId/book", requireAuth, async (req, res) => {
  try {
    if (!req.auth) throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
    if (req.auth.role !== Role.MEMBER) {
      throw new HttpError(
        403,
        "SCHEDULE_BOOKING_CREATE_FORBIDDEN",
        "Only members can book scheduled sessions",
      );
    }
    const params = scheduleSessionIdParamSchema.parse(req.params);
    const booking = await bookScheduleSession(req.auth, params.sessionId);
    res.status(201).json({ booking });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new HttpError(400, "VALIDATION_ERROR", "Path parameters are invalid", error.flatten());
    }
    throw error;
  }
});

scheduleRouter.patch("/schedule/bookings/:bookingId", requireAuth, async (req, res) => {
  try {
    if (!req.auth) throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
    const params = scheduleBookingIdParamSchema.parse(req.params);
    const payload = updateScheduleBookingSchema.parse(req.body);
    const booking = await updateScheduleBookingStatus(req.auth, params.bookingId, payload.status);
    res.status(200).json({ booking });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new HttpError(400, "VALIDATION_ERROR", "Request payload is invalid", error.flatten());
    }
    throw error;
  }
});
