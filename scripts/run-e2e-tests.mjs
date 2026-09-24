import { spawnSync } from "node:child_process";
import "dotenv/config";

const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl) {
  console.error("TEST_DATABASE_URL is required for end-to-end tests.");
  process.exit(1);
}

const appUrl = "http://127.0.0.1:3100";
const environment = {
  ...process.env,
  DATABASE_URL: databaseUrl,
  BETTER_AUTH_URL: appUrl,
  BETTER_AUTH_SECRET:
    process.env.BETTER_AUTH_SECRET ??
    "end-to-end-only-secret-at-least-32-characters",
  NEXT_PUBLIC_APP_URL: appUrl,
};

for (const [command, args] of [
  ["npx", ["prisma", "migrate", "deploy"]],
  ["npx", ["playwright", "test"]],
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
