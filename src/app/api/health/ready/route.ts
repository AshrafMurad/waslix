import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json(
      { ok: true, checks: { database: "ready" } },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { ok: false, checks: { database: "unavailable" } },
      { headers: { "Cache-Control": "no-store" }, status: 503 },
    );
  }
}
