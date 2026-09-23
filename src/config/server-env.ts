import { z } from "zod";

const serverEnvironmentSchema = z.object({
  DATABASE_URL: z.string().url().startsWith("postgresql://"),
  BETTER_AUTH_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),
});

export const serverEnvironment = serverEnvironmentSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
});
