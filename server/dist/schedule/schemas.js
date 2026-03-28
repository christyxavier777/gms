"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateScheduleBookingSchema = exports.scheduleBookingIdParamSchema = exports.scheduleSessionIdParamSchema = exports.createScheduleSessionSchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const maxScheduleTitleLength = 80;
const maxScheduleDescriptionLength = 400;
const maxScheduleLocationLength = 80;
exports.createScheduleSessionSchema = zod_1.z
    .object({
    title: zod_1.z
        .string()
        .trim()
        .min(3, "title must be at least 3 characters long")
        .max(maxScheduleTitleLength, `title must be ${maxScheduleTitleLength} characters or fewer`),
    description: zod_1.z
        .string()
        .trim()
        .min(1, "description cannot be empty")
        .max(maxScheduleDescriptionLength, `description must be ${maxScheduleDescriptionLength} characters or fewer`)
        .optional(),
    sessionType: zod_1.z.nativeEnum(client_1.ScheduleSessionType),
    location: zod_1.z
        .string()
        .trim()
        .min(1, "location cannot be empty")
        .max(maxScheduleLocationLength, `location must be ${maxScheduleLocationLength} characters or fewer`)
        .optional(),
    trainerId: zod_1.z.string().uuid("trainerId must be a valid UUID").optional(),
    startsAt: zod_1.z.coerce.date(),
    endsAt: zod_1.z.coerce.date(),
    capacity: zod_1.z.coerce.number().int().min(1).max(40),
})
    .strict()
    .superRefine((value, ctx) => {
    if (value.endsAt <= value.startsAt) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: "Session end time must be after the start time",
            path: ["endsAt"],
        });
    }
});
exports.scheduleSessionIdParamSchema = zod_1.z.object({
    sessionId: zod_1.z.string().uuid("sessionId must be a valid UUID"),
}).strict();
exports.scheduleBookingIdParamSchema = zod_1.z.object({
    bookingId: zod_1.z.string().uuid("bookingId must be a valid UUID"),
}).strict();
exports.updateScheduleBookingSchema = zod_1.z
    .object({
    status: zod_1.z.enum([
        client_1.ScheduleBookingStatus.ATTENDED,
        client_1.ScheduleBookingStatus.MISSED,
        client_1.ScheduleBookingStatus.CANCELLED,
    ]),
})
    .strict();
//# sourceMappingURL=schemas.js.map