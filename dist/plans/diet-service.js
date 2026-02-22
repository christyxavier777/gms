"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDietPlan = createDietPlan;
exports.listDietPlans = listDietPlans;
exports.getDietPlanById = getDietPlanById;
exports.updateDietPlan = updateDietPlan;
exports.deleteDietPlan = deleteDietPlan;
exports.assignDietPlan = assignDietPlan;
const client_1 = require("@prisma/client");
const client_2 = require("../prisma/client");
const http_error_1 = require("../middleware/http-error");
const prisma = (0, client_2.createPrismaClient)();
function toSafeDietPlan(plan) {
    return {
        id: plan.id,
        title: plan.title,
        description: plan.description,
        assignedToId: plan.assignedToId,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
    };
}
function canManageDietPlan(requester, plan) {
    if (requester.role === client_1.Role.ADMIN)
        return true;
    if (requester.role === client_1.Role.TRAINER && plan.createdById === requester.userId)
        return true;
    return false;
}
function canReadDietPlan(requester, plan) {
    if (requester.role === client_1.Role.ADMIN)
        return true;
    if (requester.role === client_1.Role.TRAINER && plan.createdById === requester.userId)
        return true;
    if (requester.role === client_1.Role.MEMBER && plan.assignedToId === requester.userId)
        return true;
    return false;
}
async function assertAssignableMember(memberId) {
    const member = await prisma.user.findUnique({ where: { id: memberId } });
    if (!member) {
        throw new http_error_1.HttpError(404, "USER_NOT_FOUND", "Assigned user not found");
    }
    if (member.role !== client_1.Role.MEMBER) {
        throw new http_error_1.HttpError(400, "INVALID_ASSIGNMENT_TARGET", "Plans can only be assigned to members");
    }
    return member;
}
// Creates a diet plan owned by ADMIN or TRAINER.
async function createDietPlan(requester, payload) {
    if (requester.role !== client_1.Role.ADMIN && requester.role !== client_1.Role.TRAINER) {
        throw new http_error_1.HttpError(403, "FORBIDDEN", "You are not allowed to create diet plans");
    }
    const plan = await prisma.dietPlan.create({
        data: {
            title: payload.title,
            description: payload.description,
            createdById: requester.userId,
        },
    });
    return toSafeDietPlan(plan);
}
// Lists diet plans scoped to the caller role.
async function listDietPlans(requester) {
    let where = {};
    if (requester.role === client_1.Role.TRAINER) {
        where = { createdById: requester.userId };
    }
    else if (requester.role === client_1.Role.MEMBER) {
        where = { assignedToId: requester.userId };
    }
    const plans = await prisma.dietPlan.findMany({
        where,
        orderBy: { createdAt: "desc" },
    });
    return plans.map(toSafeDietPlan);
}
// Reads a single diet plan with role-based visibility.
async function getDietPlanById(requester, planId) {
    const plan = await prisma.dietPlan.findUnique({ where: { id: planId } });
    if (!plan) {
        throw new http_error_1.HttpError(404, "DIET_PLAN_NOT_FOUND", "Diet plan not found");
    }
    if (!canReadDietPlan(requester, plan)) {
        throw new http_error_1.HttpError(403, "FORBIDDEN", "You are not allowed to access this diet plan");
    }
    return toSafeDietPlan(plan);
}
// Updates diet plan title/description with ownership checks.
async function updateDietPlan(requester, planId, payload) {
    const plan = await prisma.dietPlan.findUnique({ where: { id: planId } });
    if (!plan) {
        throw new http_error_1.HttpError(404, "DIET_PLAN_NOT_FOUND", "Diet plan not found");
    }
    if (!canManageDietPlan(requester, plan)) {
        throw new http_error_1.HttpError(403, "FORBIDDEN", "You are not allowed to modify this diet plan");
    }
    const updated = await prisma.dietPlan.update({
        where: { id: planId },
        data: {
            ...(payload.title !== undefined ? { title: payload.title } : {}),
            ...(payload.description !== undefined ? { description: payload.description } : {}),
        },
    });
    return toSafeDietPlan(updated);
}
// Hard-deletes diet plans under ownership/admin constraints.
async function deleteDietPlan(requester, planId) {
    const plan = await prisma.dietPlan.findUnique({ where: { id: planId } });
    if (!plan) {
        throw new http_error_1.HttpError(404, "DIET_PLAN_NOT_FOUND", "Diet plan not found");
    }
    if (!canManageDietPlan(requester, plan)) {
        throw new http_error_1.HttpError(403, "FORBIDDEN", "You are not allowed to delete this diet plan");
    }
    await prisma.dietPlan.delete({ where: { id: planId } });
}
// Assigns/reassigns one diet plan to one member.
async function assignDietPlan(requester, planId, memberId) {
    const plan = await prisma.dietPlan.findUnique({ where: { id: planId } });
    if (!plan) {
        throw new http_error_1.HttpError(404, "DIET_PLAN_NOT_FOUND", "Diet plan not found");
    }
    if (!canManageDietPlan(requester, plan)) {
        throw new http_error_1.HttpError(403, "FORBIDDEN", "You are not allowed to assign this diet plan");
    }
    await assertAssignableMember(memberId);
    const updated = await prisma.dietPlan.update({
        where: { id: planId },
        data: { assignedToId: memberId },
    });
    return toSafeDietPlan(updated);
}
//# sourceMappingURL=diet-service.js.map