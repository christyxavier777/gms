import { Payment, PaymentStatus, Prisma, Role } from "@prisma/client";
import { createPrismaClient } from "../prisma/client";
import { HttpError } from "../middleware/http-error";
import { SafePayment } from "./types";

const prisma = createPrismaClient();

function toSafePayment(payment: Payment): SafePayment {
  return {
    id: payment.id,
    transactionId: payment.transactionId,
    userId: payment.userId,
    subscriptionId: payment.subscriptionId,
    amount: payment.amount,
    upiId: payment.upiId,
    status: payment.status,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
}

function generateTxnId(): string {
  return `UPI-${Date.now()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

export async function createPayment(
  requester: { userId: string; role: Role },
  payload: { userId: string; subscriptionId?: string | undefined; amount: number; upiId: string },
): Promise<SafePayment> {
  if (requester.role !== Role.ADMIN && requester.userId !== payload.userId) {
    throw new HttpError(403, "FORBIDDEN", "You are not allowed to create payments for this user");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || user.role !== Role.MEMBER) {
    throw new HttpError(400, "INVALID_PAYMENT_USER", "Payments can only be recorded for members");
  }

  if (payload.subscriptionId) {
    const subscription = await prisma.subscription.findUnique({ where: { id: payload.subscriptionId } });
    if (!subscription || subscription.userId !== payload.userId) {
      throw new HttpError(400, "INVALID_SUBSCRIPTION", "Subscription is invalid for this member");
    }
  }

  const payment = await prisma.payment.create({
    data: {
      transactionId: generateTxnId(),
      userId: payload.userId,
      subscriptionId: payload.subscriptionId ?? null,
      amount: payload.amount,
      upiId: payload.upiId,
      status: PaymentStatus.SUCCESS,
    },
  });

  return toSafePayment(payment);
}

export async function listPayments(requester: { userId: string; role: Role }): Promise<SafePayment[]> {
  const where = requester.role === Role.ADMIN ? {} : { userId: requester.userId };
  const rows = await prisma.payment.findMany({ where, orderBy: { createdAt: "desc" } });
  return rows.map(toSafePayment);
}

export async function getPaymentById(
  requester: { userId: string; role: Role },
  paymentId: string,
): Promise<SafePayment> {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) {
    throw new HttpError(404, "PAYMENT_NOT_FOUND", "Payment not found");
  }

  if (requester.role !== Role.ADMIN && requester.userId !== payment.userId) {
    throw new HttpError(403, "FORBIDDEN", "You are not allowed to view this payment");
  }

  return toSafePayment(payment);
}

export async function updatePaymentStatus(
  requester: { userId: string; role: Role },
  paymentId: string,
  status: PaymentStatus,
): Promise<SafePayment> {
  if (requester.role !== Role.ADMIN) {
    throw new HttpError(403, "FORBIDDEN", "Only admins can update payment status");
  }

  try {
    const updated = await prisma.payment.update({
      where: { id: paymentId },
      data: { status },
    });
    return toSafePayment(updated);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new HttpError(404, "PAYMENT_NOT_FOUND", "Payment not found");
    }
    throw error;
  }
}


