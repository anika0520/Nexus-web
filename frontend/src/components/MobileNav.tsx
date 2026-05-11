import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, FolderKanban, ListChecks, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/app", label: "Home", icon: LayoutDashboard, exact: true },
  { to: "/app/projects", label: "Projects", icon: FolderKanban },
  { to: "/app/tasks", label: "Tasks", icon: ListChecks },
  { to: "/app/team", label: "Team", icon: Users },
];

export function MobileNav() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  return (
    <nav className="md:hidden fixed bottom-3 left-3 right-3 z-40 glass-strong rounded-2xl px-2 py-1.5 shadow-[var(--shadow-elevated)] flex justify-around">
      {items.map(({ to, label, icon: Icon, exact }) => {
        const active = exact ? pathname === to : pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            className={cn(
              "flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] font-medium transition-colors",
              active ? "text-primary bg-primary/10" : "text-muted-foreground",
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
