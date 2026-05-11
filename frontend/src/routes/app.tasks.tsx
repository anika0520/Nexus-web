import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Trello, Table as TableIcon, Pencil, Trash2, MoreHorizontal, Calendar, Loader2 } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { PriorityBadge, TaskStatusBadge, Pill } from "@/components/Pill";
import { TaskModal } from "@/components/TaskModal";
import { Button } from "@/components/ui/button";
import { dueState, fmt } from "@/lib/format";
import { tasksApi, projectsApi, usersApi, ApiTask, ApiProject, ApiUser } from "@/lib/api";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { toast } from "sonner";
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors,
  useDroppable, useDraggable,
} from "@dnd-kit/core";

export const Route = createFileRoute("/app/tasks")({
  component: TasksPage,
  head: () => ({ meta: [{ title: "Tasks — Nexus" }] }),
});

type TaskStatus = "todo" | "in_progress" | "review" | "done";

const COLUMNS: { id: TaskStatus; label: string; tone: string }[] = [
  { id: "todo", label: "To Do", tone: "bg-muted-foreground" },
  { id: "in_progress", label: "In Progress", tone: "bg-primary" },
  { id: "review", label: "Review", tone: "bg-warning" },
  { id: "done", label: "Done", tone: "bg-success" },
];

function getUser(obj: ApiUser | string | undefined, users: ApiUser[]): ApiUser | undefined {
  if (!obj) return undefined;
  if (typeof obj === "string") return users.find((u) => u._id === obj);
  return obj;
}

function getProject(obj: ApiProject | string | undefined, projects: ApiProject[]): ApiProject | undefined {
  if (!obj) return undefined;
  if (typeof obj === "string") return projects.find((p) => p._id === obj);
  return obj;
}

