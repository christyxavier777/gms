"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPayment = createPayment;
exports.listPayments = listPayments;
exports.getPaymentById = getPaymentById;
exports.updatePaymentStatus = updatePaymentStatus;
const client_1 = require("@prisma/client");
const client_2 = require("../prisma/client");
const http_error_1 = require("../middleware/http-error");
const prisma = (0, client_2.createPrismaClient)();
function toSafePayment(payment) {
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
function generateTxnId() {
    return `UPI-${Date.now()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}
async function createPayment(requester, payload) {
    if (requester.role !== client_1.Role.ADMIN && requester.userId !== payload.userId) {
        throw new http_error_1.HttpError(403, "FORBIDDEN", "You are not allowed to create payments for this user");
    }
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.role !== client_1.Role.MEMBER) {
        throw new http_error_1.HttpError(400, "INVALID_PAYMENT_USER", "Payments can only be recorded for members");
    }
    if (payload.subscriptionId) {
        const subscription = await prisma.subscription.findUnique({ where: { id: payload.subscriptionId } });
        if (!subscription || subscription.userId !== payload.userId) {
            throw new http_error_1.HttpError(400, "INVALID_SUBSCRIPTION", "Subscription is invalid for this member");
        }
    }
    const payment = await prisma.payment.create({
        data: {
            transactionId: generateTxnId(),
            userId: payload.userId,
            subscriptionId: payload.subscriptionId ?? null,
            amount: payload.amount,
            upiId: payload.upiId,
            status: client_1.PaymentStatus.SUCCESS,
        },
    });
    return toSafePayment(payment);
}
async function listPayments(requester) {
    const where = requester.role === client_1.Role.ADMIN ? {} : { userId: requester.userId };
    const rows = await prisma.payment.findMany({ where, orderBy: { createdAt: "desc" } });
    return rows.map(toSafePayment);
}
async function getPaymentById(requester, paymentId) {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) {
        throw new http_error_1.HttpError(404, "PAYMENT_NOT_FOUND", "Payment not found");
    }
    if (requester.role !== client_1.Role.ADMIN && requester.userId !== payment.userId) {
        throw new http_error_1.HttpError(403, "FORBIDDEN", "You are not allowed to view this payment");
    }
    return toSafePayment(payment);
}
async function updatePaymentStatus(requester, paymentId, status) {
    if (requester.role !== client_1.Role.ADMIN) {
        throw new http_error_1.HttpError(403, "FORBIDDEN", "Only admins can update payment status");
    }
    try {
        const updated = await prisma.payment.update({
            where: { id: paymentId },
            data: { status },
        });
        return toSafePayment(updated);
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            throw new http_error_1.HttpError(404, "PAYMENT_NOT_FOUND", "Payment not found");
        }
        throw error;
    }
}
//# sourceMappingURL=service.js.map