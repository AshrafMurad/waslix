import { z } from "zod";

const emptyToNull = (value: unknown) => (value === "" ? null : value);

export const acceptRecommendationInputSchema = z.object({
  recommendationId: z.uuid(),
  ownerId: z.preprocess(emptyToNull, z.uuid().nullable()).optional(),
  dueDate: z.preprocess(emptyToNull, z.iso.date().nullable()).optional(),
  operationKey: z.uuid(),
});

export const dismissRecommendationInputSchema = z.object({
  recommendationId: z.uuid(),
  reason: z.string().trim().min(1, "REQUIRED").max(10000),
  operationKey: z.uuid(),
});

export type AcceptRecommendationInput = z.infer<
  typeof acceptRecommendationInputSchema
>;
export type DismissRecommendationInput = z.infer<
  typeof dismissRecommendationInputSchema
>;
