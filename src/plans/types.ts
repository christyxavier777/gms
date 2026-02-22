// Shared safe response shape for workout and diet plans.
export type SafePlan = {
  id: string;
  title: string;
  description: string;
  assignedToId: string | null;
  createdAt: Date;
  updatedAt: Date;
};