function TasksPage() {
  const { currentUser } = useAppStore();
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [search, setSearch] = useState("");
  const [filterProject, setFilterProject] = useState("all");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ApiTask | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus | undefined>();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksRes, projectsRes, usersRes] = await Promise.all([
        tasksApi.list({ limit: 200 }),
        projectsApi.list({ limit: 100 }),
        usersApi.assignable(),
      ]);
      setTasks(tasksRes.data);
      setProjects(projectsRes.data);
      setUsers(usersRes.data);
    } catch {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Refresh when a task is created from the global FAB (in app.tsx layout)
  useEffect(() => {
    const handler = () => fetchAll();
    window.addEventListener("nexus:task-created", handler);
    return () => window.removeEventListener("nexus:task-created", handler);
  }, [fetchAll]);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      const ms = t.title.toLowerCase().includes(search.toLowerCase());
      const assigneeId = typeof t.assigneeId === "string" ? t.assigneeId : (t.assigneeId as ApiUser)?._id;
      const projectId = typeof t.projectId === "string" ? t.projectId : (t.projectId as ApiProject)?._id;
      const mp = filterProject === "all" || projectId === filterProject;
      const ma = filterAssignee === "all" || assigneeId === filterAssignee;
      const mpr = filterPriority === "all" || t.priority === filterPriority;
      return ms && mp && ma && mpr;
    });
  }, [tasks, search, filterProject, filterAssignee, filterPriority]);

  const grouped = useMemo(() => {
    return COLUMNS.reduce<Record<TaskStatus, ApiTask[]>>((acc, c) => {
      acc[c.id] = filtered.filter((t) => t.status === c.id).sort((a, b) => a.order - b.order);
      return acc;
    }, { todo: [], in_progress: [], review: [], done: [] });
  }, [filtered]);

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const onDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const taskId = String(active.id);
    const newStatus = String(over.id) as TaskStatus;
    const task = tasks.find((t) => t._id === taskId);
    if (!task || task.status === newStatus) return;
    setTasks((prev) => prev.map((t) => t._id === taskId ? { ...t, status: newStatus } : t));
    try {
      await tasksApi.patchStatus(taskId, newStatus);
      toast.success(`Moved to ${COLUMNS.find((c) => c.id === newStatus)?.label}`);
    } catch {
      toast.error("Failed to update task status");
      fetchAll();
    }
  };

  const openNew = (status?: TaskStatus) => { setEditing(null); setDefaultStatus(status); setModalOpen(true); };
  const openEdit = (t: ApiTask) => { setEditing(t); setDefaultStatus(undefined); setModalOpen(true); };

  const onDelete = async (t: ApiTask) => {
    try {
      await tasksApi.delete(t._id);
      setTasks((prev) => prev.filter((x) => x._id !== t._id));
      toast.success("Task deleted");
    } catch {
      toast.error("Failed to delete task");
    }
  };

  const activeTask = activeId ? tasks.find((t) => t._id === activeId) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} tasks across {projects.length} projects</p>
        </div>
        <div className="flex-1" />
        <div className="flex items-center bg-muted/50 rounded-xl p-1">
          <button onClick={() => setView("kanban")} className={`px-3 h-8 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${view === "kanban" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
            <Trello className="h-3.5 w-3.5" /> Kanban
          </button>
          <button onClick={() => setView("table")} className={`px-3 h-8 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${view === "table" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
            <TableIcon className="h-3.5 w-3.5" /> Table
          </button>
        </div>
        <Button variant="hero" onClick={() => openNew()}><Plus className="h-4 w-4" /> New task</Button>
      </div>

      <div className="glass rounded-2xl p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks…" className="w-full h-10 pl-10 pr-3 rounded-xl bg-muted/50 border border-transparent focus:border-primary/40 outline-none text-sm" />
        </div>
        <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} className="h-10 px-3 rounded-xl bg-muted/50 outline-none text-sm cursor-pointer">
          <option value="all">All projects</option>
          {projects.map((p) => <option key={p._id} value={p._id}>{p.title}</option>)}
        </select>
        {users.length > 0 && (
          <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)} className="h-10 px-3 rounded-xl bg-muted/50 outline-none text-sm cursor-pointer">
            <option value="all">All assignees</option>
            {users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
          </select>
        )}
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="h-10 px-3 rounded-xl bg-muted/50 outline-none text-sm cursor-pointer">
          <option value="all">All priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {view === "kanban" && (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                column={col}
                tasks={grouped[col.id]}
                projects={projects}
                users={users}
                onAdd={() => openNew(col.id)}
                onEdit={openEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
          <DragOverlay>
            {activeTask && (
              <div className="rotate-3 opacity-95">
                <TaskCard task={activeTask} project={getProject(activeTask.projectId, projects)} user={getUser(activeTask.assigneeId, users)} dragging />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {view === "table" && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3 font-medium">Task</th>
                  <th className="text-left px-3 py-3 font-medium">Project</th>
                  <th className="text-left px-3 py-3 font-medium">Status</th>
                  <th className="text-left px-3 py-3 font-medium">Priority</th>
                  <th className="text-left px-3 py-3 font-medium">Assignee</th>
                  <th className="text-left px-3 py-3 font-medium">Due</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const p = getProject(t.projectId, projects);
                  const u = getUser(t.assigneeId, users);
                  const ds = dueState(t.dueDate || "");
                  return (
                    <tr key={t._id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-medium">{t.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">{t.description}</div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="inline-flex items-center gap-2 text-xs">
                          {p && <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />}
                          {p?.title ?? "—"}
                        </div>
                      </td>
                      <td className="px-3 py-3"><TaskStatusBadge status={t.status} /></td>
                      <td className="px-3 py-3"><PriorityBadge priority={t.priority} /></td>
                      <td className="px-3 py-3">
                        {u ? (
                          <div className="flex items-center gap-2">
                            <Avatar name={u.name} color={u.avatarColor} size={26} />
                            <span className="text-xs">{u.name}</span>
                          </div>
                        ) : <span className="text-xs text-muted-foreground">Unassigned</span>}
                      </td>
                      <td className={`px-3 py-3 text-xs font-medium ${ds.tone === "danger" ? "text-destructive" : ds.tone === "warning" ? "text-warning" : "text-muted-foreground"}`}>
                        {t.dueDate ? fmt(t.dueDate) : "—"}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <RowMenu onEdit={() => openEdit(t)} onDelete={() => onDelete(t)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="p-12 text-center text-sm text-muted-foreground">No tasks match your filters.</div>
            )}
          </div>
        </div>
      )}

      <TaskModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            fetchAll();
            // Notify dashboard and other pages to refresh
            window.dispatchEvent(new CustomEvent("nexus:task-created"));
          }
        }}
        task={editing}
        defaultStatus={defaultStatus}
      />
    </div>
  );
}

