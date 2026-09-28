import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { ApplicationShell } from "@/components/layout/application-shell";
import { isLocale } from "@/i18n/config";
import { requireProtectedPage } from "@/lib/auth/require-protected-page";
import { getApplicationShell } from "@/modules/workspace/queries/get-application-shell";

export default async function WorkspaceLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  setRequestLocale(locale);
  const access = await requireProtectedPage(locale);
  const [shell, t] = await Promise.all([
    getApplicationShell(access),
    getTranslations({ locale, namespace: "shell" }),
  ]);

  return (
    <ApplicationShell
      locale={locale}
      workspace={shell.workspace}
      workspaces={shell.workspaces}
      user={shell.user}
      role={access.role}
      roleLabel={t(`roles.${access.role}`)}
      labels={{
        navigation: t("navigation.label"),
        skipToContent: t("navigation.skipToContent"),
        unavailable: t("navigation.unavailable"),
        menu: t("controls.menu"),
        account: t("account.label"),
        role: t("account.role"),
        search: {
          trigger: t("search.trigger"),
          title: t("search.title"),
          placeholder: t("search.placeholder"),
          empty: t("search.empty"),
          loading: t("search.loading"),
          customer: t("search.customer"),
          contact: t("search.contact"),
          task: t("search.task"),
        },
        nav: {
          overview: t("navigation.overview"),
          customers: t("navigation.customers"),
          tasks: t("navigation.tasks"),
          risks: t("navigation.risks"),
          renewals: t("navigation.renewals"),
          analytics: t("navigation.analytics"),
          team: t("navigation.team"),
          settings: t("navigation.settings"),
        },
      }}
    >
      {children}
    </ApplicationShell>
  );
}
