import { z } from "zod";

const phoneRegex = /^\d{10}$/;
const passwordHasUppercase = /[A-Z]/;
const passwordHasLowercase = /[a-z]/;
const passwordHasDigit = /\d/;
const maxNameLength = 80;
const maxPasswordLength = 128;
const maxInviteCodeLength = 64;

const passwordMessage =
  "Password must be at least 8 characters and include uppercase, lowercase, and a number";

const passwordSchema = z
  .string()
  .min(8, passwordMessage)
  .max(maxPasswordLength, `Password must be ${maxPasswordLength} characters or fewer`)
  .refine(
    (value) =>
      passwordHasUppercase.test(value) &&
      passwordHasLowercase.test(value) &&
      passwordHasDigit.test(value),
    passwordMessage,
  );

// Validation schema for register endpoint input.
export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name is required")
      .max(maxNameLength, `Name must be ${maxNameLength} characters or fewer`),
    email: z.string().trim().toLowerCase().email("Email must be a valid email address"),
    phone: z.string().trim().regex(phoneRegex, "Phone must be exactly 10 digits"),
    password: passwordSchema,
    role: z.enum(["ADMIN", "TRAINER", "MEMBER"]).default("MEMBER"),
    inviteCode: z
      .string()
      .trim()
      .max(maxInviteCodeLength, `Invite code must be ${maxInviteCodeLength} characters or fewer`)
      .optional(),
  })
  .strict();

// Validation schema for login endpoint input.
export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Email must be a valid email address"),
    password: z
      .string()
      .min(1, "Password is required")
      .max(maxPasswordLength, `Password must be ${maxPasswordLength} characters or fewer`),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
