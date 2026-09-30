import { LayoutDashboard, Menu } from "lucide-react";

import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import type { WorkspaceRole } from "@/lib/permissions/roles";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "@/modules/search/components/global-search";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { AccountMenu } from "./account-menu";
import { LocaleSwitcher } from "./locale-switcher";
import { NavigationLink, type NavigationIconKey } from "./navigation-link";
import { ThemeToggle } from "./theme-toggle";

type ShellLabels = {
  navigation: string;
  skipToContent: string;
  unavailable: string;
  menu: string;
  account: string;
  role: string;
  search: {
    trigger: string;
    title: string;
    placeholder: string;
    empty: string;
    loading: string;
    customer: string;
    contact: string;
    task: string;
  };
  nav: {
    overview: string;
    customers: string;
    tasks: string;
    risks: string;
    renewals: string;
    analytics: string;
    team: string;
    settings: string;
  };
};

type ApplicationShellProps = {
  children: React.ReactNode;
  locale: Locale;
  labels: ShellLabels;
  roleLabel: string;
  role: WorkspaceRole;
  user: { name: string; email: string };
};

const primaryNavigation: Array<{
  key: keyof ShellLabels["nav"];
  icon: NavigationIconKey;
  href?:
    | "/overview"
    | "/customers"
    | "/tasks"
    | "/risks"
    | "/renewals"
    | "/analytics";
}> = [
  {
    key: "overview",
    href: "/overview",
    icon: "overview",
  },
  { key: "customers", href: "/customers", icon: "customers" },
  { key: "tasks", href: "/tasks", icon: "tasks" },
  { key: "risks", href: "/risks", icon: "risks" },
  { key: "renewals", href: "/renewals", icon: "renewals" },
  { key: "analytics", href: "/analytics", icon: "analytics" },
] as const;

const secondaryNavigation: Array<{
  key: "team" | "settings";
  icon: NavigationIconKey;
  href: "/settings/team" | "/settings";
  roles: WorkspaceRole[];
}> = [
  {
    key: "team",
    href: "/settings/team",
    icon: "team",
    roles: ["ADMIN", "CS_MANAGER"],
  },
  { key: "settings", href: "/settings", icon: "settings", roles: ["ADMIN"] },
] as const;

function Navigation({
  labels,
  role,
  closeOnNavigate = false,
}: {
  labels: ShellLabels;
  role: WorkspaceRole;
  closeOnNavigate?: boolean;
}) {
  return (
    <nav aria-label={labels.navigation} className="flex flex-col gap-1.5">
      {primaryNavigation.map((item) => {
        if (item.href) {
          return (
            <NavigationLink
              key={item.key}
              href={item.href}
              label={labels.nav[item.key]}
              icon={item.icon}
              closeOnNavigate={closeOnNavigate}
            />
          );
        }

        return (
          <span
            key={item.key}
            aria-disabled="true"
            title={labels.unavailable}
            className="text-muted-foreground flex min-h-10 items-center gap-3 rounded-md border border-transparent px-3 opacity-60"
          >
            <LayoutDashboard aria-hidden="true" className="size-4" />
            <span>{labels.nav[item.key]}</span>
          </span>
        );
      })}
      <div className="my-3 border-t" />
      {secondaryNavigation.map((item) => {
        if (!item.roles.includes(role)) return null;
        return (
          <NavigationLink
            key={item.key}
            href={item.href}
            label={labels.nav[item.key]}
            icon={item.icon}
            closeOnNavigate={closeOnNavigate}
          />
        );
      })}
    </nav>
  );
}

