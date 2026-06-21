import { create } from "zustand";
import type { User, UserRole } from "../../shared/types";

interface AuthState {
  user: User | null;
  sessionId: string | null;
  selectedRole: UserRole;
  isAuthenticated: boolean;
  setUser: (user: User | null, sessionId: string | null) => void;
  setSelectedRole: (role: UserRole) => void;
  logout: () => void;
  initFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  sessionId: null,
  selectedRole: "president",
  isAuthenticated: false,

  setUser: (user, sessionId) => {
    if (user && sessionId) {
      localStorage.setItem("sessionId", sessionId);
      localStorage.setItem("user", JSON.stringify(user));
    }
    set({ user, sessionId, isAuthenticated: !!user });
  },

  setSelectedRole: (role) => set({ selectedRole: role }),

  logout: () => {
    localStorage.removeItem("sessionId");
    localStorage.removeItem("user");
    set({ user: null, sessionId: null, isAuthenticated: false });
  },

  initFromStorage: () => {
    const sessionId = localStorage.getItem("sessionId");
    const userStr = localStorage.getItem("user");
    if (sessionId && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        set({ user, sessionId, isAuthenticated: true });
      } catch {
        localStorage.removeItem("sessionId");
        localStorage.removeItem("user");
      }
    }
  },
}));
