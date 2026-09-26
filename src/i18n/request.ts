import { getRequestConfig } from "next-intl/server";

import { defaultLocale, isLocale } from "./config";

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale;
  const locale =
    requestedLocale && isLocale(requestedLocale)
      ? requestedLocale
      : defaultLocale;

  return {
    locale,
    messages: {
      auth: (await import(`../../messages/${locale}/auth.json`)).default,
      common: (await import(`../../messages/${locale}/common.json`)).default,
      customers: (await import(`../../messages/${locale}/customers.json`))
        .default,
      goals: (await import(`../../messages/${locale}/goals.json`)).default,
      health: (await import(`../../messages/${locale}/health.json`)).default,
      risks: (await import(`../../messages/${locale}/risks.json`)).default,
      onboarding: (await import(`../../messages/${locale}/onboarding.json`))
        .default,
      renewals: (await import(`../../messages/${locale}/renewals.json`))
        .default,
      recommendations: (
        await import(`../../messages/${locale}/recommendations.json`)
      ).default,
      attention: (await import(`../../messages/${locale}/attention.json`))
        .default,
      tasks: (await import(`../../messages/${locale}/tasks.json`)).default,
      timeline: (await import(`../../messages/${locale}/timeline.json`))
        .default,
      shell: (await import(`../../messages/${locale}/shell.json`)).default,
    },
  };
});
