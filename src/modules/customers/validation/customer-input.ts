import { z } from "zod";

const optionalText = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .transform((value) => value || null);

const optionalDate = z
  .string()
  .trim()
  .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: "INVALID_DATE",
  })
  .transform((value) => value || null);

export const customerInputSchema = z.object({
  name: z.string().trim().min(1, "REQUIRED").max(200),
  website: z
    .union([z.literal(""), z.url().max(500)])
    .transform((value) => value || null),
  industry: optionalText(200),
  companySize: z
    .union([
      z.literal(""),
      z.coerce.number().int().nonnegative().max(2_000_000_000),
    ])
    .transform((value) => (value === "" ? null : value)),
  contractValue: z
    .union([
      z.literal(""),
      z.string().regex(/^\d+(?:\.\d{1,2})?$/, "INVALID_MONEY"),
    ])
    .transform((value) => value || null),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/),
  customerSince: optionalDate,
  renewalDate: optionalDate,
  lifecycleStageId: z.uuid(),
  ownerId: z.uuid(),
  tags: z
    .string()
    .transform((value) =>
      [
        ...new Set(
          value
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        ),
      ].slice(0, 20),
    )
    .pipe(z.array(z.string().max(200))),
});

export const contactInputSchema = z.object({
  customerId: z.uuid(),
  name: z.string().trim().min(1, "REQUIRED").max(200),
  email: z
    .union([z.literal(""), z.email().max(320)])
    .transform((value) => value || null),
  phone: optionalText(50),
  jobTitle: optionalText(200),
  accountRole: z.enum([
    "CHAMPION",
    "DECISION_MAKER",
    "EXECUTIVE_SPONSOR",
    "ADMIN",
    "BILLING",
    "USER",
    "OTHER",
  ]),
  isPrimary: z.preprocess(
    (value) => value === "on" || value === true,
    z.boolean(),
  ),
});

export const updateContactInputSchema = contactInputSchema.extend({
  contactId: z.uuid(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const customerIdSchema = z.object({ customerId: z.uuid() });

export type CustomerInput = z.infer<typeof customerInputSchema>;
export type ContactInput = z.infer<typeof contactInputSchema>;
export type UpdateContactInput = z.infer<typeof updateContactInputSchema>;
