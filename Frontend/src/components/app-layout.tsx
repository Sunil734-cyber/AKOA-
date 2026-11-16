import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutGrid,
  Box,
  LineChart,
  Lightbulb,
  Bot,
  History,
  User,
  Settings,
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { authStore, useAuth } from "@/lib/store";
import { NOTIFICATIONS } from "@/lib/akoa";
import { Dropdown, MenuItem, MenuLabel, Dot } from "@/components/ako";

const NAV: { section?: string; items: { label: string; to: string; icon: typeof LayoutGrid }[] }[] = [
  { items: [{ label: "Overview", to: "/", icon: LayoutGrid }] },
  {
    section: "Infrastructure",
    items: [
      { label: "Services", to: "/services", icon: Box },
      { label: "Metrics", to: "/metrics", icon: LineChart },
    ],
  },
  {
    section: "AI Operations",
    items: [
      { label: "Recommendations", to: "/recommendations", icon: Lightbulb },
      { label: "AI Copilot", to: "/copilot", icon: Bot },
    ],
  },
  { section: "Activity", items: [{ label: "Action History", to: "/actions", icon: History }] },
  {
    section: "Account",
    items: [
      { label: "Profile", to: "/profile", icon: User },
      { label: "Settings", to: "/settings", icon: Settings },
    ],
  },
];

function isActive(pathname: string, to: string): boolean {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/60 bg-primary/10">
        <span className="font-mono text-lg font-bold text-primary">A</span>
      </div>
      <div>
        <div className="text-[15px] font-bold tracking-wide text-foreground">AKOA</div>
        <div className="text-[11px] text-muted-foreground">Autonomous Infrastructure</div>
      </div>
    </div>
  );
}

function SidebarNav({ pathname, onNavigate }: { pathname: string; onNavigate?: (() => void) | undefined }) {
  return (
    <nav className="flex-1 overflow-y-auto px-4 py-5">
      {NAV.map((group, gi) => (
        <div key={gi} className={cn(gi > 0 && "mt-6")}>
          {group.section ? (
            <div className="mb-2 px-3 font-mono text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              {group.section}
            </div>
          ) : null}
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-primary/10 font-medium text-foreground ring-1 ring-primary/25"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <Icon size={17} strokeWidth={1.8} className={active ? "text-primary" : ""} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function SidebarFooter() {
  return (
    <div className="border-t border-sidebar-border px-4 py-4">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-muted-foreground">System Status</span>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-healthy">
          <Dot className="bg-healthy" />
          Operational
        </span>
      </div>
      <div className="mt-4 flex items-center gap-3 border-t border-sidebar-border pt-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 font-mono text-xs font-bold text-primary">
          SG
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-foreground">Sreenidhi</div>
          <div className="truncate text-[11px] text-muted-foreground">Infrastructure Engineer</div>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ pathname, onClose }: { pathname: string; onClose?: () => void }) {
  return (
    <div className="flex h-full flex-col border-r border-sidebar-border bg-sidebar">
      <div className="px-5 pt-5 pb-4">
        <Logo />
      </div>
      <SidebarNav pathname={pathname} onNavigate={onClose} />
      <SidebarFooter />
    </div>
  );
}

function EnvironmentBadge() {
  return (
    <div className="flex items-center gap-3">
      <span className="hidden font-mono text-[11px] tracking-widest text-muted-foreground uppercase sm:inline">
        Environment
      </span>
      <span className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 font-mono text-[11px] font-semibold tracking-wider text-primary uppercase">
        <Dot className="bg-primary" />
        Development / Minikube
      </span>
    </div>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    authStore.hydrate();
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 lg:block">
        <Sidebar pathname={pathname} />
      </aside>

      {/* mobile sidebar */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 shadow-2xl">
            <div className="flex justify-end p-3">
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Close navigation"
              >
                <X size={18} />
              </button>
            </div>
            <div className="h-[calc(100%-3rem)]">
              <Sidebar pathname={pathname} onClose={() => setMobileOpen(false)} />
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/95 px-5 backdrop-blur lg:px-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
              aria-label="Open navigation"
            >
              <Menu size={18} />
            </button>
            <EnvironmentBadge />
          </div>
          <div className="flex items-center gap-5">
            <span className="hidden items-center gap-1.5 text-sm font-medium text-healthy sm:inline-flex">
              <Dot className="bg-healthy" />
              Operational
            </span>
            <Dropdown
              trigger={
                <button
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  aria-label="Notifications"
                >
                  <Bell size={17} />
                </button>
              }
            >
              <MenuLabel>Notifications</MenuLabel>
              {NOTIFICATIONS.map(([title, time]) => (
                <div key={time + title} className="flex items-start justify-between gap-6 px-3 py-2">
                  <span className="text-sm text-foreground">{title}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">{time}</span>
                </div>
              ))}
            </Dropdown>
            <Dropdown
              trigger={
                <button className="flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-primary">
                  {auth.signedIn ? "Sreenidhi" : "Guest"}
                  <ChevronDown size={14} className="text-muted-foreground" />
                </button>
              }
            >
              {(close) => (
                <>
                  <MenuLabel>Account</MenuLabel>
                  <MenuItem
                    onClick={() => {
                      close();
                      navigate({ to: "/profile" });
                    }}
                  >
                    Profile
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      close();
                      navigate({ to: "/settings" });
                    }}
                  >
                    Settings
                  </MenuItem>
                  <MenuItem
                    className="text-critical"
                    onClick={() => {
                      close();
                      authStore.signOut();
                      navigate({ to: "/login" });
                    }}
                  >
                    <span className="inline-flex items-center gap-2">
                      <LogOut size={14} />
                      Sign out
                    </span>
                  </MenuItem>
                </>
              )}
            </Dropdown>
          </div>
        </header>
        <main className="flex-1 px-5 py-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
