export type SafeProgress = {
  id: string;
  userId: string;
  recordedById: string;
  weight: number | null;
  height: number | null;
  bodyFat: number | null;
  bmi: number | null;
  dietCategory: "UNDERWEIGHT" | "NORMAL" | "OVERWEIGHT" | "OBESE" | null;
  notes: string | null;
  recordedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  member: {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: "ACTIVE" | "INACTIVE";
  };
  recorder: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "TRAINER" | "MEMBER";
  };
};
