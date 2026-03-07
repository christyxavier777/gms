import { z } from "zod";

const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
const phoneRegex = /^\d{10}$/;

// Validation schema for register endpoint input.
export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().regex(gmailRegex, "Email must be a valid @gmail.com address"),
  phone: z.string().trim().regex(phoneRegex, "Phone must be exactly 10 digits"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["ADMIN", "TRAINER", "MEMBER"]).default("MEMBER"),
  inviteCode: z.string().trim().optional(),
});

// Validation schema for login endpoint input.
export const loginSchema = z.object({
  email: z.string().trim().regex(gmailRegex, "Email must be a valid @gmail.com address"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
