import { formatDistanceToNow, format, isPast, differenceInDays } from "date-fns";

export const fromNow = (d: string) => formatDistanceToNow(new Date(d), { addSuffix: true });
export const fmt = (d: string, p = "MMM d") => format(new Date(d), p);
export const dueState = (d: string) => {
  const date = new Date(d);
  const days = differenceInDays(date, new Date());
  if (isPast(date) && days < 0) return { label: `${Math.abs(days)}d overdue`, tone: "danger" as const };
  if (days <= 3) return { label: `${days === 0 ? "today" : `${days}d left`}`, tone: "warning" as const };
  return { label: format(date, "MMM d"), tone: "ok" as const };
};

export const initials = (name: string) =>
  name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
