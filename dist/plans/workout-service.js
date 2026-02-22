"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWorkoutPlan = createWorkoutPlan;
exports.listWorkoutPlans = listWorkoutPlans;
exports.getWorkoutPlanById = getWorkoutPlanById;
exports.updateWorkoutPlan = updateWorkoutPlan;
exports.deleteWorkoutPlan = deleteWorkoutPlan;
exports.assignWorkoutPlan = assignWorkoutPlan;
const client_1 = require("@prisma/client");
const client_2 = require("../prisma/client");
const http_error_1 = require("../middleware/http-error");
const prisma = (0, client_2.createPrismaClient)();
function toSafeWorkoutPlan(plan) {
    return {
        id: plan.id,
        title: plan.title,
        description: plan.description,
        assignedToId: plan.assignedToId,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
    };
}
function canManageWorkoutPlan(requester, plan) {
    if (requester.role === client_1.Role.ADMIN)
        return true;
    if (requester.role === client_1.Role.TRAINER && plan.createdById === requester.userId)
        return true;
    return false;
}
function canReadWorkoutPlan(requester, plan) {
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
// Creates a workout plan owned by ADMIN or TRAINER.
async function createWorkoutPlan(requester, payload) {
    if (requester.role !== client_1.Role.ADMIN && requester.role !== client_1.Role.TRAINER) {
        throw new http_error_1.HttpError(403, "FORBIDDEN", "You are not allowed to create workout plans");
    }
    const plan = await prisma.workoutPlan.create({
        data: {
            title: payload.title,
            description: payload.description,
            createdById: requester.userId,
        },
    });
    return toSafeWorkoutPlan(plan);
}
// Lists workout plans scoped to the caller role.
async function listWorkoutPlans(requester) {
    let where = {};
    if (requester.role === client_1.Role.TRAINER) {
        where = { createdById: requester.userId };
    }
    else if (requester.role === client_1.Role.MEMBER) {
        where = { assignedToId: requester.userId };
    }
    const plans = await prisma.workoutPlan.findMany({
        where,
        orderBy: { createdAt: "desc" },
    });
    return plans.map(toSafeWorkoutPlan);
}
// Reads a single workout plan with role-based visibility.
async function getWorkoutPlanById(requester, planId) {
    const plan = await prisma.workoutPlan.findUnique({ where: { id: planId } });
    if (!plan) {
        throw new http_error_1.HttpError(404, "WORKOUT_PLAN_NOT_FOUND", "Workout plan not found");
    }
    if (!canReadWorkoutPlan(requester, plan)) {
        throw new http_error_1.HttpError(403, "FORBIDDEN", "You are not allowed to access this workout plan");
    }
    return toSafeWorkoutPlan(plan);
}
// Updates workout plan title/description with ownership checks.
async function updateWorkoutPlan(requester, planId, payload) {
    const plan = await prisma.workoutPlan.findUnique({ where: { id: planId } });
    if (!plan) {
        throw new http_error_1.HttpError(404, "WORKOUT_PLAN_NOT_FOUND", "Workout plan not found");
    }
    if (!canManageWorkoutPlan(requester, plan)) {
        throw new http_error_1.HttpError(403, "FORBIDDEN", "You are not allowed to modify this workout plan");
    }
    const updated = await prisma.workoutPlan.update({
        where: { id: planId },
        data: {
            ...(payload.title !== undefined ? { title: payload.title } : {}),
            ...(payload.description !== undefined ? { description: payload.description } : {}),
        },
    });
    return toSafeWorkoutPlan(updated);
}
// Hard-deletes workout plans under ownership/admin constraints.
async function deleteWorkoutPlan(requester, planId) {
    const plan = await prisma.workoutPlan.findUnique({ where: { id: planId } });
    if (!plan) {
        throw new http_error_1.HttpError(404, "WORKOUT_PLAN_NOT_FOUND", "Workout plan not found");
    }
    if (!canManageWorkoutPlan(requester, plan)) {
        throw new http_error_1.HttpError(403, "FORBIDDEN", "You are not allowed to delete this workout plan");
    }
    await prisma.workoutPlan.delete({ where: { id: planId } });
}
// Assigns/reassigns one workout plan to one member.
async function assignWorkoutPlan(requester, planId, memberId) {
    const plan = await prisma.workoutPlan.findUnique({ where: { id: planId } });
    if (!plan) {
        throw new http_error_1.HttpError(404, "WORKOUT_PLAN_NOT_FOUND", "Workout plan not found");
    }
    if (!canManageWorkoutPlan(requester, plan)) {
        throw new http_error_1.HttpError(403, "FORBIDDEN", "You are not allowed to assign this workout plan");
    }
    await assertAssignableMember(memberId);
    const updated = await prisma.workoutPlan.update({
        where: { id: planId },
        data: { assignedToId: memberId },
    });
    return toSafeWorkoutPlan(updated);
}
//# sourceMappingURL=workout-service.js.map