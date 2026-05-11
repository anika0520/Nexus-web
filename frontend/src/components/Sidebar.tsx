import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  Users,
  Settings,
  Sparkles,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { motion } from "framer-motion";

const items = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/projects", label: "Projects", icon: FolderKanban },
  { to: "/app/tasks", label: "Tasks", icon: ListChecks },
  { to: "/app/team", label: "Team", icon: Users },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggle = useAppStore((s) => s.toggleSidebar);
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  return (
    <aside
      className={cn(
        "hidden md:flex sticky top-0 h-screen flex-col border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl transition-[width] duration-300",
        collapsed ? "w-[76px]" : "w-[252px]",
      )}
    >
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <div className="relative">
          <div className="h-9 w-9 rounded-xl gradient-primary grid place-items-center shadow-[var(--shadow-glow)]">
            <Sparkles className="h-4.5 w-4.5 text-primary-foreground" strokeWidth={2.5} />
          </div>
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <div className="font-display text-[15px] font-semibold tracking-tight">Nexus</div>
            <div className="text-[11px] text-muted-foreground -mt-0.5">Project OS</div>
          </div>
        )}
        {!collapsed && (
          <button
            onClick={toggle}
            className="text-muted-foreground hover:text-foreground rounded-md p-1"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-1">
        {items.map(({ to, label, icon: Icon, exact }) => {
          const active = exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent",
                collapsed && "justify-center px-0",
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-sidebar-accent border border-border shadow-sm"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <Icon
                className={cn("relative h-[18px] w-[18px] shrink-0", active && "text-primary")}
              />
              {!collapsed && <span className="relative">{label}</span>}
              {active && !collapsed && (
                <span className="relative ml-auto h-1.5 w-1.5 rounded-full bg-primary animate-glow" />
              )}
            </Link>
          );
        })}
      </nav>

      {collapsed && (
        <button
          onClick={toggle}
          className="m-3 grid place-items-center rounded-xl border border-border py-2 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
          aria-label="Expand sidebar"
        >
          <ChevronLeft className="h-4 w-4 rotate-180" />
        </button>
      )}
    </aside>
  );
}
