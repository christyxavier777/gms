import { ScheduleBookingStatus, ScheduleSessionType } from "@prisma/client";

export type SchedulePersonSummary = {
  id: string;
  name: string;
  email: string;
};

export type SafeScheduleAttendee = {
  bookingId: string;
  status: ScheduleBookingStatus;
  bookedAt: Date;
  member: SchedulePersonSummary;
};

export type SafeScheduleSession = {
  id: string;
  title: string;
  description: string | null;
  sessionType: ScheduleSessionType;
  location: string | null;
  startsAt: Date;
  endsAt: Date;
  capacity: number;
  bookedCount: number;
  remainingSeats: number;
  trainer: SchedulePersonSummary;
  createdById: string;
  attendees: SafeScheduleAttendee[];
  currentUserBooking: { id: string; status: ScheduleBookingStatus } | null;
};

export type SafeScheduleHistoryItem = {
  id: string;
  status: ScheduleBookingStatus;
  bookedAt: Date;
  updatedAt: Date;
  session: {
    id: string;
    title: string;
    sessionType: ScheduleSessionType;
    location: string | null;
    startsAt: Date;
    endsAt: Date;
    trainer: SchedulePersonSummary;
  };
};

export type SafeTrainerAvailability = {
  trainer: SchedulePersonSummary;
  upcomingSessions: number;
  bookedSeats: number;
  remainingSeats: number;
  nextSessionStartsAt: Date | null;
};

export type ScheduleWorkspace = {
  upcomingSessions: SafeScheduleSession[];
  attendanceHistory: SafeScheduleHistoryItem[];
  trainerAvailability: SafeTrainerAvailability[];
  trainers: SchedulePersonSummary[];
};