function KanbanColumn({ column, tasks, projects, users, onAdd, onEdit, onDelete }: {
  column: { id: TaskStatus; label: string; tone: string };
  tasks: ApiTask[];
  projects: ApiProject[];
  users: ApiUser[];
  onAdd: () => void;
  onEdit: (t: ApiTask) => void;
  onDelete: (t: ApiTask) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const getProject = (t: ApiTask) => {
    const id = typeof t.projectId === "string" ? t.projectId : (t.projectId as ApiProject)?._id;
    return projects.find((p) => p._id === id);
  };
  const getUser = (t: ApiTask) => {
    const id = typeof t.assigneeId === "string" ? t.assigneeId : (t.assigneeId as ApiUser)?._id;
    return users.find((u) => u._id === id);
  };
  return (
    <div ref={setNodeRef} className={`glass rounded-2xl flex flex-col min-h-[400px] transition-colors ${isOver ? "border-primary/60 bg-primary/5" : ""}`}>
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <span className={`h-2 w-2 rounded-full ${column.tone}`} />
        <span className="text-sm font-semibold">{column.label}</span>
        <span className="text-xs text-muted-foreground">{tasks.length}</span>
        <button onClick={onAdd} className="ml-auto h-7 w-7 grid place-items-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground" aria-label="Add">
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 p-3 space-y-3 overflow-y-auto scrollbar-thin">
        <AnimatePresence>
          {tasks.map((t) => (
            <DraggableCard key={t._id} task={t} project={getProject(t)} user={getUser(t)} onEdit={() => onEdit(t)} onDelete={() => onDelete(t)} />
          ))}
        </AnimatePresence>
        {tasks.length === 0 && (
          <div className="text-center py-10 text-xs text-muted-foreground">
            <div className="mx-auto h-10 w-10 rounded-xl bg-muted grid place-items-center mb-2 opacity-60">
              <Plus className="h-4 w-4" />
            </div>
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}

function DraggableCard({ task, project, user, onEdit, onDelete }: { task: ApiTask; project?: ApiProject; user?: ApiUser; onEdit: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task._id });
  return (
    <motion.div
      layout
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: isDragging ? 0.3 : 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`cursor-grab active:cursor-grabbing ${isDragging ? "z-10" : ""}`}
    >
      <TaskCard task={task} project={project} user={user} onEdit={onEdit} onDelete={onDelete} />
    </motion.div>
  );
}

function TaskCard({ task, project, user, onEdit, onDelete, dragging }: { task: ApiTask; project?: ApiProject; user?: ApiUser; onEdit?: () => void; onDelete?: () => void; dragging?: boolean }) {
  const ds = dueState(task.dueDate || "");
  return (
    <div className={`glass-strong rounded-xl p-3.5 group hover:border-primary/40 transition-colors ${dragging ? "shadow-[var(--shadow-elevated)]" : ""}`}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium leading-snug line-clamp-2">{task.title}</div>
          {project && (
            <div className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: project.color }} />
              {project.title}
            </div>
          )}
        </div>
        {onEdit && <RowMenu onEdit={onEdit} onDelete={onDelete!} />}
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-1.5">
          <PriorityBadge priority={task.priority} />
          {task.dueDate && (
            <Pill tone={ds.tone === "danger" ? "danger" : ds.tone === "warning" ? "warning" : "muted"}>
              <Calendar className="h-3 w-3" /> {ds.label}
            </Pill>
          )}
        </div>
        {user && <Avatar name={user.name} color={user.avatarColor} size={24} />}
      </div>
    </div>
  );
}

function RowMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button onPointerDown={(e) => e.stopPropagation()} className="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content sideOffset={4} align="end" className="z-50 glass-strong rounded-xl p-1.5 min-w-[140px] shadow-[var(--shadow-elevated)]">
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
