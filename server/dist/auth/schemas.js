"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const phoneRegex = /^\d{10}$/;
const passwordHasUppercase = /[A-Z]/;
const passwordHasLowercase = /[a-z]/;
const passwordHasDigit = /\d/;
const maxNameLength = 80;
const maxPasswordLength = 128;
const maxInviteCodeLength = 64;
const passwordMessage = "Password must be at least 8 characters and include uppercase, lowercase, and a number";
const passwordSchema = zod_1.z
    .string()
    .min(8, passwordMessage)
    .max(maxPasswordLength, `Password must be ${maxPasswordLength} characters or fewer`)
    .refine((value) => passwordHasUppercase.test(value) &&
    passwordHasLowercase.test(value) &&
    passwordHasDigit.test(value), passwordMessage);
// Validation schema for register endpoint input.
exports.registerSchema = zod_1.z
    .object({
    name: zod_1.z
        .string()
        .trim()
        .min(1, "Name is required")
        .max(maxNameLength, `Name must be ${maxNameLength} characters or fewer`),
    email: zod_1.z.string().trim().toLowerCase().email("Email must be a valid email address"),
    phone: zod_1.z.string().trim().regex(phoneRegex, "Phone must be exactly 10 digits"),
    password: passwordSchema,
    role: zod_1.z.enum(["ADMIN", "TRAINER", "MEMBER"]).default("MEMBER"),
    inviteCode: zod_1.z
        .string()
        .trim()
        .max(maxInviteCodeLength, `Invite code must be ${maxInviteCodeLength} characters or fewer`)
        .optional(),
})
    .strict();
// Validation schema for login endpoint input.
exports.loginSchema = zod_1.z
    .object({
    email: zod_1.z.string().trim().toLowerCase().email("Email must be a valid email address"),
    password: zod_1.z
        .string()
        .min(1, "Password is required")
        .max(maxPasswordLength, `Password must be ${maxPasswordLength} characters or fewer`),
})
    .strict();
//# sourceMappingURL=schemas.js.map