import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { API_CONFIG } from "@/config/api";

// -------- Types --------
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  checkAuth: () => Promise<void>;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

// -------- Local storage helpers (for resilience across reloads) --------
const USER_KEY = "flowo_user";

function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    return {
      id: obj.id || "",
      email: obj.email || "",
      firstName: obj.firstName || obj.first_name || "",
      lastName: obj.lastName || obj.last_name || "",
      createdAt: obj.createdAt ? new Date(obj.createdAt) : new Date(),
    };
  } catch {
    return null;
  }
}

function setStoredUser(u: User | null) {
  if (!u) {
    localStorage.removeItem(USER_KEY);
    return;
  }
  localStorage.setItem(
    USER_KEY,
    JSON.stringify({
      ...u,
      createdAt: u.createdAt.toISOString(),
    })
  );
}

// -------- Safe parse for various backend shapes --------
function parseUser(payload: any): User | null {
  if (!payload) return null;

  // Preferred: { user: {...} }
  const src = payload.user ?? payload;
  if (!src || !src.email) return null;

  return {
    id: src.id || "",
    email: src.email,
    firstName: src.firstName || src.first_name || "",
    lastName: src.lastName || src.last_name || "",
    createdAt: src.createdAt ? new Date(src.createdAt) : new Date(),
  };
}

// -------- Context --------
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// -------- Provider --------
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      // Always try the server (cookie-based session)
      const res = await fetch(`${API_CONFIG.BASE_URL}/auth/check-auth`, {
        method: "GET",
        headers: { accept: "application/json" },
        credentials: "include",
      });

      if (res.status === 200) {
        const data = await res.json();
        const u = parseUser(data);
        if (u) {
          setUser(u);
          setStoredUser(u);
          return;
        }
        // If 200 but unexpected shape, clear
        setUser(null);
        setStoredUser(null);
        return;
      }

      if (res.status === 401) {
        setUser(null);
        setStoredUser(null);
        return;
      }

      // Other server errors: keep any stored user as a fallback
      const fallback = getStoredUser();
      setUser(fallback);
    } catch {
      // Network error: keep any stored user as a fallback
      const fallback = getStoredUser();
      setUser(fallback);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login: AuthContextType["login"] = async (email, password) => {
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
        credentials: "include", // <-- cookie session
      });

      if (res.status === 200) {
        // After login, immediately hydrate user from check-auth
        await checkAuth();
        if (!getStoredUser()) {
          return { success: false, error: "Login succeeded but no user data returned." };
        }
        return { success: true };
      }

      // Surface API error message where possible
      try {
        const err = await res.json();
        return { success: false, error: err.message || err.error || "Invalid email or password." };
      } catch {
        return { success: false, error: "Invalid email or password." };
      }
    } catch {
      return { success: false, error: "Unable to connect to the server. Please try again." };
    }
  };

  const register: AuthContextType["register"] = async (data) => {
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email.trim(),
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          password: data.password.trim(),
        }),
        credentials: "include",
      });

      if (res.status === 200 || res.status === 201) {
        // Some backends auto-login after register; hydrate regardless
        await checkAuth();
        return { success: true };
      }

      try {
        const err = await res.json();
        return { success: false, error: err.message || err.error || "Registration failed." };
      } catch {
        return { success: false, error: "Registration failed." };
      }
    } catch {
      return { success: false, error: "Unable to connect to the server." };
    }
  };

  const logout: AuthContextType["logout"] = async () => {
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/auth/logout`, {
        method: "POST",
        headers: { accept: "application/json" },
        credentials: "include",
      });

      // Treat 200 and 401 as "logged out"
      if (res.status === 200 || res.status === 401) {
        setUser(null);
        setStoredUser(null);
        return { success: true };
      }

      return { success: false, error: "Logout failed. Please try again." };
    } catch {
      // Still clear locally
      setUser(null);
      setStoredUser(null);
      return { success: false, error: "Network error. You have been logged out locally." };
    }
  };

  const resetPassword: AuthContextType["resetPassword"] = async (email) => {
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (res.status === 200) return { success: true };

      try {
        const err = await res.json();
        return { success: false, error: err.message || err.error || "Reset failed." };
      } catch {
        return { success: false, error: "Reset failed." };
      }
    } catch {
      return { success: false, error: "Unable to connect to the server." };
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    resetPassword,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// -------- Hook --------
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
