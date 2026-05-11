import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { MobileNav } from "@/components/MobileNav";
import { FAB } from "@/components/FAB";
import { TaskModal } from "@/components/TaskModal";

export const Route = createFileRoute("/app")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("nexus-token");
    if (!token) {
      throw redirect({ to: "/login" });
    }

    // Check persisted zustand store for currentUser
    const raw = window.localStorage.getItem("nexus-app-store");
    if (raw) {
      let hasUser = false;
      try {
        const parsed = JSON.parse(raw);
        hasUser = !!parsed?.state?.currentUser;
      } catch {
        // ignore parse error, will redirect below
      }
      if (!hasUser) {
        throw redirect({ to: "/login" });
      }
    } else {
      throw redirect({ to: "/login" });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  const user = useAppStore((s) => s.currentUser);
  const [taskOpen, setTaskOpen] = useState(false);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar />
        <main className="flex-1 px-4 md:px-8 pb-24 md:pb-10 pt-6">
          <Outlet />
        </main>
      </div>
      <MobileNav />
      <FAB onClick={() => setTaskOpen(true)} />
      <TaskModal
        open={taskOpen}
        onOpenChange={(open) => {
          setTaskOpen(open);
          if (!open) {
            // Notify other pages (e.g. Tasks page) to refresh their data
            window.dispatchEvent(new CustomEvent("nexus:task-created"));
          }
        }}
      />
    </div>
  );
}
