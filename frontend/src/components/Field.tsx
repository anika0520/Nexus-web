import { cn } from "@/lib/utils";

export const Field = ({ label, error, children, className }: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <label className={cn("block space-y-1.5", className)}>
    <span className="text-[12px] font-medium text-muted-foreground">{label}</span>
    {children}
    {error && <span className="text-[11px] text-destructive">{error}</span>}
  </label>
);

export const inputCls =
  "w-full h-10 px-3 rounded-lg bg-muted/50 border border-border focus:border-primary/60 focus:bg-background outline-none text-sm transition-colors";

export const textareaCls =
  "w-full px-3 py-2.5 rounded-lg bg-muted/50 border border-border focus:border-primary/60 focus:bg-background outline-none text-sm transition-colors resize-none";

export const selectCls = inputCls + " appearance-none pr-8 cursor-pointer";
