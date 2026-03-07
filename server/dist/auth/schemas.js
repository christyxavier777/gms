"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
const phoneRegex = /^\d{10}$/;
// Validation schema for register endpoint input.
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1, "Name is required"),
    email: zod_1.z.string().trim().regex(gmailRegex, "Email must be a valid @gmail.com address"),
    phone: zod_1.z.string().trim().regex(phoneRegex, "Phone must be exactly 10 digits"),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters"),
    role: zod_1.z.enum(["ADMIN", "TRAINER", "MEMBER"]).default("MEMBER"),
    inviteCode: zod_1.z.string().trim().optional(),
});
// Validation schema for login endpoint input.
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().trim().regex(gmailRegex, "Email must be a valid @gmail.com address"),
    password: zod_1.z.string().min(1, "Password is required"),
});
//# sourceMappingURL=schemas.js.map