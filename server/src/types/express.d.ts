import { Role } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      rawBody?: Buffer;
      auth?: {
        userId: string;
        role: Role;
      };
    }
  }
}

export {};
