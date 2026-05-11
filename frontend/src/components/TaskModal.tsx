import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { Field, inputCls, selectCls, textareaCls } from "./Field";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { tasksApi, projectsApi, usersApi, ApiTask, ApiProject, ApiUser } from "@/lib/api";
import { useAppStore } from "@/lib/store";

type TaskStatus = "todo" | "in_progress" | "review" | "done";

const schema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "review", "done"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  assigneeId: z.string().optional(),
  projectId: z.string().min(1, "Pick a project"),
  dueDate: z.string().optional(),
});

type Form = z.infer<typeof schema>;

function getProjectId(p: ApiProject | string | undefined): string {
  if (!p) return "";
  if (typeof p === "string") return p;
  return p._id;
}

function getAssigneeId(a: ApiUser | string | undefined): string {
  if (!a) return "";
  if (typeof a === "string") return a;
  return a._id;
}

export function TaskModal({
  open,
  onOpenChange,
  task,
  defaultStatus,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  task?: ApiTask | null;
  defaultStatus?: TaskStatus;
}) {
  const { currentUser } = useAppStore();
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const editing = !!task;

  useEffect(() => {
    if (!open) return;
    Promise.all([
      projectsApi.list({ limit: 100 }),
      usersApi.assignable(),
    ]).then(([pRes, uRes]) => {
      setProjects(pRes.data);
      setUsers(uRes.data);
    }).catch(() => {});
  }, [open, currentUser]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      status: defaultStatus ?? "todo",
      priority: "medium",
      assigneeId: "",
      projectId: "",
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    },
  });

  useEffect(() => {
    if (!open) return;
    reset(
      task
        ? {
            title: task.title,
            description: task.description || "",
            status: task.status,
            priority: task.priority,
            assigneeId: getAssigneeId(task.assigneeId as ApiUser | string),
            projectId: getProjectId(task.projectId as ApiProject | string),
            dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
          }
        : {
            title: "",
            description: "",
            status: defaultStatus ?? "todo",
            priority: "medium",
            assigneeId: "",
            projectId: projects[0]?._id ?? "",
            dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
          },
    );
  }, [open, task, defaultStatus, reset, projects]);

  const onSubmit = async (data: Form) => {
    setSubmitting(true);
    try {
      const payload = {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
        assigneeId: data.assigneeId || undefined,
      };
      if (editing && task) {
        await tasksApi.update(task._id, payload);
        toast.success("Task updated");
      } else {
        await tasksApi.create({ ...payload, projectId: data.projectId });
        toast.success("Task created");
      }
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save task";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Edit task" : "Create new task"}
      description="Track work across your team with rich context."
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Title" error={errors.title?.message}>
          <input className={inputCls} placeholder="Eg. Build payment flow" {...register("title")} />
        </Field>
        <Field label="Description">
          <textarea rows={3} className={textareaCls} placeholder="Add details, links, acceptance criteria…" {...register("description")} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Project" error={errors.projectId?.message}>
            <select className={selectCls} {...register("projectId")}>
              <option value="">Select project…</option>
              {projects.map((p) => (<option key={p._id} value={p._id}>{p.title}</option>))}
            </select>
          </Field>
          <Field label="Assignee">
            <select className={selectCls} {...register("assigneeId")}>
              <option value="">Unassigned</option>
              {users.map((u) => (<option key={u._id} value={u._id}>{u.name}</option>))}
            </select>
          </Field>
          <Field label="Status">
            <select className={selectCls} {...register("status")}>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>
          </Field>
          <Field label="Priority">
            <select className={selectCls} {...register("priority")}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </Field>
          <Field label="Due date" className="sm:col-span-2">
            <input type="date" className={inputCls} {...register("dueDate")} />
          </Field>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" variant="hero" disabled={submitting}>
            {submitting ? "Saving…" : editing ? "Save changes" : "Create task"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
