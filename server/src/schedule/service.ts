import {
  Prisma,
  Role,
  ScheduleBooking,
  ScheduleBookingStatus,
  ScheduleSession,
  ScheduleSessionType,
  User,
  UserStatus,
} from "@prisma/client";
import { createPrismaClient } from "../prisma/client";
import { HttpError } from "../middleware/http-error";
import {
  SafeScheduleAttendee,
  SafeScheduleHistoryItem,
  SafeScheduleSession,
  SafeTrainerAvailability,
  SchedulePersonSummary,
  ScheduleWorkspace,
} from "./types";

const prisma = createPrismaClient();
const defaultScheduleCapacity = 12;

const schedulePersonSelect = {
  id: true,
  name: true,
  email: true,
} satisfies Prisma.UserSelect;

const scheduleBookingOperationSelect = {
  id: true,
  status: true,
  createdAt: true,
  memberId: true,
} satisfies Prisma.ScheduleBookingSelect;

function toPersonSummary(user: Pick<User, "id" | "name" | "email">): SchedulePersonSummary {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

function countReservedBookings(bookings: Array<Pick<ScheduleBooking, "status">>): number {
  return bookings.filter((booking) => booking.status !== ScheduleBookingStatus.CANCELLED).length;
}

function toSafeAttendees(
  bookings: Array<
    Pick<ScheduleBooking, "id" | "status" | "createdAt"> & {
      member: Pick<User, "id" | "name" | "email">;
    }
  >,
): SafeScheduleAttendee[] {
  return bookings.map((booking) => ({
    bookingId: booking.id,
    status: booking.status,
    bookedAt: booking.createdAt,
    member: toPersonSummary(booking.member),
  }));
}

function toSafeScheduleSession(
  session: Pick<
    ScheduleSession,
    "id" | "title" | "description" | "sessionType" | "location" | "startsAt" | "endsAt" | "capacity" | "createdById"
  > & {
    trainer: Pick<User, "id" | "name" | "email">;
    bookings: Array<
      Pick<ScheduleBooking, "id" | "status" | "createdAt" | "memberId"> & {
        member: Pick<User, "id" | "name" | "email">;
      }
    >;
  },
  requesterUserId: string,
  includeAttendees: boolean,
): SafeScheduleSession {
  const bookedCount = countReservedBookings(session.bookings);
  const currentUserBooking = session.bookings.find((booking) => booking.memberId === requesterUserId) || null;

  return {
    id: session.id,
    title: session.title,
    description: session.description,
    sessionType: session.sessionType,
    location: session.location,
    startsAt: session.startsAt,
    endsAt: session.endsAt,
    capacity: session.capacity,
    bookedCount,
    remainingSeats: Math.max(session.capacity - bookedCount, 0),
    trainer: toPersonSummary(session.trainer),
    createdById: session.createdById,
    attendees: includeAttendees ? toSafeAttendees(session.bookings) : [],
    currentUserBooking: currentUserBooking
      ? { id: currentUserBooking.id, status: currentUserBooking.status }
      : null,
  };
}

function buildTrainerAvailability(
  sessions: SafeScheduleSession[],
  trainers: SchedulePersonSummary[],
): SafeTrainerAvailability[] {
  return trainers
    .map((trainer) => {
      const trainerSessions = sessions.filter((session) => session.trainer.id === trainer.id);
      const bookedSeats = trainerSessions.reduce((sum, session) => sum + session.bookedCount, 0);
      const remainingSeats = trainerSessions.reduce((sum, session) => sum + session.remainingSeats, 0);

      return {
        trainer,
        upcomingSessions: trainerSessions.length,
        bookedSeats,
        remainingSeats,
        nextSessionStartsAt: trainerSessions[0]?.startsAt || null,
      };
    })
    .sort((left, right) => {
      if (left.nextSessionStartsAt && right.nextSessionStartsAt) {
        return left.nextSessionStartsAt.getTime() - right.nextSessionStartsAt.getTime();
      }
      if (left.nextSessionStartsAt) return -1;
      if (right.nextSessionStartsAt) return 1;
      return left.trainer.name.localeCompare(right.trainer.name);
    });
}

async function assertTrainerUser(trainerId: string): Promise<Pick<User, "id" | "name" | "email" | "role" | "status">> {
  const trainer = await prisma.user.findUnique({
    where: { id: trainerId },
    select: { id: true, name: true, email: true, role: true, status: true },
  });

  if (!trainer || trainer.role !== Role.TRAINER) {
    throw new HttpError(400, "INVALID_TRAINER", "A valid trainer is required for scheduled sessions");
  }

  if (trainer.status !== UserStatus.ACTIVE) {
    throw new HttpError(400, "TRAINER_INACTIVE", "Scheduled sessions can only be assigned to active trainers");
  }

  return trainer;
}

async function getScheduleSessionOrThrow(sessionId: string) {
  const session = await prisma.scheduleSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      startsAt: true,
      capacity: true,
      bookings: {
        orderBy: [{ createdAt: "asc" }],
        select: scheduleBookingOperationSelect,
      },
    },
  });

  if (!session) {
    throw new HttpError(404, "SCHEDULE_SESSION_NOT_FOUND", "Scheduled session not found");
  }

  return session;
}

