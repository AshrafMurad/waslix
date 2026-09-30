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
import { Checkbox } from "@/components/ui/checkbox";
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
import commonCurrencies from "@/modules/workspace/data/common-currencies.json";
import {
  addWorkspaceCurrencyAction,
  updateLifecycleStageSettingsAction,
  updateWorkspaceCurrencyAction,
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
  const existingCurrencyCodes = new Set(
    settings.currencies.map((currency) => currency.code),
  );
  const availableCurrencies = commonCurrencies.filter(
    (currency) => !existingCurrencyCodes.has(currency.code),
  );

  return (
    <div className="waslix-page">
      <div className="space-y-1">
        <p className="waslix-eyebrow">{t("settings.eyebrow")}</p>
        <h1 className="waslix-page-title">{t("settings.title")}</h1>
        <p className="waslix-page-description">{t("settings.description")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.profile.title")}</CardTitle>
          <CardDescription>{t("settings.profile.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={updateWorkspaceSettingsAction}
            className="grid gap-4 md:grid-cols-2"
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
            <div className="md:col-span-2">
              <Button>{t("settings.profile.save")}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.currencies.title")}</CardTitle>
          <CardDescription>
            {t("settings.currencies.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form
            action={addWorkspaceCurrencyAction}
            className="bg-raised grid gap-4 rounded-md border p-4 md:grid-cols-[minmax(18rem,1fr)_auto_auto] md:items-end"
          >
            <input type="hidden" name="locale" value={locale} />
            <div className="space-y-2">
              <Label htmlFor="currency-code">
                {t("settings.currencies.choose")}
              </Label>
              <Select
                name="currencyCode"
                defaultValue={availableCurrencies[0]?.code}
                disabled={!availableCurrencies.length}
              >
                <SelectTrigger id="currency-code" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableCurrencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.code} · {currency.symbol} {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 pb-2">
              <Checkbox id="currency-default" name="isDefault" />
              <Label htmlFor="currency-default">
                {t("settings.currencies.default")}
              </Label>
            </div>
            <Button disabled={!availableCurrencies.length}>
              {t("settings.currencies.add")}
            </Button>
          </form>

          <Table className="min-w-[42rem]">
            <TableHeader>
              <TableRow>
                <TableHead>{t("settings.currencies.code")}</TableHead>
                <TableHead>{t("settings.currencies.name")}</TableHead>
                <TableHead>{t("settings.currencies.symbol")}</TableHead>
                <TableHead>{t("settings.currencies.decimals")}</TableHead>
                <TableHead>{t("settings.currencies.status")}</TableHead>
                <TableHead>{t("settings.currencies.default")}</TableHead>
                <TableHead>{t("settings.currencies.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settings.currencies.map((currency) => (
                <TableRow key={currency.id}>
                  <TableCell className="font-medium">{currency.code}</TableCell>
                  <TableCell>{currency.name}</TableCell>
                  <TableCell dir="auto">{currency.symbol}</TableCell>
                  <TableCell>{currency.decimalPlaces}</TableCell>
                  <TableCell>
                    <span
                      className={
                        currency.isActive
                          ? "text-healthy text-sm font-medium"
                          : "text-muted-foreground text-sm font-medium"
                      }
                    >
                      {currency.isActive
                        ? t("settings.currencies.active")
                        : t("settings.currencies.inactive")}
                    </span>
                  </TableCell>
                  <TableCell>
                    {currency.isDefault ? (
                      <span className="text-healthy text-sm font-medium">
                        {t("settings.currencies.currentDefault")}
                      </span>
                    ) : (
                      <form action={updateWorkspaceCurrencyAction}>
                        <input type="hidden" name="locale" value={locale} />
                        <input
                          type="hidden"
                          name="currencyId"
                          value={currency.id}
                        />
                        <input type="hidden" name="isActive" value="true" />
                        <input type="hidden" name="isDefault" value="on" />
                        <Button variant="outline" size="sm">
                          {t("settings.currencies.makeDefault")}
                        </Button>
                      </form>
                    )}
                  </TableCell>
                  <TableCell className="flex flex-wrap gap-2">
                    <form action={updateWorkspaceCurrencyAction}>
                      <input type="hidden" name="locale" value={locale} />
                      <input
                        type="hidden"
                        name="currencyId"
                        value={currency.id}
                      />
                      <input
                        type="hidden"
                        name="isActive"
                        value={currency.isActive ? "false" : "true"}
                      />
                      {currency.isDefault ? (
                        <input type="hidden" name="isDefault" value="on" />
                      ) : null}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currency.isDefault}
                      >
                        {currency.isActive
                          ? t("settings.currencies.deactivate")
                          : t("settings.currencies.activate")}
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
