import test from "node:test";
import assert from "node:assert/strict";
import { loginSchema, registerSchema } from "../auth/schemas";

test("register schema accepts non-gmail email addresses when the password is strong", () => {
  const payload = registerSchema.parse({
    name: "Jordan Lee",
    email: "jordan.lee@example.com",
    phone: "9876543210",
    password: "StrongPass1",
    role: "MEMBER",
  });

  assert.equal(payload.email, "jordan.lee@example.com");
});

test("register schema rejects weak passwords", () => {
  assert.throws(() =>
    registerSchema.parse({
      name: "Jordan Lee",
      email: "jordan.lee@example.com",
      phone: "9876543210",
      password: "weakpass",
      role: "MEMBER",
    }),
  );
});

test("login schema accepts standard email addresses", () => {
  const payload = loginSchema.parse({
    email: "coach@fitnessgarage.in",
    password: "any-non-empty-password",
  });

  assert.equal(payload.email, "coach@fitnessgarage.in");
});