async function getScheduleBookingOrThrow(bookingId: string) {
  const booking = await prisma.scheduleBooking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      memberId: true,
      status: true,
      session: {
        select: {
          trainerId: true,
          startsAt: true,
        },
      },
    },
  });

  if (!booking) {
    throw new HttpError(404, "SCHEDULE_BOOKING_NOT_FOUND", "Schedule booking not found");
  }

  return booking;
}

export async function listScheduleWorkspace(requester: {
  userId: string;
  role: Role;
}): Promise<ScheduleWorkspace> {
  const now = new Date();
  const upcomingWhere: Prisma.ScheduleSessionWhereInput = {
    endsAt: { gte: now },
    ...(requester.role === Role.TRAINER ? { trainerId: requester.userId } : {}),
  };

  const [upcomingRows, trainerRows] = await Promise.all([
    prisma.scheduleSession.findMany({
      where: upcomingWhere,
      include: {
        trainer: {
          select: schedulePersonSelect,
        },
        bookings: {
          orderBy: [{ createdAt: "asc" }],
          include: {
            member: {
              select: schedulePersonSelect,
            },
          },
        },
      },
      orderBy: [{ startsAt: "asc" }, { createdAt: "asc" }],
      take: 24,
    }),
    prisma.user.findMany({
      where: {
        role: Role.TRAINER,
        status: UserStatus.ACTIVE,
        ...(requester.role === Role.TRAINER ? { id: requester.userId } : {}),
      },
      select: { id: true, name: true, email: true },
      orderBy: [{ name: "asc" }, { createdAt: "asc" }],
      take: requester.role === Role.TRAINER ? 1 : 25,
    }),
  ]);

  const historyRows =
    requester.role === Role.MEMBER
      ? await prisma.scheduleBooking.findMany({
          where: {
            memberId: requester.userId,
            OR: [
              { status: { in: [ScheduleBookingStatus.ATTENDED, ScheduleBookingStatus.MISSED, ScheduleBookingStatus.CANCELLED] } },
              { session: { endsAt: { lt: now } } },
            ],
          },
          include: {
            session: {
              include: {
                trainer: {
                  select: schedulePersonSelect,
                },
              },
            },
          },
          orderBy: [{ updatedAt: "desc" }],
          take: 12,
        })
      : [];

  const includeAttendees = requester.role !== Role.MEMBER;
  const upcomingSessions = upcomingRows.map((session) =>
    toSafeScheduleSession(session, requester.userId, includeAttendees),
  );
  const trainers = trainerRows.map(toPersonSummary);
  const trainerAvailability = buildTrainerAvailability(upcomingSessions, trainers);
  const attendanceHistory: SafeScheduleHistoryItem[] = historyRows.map((booking) => ({
    id: booking.id,
    status: booking.status,
    bookedAt: booking.createdAt,
    updatedAt: booking.updatedAt,
    session: {
      id: booking.session.id,
      title: booking.session.title,
      sessionType: booking.session.sessionType,
      location: booking.session.location,
      startsAt: booking.session.startsAt,
      endsAt: booking.session.endsAt,
      trainer: toPersonSummary(booking.session.trainer),
    },
  }));

  return {
    upcomingSessions,
    attendanceHistory,
    trainerAvailability,
    trainers,
  };
}

export async function createScheduleSession(
  requester: { userId: string; role: Role },
  payload: {
    title: string;
    description?: string | undefined;
    sessionType: ScheduleSessionType;
    location?: string | undefined;
    trainerId?: string | undefined;
    startsAt: Date;
    endsAt: Date;
    capacity?: number | undefined;
  },
): Promise<SafeScheduleSession> {
  if (requester.role !== Role.ADMIN && requester.role !== Role.TRAINER) {
    throw new HttpError(
      403,
      "SCHEDULE_SESSION_CREATE_FORBIDDEN",
      "You are not allowed to create scheduled sessions",
    );
  }

  if (payload.startsAt <= new Date()) {
    throw new HttpError(400, "SESSION_START_IN_PAST", "Scheduled sessions must start in the future");
  }

  if (requester.role === Role.TRAINER && payload.trainerId && payload.trainerId !== requester.userId) {
    throw new HttpError(
      403,
      "SCHEDULE_TRAINER_SCOPE_FORBIDDEN",
      "Trainers can only schedule sessions for themselves",
    );
  }

  const trainerId = requester.role === Role.TRAINER ? requester.userId : payload.trainerId;
  if (!trainerId) {
    throw new HttpError(400, "TRAINER_REQUIRED", "Choose a trainer before creating a session");
  }

  await assertTrainerUser(trainerId);
  const capacity = payload.capacity ?? defaultScheduleCapacity;

  const created = await prisma.scheduleSession.create({
    data: {
      title: payload.title.trim(),
      description: payload.description?.trim() || null,
      sessionType: payload.sessionType,
      location: payload.location?.trim() || null,
      trainerId,
      createdById: requester.userId,
      startsAt: payload.startsAt,
      endsAt: payload.endsAt,
      capacity,
    },
    include: {
      trainer: {
        select: schedulePersonSelect,
      },
      bookings: {
        include: {
          member: {
            select: schedulePersonSelect,
          },
        },
      },
    },
  });

  return toSafeScheduleSession(created, requester.userId, true);
}

