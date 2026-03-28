import dotenv from "dotenv";
import {
  PaymentStatus,
  Role,
  ScheduleBookingStatus,
  ScheduleSessionType,
  SubscriptionStatus,
} from "@prisma/client";
import { hashPassword } from "../auth/password";
import { toMinorUnits } from "../payments/money";
import { calculateBmi, categorizeBmi } from "../progress/bmi";
import { addUtcDays, todayUtc } from "../subscriptions/lifecycle";
import { createPrismaClient } from "../prisma/client";

dotenv.config({ quiet: true });

const prisma = createPrismaClient();

type DemoUserSeed = {
  key: "admin" | "trainer" | "memberActive" | "memberPending" | "memberEnding" | "memberCancelled";
  name: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
};

function readOptionalEnv(name: string, fallback = ""): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    return fallback;
  }
  return value.trim();
}

function buildEmail(localPart: string): string {
  const domain = readOptionalEnv("DEMO_EMAIL_DOMAIN", "demo.gms.local");
  return `${localPart}@${domain}`.toLowerCase();
}

function buildDemoUsers(): DemoUserSeed[] {
  const sharedMemberPassword = readOptionalEnv("DEMO_MEMBER_PASSWORD", "DemoMember123");

  return [
    {
      key: "admin",
      name: "Demo Admin",
      email: buildEmail("demo.admin"),
      phone: "9000000001",
      password: readOptionalEnv("DEMO_ADMIN_PASSWORD", "DemoAdmin123"),
      role: Role.ADMIN,
    },
    {
      key: "trainer",
      name: "Demo Trainer",
      email: buildEmail("demo.trainer"),
      phone: "9000000002",
      password: readOptionalEnv("DEMO_TRAINER_PASSWORD", "DemoTrainer123"),
      role: Role.TRAINER,
    },
    {
      key: "memberActive",
      name: "Aanya Active",
      email: buildEmail("aanya.active"),
      phone: "9000000003",
      password: sharedMemberPassword,
      role: Role.MEMBER,
    },
    {
      key: "memberPending",
      name: "Vihaan Pending",
      email: buildEmail("vihaan.pending"),
      phone: "9000000004",
      password: sharedMemberPassword,
      role: Role.MEMBER,
    },
    {
      key: "memberEnding",
      name: "Sara Ending",
      email: buildEmail("sara.ending"),
      phone: "9000000005",
      password: sharedMemberPassword,
      role: Role.MEMBER,
    },
    {
      key: "memberCancelled",
      name: "Kabir Cancelled",
      email: buildEmail("kabir.cancelled"),
      phone: "9000000006",
      password: sharedMemberPassword,
      role: Role.MEMBER,
    },
  ];
}

function assertSafeRuntime(): void {
  const nodeEnv = readOptionalEnv("NODE_ENV", "development").toLowerCase();
  if (nodeEnv === "production") {
    throw new Error("seed:demo is blocked in production. Use a dedicated non-production environment.");
  }
}

