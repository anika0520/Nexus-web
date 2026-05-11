import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, LayoutGrid, List, MoreHorizontal, Trash2, Pencil, Loader2 } from "lucide-react";
import { AvatarStack } from "@/components/Avatar";
import { ProjectStatusBadge } from "@/components/Pill";
import { ProjectModal } from "@/components/ProjectModal";
import { dueState, fmt } from "@/lib/format";
import { Button } from "@/components/ui/button";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { toast } from "sonner";
import { projectsApi, ApiProject, ApiUser, usersApi } from "@/lib/api";

export const Route = createFileRoute("/app/projects")({
  component: ProjectsPage,
  head: () => ({ meta: [{ title: "Projects — Nexus" }] }),
});

function ProjectsPage() {
  const { currentUser } = useAppStore();
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ApiProject | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (status !== "all") params.status = status;
      const res = await projectsApi.list(params);
      setProjects(res.data);
    } catch {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    usersApi.assignable().then((r) => setUsers(r.data)).catch(() => {});
  }, []);

  const openNew = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (p: ApiProject) => { setEditing(p); setModalOpen(true); };

  const onDelete = async (p: ApiProject) => {
    if (!confirm(`Delete "${p.title}"? This will also delete all its tasks.`)) return;
    try {
      await projectsApi.delete(p._id);
      toast.success(`Deleted "${p.title}"`);
      fetchProjects();
    } catch {
      toast.error("Failed to delete project");
    }
  };

  const getMembersFromProject = (p: ApiProject): ApiUser[] => {
    return (p.memberIds || [])
      .map((m) => typeof m === "string" ? users.find((u) => u._id === m) : m as ApiUser)
      .filter(Boolean) as ApiUser[];
  };

  const toAvatarUser = (u: ApiUser) => ({
    id: u._id, name: u.name, email: u.email,
    avatarColor: u.avatarColor,
    role: u.role === "ADMIN" ? "admin" as const : "member" as const,
  });

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">{projects.length} projects</p>
        </div>
        <div className="flex-1" />
        <Button variant="hero" onClick={openNew}><Plus className="h-4 w-4" /> New project</Button>
      </div>

      <div className="glass rounded-2xl p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects…"
            className="w-full h-10 pl-10 pr-3 rounded-xl bg-muted/50 border border-transparent focus:border-primary/40 focus:bg-background outline-none text-sm"
          />
        </div>
        <select
          value={status} onChange={(e) => setStatus(e.target.value)}
          className="h-10 px-3 rounded-xl bg-muted/50 border border-transparent outline-none text-sm cursor-pointer"
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="on_hold">On hold</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
        <div className="flex items-center bg-muted/50 rounded-xl p-1">
          <button onClick={() => setView("grid")} className={`h-8 w-8 grid place-items-center rounded-lg transition-colors ${view === "grid" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`} aria-label="Grid view">
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button onClick={() => setView("list")} className={`h-8 w-8 grid place-items-center rounded-lg transition-colors ${view === "list" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`} aria-label="List view">
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : projects.length === 0 ? (
        <div className="glass rounded-2xl py-16 text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl gradient-primary grid place-items-center mb-4 opacity-80">
            <Plus className="h-6 w-6 text-primary-foreground" />
          </div>
          <h3 className="font-display text-lg font-semibold">No projects found</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-5">Try adjusting filters or create a new project.</p>
          <Button variant="hero" onClick={openNew}>Create project</Button>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {projects.map((p, i) => {
              const members = getMembersFromProject(p);
              const ds = dueState(p.endDate || "");
              return (
                <motion.div
                  key={p._id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass rounded-2xl p-5 hover:shadow-[var(--shadow-elevated)] hover:border-primary/40 transition-all relative overflow-hidden group"
                >
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, ${p.color}, ${p.color}66)` }} />
                  <div className="flex items-start gap-3">
                    <div className="h-11 w-11 rounded-xl grid place-items-center text-white text-sm font-bold shadow-sm" style={{ background: `linear-gradient(135deg, ${p.color}, ${p.color}aa)` }}>
                      {p.title.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-sm truncate">{p.title}</div>
                        <ProjectStatusBadge status={p.status} />
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{p.description}</div>
                    </div>
                    <ProjectMenu onEdit={() => openEdit(p)} onDelete={() => onDelete(p)} />
                  </div>

                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
                    <AvatarStack users={members.map(toAvatarUser)} max={4} />
                    {p.endDate && (
                      <span className={`text-xs font-medium ${
                        ds.tone === "danger" ? "text-destructive" : ds.tone === "warning" ? "text-warning" : "text-muted-foreground"
                      }`}>{ds.label}</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-5 py-3 text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/30">
            <div className="col-span-5">Project</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Members</div>
            <div className="col-span-2">Due</div>
            <div className="col-span-1" />
          </div>
          {projects.map((p) => {
            const members = getMembersFromProject(p);
            return (
              <div key={p._id} className="grid grid-cols-12 gap-4 items-center px-5 py-4 border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                <div className="col-span-5 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg text-white text-xs font-bold grid place-items-center" style={{ background: p.color }}>
                    {p.title.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{p.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{p.description}</div>
                  </div>
                </div>
                <div className="col-span-2"><ProjectStatusBadge status={p.status} /></div>
                <div className="col-span-2"><AvatarStack users={members.map(toAvatarUser)} /></div>
                <div className="col-span-2 text-xs text-muted-foreground">{p.endDate ? fmt(p.endDate) : "—"}</div>
                <div className="col-span-1 flex justify-end">
                  <ProjectMenu onEdit={() => openEdit(p)} onDelete={() => onDelete(p)} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ProjectModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) fetchProjects();
        }}
        project={editing}
      />
    </div>
  );
}

function ProjectMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="More">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content sideOffset={6} align="end" className="z-50 glass-strong rounded-xl p-1.5 min-w-[160px] shadow-[var(--shadow-elevated)]">
          <DropdownMenu.Item onSelect={onEdit} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-muted outline-none">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </DropdownMenu.Item>
          <DropdownMenu.Item onSelect={onDelete} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer text-destructive hover:bg-destructive/10 outline-none">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
