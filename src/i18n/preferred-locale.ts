import type { PreferredLocale } from "@prisma/client";

import type { Locale } from "./config";

const localeByPreference = {
  EN: "en",
  AR: "ar",
} as const satisfies Record<PreferredLocale, Locale>;

const preferenceByLocale = {
  en: "EN",
  ar: "AR",
} as const satisfies Record<Locale, PreferredLocale>;

export function toAppLocale(preferredLocale: PreferredLocale): Locale {
  return localeByPreference[preferredLocale];
}

export function toPreferredLocale(locale: Locale): PreferredLocale {
  return preferenceByLocale[locale];
}
