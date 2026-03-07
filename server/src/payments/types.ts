import { PaymentStatus } from "@prisma/client";

export type SafePayment = {
  id: string;
  transactionId: string;
  userId: string;
  subscriptionId: string | null;
  amount: number;
  upiId: string;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
};
