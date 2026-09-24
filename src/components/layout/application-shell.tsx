import {
  BarChart3,
  CheckSquare2,
  ChevronDown,
  CircleAlert,
  LayoutDashboard,
  Menu,
  RefreshCw,
  Settings,
  Users,
  UsersRound,
} from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/config";
import { SignOutButton } from "@/modules/auth/components/sign-out-button";

import { LocaleSwitcher } from "./locale-switcher";
import { ThemeToggle } from "./theme-toggle";
import { WorkspaceSwitcher } from "./workspace-switcher";

type ShellLabels = {
  navigation: string;
  unavailable: string;
  menu: string;
  account: string;
  role: string;
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
  workspace: { id: string; name: string };
  workspaces: Array<{ id: string; name: string }>;
  user: { name: string; email: string };
};

const primaryNavigation: Array<{
  key: keyof ShellLabels["nav"];
  icon: typeof LayoutDashboard;
  href?: "/overview" | "/customers" | "/tasks";
}> = [
  {
    key: "overview",
    href: "/overview",
    icon: LayoutDashboard,
  },
  { key: "customers", href: "/customers", icon: UsersRound },
  { key: "tasks", href: "/tasks", icon: CheckSquare2 },
  { key: "risks", icon: CircleAlert },
  { key: "renewals", icon: RefreshCw },
  { key: "analytics", icon: BarChart3 },
] as const;

const secondaryNavigation = [
  { key: "team", icon: Users },
  { key: "settings", icon: Settings },
] as const;

function Navigation({ labels }: { labels: ShellLabels }) {
  return (
    <nav aria-label={labels.navigation} className="flex flex-col gap-1">
      {primaryNavigation.map((item) => {
        const Icon = item.icon;
        if (item.href) {
          return (
            <Link
              key={item.key}
              href={item.href}
              className="hover:bg-raised flex min-h-10 items-center gap-3 rounded-md px-3 font-medium"
            >
              <Icon aria-hidden="true" className="size-4" />
              <span>{labels.nav[item.key]}</span>
            </Link>
          );
        }

        return (
          <span
            key={item.key}
            aria-disabled="true"
            title={labels.unavailable}
            className="text-muted-foreground flex min-h-10 items-center gap-3 rounded-md px-3 opacity-60"
          >
            <Icon aria-hidden="true" className="size-4" />
            <span>{labels.nav[item.key]}</span>
          </span>
        );
      })}
      <div className="my-3 border-t" />
      {secondaryNavigation.map((item) => {
        const Icon = item.icon;
        return (
          <span
            key={item.key}
            aria-disabled="true"
            title={labels.unavailable}
            className="text-muted-foreground flex min-h-10 items-center gap-3 rounded-md px-3 opacity-60"
          >
            <Icon aria-hidden="true" className="size-4" />
            <span>{labels.nav[item.key]}</span>
          </span>
        );
      })}
    </nav>
  );
}

export function ApplicationShell({
  children,
  labels,
  locale,
  roleLabel,
  user,
  workspace,
  workspaces,
}: ApplicationShellProps) {
  const userInitial =
    user.name.trim().charAt(0).toLocaleUpperCase(locale) || "W";

  return (
    <div className="bg-background min-h-screen md:grid md:grid-cols-[16rem_1fr]">
      <aside className="bg-surface sticky top-0 hidden h-screen border-e p-4 md:flex md:flex-col">
        <Link href="/overview" className="mb-6 flex items-center gap-3 px-2">
          <span className="bg-brand text-brand-foreground flex size-9 items-center justify-center rounded-md text-base font-semibold">
            W
          </span>
          <span className="text-lg font-semibold tracking-tight">Waslix</span>
        </Link>
        <WorkspaceSwitcher
          activeWorkspaceId={workspace.id}
          workspaces={workspaces}
        />
        <div className="mt-6 flex-1 overflow-y-auto">
          <Navigation labels={labels} />
        </div>
      </aside>

      <div className="min-w-0">
        <header className="bg-background/95 sticky top-0 z-20 flex h-16 items-center gap-2 border-b px-4 md:px-6">
          <details className="group md:hidden">
            <summary
              aria-label={labels.menu}
              className="hover:bg-raised flex size-10 list-none items-center justify-center rounded-md [&::-webkit-details-marker]:hidden"
            >
              <Menu aria-hidden="true" className="size-5" />
            </summary>
            <div className="bg-surface absolute inset-x-0 top-16 border-b p-4 shadow-lg">
              <WorkspaceSwitcher
                activeWorkspaceId={workspace.id}
                workspaces={workspaces}
              />
              <div className="mt-4">
                <Navigation labels={labels} />
              </div>
            </div>
          </details>
          <Link href="/overview" className="flex items-center gap-2 md:hidden">
            <span className="bg-brand text-brand-foreground flex size-8 items-center justify-center rounded-md font-semibold">
              W
            </span>
            <span className="font-semibold">Waslix</span>
          </Link>
          <div className="ms-auto flex items-center gap-1">
            <LocaleSwitcher />
            <ThemeToggle />
            <details className="group relative">
              <summary className="hover:bg-raised flex min-h-10 list-none items-center gap-2 rounded-md p-1 pe-2 [&::-webkit-details-marker]:hidden">
                <span className="bg-brand text-brand-foreground flex size-8 items-center justify-center rounded-full text-sm font-semibold">
                  {userInitial}
                </span>
                <span
                  className="hidden max-w-32 truncate text-sm font-medium lg:block"
                  dir="auto"
                >
                  {user.name}
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className="text-muted-foreground hidden size-4 lg:block"
                />
              </summary>
              <div className="bg-popover absolute end-0 z-30 mt-2 w-64 rounded-md border p-2 shadow-lg">
                <p className="text-muted-foreground px-2 pt-1 text-xs font-medium">
                  {labels.account}
                </p>
                <div className="border-b px-2 py-3">
                  <p className="truncate font-medium" dir="auto">
                    {user.name}
                  </p>
                  <p
                    className="text-muted-foreground truncate text-xs"
                    dir="ltr"
                  >
                    {user.email}
                  </p>
                  <p className="text-muted-foreground mt-2 text-xs">
                    {labels.role}: {roleLabel}
                  </p>
                </div>
                <SignOutButton />
              </div>
            </details>
          </div>
        </header>
        <main className="mx-auto w-full max-w-screen-2xl p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
