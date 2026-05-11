import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { Pill } from "@/components/Pill";
import { motion } from "framer-motion";
import { Mail, Shield, Loader2 } from "lucide-react";
import { usersApi, ApiUser } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/app/team")({
  component: TeamPage,
  head: () => ({ meta: [{ title: "Team — Nexus" }] }),
});

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="font-display text-xl font-semibold">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

function TeamPage() {
  const { currentUser } = useAppStore();
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.role !== "ADMIN") {
      setLoading(false);
      return;
    }
    usersApi.list()
      .then((r) => setUsers(r.data))
      .catch(() => toast.error("Failed to load team members"))
      .finally(() => setLoading(false));
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (currentUser?.role !== "ADMIN") {
    return (
      <div className="space-y-6 max-w-[1400px] mx-auto">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">Team</h1>
        </div>
        <div className="glass rounded-2xl py-16 text-center">
          <p className="text-sm text-muted-foreground">Team directory is only visible to administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">Team</h1>
        <p className="text-sm text-muted-foreground mt-1">{users.length} members in your workspace</p>
      </div>

      {users.length === 0 ? (
        <div className="glass rounded-2xl py-16 text-center">
          <p className="text-sm text-muted-foreground">No team members found. Invite people to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {users.map((u, i) => (
            <motion.div
              key={u._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl p-6 hover:border-primary/40 hover:shadow-[var(--shadow-elevated)] transition-all relative overflow-hidden"
            >
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-20 blur-2xl" style={{ background: u.avatarColor }} />
              <div className="relative flex items-start gap-4">
                <Avatar name={u.name} color={u.avatarColor} size={56} />
                <div className="flex-1 min-w-0">
                  <div className="font-display text-base font-semibold truncate">{u.name}</div>
                  <div className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-0.5">
                    <Mail className="h-3 w-3" /> {u.email}
                  </div>
                  <div className="mt-2">
                    <Pill tone={u.role === "ADMIN" ? "primary" : "muted"} className="capitalize">
                      <Shield className="h-3 w-3" /> {u.role.toLowerCase()}
                    </Pill>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-border">
                <Stat label="Role" value={u.role === "ADMIN" ? 1 : 0} />
                <Stat label="Member since" value={new Date(u.createdAt).getFullYear()} />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
