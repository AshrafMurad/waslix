import "server-only";

import type { Locale } from "@/i18n/config";
import { toPreferredLocale } from "@/i18n/preferred-locale";
import type { WorkspaceAccessContext } from "@/lib/auth/access-context";
import { prisma } from "@/lib/db/prisma";

export function updatePreferredLocale(
  access: WorkspaceAccessContext,
  locale: Locale,
) {
  return prisma.user.update({
    where: { id: access.userId },
    data: { preferredLocale: toPreferredLocale(locale) },
    select: { id: true, preferredLocale: true },
  });
}
