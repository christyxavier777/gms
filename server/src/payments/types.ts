import { PaymentStatus, SubscriptionStatus, UserStatus } from "@prisma/client";

export type PaymentMemberSummary = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: UserStatus;
};

export type PaymentSubscriptionSummary = {
  id: string;
  planId: string;
  planName: string;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  plan: {
    id: string;
    name: string;
    priceMinor: number;
    priceInr: number;
    durationDays: number;
    perks: string;
    active: boolean;
  };
};

export type PaymentReviewerSummary = {
  id: string;
  name: string;
  email: string;
};

export type PaymentEventSummary = {
  id: string;
  fromStatus: PaymentStatus | null;
  toStatus: PaymentStatus;
  verificationNotes: string | null;
  createdAt: Date;
  actor: PaymentReviewerSummary | null;
};

export type SafePayment = {
  id: string;
  transactionId: string;
  userId: string;
  subscriptionId: string | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  amount: number;
  amountMinor: number;
  upiId: string;
  proofReference: string | null;
  status: PaymentStatus;
  reviewedAt: Date | null;
  verificationNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  member: PaymentMemberSummary;
  subscription: PaymentSubscriptionSummary | null;
  reviewer: PaymentReviewerSummary | null;
  events: PaymentEventSummary[];
};

export type PaymentListSummary = {
  total: number;
  pending: number;
  success: number;
  failed: number;
  verifiedRevenueMinor: number;
};
