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
      common: (await import(`../../messages/${locale}/common.json`)).default,
    },
  };
});
