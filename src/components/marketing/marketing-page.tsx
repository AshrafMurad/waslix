import { AccountDeepDive } from "./account-deep-dive";
import { CollaborationRenewals } from "./collaboration-renewals";
import { DataFragmentation } from "./data-fragmentation";
import { FinalCtaFooter } from "./final-cta-footer";
import { HealthExplainer } from "./health-explainer";
import { Hero } from "./hero";
import { Integrations } from "./integrations";
import { IntelligenceDemo } from "./intelligence-demo";
import { Lifecycle } from "./lifecycle";
import { MarketingNavigation } from "./marketing-navigation";
import { SignalHealthAction } from "./signal-health-action";

type MarketingPageProps = { locale: "en" | "ar" };

export function MarketingPage({ locale }: MarketingPageProps) {
  return (
    <main className="marketing-shell">
      <MarketingNavigation locale={locale} />
      <Hero locale={locale} />
      <DataFragmentation locale={locale} />
      <SignalHealthAction locale={locale} />
      <HealthExplainer />
      <AccountDeepDive locale={locale} />
      <Lifecycle locale={locale} />
      <CollaborationRenewals locale={locale} />
      <IntelligenceDemo />
      <Integrations locale={locale} />
      <FinalCtaFooter locale={locale} />
    </main>
  );
}
