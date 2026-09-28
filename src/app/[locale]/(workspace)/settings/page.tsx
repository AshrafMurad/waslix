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
import { hasWorkspaceCapability } from "@/lib/permissions/roles";
import {
  updateLifecycleStageSettingsAction,
  updateWorkspaceSettingsAction,
} from "@/modules/workspace/actions/team-settings-actions";
import { getWorkspaceSettings } from "@/modules/workspace/queries/get-workspace-settings";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const access = await requireProtectedPage(locale);
  if (!hasWorkspaceCapability(access.role, "manageWorkspaceMembership")) {
    notFound();
  }

  const [settings, t] = await Promise.all([
    getWorkspaceSettings(access),
    getTranslations({ locale, namespace: "workspace" }),
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-brand-accent text-xs font-medium tracking-wide uppercase">
          {t("settings.eyebrow")}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("settings.title")}
        </h1>
        <p className="text-muted-foreground max-w-3xl">
          {t("settings.description")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.profile.title")}</CardTitle>
          <CardDescription>{t("settings.profile.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={updateWorkspaceSettingsAction}
            className="grid gap-4 md:grid-cols-3"
          >
            <input type="hidden" name="locale" value={locale} />
            <label className="space-y-2 text-sm font-medium">
              <span>{t("settings.profile.name")}</span>
              <input
                name="name"
                defaultValue={settings.name}
                required
                className="border-input bg-background w-full rounded-md border px-3 py-2"
              />
            </label>
            <label className="space-y-2 text-sm font-medium">
              <span>{t("settings.profile.timezone")}</span>
              <input
                name="timezone"
                defaultValue={settings.timezone}
                required
                className="border-input bg-background w-full rounded-md border px-3 py-2"
              />
            </label>
            <label className="space-y-2 text-sm font-medium">
              <span>{t("settings.profile.currency")}</span>
              <input
                name="defaultCurrency"
                defaultValue={settings.defaultCurrency}
                required
                minLength={3}
                maxLength={3}
                className="border-input bg-background w-full rounded-md border px-3 py-2 uppercase"
              />
            </label>
            <div className="md:col-span-3">
              <button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium">
                {t("settings.profile.save")}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.lifecycle.title")}</CardTitle>
          <CardDescription>
            {t("settings.lifecycle.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-sm">
            <thead className="text-muted-foreground border-b text-start">
              <tr>
                <th className="py-2 text-start">
                  {t("settings.lifecycle.name")}
                </th>
                <th className="py-2 text-start">
                  {t("settings.lifecycle.key")}
                </th>
                <th className="py-2 text-start">
                  {t("settings.lifecycle.status")}
                </th>
                <th className="py-2 text-start">
                  {t("settings.lifecycle.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {settings.lifecycleStages.map((stage) => (
                <tr key={stage.id} className="border-b last:border-0">
                  <td className="py-3" colSpan={4}>
                    <form
                      action={updateLifecycleStageSettingsAction}
                      className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto] md:items-center"
                    >
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="stageId" value={stage.id} />
                      <input
                        name="name"
                        defaultValue={stage.name}
                        required
                        className="border-input bg-background rounded-md border px-3 py-2 font-medium"
                      />
                      <code className="py-2">{stage.key}</code>
                      <select
                        name="isActive"
                        defaultValue={stage.isActive ? "true" : "false"}
                        className="border-input bg-background rounded-md border px-3 py-2"
                      >
                        <option value="true">
                          {t("settings.lifecycle.active")}
                        </option>
                        <option value="false">
                          {t("settings.lifecycle.inactive")}
                        </option>
                      </select>
                      <button className="border-input hover:bg-accent rounded-md border px-3 py-2 text-sm font-medium">
                        {t("settings.lifecycle.save")}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
