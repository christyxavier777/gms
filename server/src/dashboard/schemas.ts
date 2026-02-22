import { z } from "zod";

// Optional limit query for recent progress sections.
export const recentLimitQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(5),
});
