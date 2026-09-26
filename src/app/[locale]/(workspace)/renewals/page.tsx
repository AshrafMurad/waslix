import {
  getFormatter,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isLocale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireProtectedPage } from "@/lib/auth/require-protected-page";
import { getRenewalPortfolio } from "@/modules/renewals/queries/get-renewals";

export default async function RenewalsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const access = await requireProtectedPage(locale);
  const [portfolio, t, format] = await Promise.all([
    getRenewalPortfolio(access),
    getTranslations({ locale, namespace: "renewals" }),
    getFormatter({ locale }),
  ]);
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-brand-accent text-xs font-medium tracking-wide uppercase">
          {t("portfolio.eyebrow")}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("portfolio.title")}
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm leading-6">
          {t("portfolio.description")}
        </p>
      </div>
      <Card className="gap-0 overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-raised hover:bg-raised">
              <TableHead className="px-4">{t("columns.customer")}</TableHead>
              <TableHead className="px-4">{t("columns.date")}</TableHead>
              <TableHead className="hidden px-4 md:table-cell">
                {t("columns.stage")}
              </TableHead>
              <TableHead className="hidden px-4 lg:table-cell">
                {t("columns.readiness")}
              </TableHead>
              <TableHead className="hidden px-4 lg:table-cell">
                {t("columns.value")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {portfolio.renewals.length ? (
              portfolio.renewals.map((renewal) => (
                <TableRow key={renewal.id}>
                  <TableCell className="px-4 py-3">
                    <Link
                      href={`/customers/${renewal.customer.id}/renewal`}
                      className="font-medium hover:underline"
                    >
                      <bdi>{renewal.customer.name}</bdi>
                    </Link>
                    <p className="text-muted-foreground mt-1 text-xs">
                      <bdi>{renewal.owner.user.name}</bdi>
                    </p>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {format.dateTime(renewal.renewalAt, {
                      dateStyle: "medium",
                    })}
                  </TableCell>
                  <TableCell className="hidden px-4 py-3 md:table-cell">
                    {t(`stage.${renewal.stage}`)}
                  </TableCell>
                  <TableCell className="hidden px-4 py-3 lg:table-cell">
                    {renewal.readinessStatus
                      ? t(`readiness.${renewal.readinessStatus}`)
                      : t("readiness.notAssessed")}
                  </TableCell>
                  <TableCell className="hidden px-4 py-3 lg:table-cell">
                    {format.number(Number(renewal.contractValue), {
                      style: "currency",
                      currency: renewal.currency,
                      currencyDisplay: "code",
                    })}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground p-6">
                  {t("portfolio.empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
