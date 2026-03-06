import { useState } from "react";

export interface Session {
  role: "admin" | "supervisor";
  username: string;
  name: string;
}

const SESSION_KEY = "pc_erp_session";
const SUPERVISORS_KEY = "pc_erp_supervisors";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";
const ADMIN_NAME = "Administrator";

function getStoredSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

function setStoredSession(session: Session | null) {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

export interface SupervisorAccount {
  id: string;
  username: string;
  password: string;
  name: string;
  status: "Active" | "Inactive";
  createdAt: string;
}

function getSupervisors(): SupervisorAccount[] {
  try {
    const raw = localStorage.getItem(SUPERVISORS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SupervisorAccount[];
  } catch {
    return [];
  }
}

// Export all supervisor accounts as a base64 sync code
export function exportSyncCode(): string {
  const supervisors = getSupervisors();
  return btoa(JSON.stringify(supervisors));
}

// Import supervisor accounts from a base64 sync code (merges, doesn't replace)
export function importSyncCode(code: string): {
  ok: boolean;
  count: number;
  error?: string;
} {
  try {
    const decoded = JSON.parse(atob(code.trim())) as SupervisorAccount[];
    if (!Array.isArray(decoded))
      return { ok: false, count: 0, error: "Invalid sync code" };
    const existing = getSupervisors();
    const merged = [...existing];
    let count = 0;
    for (const acc of decoded) {
      if (!acc.username || !acc.password || !acc.name) continue;
      const idx = merged.findIndex((s) => s.username === acc.username);
      if (idx === -1) {
        merged.push(acc);
        count++;
      } else {
        merged[idx] = acc;
        count++;
      }
    }
    localStorage.setItem(SUPERVISORS_KEY, JSON.stringify(merged));
    return { ok: true, count };
  } catch {
    return { ok: false, count: 0, error: "Invalid sync code format" };
  }
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(getStoredSession);

  const login = (
    username: string,
    password: string,
  ): { ok: boolean; error?: string } => {
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      return { ok: false, error: "Please enter your login ID and password." };
    }

    // Check admin credentials first
    if (
      trimmedUsername === ADMIN_USERNAME &&
      trimmedPassword === ADMIN_PASSWORD
    ) {
      const newSession: Session = {
        role: "admin",
        username: ADMIN_USERNAME,
        name: ADMIN_NAME,
      };
      setStoredSession(newSession);
      setSession(newSession);
      return { ok: true };
    }

    // Check supervisor accounts
    const supervisors = getSupervisors();
    const supervisor = supervisors.find(
      (s) =>
        s.username === trimmedUsername &&
        s.password === trimmedPassword &&
        s.status === "Active",
    );

    if (supervisor) {
      const newSession: Session = {
        role: "supervisor",
        username: supervisor.username,
        name: supervisor.name,
      };
      setStoredSession(newSession);
      setSession(newSession);
      return { ok: true };
    }

    // Check if supervisor exists but is inactive
    const inactiveSupervisor = supervisors.find(
      (s) => s.username === trimmedUsername && s.password === trimmedPassword,
    );
    if (inactiveSupervisor) {
      return {
        ok: false,
        error: "This account is inactive. Please contact admin.",
      };
    }

    return { ok: false, error: "Invalid login ID or password." };
  };

  const logout = () => {
    setStoredSession(null);
    setSession(null);
  };

  return { session, login, logout };
}
