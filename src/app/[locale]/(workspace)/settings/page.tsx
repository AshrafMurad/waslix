import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
            <div className="space-y-2">
              <Label htmlFor="workspace-name">
                {t("settings.profile.name")}
              </Label>
              <Input
                id="workspace-name"
                name="name"
                defaultValue={settings.name}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workspace-timezone">
                {t("settings.profile.timezone")}
              </Label>
              <Input
                id="workspace-timezone"
                name="timezone"
                defaultValue={settings.timezone}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workspace-currency">
                {t("settings.profile.currency")}
              </Label>
              <Input
                id="workspace-currency"
                name="defaultCurrency"
                defaultValue={settings.defaultCurrency}
                required
                minLength={3}
                maxLength={3}
                className="uppercase"
              />
            </div>
            <div className="md:col-span-3">
              <Button>{t("settings.profile.save")}</Button>
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
        <CardContent>
          <Table className="min-w-[36rem]">
            <TableHeader>
              <TableRow>
                <TableHead>{t("settings.lifecycle.name")}</TableHead>
                <TableHead>{t("settings.lifecycle.key")}</TableHead>
                <TableHead>{t("settings.lifecycle.status")}</TableHead>
                <TableHead>{t("settings.lifecycle.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settings.lifecycleStages.map((stage) => (
                <TableRow key={stage.id}>
                  <TableCell colSpan={4}>
                    <form
                      action={updateLifecycleStageSettingsAction}
                      className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto] md:items-center"
                    >
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="stageId" value={stage.id} />
                      <Input
                        name="name"
                        defaultValue={stage.name}
                        required
                        className="font-medium"
                      />
                      <code className="py-2">{stage.key}</code>
                      <Select
                        name="isActive"
                        defaultValue={stage.isActive ? "true" : "false"}
                      >
                        <SelectTrigger className="w-full md:w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">
                            {t("settings.lifecycle.active")}
                          </SelectItem>
                          <SelectItem value="false">
                            {t("settings.lifecycle.inactive")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline">
                        {t("settings.lifecycle.save")}
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
