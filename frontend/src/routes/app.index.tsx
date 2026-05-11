import { createFileRoute, Link } from "@tanstack/react-router";
import { useAppStore } from "@/lib/store";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, FolderKanban, AlertTriangle, ArrowUpRight, TrendingUp, Plus, Loader2 } from "lucide-react";
import { Avatar, AvatarStack } from "@/components/Avatar";
import { PriorityBadge, ProjectStatusBadge } from "@/components/Pill";
import { fmt, fromNow, dueState } from "@/lib/format";
import { useEffect, useState } from "react";
import { dashboardApi, DashboardStats, ApiProject, ApiTask, ApiUser } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — Nexus" }] }),
});

function getUser(obj: ApiUser | string | undefined): ApiUser | undefined {
  if (!obj || typeof obj === "string") return undefined;
  return obj;
}

function getProject(obj: ApiProject | string | undefined): ApiProject | undefined {
  if (!obj || typeof obj === "string") return undefined;
  return obj;
}

function Dashboard() {
  const { currentUser } = useAppStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = () => {
    dashboardApi.stats()
      .then((r) => setStats(r.data))
      .catch(() => toast.error("Failed to load dashboard data"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Refresh dashboard when a task is created from anywhere
  useEffect(() => {
    const handler = () => fetchStats();
    window.addEventListener("nexus:task-created", handler);
    return () => window.removeEventListener("nexus:task-created", handler);
  }, []);

  const statCards = stats
    ? [
        { label: "Total Projects", value: stats.projects.total, change: `${stats.projects.active} active`, icon: FolderKanban, tone: "primary" as const },
        { label: "Active Tasks", value: stats.tasks.inProgress + stats.tasks.todo, change: `${stats.tasks.review} in review`, icon: Clock, tone: "accent" as const },
        { label: "Completed", value: stats.tasks.done, change: "tasks done", icon: CheckCircle2, tone: "success" as const },
        { label: "Overdue", value: stats.tasks.overdue, change: stats.tasks.overdue > 0 ? "needs attention" : "all clear", icon: AlertTriangle, tone: "danger" as const },
      ]
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-3xl gradient-mesh border border-border p-6 sm:p-8">
        <div className="relative z-10">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Welcome back</div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight mt-1">
            Good to see you, <span className="gradient-text">{currentUser?.name?.split(" ")[0]}</span>.
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl">
            Here's what's happening across your workspace today.
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-2xl p-5 hover:border-primary/40 transition-colors group"
          >
            <div className="flex items-start justify-between">
              <div className={`h-10 w-10 rounded-xl grid place-items-center ${
                s.tone === "primary" ? "bg-primary/15 text-primary" :
                s.tone === "accent" ? "bg-accent/15 text-accent" :
                s.tone === "success" ? "bg-success/15 text-success" :
                "bg-destructive/15 text-destructive"
              }`}>
                <s.icon className="h-5 w-5" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <div className="mt-4 font-display text-3xl font-semibold tracking-tight">{s.value}</div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <span className="text-[10px] text-success ml-auto inline-flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" /> {s.change}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Two column */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent projects */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Recent projects</h2>
            <Link to="/app/projects" className="text-xs text-primary font-medium hover:underline">View all</Link>
          </div>
          {!stats?.recentProjects?.length ? (
            <div className="glass rounded-2xl py-12 text-center">
              <p className="text-sm text-muted-foreground">No projects yet. Create your first project.</p>
              <Link to="/app/projects" className="inline-block mt-3 text-xs text-primary font-medium hover:underline">Go to Projects →</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {stats.recentProjects.slice(0, 4).map((p: ApiProject, i: number) => {
                const owner = getUser(p.ownerId as ApiUser);
                const members = (p.memberIds || []).map((m) => getUser(m as ApiUser)).filter(Boolean) as ApiUser[];
                const ds = dueState(p.endDate || "");
                return (
                  <motion.div
                    key={p._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + i * 0.05 }}
                    className="relative glass rounded-2xl p-5 hover:shadow-[var(--shadow-elevated)] hover:border-primary/40 transition-all overflow-hidden group"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1" style={{ background: p.color }} />
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl grid place-items-center text-white text-sm font-semibold" style={{ background: `linear-gradient(135deg, ${p.color}, ${p.color}99)` }}>
                        {p.title.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{p.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">{p.description}</div>
                      </div>
                      <ProjectStatusBadge status={p.status} />
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <AvatarStack users={[...(owner ? [owner] : []), ...members].map((u) => ({ name: u.name, avatarColor: u.avatarColor, id: u._id, email: u.email, role: u.role === "ADMIN" ? "admin" : "member" }))} />
                      {p.endDate && (
                        <span className={`text-[11px] font-medium ${
                          ds.tone === "danger" ? "text-destructive" : ds.tone === "warning" ? "text-warning" : "text-muted-foreground"
                        }`}>
                          {ds.label}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Empty state for activity — real activity feed would require a backend Activity model */}
        <div className="space-y-4">
          <h2 className="font-display text-lg font-semibold">Workspace</h2>
          <div className="glass rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <div className="h-10 w-10 rounded-xl bg-primary/15 grid place-items-center text-primary">
                <FolderKanban className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-medium">{stats?.projects.total ?? 0} Projects</div>
                <div className="text-xs text-muted-foreground">{stats?.projects.active ?? 0} active</div>
              </div>
            </div>
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <div className="h-10 w-10 rounded-xl bg-accent/15 grid place-items-center text-accent">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-medium">{(stats?.tasks.inProgress ?? 0) + (stats?.tasks.todo ?? 0)} Open Tasks</div>
                <div className="text-xs text-muted-foreground">{stats?.tasks.review ?? 0} in review</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-success/15 grid place-items-center text-success">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-medium">{stats?.tasks.done ?? 0} Completed</div>
                <div className="text-xs text-muted-foreground">tasks done</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming tasks */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Upcoming tasks</h2>
          <Link to="/app/tasks" className="text-xs text-primary font-medium hover:underline">Open Kanban</Link>
        </div>
        <div className="glass rounded-2xl divide-y divide-border overflow-hidden">
          {!stats?.upcomingTasks?.length ? (
            <div className="p-10 text-center">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-muted grid place-items-center mb-3">
                <Plus className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No upcoming tasks. Create your first one.</p>
            </div>
          ) : stats.upcomingTasks.map((t: ApiTask) => {
            const assignee = getUser(t.assigneeId as ApiUser);
            const project = getProject(t.projectId as ApiProject);
            const ds = dueState(t.dueDate || "");
            return (
              <div key={t._id} className="flex items-center gap-4 p-4 hover:bg-muted/40 transition-colors">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: project?.color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{t.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{project?.title}</div>
                </div>
                <PriorityBadge priority={t.priority} />
                {assignee && <Avatar name={assignee.name} color={assignee.avatarColor} size={28} />}
                {t.dueDate && (
                  <div className={`text-xs font-medium w-20 text-right ${
                    ds.tone === "danger" ? "text-destructive" : ds.tone === "warning" ? "text-warning" : "text-muted-foreground"
                  }`}>
                    {fmt(t.dueDate)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
