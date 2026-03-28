import { ScheduleBookingStatus, ScheduleSessionType } from "@prisma/client";
import { z } from "zod";

const maxScheduleTitleLength = 80;
const maxScheduleDescriptionLength = 400;
const maxScheduleLocationLength = 80;

export const createScheduleSessionSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "title must be at least 3 characters long")
      .max(maxScheduleTitleLength, `title must be ${maxScheduleTitleLength} characters or fewer`),
    description: z
      .string()
      .trim()
      .min(1, "description cannot be empty")
      .max(
        maxScheduleDescriptionLength,
        `description must be ${maxScheduleDescriptionLength} characters or fewer`,
      )
      .optional(),
    sessionType: z.nativeEnum(ScheduleSessionType),
    location: z
      .string()
      .trim()
      .min(1, "location cannot be empty")
      .max(maxScheduleLocationLength, `location must be ${maxScheduleLocationLength} characters or fewer`)
      .optional(),
    trainerId: z.string().uuid("trainerId must be a valid UUID").optional(),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    capacity: z.coerce.number().int().min(1).max(40),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.endsAt <= value.startsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Session end time must be after the start time",
        path: ["endsAt"],
      });
    }
  });

export const scheduleSessionIdParamSchema = z.object({
  sessionId: z.string().uuid("sessionId must be a valid UUID"),
}).strict();

export const scheduleBookingIdParamSchema = z.object({
  bookingId: z.string().uuid("bookingId must be a valid UUID"),
}).strict();

export const updateScheduleBookingSchema = z
  .object({
    status: z.enum([
      ScheduleBookingStatus.ATTENDED,
      ScheduleBookingStatus.MISSED,
      ScheduleBookingStatus.CANCELLED,
    ]),
  })
  .strict();
