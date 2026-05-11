import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";

export function Avatar({
  name,
  color,
  size = 32,
  className,
}: {
  name: string;
  color?: string;
  size?: number;
  className?: string;
}) {
  const bg = color ?? "#6366f1";
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full text-[11px] font-semibold text-white ring-2 ring-background shadow-sm select-none",
        className,
      )}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${bg}, ${bg}cc)`,
        fontSize: Math.max(10, size * 0.38),
      }}
      title={name}
    >
      {initials(name)}
    </span>
  );
}

export function AvatarStack({
  users,
  max = 3,
  size = 28,
}: {
  users: { name: string; avatarColor?: string }[];
  max?: number;
  size?: number;
}) {
  const shown = users.slice(0, max);
  const rest = users.length - shown.length;
  return (
    <div className="flex items-center -space-x-2">
      {shown.map((u, i) => (
        <Avatar key={i} name={u.name} color={u.avatarColor} size={size} />
      ))}
      {rest > 0 && (
        <span
          className="inline-flex items-center justify-center rounded-full bg-muted text-foreground text-[10px] font-semibold ring-2 ring-background"
          style={{ width: size, height: size }}
        >
          +{rest}
        </span>
      )}
    </div>
  );
}
