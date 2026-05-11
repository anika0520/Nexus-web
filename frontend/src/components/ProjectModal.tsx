import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { Field, inputCls, selectCls, textareaCls } from "./Field";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { projectsApi, usersApi, ApiProject, ApiUser } from "@/lib/api";
import { useAppStore } from "@/lib/store";

const colors = ["#8b5cf6", "#10b981", "#f59e0b", "#ec4899", "#06b6d4", "#ef4444", "#3b82f6", "#a855f7"];

const schema = z.object({
  title: z.string().min(2, "Name is required"),
  description: z.string().optional(),
  status: z.enum(["active", "on_hold", "completed", "archived"]),
  color: z.string().min(1),
  endDate: z.string().optional(),
  memberIds: z.array(z.string()).optional(),
});
type Form = z.infer<typeof schema>;

export function ProjectModal({
  open, onOpenChange, project,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project?: ApiProject | null;
}) {
  const { currentUser } = useAppStore();
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const editing = !!project;

  useEffect(() => {
    usersApi.assignable().then((r) => setUsers(r.data)).catch(() => {});
  }, []);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      status: "active",
      color: colors[0],
      endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      memberIds: [],
    },
  });

  const memberIds = watch("memberIds") ?? [];
  const color = watch("color");

  useEffect(() => {
    if (!open) return;
    const getMemberIds = (p: ApiProject): string[] =>
      (p.memberIds || []).map((m) => typeof m === "string" ? m : (m as ApiUser)._id);

    reset(project ? {
      title: project.title,
      description: project.description,
      status: project.status,
      color: project.color,
      endDate: project.endDate ? project.endDate.slice(0, 10) : "",
      memberIds: getMemberIds(project),
    } : {
      title: "", description: "", status: "active", color: colors[0],
      endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      memberIds: [],
    });
  }, [open, project, reset]);

  const toggleMember = (id: string) => {
    setValue("memberIds", memberIds.includes(id) ? memberIds.filter((m) => m !== id) : [...memberIds, id], { shouldValidate: true });
  };

  const onSubmit = async (data: Form) => {
    setSubmitting(true);
    try {
      const payload = {
        ...data,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
      };
      if (editing && project) {
        await projectsApi.update(project._id, payload);
        toast.success("Project updated");
      } else {
        await projectsApi.create(payload);
        toast.success("Project created");
      }
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save project";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={editing ? "Edit project" : "Create new project"} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Project name" error={errors.title?.message}>
          <input className={inputCls} placeholder="Eg. Mobile redesign" {...register("title")} />
        </Field>
        <Field label="Description">
          <textarea rows={2} className={textareaCls} placeholder="What is this project about?" {...register("description")} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Status">
            <select className={selectCls} {...register("status")}>
              <option value="active">Active</option>
              <option value="on_hold">On hold</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </Field>
          <Field label="End date">
            <input type="date" className={inputCls} {...register("endDate")} />
          </Field>
        </div>
        <Field label="Accent color">
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setValue("color", c)}
                className="h-8 w-8 rounded-lg border-2 transition-transform hover:scale-110"
                style={{ background: c, borderColor: color === c ? "white" : "transparent", boxShadow: color === c ? `0 0 0 2px ${c}` : undefined }}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
        </Field>
        {users.length > 0 && (
          <Field label="Team members">
            <div className="flex flex-wrap gap-2">
              {users.map((u) => {
                const on = memberIds.includes(u._id);
                return (
                  <button
                    type="button"
                    key={u._id}
                    onClick={() => toggleMember(u._id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      on ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground border-border hover:text-foreground"
                    }`}
                  >
                    {u.name}
                  </button>
                );
              })}
            </div>
          </Field>
        )}
        <div className="flex gap-2 justify-end pt-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" variant="hero" disabled={submitting}>{submitting ? "Saving…" : editing ? "Save" : "Create project"}</Button>
        </div>
      </form>
    </Modal>
  );
}
