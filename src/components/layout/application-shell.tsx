import {
  BarChart3,
  CheckSquare2,
  CircleAlert,
  LayoutDashboard,
  Menu,
  RefreshCw,
  Settings,
  Users,
  UsersRound,
} from "lucide-react";

import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import type { WorkspaceRole } from "@/lib/permissions/roles";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "@/modules/search/components/global-search";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { AccountMenu } from "./account-menu";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeToggle } from "./theme-toggle";
import { WorkspaceSwitcher } from "./workspace-switcher";

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
  workspace: { id: string; name: string };
  workspaces: Array<{ id: string; name: string }>;
  user: { name: string; email: string };
};

const primaryNavigation: Array<{
  key: keyof ShellLabels["nav"];
  icon: typeof LayoutDashboard;
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
    icon: LayoutDashboard,
  },
  { key: "customers", href: "/customers", icon: UsersRound },
  { key: "tasks", href: "/tasks", icon: CheckSquare2 },
  { key: "risks", href: "/risks", icon: CircleAlert },
  { key: "renewals", href: "/renewals", icon: RefreshCw },
  { key: "analytics", href: "/analytics", icon: BarChart3 },
] as const;

const secondaryNavigation: Array<{
  key: "team" | "settings";
  icon: typeof Users;
  href: "/settings/team" | "/settings";
  roles: WorkspaceRole[];
}> = [
  {
    key: "team",
    href: "/settings/team",
    icon: Users,
    roles: ["ADMIN", "CS_MANAGER"],
  },
  { key: "settings", href: "/settings", icon: Settings, roles: ["ADMIN"] },
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
        const Icon = item.icon;
        if (item.href) {
          const link = (
            <Link
              key={item.key}
              href={item.href}
              className="text-muted-foreground hover:bg-raised hover:text-foreground focus-visible:bg-raised flex min-h-10 items-center gap-3 rounded-md border border-transparent px-3 font-medium transition-colors"
            >
              <Icon aria-hidden="true" className="size-4" />
              <span>{labels.nav[item.key]}</span>
            </Link>
          );
          return closeOnNavigate ? (
            <SheetClose key={item.key} asChild>
              {link}
            </SheetClose>
          ) : (
            link
          );
        }

        return (
          <span
            key={item.key}
            aria-disabled="true"
            title={labels.unavailable}
            className="text-muted-foreground flex min-h-10 items-center gap-3 rounded-md border border-transparent px-3 opacity-60"
          >
            <Icon aria-hidden="true" className="size-4" />
            <span>{labels.nav[item.key]}</span>
          </span>
        );
      })}
      <div className="my-3 border-t" />
      {secondaryNavigation.map((item) => {
        const Icon = item.icon;
        if (!item.roles.includes(role)) return null;
        const link = (
          <Link
            key={item.key}
            href={item.href}
            className="text-muted-foreground hover:bg-raised hover:text-foreground focus-visible:bg-raised flex min-h-10 items-center gap-3 rounded-md border border-transparent px-3 font-medium transition-colors"
          >
            <Icon aria-hidden="true" className="size-4" />
            <span>{labels.nav[item.key]}</span>
          </Link>
        );
        return closeOnNavigate ? (
          <SheetClose key={item.key} asChild>
            {link}
          </SheetClose>
        ) : (
          link
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
  workspace,
  workspaces,
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
        <WorkspaceSwitcher
          activeWorkspaceId={workspace.id}
          workspaces={workspaces}
        />
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
            <SheetContent side={locale === "ar" ? "right" : "left"}>
              <SheetHeader className="sr-only">
                <SheetTitle>{labels.menu}</SheetTitle>
                <SheetDescription>{labels.navigation}</SheetDescription>
              </SheetHeader>
              <WorkspaceSwitcher
                activeWorkspaceId={workspace.id}
                workspaces={workspaces}
              />
              <div className="mt-4">
                <Navigation labels={labels} role={role} closeOnNavigate />
              </div>
            </SheetContent>
          </Sheet>
          <Link href="/overview" className="flex items-center gap-2 md:hidden">
            <span className="bg-brand text-brand-foreground flex size-8 items-center justify-center rounded-md font-semibold shadow-xs">
              W
            </span>
            <span className="font-semibold">Waslix</span>
          </Link>
          <div className="hidden md:block">
            <GlobalSearch labels={labels.search} />
          </div>
          <div className="ms-auto flex items-center gap-1">
            <div className="md:hidden">
              <GlobalSearch labels={labels.search} />
            </div>
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
