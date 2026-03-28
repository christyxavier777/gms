import { SubscriptionStatus } from "@prisma/client";

export type SafeMembershipPlan = {
  id: string;
  name: string;
  priceMinor: number;
  priceInr: number;
  durationDays: number;
  perks: string;
  active: boolean;
};

export type SubscriptionMemberSummary = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "ACTIVE" | "INACTIVE";
};

// Safe subscription shape returned by API responses.
export type SafeSubscription = {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  startDate: Date;
  endDate: Date;
  status: SubscriptionStatus;
  createdAt: Date;
  updatedAt: Date;
  plan: SafeMembershipPlan;
  member: SubscriptionMemberSummary;
};
