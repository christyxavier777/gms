// Safe progress response model for API output.
export type SafeProgress = {
  id: string;
  userId: string;
  recordedById: string;
  weight: number | null;
  bodyFat: number | null;
  bmi: number | null;
  notes: string | null;
  recordedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};