export async function bookScheduleSession(
  requester: { userId: string; role: Role },
  sessionId: string,
): Promise<{ bookingId: string; status: ScheduleBookingStatus }> {
  if (requester.role !== Role.MEMBER) {
    throw new HttpError(
      403,
      "SCHEDULE_BOOKING_CREATE_FORBIDDEN",
      "Only members can book scheduled sessions",
    );
  }

  const session = await getScheduleSessionOrThrow(sessionId);
  if (session.startsAt <= new Date()) {
    throw new HttpError(400, "SESSION_ALREADY_STARTED", "This session can no longer be booked");
  }

  const reservedCount = countReservedBookings(session.bookings);
  const existingBooking = session.bookings.find((booking) => booking.memberId === requester.userId) || null;

  if (existingBooking && existingBooking.status !== ScheduleBookingStatus.CANCELLED) {
    throw new HttpError(409, "SESSION_ALREADY_BOOKED", "You already have a booking for this session");
  }

  if (existingBooking && reservedCount >= session.capacity) {
    throw new HttpError(409, "SESSION_FULL", "This session is already full");
  }

  if (!existingBooking && reservedCount >= session.capacity) {
    throw new HttpError(409, "SESSION_FULL", "This session is already full");
  }

  if (existingBooking) {
    const reopened = await prisma.scheduleBooking.update({
      where: { id: existingBooking.id },
      data: { status: ScheduleBookingStatus.BOOKED },
    });

    return { bookingId: reopened.id, status: reopened.status };
  }

  const created = await prisma.scheduleBooking.create({
    data: {
      sessionId,
      memberId: requester.userId,
    },
  });

  return { bookingId: created.id, status: created.status };
}

export async function updateScheduleBookingStatus(
  requester: { userId: string; role: Role },
  bookingId: string,
  nextStatus: ScheduleBookingStatus,
): Promise<{ bookingId: string; status: ScheduleBookingStatus }> {
  const booking = await getScheduleBookingOrThrow(bookingId);
  const now = new Date();

  if (requester.role === Role.MEMBER) {
    if (booking.memberId !== requester.userId) {
      throw new HttpError(
        403,
        "SCHEDULE_BOOKING_MEMBER_SCOPE_FORBIDDEN",
        "You are not allowed to update this booking",
      );
    }
    if (nextStatus !== ScheduleBookingStatus.CANCELLED) {
      throw new HttpError(
        403,
        "SCHEDULE_BOOKING_CANCEL_FORBIDDEN",
        "Members can only cancel their own bookings",
      );
    }
    if (booking.session.startsAt <= now) {
      throw new HttpError(400, "SESSION_ALREADY_STARTED", "Bookings can only be cancelled before the session starts");
    }
  }

  if (requester.role === Role.TRAINER && booking.session.trainerId !== requester.userId) {
    throw new HttpError(
      403,
      "SCHEDULE_BOOKING_TRAINER_SCOPE_FORBIDDEN",
      "You are not allowed to update bookings for this session",
    );
  }

  if ((requester.role === Role.ADMIN || requester.role === Role.TRAINER) &&
      nextStatus !== ScheduleBookingStatus.CANCELLED &&
      booking.session.startsAt > now) {
    throw new HttpError(400, "ATTENDANCE_TOO_EARLY", "Attendance can only be marked after the session starts");
  }

  if (booking.status === ScheduleBookingStatus.CANCELLED && nextStatus !== ScheduleBookingStatus.CANCELLED) {
    throw new HttpError(409, "BOOKING_ALREADY_CANCELLED", "Cancelled bookings cannot be marked for attendance");
  }

  const updated = await prisma.scheduleBooking.update({
    where: { id: bookingId },
    data: { status: nextStatus },
  });

  return { bookingId: updated.id, status: updated.status };
}
