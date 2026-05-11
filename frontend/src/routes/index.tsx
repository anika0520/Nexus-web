import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAppStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const user = useAppStore((s) => s.currentUser);
  return <Navigate to={user ? "/app" : "/login"} />;
}
