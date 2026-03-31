# Payment Code Sample

This is a document-ready sample based on the actual Razorpay payment flow in this project.

Original source file:
- `server/src/payments/service.ts`

```ts
import { PaymentStatus, Role, SubscriptionStatus } from "@prisma/client";
import { createPrismaClient } from "../prisma/client";
import { HttpError } from "../middleware/http-error";
import { buildSubscriptionPeriod } from "../subscriptions/lifecycle";

const prisma = createPrismaClient();

async function createRazorpayCheckoutOrder(
  requester: { userId: string; role: Role; name?: string; email?: string; phone?: string },
  payload: { subscriptionId?: string; planId?: string },
) {
  if (requester.role !== Role.MEMBER) {
    throw new HttpError(403, "RAZORPAY_CHECKOUT_FORBIDDEN", "Only members can start Razorpay checkout");
  }

  const result = await prisma.$transaction(async (tx) => {
    let subscriptionId = payload.subscriptionId ?? null;
    let planName = "";
    let amountMinor = 0;

    if (payload.subscriptionId) {
      const subscription = await tx.subscription.findUnique({
        where: { id: payload.subscriptionId },
        select: {
          id: true,
          userId: true,
          status: true,
          plan: { select: { name: true, priceMinor: true } },
        },
      });

      if (!subscription || subscription.userId !== requester.userId) {
        throw new HttpError(400, "INVALID_SUBSCRIPTION", "Subscription is invalid for this member");
      }

      if (subscription.status !== SubscriptionStatus.PENDING_ACTIVATION) {
        throw new HttpError(409, "SUBSCRIPTION_NOT_PAYABLE", "Only pending subscriptions can be paid");
      }

      subscriptionId = subscription.id;
      planName = subscription.plan.name;
      amountMinor = subscription.plan.priceMinor;
    }

    const razorpayOrder = await createRazorpayOrder({
      amountMinor,
      receipt: `txn_${Date.now()}`,
      notes: { memberUserId: requester.userId, subscriptionId: subscriptionId ?? "", planName },
    });

    const payment = await tx.payment.create({
      data: {
        transactionId: `txn_${Date.now()}`,
        userId: requester.userId,
        subscriptionId,
        razorpayOrderId: razorpayOrder.id,
        amountMinor,
        upiId: "RAZORPAY_CHECKOUT",
        status: PaymentStatus.PENDING,
        verificationNotes: "Awaiting Razorpay checkout completion",
      },
    });

    return { payment, razorpayOrder };
  });

  return result;
}

async function verifyRazorpayCheckoutPayment(
  requester: { userId: string; role: Role },
  payload: {
    paymentId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  },
) {
  if (requester.role !== Role.MEMBER) {
    throw new HttpError(403, "RAZORPAY_VERIFY_FORBIDDEN", "Only members can verify payments");
  }

  const payment = await prisma.payment.findUnique({
    where: { id: payload.paymentId },
    include: { subscription: { include: { plan: true } } },
  });

  if (!payment || payment.userId !== requester.userId) {
    throw new HttpError(404, "PAYMENT_NOT_FOUND", "Payment not found");
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payload.paymentId },
      data: {
        status: PaymentStatus.SUCCESS,
        reviewedAt: new Date(),
        verificationNotes: "Verified via Razorpay Checkout",
        razorpayPaymentId: payload.razorpayPaymentId,
        razorpaySignature: payload.razorpaySignature,
      },
    });

    if (payment.subscriptionId && payment.subscription?.status === SubscriptionStatus.PENDING_ACTIVATION) {
      const nextPeriod = buildSubscriptionPeriod(payment.subscription.plan.durationDays, new Date());
      await tx.subscription.update({
        where: { id: payment.subscriptionId },
        data: {
          status: SubscriptionStatus.ACTIVE,
          startDate: nextPeriod.startDate,
          endDate: nextPeriod.endDate,
        },
      });
    }

    return tx.payment.findUnique({ where: { id: payload.paymentId } });
  });

  return updated;
}
```

Suggested caption:

`Sample code for Razorpay payment creation, local payment recording, verification, and subscription activation after successful payment.`
