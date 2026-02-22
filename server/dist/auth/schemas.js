"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
// Validation schema for register endpoint input.
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1, "Name is required"),
    email: zod_1.z.string().trim().email("Valid email is required"),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters"),
});
// Validation schema for login endpoint input.
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().trim().email("Valid email is required"),
    password: zod_1.z.string().min(1, "Password is required"),
});
//# sourceMappingURL=schemas.js.map