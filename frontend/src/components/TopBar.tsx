import { Bell, Moon, Search, Sun, LogOut, Menu } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Avatar } from "./Avatar";
import { Pill } from "./Pill";
import { useNavigate } from "@tanstack/react-router";
import { authApi } from "@/lib/api";
import { toast } from "sonner";

export function TopBar({ onMenu }: { onMenu?: () => void }) {
  const { currentUser, theme, toggleTheme, clearAuth, toggleSidebar } = useAppStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    clearAuth();
    toast.success("Signed out");
    navigate({ to: "/login" });
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="h-full px-4 md:px-6 flex items-center gap-3">
        <button
          onClick={() => (onMenu ? onMenu() : toggleSidebar())}
          className="md:hidden p-2 rounded-lg hover:bg-muted text-muted-foreground"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden md:flex relative items-center flex-1 max-w-md">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search projects, tasks, people…"
            className="w-full h-10 pl-10 pr-16 rounded-xl bg-muted/60 border border-transparent focus:border-primary/40 focus:bg-background outline-none text-sm transition-colors"
          />
          <kbd className="absolute right-3 text-[10px] text-muted-foreground px-1.5 py-0.5 rounded border border-border bg-background">
            ⌘K
          </kbd>
        </div>

        <div className="flex-1 md:hidden" />

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </button>

        <button className="relative p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" aria-label="Notifications">
          <Bell className="h-[18px] w-[18px]" />
        </button>

        <div className="h-8 w-px bg-border mx-1" />

        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <div className="text-[13px] font-medium leading-tight">{currentUser?.name}</div>
            <div className="flex justify-end mt-0.5">
              <Pill tone="primary" className="!py-0 !px-1.5 !text-[10px] capitalize">
                {currentUser?.role?.toLowerCase()}
              </Pill>
            </div>
          </div>
          <Avatar name={currentUser?.name ?? "U"} color={currentUser?.avatarColor ?? "#7c3aed"} size={36} />
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
            aria-label="Logout"
            title="Sign out"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </header>
  );
}
