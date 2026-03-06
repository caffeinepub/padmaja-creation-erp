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

interface SyncPayload {
  supervisors: SupervisorAccount[];
  // Master data shared by admin
  employees?: unknown[];
  operations?: unknown[];
  bundles?: unknown[];
}

// Export all supervisor accounts + master data as a base64 sync code
export function exportSyncCode(): string {
  const supervisors = getSupervisors();
  // Serialize master data as raw objects (localStore handles bigint conversion)
  const KEYS = {
    employees: "pc_erp_employees",
    operations: "pc_erp_operations",
    bundles: "pc_erp_bundles",
  };
  function getRaw(key: string): unknown[] {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      return JSON.parse(raw) as unknown[];
    } catch {
      return [];
    }
  }
  const payload: SyncPayload = {
    supervisors,
    employees: getRaw(KEYS.employees),
    operations: getRaw(KEYS.operations),
    bundles: getRaw(KEYS.bundles),
  };
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

// Import supervisor accounts + master data from a base64 sync code
export function importSyncCode(code: string): {
  ok: boolean;
  count: number;
  error?: string;
} {
  try {
    const jsonStr = decodeURIComponent(escape(atob(code.trim())));
    const decoded = JSON.parse(jsonStr) as SyncPayload | SupervisorAccount[]; // backward compat

    // Support old format (plain array of supervisors)
    const payload: SyncPayload = Array.isArray(decoded)
      ? { supervisors: decoded }
      : decoded;

    if (!payload.supervisors || !Array.isArray(payload.supervisors))
      return { ok: false, count: 0, error: "Invalid sync code" };

    // Merge supervisor accounts
    const existing = getSupervisors();
    const merged = [...existing];
    let count = 0;
    for (const acc of payload.supervisors) {
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

    // Import master data (employees, operations, bundles) if present
    const KEYS = {
      employees: "pc_erp_employees",
      operations: "pc_erp_operations",
      bundles: "pc_erp_bundles",
      counters: "pc_erp_counters",
    };

    if (
      payload.employees &&
      Array.isArray(payload.employees) &&
      payload.employees.length > 0
    ) {
      localStorage.setItem(KEYS.employees, JSON.stringify(payload.employees));
    }
    if (
      payload.operations &&
      Array.isArray(payload.operations) &&
      payload.operations.length > 0
    ) {
      localStorage.setItem(KEYS.operations, JSON.stringify(payload.operations));
    }
    if (
      payload.bundles &&
      Array.isArray(payload.bundles) &&
      payload.bundles.length > 0
    ) {
      localStorage.setItem(KEYS.bundles, JSON.stringify(payload.bundles));
      // Update counters so new bundles don't clash
      try {
        const existingCounters = JSON.parse(
          localStorage.getItem(KEYS.counters) ?? "{}",
        ) as Record<string, number>;
        const bundlesArr = payload.bundles as Array<{ id?: string }>;
        const maxBundle = bundlesArr.reduce((max, b) => {
          const m = String(b.id ?? "").match(/^B(\d+)$/);
          if (m) return Math.max(max, Number.parseInt(m[1], 10));
          return max;
        }, existingCounters.bundle ?? 0);
        const empsArr = (payload.employees ?? []) as Array<{ id?: string }>;
        const maxEmp = empsArr.reduce((max, e) => {
          const m = String(e.id ?? "").match(/^EMP(\d+)$/);
          if (m) return Math.max(max, Number.parseInt(m[1], 10));
          return max;
        }, existingCounters.employee ?? 0);
        const opsArr = (payload.operations ?? []) as Array<{ id?: string }>;
        const maxOp = opsArr.reduce((max, o) => {
          const m = String(o.id ?? "").match(/^OP(\d+)$/);
          if (m) return Math.max(max, Number.parseInt(m[1], 10));
          return max;
        }, existingCounters.operation ?? 0);
        localStorage.setItem(
          KEYS.counters,
          JSON.stringify({
            ...existingCounters,
            bundle: maxBundle,
            employee: maxEmp,
            operation: maxOp,
          }),
        );
      } catch {
        // ignore counter update errors
      }
    }

    return { ok: true, count };
  } catch {
    return { ok: false, count: 0, error: "Invalid sync code format" };
  }
}

// Import only master data (no supervisor accounts) — used for data refresh
export function importDataFromSyncCode(code: string): {
  ok: boolean;
  error?: string;
} {
  try {
    const jsonStr = decodeURIComponent(escape(atob(code.trim())));
    const decoded = JSON.parse(jsonStr) as SyncPayload | SupervisorAccount[];

    const payload: SyncPayload = Array.isArray(decoded)
      ? { supervisors: decoded }
      : decoded;

    const KEYS = {
      employees: "pc_erp_employees",
      operations: "pc_erp_operations",
      bundles: "pc_erp_bundles",
      counters: "pc_erp_counters",
    };

    let updated = false;
    if (payload.employees && Array.isArray(payload.employees)) {
      localStorage.setItem(KEYS.employees, JSON.stringify(payload.employees));
      updated = true;
    }
    if (payload.operations && Array.isArray(payload.operations)) {
      localStorage.setItem(KEYS.operations, JSON.stringify(payload.operations));
      updated = true;
    }
    if (payload.bundles && Array.isArray(payload.bundles)) {
      localStorage.setItem(KEYS.bundles, JSON.stringify(payload.bundles));
      updated = true;
    }

    // Also merge supervisor accounts in case they changed
    if (payload.supervisors && Array.isArray(payload.supervisors)) {
      const existing = getSupervisors();
      const merged = [...existing];
      for (const acc of payload.supervisors) {
        if (!acc.username || !acc.password || !acc.name) continue;
        const idx = merged.findIndex((s) => s.username === acc.username);
        if (idx === -1) {
          merged.push(acc);
        } else {
          merged[idx] = acc;
        }
      }
      localStorage.setItem(SUPERVISORS_KEY, JSON.stringify(merged));
    }

    if (!updated) return { ok: false, error: "No data found in sync code." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Invalid sync code format" };
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
