import { Role } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      rawBody?: Buffer;
      rateLimits?: Record<
        string,
        {
          count: number;
          limit: number;
          remaining: number;
          retryAfterSec: number;
          windowSec: number;
          resetAtUnix: number;
        }
      >;
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
