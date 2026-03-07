import { Role, UserStatus } from "@prisma/client";

export type AuthTokenPayload = {
  userId: string;
  role: Role;
};

export type SafeUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
};
