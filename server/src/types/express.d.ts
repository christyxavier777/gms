import { Role } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      rawBody?: Buffer;
      wearableWebhook?: {
        provider: "FITBIT" | "APPLE_WATCH" | "GENERIC";
        eventId: string;
        dedupeKey: string;
      };
      auth?: {
        userId: string;
        role: Role;
      };
    }
  }
}

export {};
