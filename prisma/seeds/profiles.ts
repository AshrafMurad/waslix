import { calculateHealth } from "../../src/modules/health/engine/calculate-health";
import { customerNames, scenarioLabels } from "./data/customer-names";
import { addDays, createRandom, dateOnly, shuffled, slugify } from "./helpers";

const industries = [
  "B2B SaaS",
  "FinTech",
  "HealthTech",
  "EdTech",
  "Logistics",
  "E-commerce",
  "PropTech",
  "Construction",
  "Manufacturing",
  "Marketing",
  "Professional Services",
  "Cybersecurity",
  "HR Tech",
  "Retail",
  "Hospitality",
  "Travel",
  "Legal Tech",
  "Accounting",
  "Telecom",
  "Media",
  "Insurance",
  "Fleet Management",
  "AI Products",
  "Developer Tools",
] as const;

const currencies = ["SAR", "USD", "USD", "EUR", "GBP", "AED"] as const;

export type CustomerProfile = ReturnType<typeof buildCustomerProfiles>[number];

export function buildCustomerProfiles(now: Date, seed: string) {
  const random = createRandom(seed);
  const scenarioLifecycleKeys = [
    "active",
    "renewal",
    "active",
    "onboarding",
    "onboarding",
    "active",
    "adoption",
    "active",
    "active",
    "active",
    "churned",
    "active",
    "active",
    "active",
    "new",
  ];
  const lifecycleKeys = shuffled(
    [
      ...Array(7).fill("new"),
      ...Array(16).fill("onboarding"),
      ...Array(15).fill("adoption"),
      ...Array(43).fill("active"),
      ...Array(19).fill("renewal"),
      ...Array(5).fill("churned"),
    ] as string[],
    random,
  );
  lifecycleKeys.unshift(...scenarioLifecycleKeys);
  const scenarioScores = [
    98, 35, 93, 72, 55, 48, 76, 58, 88, 86, 30, 64, 82, 91, 67,
  ];
  const healthScores = shuffled(
    [
      ...Array.from({ length: 18 }, (_, index) => 90 + (index % 11)),
      ...Array.from({ length: 26 }, (_, index) => 80 + (index % 10)),
      ...Array.from({ length: 23 }, (_, index) => 70 + (index % 10)),
      ...Array.from({ length: 18 }, (_, index) => 60 + (index % 10)),
      ...Array.from({ length: 12 }, (_, index) => 40 + (index % 20)),
      ...Array.from({ length: 8 }, (_, index) => 18 + index * 2),
    ],
    random,
  );
  healthScores.unshift(...scenarioScores);
  const scenarioSegments = [
    "MID_MARKET",
    "STRATEGIC",
    "STRATEGIC",
    "STARTUP",
    "SMB",
    "SMB",
    "MID_MARKET",
    "MID_MARKET",
    "SMB",
    "MID_MARKET",
    "SMB",
    "MID_MARKET",
    "STARTUP",
    "STRATEGIC",
    "STARTUP",
  ] as const;
  const segments = shuffled(
    [
      ...Array(21).fill("STARTUP"),
      ...Array(44).fill("SMB"),
      ...Array(31).fill("MID_MARKET"),
      ...Array(9).fill("STRATEGIC"),
    ] as Array<(typeof scenarioSegments)[number]>,
    random,
  );
  segments.unshift(...scenarioSegments);

  return customerNames.map((name, index) => {
    const segment = segments[index];
    const sizeBase = { STARTUP: 12, SMB: 65, MID_MARKET: 420, STRATEGIC: 1800 }[
      segment
    ];
    const valueBase = {
      STARTUP: 4800,
      SMB: 24000,
      MID_MARKET: 78000,
      STRATEGIC: 240000,
    }[segment];
    const ageDays = index < 8 ? 5 + index * 3 : 60 + ((index * 37) % 900);
    const score = healthScores[index];
    const scoreTrend =
      index === 6 ? 19 : index === 7 ? -16 : ((index % 7) - 3) * 2;
    const slug = slugify(name);
    return {
      index,
      externalKey: `waslix-demo-${String(index + 1).padStart(3, "0")}`,
      name,
      slug,
      scenario: scenarioLabels[index] ?? null,
      industry: industries[index % industries.length],
      segment,
      companySize: sizeBase + ((index * 29) % Math.max(20, sizeBase)),
      contractValue: valueBase + ((index * 1739) % valueBase),
      currency: currencies[index % currencies.length],
      customerSince: dateOnly(addDays(now, -ageDays)),
      lifecycleKey: lifecycleKeys[index],
      score,
      scoreTrend,
      website: index === 14 ? null : `https://${slug}.example.com`,
      contactCount:
        index === 14
          ? 1
          : index === 13
            ? 8
            : segment === "STARTUP"
              ? 1 + (index % 2)
              : segment === "SMB"
                ? 2 + (index % 3)
                : segment === "MID_MARKET"
                  ? 3 + (index % 3)
                  : 5 + (index % 4),
      activityCount:
        index === 5 || index === 14 ? 0 : index < 15 ? 12 : 2 + (index % 7),
      taskCount:
        index === 12 || index === 14 ? 0 : index === 11 ? 10 : index % 6,
      hasRisk: score < 70 || index % 7 === 0,
      health: healthForScore(score, now, `profile:${index}`),
    };
  });
}

function healthForScore(score: number, now: Date, sourceId: string) {
  const candidate = [
    { dimension: "USAGE" as const, score: score - 4 },
    { dimension: "ENGAGEMENT" as const, score: score + 4 },
    { dimension: "SUPPORT" as const, score: score + 2 },
    { dimension: "GOALS" as const, score },
  ];
  const scores = candidate.every((item) => item.score >= 0 && item.score <= 100)
    ? candidate
    : candidate.map((item) => ({ ...item, score }));
  return calculateHealth(
    scores.map((item) => ({
      ...item,
      observedAt: addDays(now, -(Number(sourceId.split(":")[1]) % 5)),
      source:
        item.dimension === "ENGAGEMENT" || item.dimension === "GOALS"
          ? "SYSTEM"
          : "MANUAL",
      sourceId: `${sourceId}:${item.dimension.toLowerCase()}`,
      isSimulated: true,
    })),
    now,
  );
}
