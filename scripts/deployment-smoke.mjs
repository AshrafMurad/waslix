const baseUrl =
  process.env.DEPLOYMENT_SMOKE_URL ?? process.env.NEXT_PUBLIC_APP_URL;

if (!baseUrl) {
  console.error("Set DEPLOYMENT_SMOKE_URL or NEXT_PUBLIC_APP_URL.");
  process.exit(1);
}

const checks = [
  ["live readiness", "/api/health/live"],
  ["database readiness", "/api/health/ready"],
  ["English sign-in page", "/en/sign-in"],
];

for (const [name, path] of checks) {
  const response = await fetch(new URL(path, baseUrl));
  if (!response.ok) {
    console.error(`${name} failed with HTTP ${response.status}`);
    process.exit(1);
  }
}

console.log(`Deployment smoke checks passed for ${baseUrl}`);
