"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const password_1 = require("../auth/password");
const money_1 = require("../payments/money");
const bmi_1 = require("../progress/bmi");
const lifecycle_1 = require("../subscriptions/lifecycle");
const client_2 = require("../prisma/client");
dotenv_1.default.config({ quiet: true });
const prisma = (0, client_2.createPrismaClient)();
function readOptionalEnv(name, fallback = "") {
    const value = process.env[name];
    if (!value || value.trim().length === 0) {
        return fallback;
    }
    return value.trim();
}
function buildEmail(localPart) {
    const domain = readOptionalEnv("DEMO_EMAIL_DOMAIN", "demo.gms.local");
    return `${localPart}@${domain}`.toLowerCase();
}
function buildDemoUsers() {
    const sharedMemberPassword = readOptionalEnv("DEMO_MEMBER_PASSWORD", "DemoMember123");
    return [
        {
            key: "admin",
            name: "Demo Admin",
            email: buildEmail("demo.admin"),
            phone: "9000000001",
            password: readOptionalEnv("DEMO_ADMIN_PASSWORD", "DemoAdmin123"),
            role: client_1.Role.ADMIN,
        },
        {
            key: "trainer",
            name: "Demo Trainer",
            email: buildEmail("demo.trainer"),
            phone: "9000000002",
            password: readOptionalEnv("DEMO_TRAINER_PASSWORD", "DemoTrainer123"),
            role: client_1.Role.TRAINER,
        },
        {
            key: "memberActive",
            name: "Aanya Active",
            email: buildEmail("aanya.active"),
            phone: "9000000003",
            password: sharedMemberPassword,
            role: client_1.Role.MEMBER,
        },
        {
            key: "memberPending",
            name: "Vihaan Pending",
            email: buildEmail("vihaan.pending"),
            phone: "9000000004",
            password: sharedMemberPassword,
            role: client_1.Role.MEMBER,
        },
        {
            key: "memberEnding",
            name: "Sara Ending",
            email: buildEmail("sara.ending"),
            phone: "9000000005",
            password: sharedMemberPassword,
            role: client_1.Role.MEMBER,
        },
        {
            key: "memberCancelled",
            name: "Kabir Cancelled",
            email: buildEmail("kabir.cancelled"),
            phone: "9000000006",
            password: sharedMemberPassword,
            role: client_1.Role.MEMBER,
        },
    ];
}
function assertSafeRuntime() {
    const nodeEnv = readOptionalEnv("NODE_ENV", "development").toLowerCase();
    if (nodeEnv === "production") {
        throw new Error("seed:demo is blocked in production. Use a dedicated non-production environment.");
    }
}
async function resetExistingDemoData(emails) {
    const existingUsers = await prisma.user.findMany({
        where: { email: { in: emails } },
        select: { id: true },
    });
    const userIds = existingUsers.map((user) => user.id);
    if (userIds.length === 0) {
        return;
    }
    const sessionRows = await prisma.scheduleSession.findMany({
        where: {
            OR: [
                { trainerId: { in: userIds } },
                { createdById: { in: userIds } },
            ],
        },
        select: { id: true },
    });
    const scheduleSessionIds = sessionRows.map((session) => session.id);
    const paymentRows = await prisma.payment.findMany({
        where: { userId: { in: userIds } },
        select: { id: true },
    });
    const paymentIds = paymentRows.map((payment) => payment.id);
    if (scheduleSessionIds.length > 0) {
        await prisma.scheduleBooking.deleteMany({
            where: { sessionId: { in: scheduleSessionIds } },
        });
        await prisma.scheduleSession.deleteMany({
            where: { id: { in: scheduleSessionIds } },
        });
    }
    await prisma.scheduleBooking.deleteMany({
        where: { memberId: { in: userIds } },
    });
    if (paymentIds.length > 0) {
        await prisma.paymentEvent.deleteMany({
            where: { paymentId: { in: paymentIds } },
        });
        await prisma.payment.deleteMany({
            where: { id: { in: paymentIds } },
        });
    }
    await prisma.progress.deleteMany({
        where: {
            OR: [
                { userId: { in: userIds } },
                { recordedById: { in: userIds } },
            ],
        },
    });
    await prisma.workoutPlan.deleteMany({
        where: {
            OR: [
                { createdById: { in: userIds } },
                { assignedToId: { in: userIds } },
            ],
        },
    });
    await prisma.dietPlan.deleteMany({
        where: {
            OR: [
                { createdById: { in: userIds } },
                { assignedToId: { in: userIds } },
            ],
        },
    });
    await prisma.subscription.deleteMany({
        where: { userId: { in: userIds } },
    });
    await prisma.trainerMemberAssignment.deleteMany({
        where: {
            OR: [
                { trainerId: { in: userIds } },
                { memberId: { in: userIds } },
            ],
        },
    });
    await prisma.session.deleteMany({
        where: { userId: { in: userIds } },
    });
    await prisma.user.deleteMany({
        where: { id: { in: userIds } },
    });
}
async function createUsers(userSeeds) {
    const createdUsers = {};
    for (const seed of userSeeds) {
        const passwordHash = await (0, password_1.hashPassword)(seed.password);
        const user = await prisma.user.create({
            data: {
                name: seed.name,
                email: seed.email,
                phone: seed.phone,
                passwordHash,
                role: seed.role,
            },
            select: { id: true, email: true },
        });
        createdUsers[seed.key] = user;
    }
    return createdUsers;
}
async function seedMembershipData(users) {
    const [basicPlan, proPlan, elitePlan] = await Promise.all([
        prisma.membershipPlan.findUnique({ where: { id: "basic-monthly" }, select: { id: true, name: true, priceMinor: true, durationDays: true } }),
        prisma.membershipPlan.findUnique({ where: { id: "pro-quarterly" }, select: { id: true, name: true, priceMinor: true, durationDays: true } }),
        prisma.membershipPlan.findUnique({ where: { id: "elite-annual" }, select: { id: true, name: true, priceMinor: true, durationDays: true } }),
    ]);
    if (!basicPlan || !proPlan || !elitePlan) {
        throw new Error("Expected the canonical membership plan catalog to be present before running seed:demo.");
    }
    const today = (0, lifecycle_1.todayUtc)();
    const activeStart = (0, lifecycle_1.addUtcDays)(today, -18);
    const pendingStart = today;
    const endingStart = (0, lifecycle_1.addUtcDays)(today, -40);
    const cancelledStart = (0, lifecycle_1.addUtcDays)(today, -50);
    const activeSubscription = await prisma.subscription.create({
        data: {
            userId: users.memberActive.id,
            planId: proPlan.id,
            planName: proPlan.name,
            startDate: activeStart,
            endDate: (0, lifecycle_1.addUtcDays)(activeStart, proPlan.durationDays),
            status: client_1.SubscriptionStatus.ACTIVE,
        },
        select: { id: true },
    });
    const pendingSubscription = await prisma.subscription.create({
        data: {
            userId: users.memberPending.id,
            planId: basicPlan.id,
            planName: basicPlan.name,
            startDate: pendingStart,
            endDate: (0, lifecycle_1.addUtcDays)(pendingStart, basicPlan.durationDays),
            status: client_1.SubscriptionStatus.PENDING_ACTIVATION,
        },
        select: { id: true },
    });
    const endingSubscription = await prisma.subscription.create({
        data: {
            userId: users.memberEnding.id,
            planId: elitePlan.id,
            planName: elitePlan.name,
            startDate: endingStart,
            endDate: (0, lifecycle_1.addUtcDays)(endingStart, elitePlan.durationDays),
            status: client_1.SubscriptionStatus.CANCELLED_AT_PERIOD_END,
        },
        select: { id: true },
    });
    const cancelledSubscription = await prisma.subscription.create({
        data: {
            userId: users.memberCancelled.id,
            planId: basicPlan.id,
            planName: basicPlan.name,
            startDate: cancelledStart,
            endDate: (0, lifecycle_1.addUtcDays)(cancelledStart, basicPlan.durationDays),
            status: client_1.SubscriptionStatus.CANCELLED,
        },
        select: { id: true },
    });
    await prisma.trainerMemberAssignment.createMany({
        data: [
            { trainerId: users.trainer.id, memberId: users.memberActive.id, active: true },
            { trainerId: users.trainer.id, memberId: users.memberEnding.id, active: true },
            { trainerId: users.trainer.id, memberId: users.memberPending.id, active: true },
        ],
    });
    await prisma.workoutPlan.createMany({
        data: [
            {
                title: "Strength Base Split",
                description: "Three-day compound-focused strength block for onboarding members.",
                createdById: users.trainer.id,
                assignedToId: users.memberActive.id,
            },
            {
                title: "Hybrid Conditioning",
                description: "Mobility, intervals, and steady-state work for schedule-compliant progress.",
                createdById: users.trainer.id,
                assignedToId: users.memberEnding.id,
            },
        ],
    });
    await prisma.dietPlan.createMany({
        data: [
            {
                title: "High Protein Reset",
                description: "Recovery-first meal pattern with consistent protein targets.",
                createdById: users.trainer.id,
                assignedToId: users.memberActive.id,
            },
            {
                title: "Maintenance Balance",
                description: "Balanced meal timing tuned for an active long-term member.",
                createdById: users.trainer.id,
                assignedToId: users.memberEnding.id,
            },
        ],
    });
    const successPayment = await prisma.payment.create({
        data: {
            transactionId: "DEMO-UPI-001",
            userId: users.memberActive.id,
            subscriptionId: activeSubscription.id,
            amountMinor: proPlan.priceMinor,
            upiId: "aanya.active@okaxis",
            proofReference: "demo-proof-success",
            status: client_1.PaymentStatus.SUCCESS,
            reviewedById: users.admin.id,
            reviewedAt: (0, lifecycle_1.addUtcDays)(today, -16),
            verificationNotes: "Demo verified payment for active member.",
            events: {
                create: [
                    {
                        fromStatus: null,
                        toStatus: client_1.PaymentStatus.PENDING,
                        changedById: users.memberActive.id,
                        verificationNotes: null,
                    },
                    {
                        fromStatus: client_1.PaymentStatus.PENDING,
                        toStatus: client_1.PaymentStatus.SUCCESS,
                        changedById: users.admin.id,
                        verificationNotes: "Approved during demo seed.",
                    },
                ],
            },
        },
    });
    const pendingPayment = await prisma.payment.create({
        data: {
            transactionId: "DEMO-UPI-002",
            userId: users.memberPending.id,
            subscriptionId: pendingSubscription.id,
            amountMinor: basicPlan.priceMinor,
            upiId: "vihaan.pending@okaxis",
            proofReference: "demo-proof-pending",
            status: client_1.PaymentStatus.PENDING,
            events: {
                create: {
                    fromStatus: null,
                    toStatus: client_1.PaymentStatus.PENDING,
                    changedById: users.memberPending.id,
                    verificationNotes: null,
                },
            },
        },
    });
    const endingPayment = await prisma.payment.create({
        data: {
            transactionId: "DEMO-UPI-003",
            userId: users.memberEnding.id,
            subscriptionId: endingSubscription.id,
            amountMinor: elitePlan.priceMinor,
            upiId: "sara.ending@okaxis",
            proofReference: "demo-proof-ending",
            status: client_1.PaymentStatus.SUCCESS,
            reviewedById: users.admin.id,
            reviewedAt: (0, lifecycle_1.addUtcDays)(today, -35),
            verificationNotes: "Long-term membership confirmed.",
            events: {
                create: [
                    {
                        fromStatus: null,
                        toStatus: client_1.PaymentStatus.PENDING,
                        changedById: users.memberEnding.id,
                        verificationNotes: null,
                    },
                    {
                        fromStatus: client_1.PaymentStatus.PENDING,
                        toStatus: client_1.PaymentStatus.SUCCESS,
                        changedById: users.admin.id,
                        verificationNotes: "Approved during demo seed.",
                    },
                ],
            },
        },
    });
    await prisma.payment.create({
        data: {
            transactionId: "DEMO-UPI-004",
            userId: users.memberCancelled.id,
            subscriptionId: cancelledSubscription.id,
            amountMinor: (0, money_1.toMinorUnits)(999),
            upiId: "kabir.cancelled@okaxis",
            proofReference: "demo-proof-failed",
            status: client_1.PaymentStatus.FAILED,
            reviewedById: users.admin.id,
            reviewedAt: (0, lifecycle_1.addUtcDays)(today, -42),
            verificationNotes: "Reference mismatch flagged by reviewer.",
            events: {
                create: [
                    {
                        fromStatus: null,
                        toStatus: client_1.PaymentStatus.PENDING,
                        changedById: users.memberCancelled.id,
                        verificationNotes: null,
                    },
                    {
                        fromStatus: client_1.PaymentStatus.PENDING,
                        toStatus: client_1.PaymentStatus.FAILED,
                        changedById: users.admin.id,
                        verificationNotes: "Reference mismatch flagged by reviewer.",
                    },
                ],
            },
        },
    });
    const activeBmi = (0, bmi_1.calculateBmi)(74, 1.75);
    const endingBmi = (0, bmi_1.calculateBmi)(69, 1.68);
    const pendingBmi = (0, bmi_1.calculateBmi)(81, 1.79);
    await prisma.progress.createMany({
        data: [
            {
                userId: users.memberActive.id,
                recordedById: users.trainer.id,
                weight: 74,
                height: 1.75,
                bodyFat: 19.2,
                bmi: activeBmi,
                dietCategory: (0, bmi_1.categorizeBmi)(activeBmi),
                notes: "Demo trainer check-in with stable weekly adherence.",
                recordedAt: (0, lifecycle_1.addUtcDays)(today, -7),
            },
            {
                userId: users.memberEnding.id,
                recordedById: users.admin.id,
                weight: 69,
                height: 1.68,
                bodyFat: 18.4,
                bmi: endingBmi,
                dietCategory: (0, bmi_1.categorizeBmi)(endingBmi),
                notes: "Admin-assisted reassessment before renewal decision.",
                recordedAt: (0, lifecycle_1.addUtcDays)(today, -5),
            },
            {
                userId: users.memberPending.id,
                recordedById: users.trainer.id,
                weight: 81,
                height: 1.79,
                bodyFat: 24.1,
                bmi: pendingBmi,
                dietCategory: (0, bmi_1.categorizeBmi)(pendingBmi),
                notes: "Initial onboarding measurements recorded ahead of activation.",
                recordedAt: (0, lifecycle_1.addUtcDays)(today, -1),
            },
        ],
    });
    const upcomingSession = await prisma.scheduleSession.create({
        data: {
            title: "Demo Strength Circuit",
            description: "Shared class slot for seeded member bookings.",
            sessionType: client_1.ScheduleSessionType.CLASS,
            location: "Main Floor",
            trainerId: users.trainer.id,
            createdById: users.admin.id,
            startsAt: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000),
            endsAt: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000 + 19 * 60 * 60 * 1000),
            capacity: 10,
        },
        select: { id: true },
    });
    const historySession = await prisma.scheduleSession.create({
        data: {
            title: "Demo Mobility Recovery",
            description: "Past attendance history for seeded dashboards.",
            sessionType: client_1.ScheduleSessionType.RECOVERY,
            location: "Studio B",
            trainerId: users.trainer.id,
            createdById: users.admin.id,
            startsAt: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000),
            endsAt: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000),
            capacity: 8,
        },
        select: { id: true },
    });
    await prisma.scheduleBooking.createMany({
        data: [
            {
                sessionId: upcomingSession.id,
                memberId: users.memberActive.id,
                status: client_1.ScheduleBookingStatus.BOOKED,
            },
            {
                sessionId: upcomingSession.id,
                memberId: users.memberEnding.id,
                status: client_1.ScheduleBookingStatus.BOOKED,
            },
            {
                sessionId: historySession.id,
                memberId: users.memberActive.id,
                status: client_1.ScheduleBookingStatus.ATTENDED,
            },
            {
                sessionId: historySession.id,
                memberId: users.memberCancelled.id,
                status: client_1.ScheduleBookingStatus.MISSED,
            },
        ],
    });
    console.log(JSON.stringify({
        event: "seed_demo_complete",
        users,
        subscriptions: {
            active: activeSubscription.id,
            pending: pendingSubscription.id,
            ending: endingSubscription.id,
            cancelled: cancelledSubscription.id,
        },
        payments: {
            success: successPayment.id,
            pending: pendingPayment.id,
            ending: endingPayment.id,
        },
    }, null, 2));
}
async function run() {
    assertSafeRuntime();
    const demoUsers = buildDemoUsers();
    await resetExistingDemoData(demoUsers.map((user) => user.email));
    const createdUsers = await createUsers(demoUsers);
    await seedMembershipData(createdUsers);
}
void run()
    .catch((error) => {
    console.error("[seed-demo] failed", error);
    process.exitCode = 1;
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed-demo.js.map