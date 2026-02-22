import { SubscriptionStatus } from "@prisma/client";

// Safe subscription shape returned by API responses.
export type SafeSubscription = {
  id: string;
  userId: string;
  planName: string;
  startDate: Date;
  endDate: Date;
  status: SubscriptionStatus;
  createdAt: Date;
  updatedAt: Date;
};