async function resetExistingDemoData(emails: string[]): Promise<void> {
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

async function createUsers(userSeeds: DemoUserSeed[]): Promise<Record<DemoUserSeed["key"], { id: string; email: string }>> {
  const createdUsers: Partial<Record<DemoUserSeed["key"], { id: string; email: string }>> = {};

  for (const seed of userSeeds) {
    const passwordHash = await hashPassword(seed.password);
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

  return createdUsers as Record<DemoUserSeed["key"], { id: string; email: string }>;
}

async function seedMembershipData(users: Record<DemoUserSeed["key"], { id: string; email: string }>): Promise<void> {
  const [basicPlan, proPlan, elitePlan] = await Promise.all([
    prisma.membershipPlan.findUnique({ where: { id: "basic-monthly" }, select: { id: true, name: true, priceMinor: true, durationDays: true } }),
    prisma.membershipPlan.findUnique({ where: { id: "pro-quarterly" }, select: { id: true, name: true, priceMinor: true, durationDays: true } }),
    prisma.membershipPlan.findUnique({ where: { id: "elite-annual" }, select: { id: true, name: true, priceMinor: true, durationDays: true } }),
  ]);

  if (!basicPlan || !proPlan || !elitePlan) {
    throw new Error("Expected the canonical membership plan catalog to be present before running seed:demo.");
  }

  const today = todayUtc();
  const activeStart = addUtcDays(today, -18);
  const pendingStart = today;
  const endingStart = addUtcDays(today, -40);
  const cancelledStart = addUtcDays(today, -50);

  const activeSubscription = await prisma.subscription.create({
    data: {
      userId: users.memberActive.id,
      planId: proPlan.id,
      planName: proPlan.name,
      startDate: activeStart,
      endDate: addUtcDays(activeStart, proPlan.durationDays),
      status: SubscriptionStatus.ACTIVE,
    },
    select: { id: true },
  });

  const pendingSubscription = await prisma.subscription.create({
    data: {
      userId: users.memberPending.id,
      planId: basicPlan.id,
      planName: basicPlan.name,
      startDate: pendingStart,
      endDate: addUtcDays(pendingStart, basicPlan.durationDays),
      status: SubscriptionStatus.PENDING_ACTIVATION,
    },
    select: { id: true },
  });

  const endingSubscription = await prisma.subscription.create({
    data: {
      userId: users.memberEnding.id,
      planId: elitePlan.id,
      planName: elitePlan.name,
      startDate: endingStart,
      endDate: addUtcDays(endingStart, elitePlan.durationDays),
      status: SubscriptionStatus.CANCELLED_AT_PERIOD_END,
    },
    select: { id: true },
  });

  const cancelledSubscription = await prisma.subscription.create({
    data: {
      userId: users.memberCancelled.id,
      planId: basicPlan.id,
      planName: basicPlan.name,
      startDate: cancelledStart,
      endDate: addUtcDays(cancelledStart, basicPlan.durationDays),
      status: SubscriptionStatus.CANCELLED,
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
      status: PaymentStatus.SUCCESS,
      reviewedById: users.admin.id,
      reviewedAt: addUtcDays(today, -16),
      verificationNotes: "Demo verified payment for active member.",
      events: {
        create: [
          {
            fromStatus: null,
            toStatus: PaymentStatus.PENDING,
            changedById: users.memberActive.id,
            verificationNotes: null,
          },
          {
            fromStatus: PaymentStatus.PENDING,
            toStatus: PaymentStatus.SUCCESS,
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
      status: PaymentStatus.PENDING,
      events: {
        create: {
          fromStatus: null,
          toStatus: PaymentStatus.PENDING,
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
      status: PaymentStatus.SUCCESS,
      reviewedById: users.admin.id,
      reviewedAt: addUtcDays(today, -35),
      verificationNotes: "Long-term membership confirmed.",
      events: {
        create: [
          {
            fromStatus: null,
            toStatus: PaymentStatus.PENDING,
            changedById: users.memberEnding.id,
            verificationNotes: null,
          },
          {
            fromStatus: PaymentStatus.PENDING,
            toStatus: PaymentStatus.SUCCESS,
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
      amountMinor: toMinorUnits(999),
      upiId: "kabir.cancelled@okaxis",
      proofReference: "demo-proof-failed",
      status: PaymentStatus.FAILED,
      reviewedById: users.admin.id,
      reviewedAt: addUtcDays(today, -42),
      verificationNotes: "Reference mismatch flagged by reviewer.",
      events: {
        create: [
          {
            fromStatus: null,
            toStatus: PaymentStatus.PENDING,
            changedById: users.memberCancelled.id,
            verificationNotes: null,
          },
          {
            fromStatus: PaymentStatus.PENDING,
            toStatus: PaymentStatus.FAILED,
            changedById: users.admin.id,
            verificationNotes: "Reference mismatch flagged by reviewer.",
          },
        ],
      },
    },
  });

  const activeBmi = calculateBmi(74, 1.75);
  const endingBmi = calculateBmi(69, 1.68);
  const pendingBmi = calculateBmi(81, 1.79);

  await prisma.progress.createMany({
    data: [
      {
        userId: users.memberActive.id,
        recordedById: users.trainer.id,
        weight: 74,
        height: 1.75,
        bodyFat: 19.2,
        bmi: activeBmi,
        dietCategory: categorizeBmi(activeBmi),
        notes: "Demo trainer check-in with stable weekly adherence.",
        recordedAt: addUtcDays(today, -7),
      },
      {
        userId: users.memberEnding.id,
        recordedById: users.admin.id,
        weight: 69,
        height: 1.68,
        bodyFat: 18.4,
        bmi: endingBmi,
        dietCategory: categorizeBmi(endingBmi),
        notes: "Admin-assisted reassessment before renewal decision.",
        recordedAt: addUtcDays(today, -5),
      },
      {
        userId: users.memberPending.id,
        recordedById: users.trainer.id,
        weight: 81,
        height: 1.79,
        bodyFat: 24.1,
        bmi: pendingBmi,
        dietCategory: categorizeBmi(pendingBmi),
        notes: "Initial onboarding measurements recorded ahead of activation.",
        recordedAt: addUtcDays(today, -1),
      },
    ],
  });

  const upcomingSession = await prisma.scheduleSession.create({
    data: {
      title: "Demo Strength Circuit",
      description: "Shared class slot for seeded member bookings.",
      sessionType: ScheduleSessionType.CLASS,
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
      sessionType: ScheduleSessionType.RECOVERY,
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
        status: ScheduleBookingStatus.BOOKED,
      },
      {
        sessionId: upcomingSession.id,
        memberId: users.memberEnding.id,
        status: ScheduleBookingStatus.BOOKED,
      },
      {
        sessionId: historySession.id,
        memberId: users.memberActive.id,
        status: ScheduleBookingStatus.ATTENDED,
      },
      {
        sessionId: historySession.id,
        memberId: users.memberCancelled.id,
        status: ScheduleBookingStatus.MISSED,
      },
    ],
  });

  console.log(
    JSON.stringify(
      {
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
      },
      null,
      2,
    ),
  );
}

async function run(): Promise<void> {
  assertSafeRuntime();

  const demoUsers = buildDemoUsers();
  await resetExistingDemoData(demoUsers.map((user) => user.email));
  const createdUsers = await createUsers(demoUsers);
  await seedMembershipData(createdUsers);
}

void run()
  .catch((error: unknown) => {
    console.error("[seed-demo] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
