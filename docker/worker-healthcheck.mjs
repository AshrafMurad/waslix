import { stat } from "node:fs/promises";

const heartbeatFile =
  process.env.WORKER_HEARTBEAT_FILE ?? "/tmp/waslix-worker-heartbeat";
const maxAgeMs = Number(process.env.WORKER_HEARTBEAT_MAX_AGE_MS ?? 600000);

try {
  const heartbeat = await stat(heartbeatFile);
  const ageMs = Date.now() - heartbeat.mtimeMs;
  process.exit(ageMs <= maxAgeMs ? 0 : 1);
} catch {
  process.exit(1);
}
