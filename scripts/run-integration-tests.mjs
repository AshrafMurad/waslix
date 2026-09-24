import { spawnSync } from "node:child_process";
import "dotenv/config";

const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl) {
  console.error("TEST_DATABASE_URL is required for integration tests.");
  process.exit(1);
}

const environment = {
  ...process.env,
  DATABASE_URL: databaseUrl,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  BETTER_AUTH_SECRET:
    process.env.BETTER_AUTH_SECRET ??
    "integration-only-secret-at-least-32-characters",
};

for (const [command, args] of [
  ["npx", ["prisma", "migrate", "deploy"]],
  [
    "npx",
    [
      "vitest",
      "run",
      "tests/integration",
      "--maxWorkers=1",
      "--no-file-parallelism",
    ],
  ],
]) {
  const result = spawnSync(command, args, {
    env: environment,
    shell: process.platform === "win32",
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
