import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ApiUser } from "./api";

interface AuthState {
  currentUser: ApiUser | null;
  token: string | null;
  setAuth: (user: ApiUser, token: string) => void;
  clearAuth: () => void;

  theme: "dark" | "light";
  toggleTheme: () => void;

  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const useAppStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      token: null,

      setAuth: (user, token) => {
        localStorage.setItem("nexus-token", token);
        set({ currentUser: user, token });
      },

      clearAuth: () => {
        localStorage.removeItem("nexus-token");
        set({ currentUser: null, token: null });
      },

      theme: "dark",
      toggleTheme: () => set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),

      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    {
      name: "nexus-app-store",
      partialize: (s) => ({
        currentUser: s.currentUser,
        token: s.token,
        theme: s.theme,
        sidebarCollapsed: s.sidebarCollapsed,
      }),
    }
  )
);
