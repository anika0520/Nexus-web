import { cn } from "@/lib/utils";
import type { Priority, ProjectStatus, TaskStatus } from "@/lib/types";

const tones: Record<string, string> = {
  primary: "bg-primary/15 text-primary border-primary/30",
  success: "bg-success/15 text-success border-success/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  danger: "bg-destructive/15 text-destructive border-destructive/30",
  muted: "bg-muted text-muted-foreground border-border",
  accent: "bg-accent/15 text-accent border-accent/30",
};

export function Pill({
  children,
  tone = "muted",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const map: Record<Priority, { tone: keyof typeof tones; label: string }> = {
    low: { tone: "muted", label: "Low" },
    medium: { tone: "primary", label: "Medium" },
    high: { tone: "warning", label: "High" },
    urgent: { tone: "danger", label: "Urgent" },
  };
  const m = map[priority];
  return (
    <Pill tone={m.tone}>
      <span className={cn("h-1.5 w-1.5 rounded-full", {
        "bg-muted-foreground": priority === "low",
        "bg-primary": priority === "medium",
        "bg-warning": priority === "high",
        "bg-destructive": priority === "urgent",
      })} />
      {m.label}
    </Pill>
  );
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const map: Record<TaskStatus, { tone: keyof typeof tones; label: string }> = {
    todo: { tone: "muted", label: "To Do" },
    in_progress: { tone: "primary", label: "In Progress" },
    review: { tone: "warning", label: "Review" },
    done: { tone: "success", label: "Done" },
  };
  const m = map[status];
  return <Pill tone={m.tone}>{m.label}</Pill>;
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const map: Record<ProjectStatus, { tone: keyof typeof tones; label: string }> = {
    active: { tone: "success", label: "Active" },
    on_hold: { tone: "warning", label: "On hold" },
    completed: { tone: "primary", label: "Completed" },
    archived: { tone: "muted", label: "Archived" },
  };
  const m = map[status];
  return <Pill tone={m.tone}>{m.label}</Pill>;
}
