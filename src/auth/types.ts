import { Role } from "@prisma/client";

// JWT claims stored in access tokens for authn/authz checks.
export type AuthTokenPayload = {
  userId: string;
  role: Role;
};

// Safe user shape returned to API consumers.
export type SafeUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
};