export function ApplicationShell({
  children,
  labels,
  locale,
  role,
  roleLabel,
  user,
}: ApplicationShellProps) {
  const userInitial =
    user.name.trim().charAt(0).toLocaleUpperCase(locale) || "W";

  return (
    <div className="waslix-app-shell bg-background min-h-screen md:grid md:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,1fr)]">
      <a
        href="#workspace-content"
        className="bg-surface text-foreground fixed start-3 top-3 z-50 -translate-y-16 rounded-md border px-3 py-2 font-medium shadow-sm transition-transform focus-visible:translate-y-0 focus-visible:ring-2"
      >
        {labels.skipToContent}
      </a>
      <aside className="waslix-sidebar bg-surface/95 sticky top-0 hidden h-screen border-e p-4 shadow-[12px_0_40px_-34px_rgb(15_23_42_/_0.75)] md:flex md:flex-col dark:shadow-[14px_0_52px_-36px_rgb(0_0_0_/_0.95)]">
        <Link
          href="/overview"
          className="waslix-brand-link mb-4 flex items-center gap-3 px-2 py-1"
        >
          <span className="waslix-brand-mark bg-brand text-brand-foreground flex size-10 items-center justify-center rounded-md text-lg font-black tracking-[-0.08em] shadow-[0_16px_32px_-22px_rgb(15_118_110_/_0.9)]">
            W
          </span>
          <span className="text-xl font-black tracking-[-0.05em]">Waslix</span>
        </Link>
        <div className="mt-4 flex-1 overflow-y-auto pe-1">
          <Navigation labels={labels} role={role} />
        </div>
      </aside>

      <div className="min-w-0">
        <header className="waslix-topbar bg-background/92 sticky top-0 z-20 flex h-16 items-center gap-2 border-b px-4 shadow-[0_18px_42px_-38px_rgb(15_23_42_/_0.65)] md:px-6 dark:shadow-[0_18px_42px_-36px_rgb(0_0_0_/_0.9)]">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon-lg"
                aria-label={labels.menu}
                className="md:hidden"
              >
                <Menu aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side={locale === "ar" ? "right" : "left"}
              className="w-80 max-w-[calc(100vw-3rem)] gap-0 p-0 sm:max-w-80"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>{labels.menu}</SheetTitle>
                <SheetDescription>{labels.navigation}</SheetDescription>
              </SheetHeader>
              <div className="flex min-h-16 items-center gap-3 border-b px-4 pe-12">
                <span className="waslix-brand-mark bg-brand text-brand-foreground flex size-10 items-center justify-center rounded-md text-lg font-black tracking-[-0.08em] shadow-[0_16px_32px_-22px_rgb(15_118_110_/_0.9)]">
                  W
                </span>
                <span className="text-xl font-black tracking-[-0.05em]">
                  Waslix
                </span>
              </div>
              <div className="p-3">
                <Navigation labels={labels} role={role} closeOnNavigate />
              </div>
              <div className="mt-auto flex items-center justify-between gap-2 border-t p-4">
                <div className="flex items-center gap-1">
                  <LocaleSwitcher />
                  <ThemeToggle />
                </div>
                <AccountMenu
                  accountLabel={labels.account}
                  roleLabel={labels.role}
                  roleValue={roleLabel}
                  user={user}
                  userInitial={userInitial}
                />
              </div>
            </SheetContent>
          </Sheet>
          <Link
            href="/overview"
            className="waslix-brand-link flex items-center gap-2 md:hidden"
          >
            <span className="waslix-brand-mark bg-brand text-brand-foreground flex size-8 items-center justify-center rounded-md font-black tracking-[-0.08em] shadow-[0_12px_24px_-18px_rgb(15_118_110_/_0.9)]">
              W
            </span>
            <span className="font-black tracking-[-0.04em]">Waslix</span>
          </Link>
          <div className="ms-auto md:ms-4 md:w-80 lg:w-96">
            <GlobalSearch
              labels={labels.search}
              className="size-10 min-w-0 justify-center px-0 md:h-10 md:w-full md:min-w-64 md:justify-start md:px-4"
            />
          </div>
          <div className="ms-auto hidden items-center gap-1 md:flex">
            <LocaleSwitcher />
            <ThemeToggle />
            <AccountMenu
              accountLabel={labels.account}
              roleLabel={labels.role}
              roleValue={roleLabel}
              user={user}
              userInitial={userInitial}
            />
          </div>
        </header>
        <main
          id="workspace-content"
          tabIndex={-1}
          className="waslix-content mx-auto w-full max-w-screen-2xl px-4 py-5 sm:px-5 md:px-6 md:py-7 xl:px-8 xl:py-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
