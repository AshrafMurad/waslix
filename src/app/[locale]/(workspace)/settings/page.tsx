import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Banknote, Building2, Workflow } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  updateWorkspaceCurrencyAction,
} from "@/modules/workspace/actions/team-settings-actions";
import {
  LifecycleStageSettingsForm,
  WorkspaceProfileForm,
} from "@/modules/workspace/components/settings-validation-forms";
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
      <div className="waslix-page-header">
        <div>
          <h1 className="waslix-page-title">{t("settings.title")}</h1>
          <p className="waslix-page-description">{t("settings.description")}</p>
        </div>
        <nav
          aria-label={t("settings.navigation.label")}
          className="bg-raised/60 flex w-full gap-1 overflow-x-auto rounded-md border p-1 sm:w-auto"
        >
          {(["profile", "currencies", "lifecycle"] as const).map((section) => (
            <a
              key={section}
              href={`#${section}`}
              className="hover:bg-background focus-visible:ring-ring shrink-0 rounded px-3 py-2 text-sm font-medium outline-none hover:shadow-xs focus-visible:ring-2"
            >
              {t(`settings.navigation.${section}`)}
            </a>
          ))}
        </nav>
      </div>

      <Card id="profile" className="scroll-mt-24">
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="bg-brand/10 text-brand-accent flex size-9 items-center justify-center rounded-md">
              <Building2 aria-hidden="true" className="size-4" />
            </span>
            <CardTitle>{t("settings.profile.title")}</CardTitle>
          </div>
          <CardDescription>{t("settings.profile.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <WorkspaceProfileForm
            locale={locale}
            name={settings.name}
            timezone={settings.timezone}
          />
        </CardContent>
      </Card>

      <Card id="currencies" className="scroll-mt-24">
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="bg-brand/10 text-brand-accent flex size-9 items-center justify-center rounded-md">
              <Banknote aria-hidden="true" className="size-4" />
            </span>
            <CardTitle>{t("settings.currencies.title")}</CardTitle>
          </div>
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

          <div className="overflow-x-auto">
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
                    <TableCell className="font-medium">
                      {currency.code}
                    </TableCell>
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
          </div>
        </CardContent>
      </Card>

      <Card id="lifecycle" className="scroll-mt-24">
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="bg-brand/10 text-brand-accent flex size-9 items-center justify-center rounded-md">
              <Workflow aria-hidden="true" className="size-4" />
            </span>
            <CardTitle>{t("settings.lifecycle.title")}</CardTitle>
          </div>
          <CardDescription>
            {t("settings.lifecycle.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
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
                      <LifecycleStageSettingsForm
                        locale={locale}
                        stage={stage}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
