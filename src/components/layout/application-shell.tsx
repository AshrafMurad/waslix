import { LayoutDashboard, Menu, Users } from "lucide-react";

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
    <nav aria-label={labels.navigation} className="flex flex-col gap-1">
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
    <div className="bg-background min-h-screen md:grid md:grid-cols-[15rem_1fr] xl:grid-cols-[16rem_1fr]">
      <a
        href="#workspace-content"
        className="bg-surface text-foreground fixed start-3 top-3 z-50 -translate-y-16 rounded-md border px-3 py-2 font-medium shadow-sm transition-transform focus-visible:translate-y-0 focus-visible:ring-2"
      >
        {labels.skipToContent}
      </a>
      <aside className="bg-surface sticky top-0 hidden h-screen border-e p-4 md:flex md:flex-col">
        <Link href="/overview" className="mb-5 flex items-center gap-3 px-2">
          <span className="bg-brand text-brand-foreground flex size-9 items-center justify-center rounded-md text-base font-semibold shadow-xs">
            W
          </span>
          <span className="text-lg font-semibold tracking-tight">Waslix</span>
        </Link>
        <div className="mt-5 flex-1 overflow-y-auto pe-1">
          <Navigation labels={labels} role={role} />
        </div>
      </aside>

      <div className="min-w-0">
        <header className="bg-background sticky top-0 z-20 flex h-16 items-center gap-2 border-b px-4 md:px-6">
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
                <span className="bg-brand text-brand-foreground flex size-9 items-center justify-center rounded-md text-base font-semibold shadow-xs">
                  W
                </span>
                <span className="text-lg font-semibold tracking-tight">
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
          <Link href="/overview" className="flex items-center gap-2 md:hidden">
            <span className="bg-brand text-brand-foreground flex size-8 items-center justify-center rounded-md font-semibold shadow-xs">
              W
            </span>
            <span className="font-semibold">Waslix</span>
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
          className="mx-auto w-full max-w-screen-2xl p-4 md:p-6 xl:p-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
