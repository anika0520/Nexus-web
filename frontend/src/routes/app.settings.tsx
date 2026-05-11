import { createFileRoute } from "@tanstack/react-router";
import { useAppStore } from "@/lib/store";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Field, inputCls } from "@/components/Field";
import { Moon, Sun, Bell, Lock, Shield } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Settings — Nexus" }] }),
});

function Row({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-border last:border-0">
      <div className="h-9 w-9 rounded-xl bg-muted grid place-items-center text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      </div>
      {children}
    </div>
  );
}

function SettingsPage() {
  const { currentUser, theme, toggleTheme } = useAppStore();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your workspace preferences.</p>
      </div>

      {/* Profile */}
      <div className="glass rounded-2xl p-6">
        <h2 className="font-semibold mb-4">Profile</h2>
        <div className="flex items-center gap-4 mb-6">
          <Avatar
            name={currentUser?.name ?? "U"}
            color={currentUser?.avatarColor ?? "#7c3aed"}
            size={64}
          />
          <div>
            <div className="font-medium">{currentUser?.name}</div>
            <div className="text-sm text-muted-foreground">{currentUser?.email}</div>
            <div className="text-xs text-muted-foreground mt-0.5 capitalize flex items-center gap-1">
              <Shield className="h-3 w-3" /> {currentUser?.role?.toLowerCase()}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Display name">
            <input className={inputCls} defaultValue={currentUser?.name} readOnly />
          </Field>
          <Field label="Email">
            <input className={inputCls} defaultValue={currentUser?.email} readOnly />
          </Field>
        </div>
      </div>

      {/* Appearance */}
      <div className="glass rounded-2xl p-6 space-y-1">
        <h2 className="font-semibold mb-2">Preferences</h2>
        <Row
          icon={theme === "dark" ? Moon : Sun}
          title="Theme"
          subtitle="Switch between dark and light mode"
        >
          <Button variant="outline" onClick={toggleTheme}>
            {theme === "dark" ? "Switch to light" : "Switch to dark"}
          </Button>
        </Row>
        <Row icon={Bell} title="Notifications" subtitle="Email me about activity in my projects">
          <input
            type="checkbox"
            defaultChecked
            className="h-5 w-5 accent-[var(--primary)]"
            onChange={() => toast.info("Notification preferences saved")}
          />
        </Row>
      </div>
    </div>
  );
}
