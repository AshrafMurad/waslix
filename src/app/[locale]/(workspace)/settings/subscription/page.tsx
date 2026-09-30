import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isLocale } from "@/i18n/config";
import { requireProtectedPage } from "@/lib/auth/require-protected-page";
import { getWorkspaceSubscription } from "@/modules/workspace/queries/get-workspace-subscription";

export default async function SubscriptionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const access = await requireProtectedPage(locale);
  const [state, t] = await Promise.all([
    getWorkspaceSubscription(access),
    getTranslations({ locale, namespace: "workspace" }),
  ]);
  const subscription = state.subscription;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-brand-accent text-xs font-medium tracking-wide uppercase">
          {t("subscription.eyebrow")}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("subscription.title")}
        </h1>
        <p className="text-muted-foreground max-w-3xl">
          {t("subscription.description")}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("subscription.current")}</CardTitle>
          <CardDescription>{t("subscription.comingLater")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="bg-raised rounded-md border p-4">
            <p className="text-muted-foreground text-sm">
              {t("subscription.plan")}
            </p>
            <p className="text-xl font-semibold">
              {subscription
                ? t(`plans.${subscription.plan}`)
                : t("subscription.none")}
            </p>
          </div>
          <div className="bg-raised rounded-md border p-4">
            <p className="text-muted-foreground text-sm">
              {t("subscription.status")}
            </p>
            <p className="text-xl font-semibold">
              {subscription
                ? t(`subscriptionStatus.${subscription.status}`)
                : t("subscription.none")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
