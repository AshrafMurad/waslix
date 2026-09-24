import { z } from "zod";

const dimensionEvidenceSchema = z.object({
  score: z.number().min(0).max(100),
  observedAt: z.iso.datetime({ offset: true }),
  source: z.enum(["MANUAL", "SYSTEM", "INTEGRATION"]),
  sourceId: z.string().min(1),
  isSimulated: z.boolean(),
  freshness: z.enum(["FRESH", "AGING", "STALE"]),
  originalWeight: z.number().min(0).max(1),
  effectiveWeight: z.number().min(0).max(1),
});

export const healthEvidenceSchema = z.object({
  version: z.literal(1),
  dimensions: z.object({
    USAGE: dimensionEvidenceSchema.optional(),
    ENGAGEMENT: dimensionEvidenceSchema.optional(),
    SUPPORT: dimensionEvidenceSchema.optional(),
    GOALS: dimensionEvidenceSchema.optional(),
  }),
  nativeFacts: z.object({
    meaningfulActivity: z
      .object({ id: z.string(), occurredAt: z.iso.datetime({ offset: true }) })
      .nullable(),
    goals: z.array(
      z.object({
        id: z.string(),
        progress: z.number(),
        status: z.string(),
        observedAt: z.iso.datetime({ offset: true }),
      }),
    ),
  }),
});
