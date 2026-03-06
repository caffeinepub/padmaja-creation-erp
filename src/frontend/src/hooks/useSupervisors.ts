import { useState } from "react";
import type { SupervisorAccount } from "./useAuth";

const SUPERVISORS_KEY = "pc_erp_supervisors";

function getSupervisors(): SupervisorAccount[] {
  try {
    const raw = localStorage.getItem(SUPERVISORS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SupervisorAccount[];
  } catch {
    return [];
  }
}

function setSupervisors(supervisors: SupervisorAccount[]) {
  localStorage.setItem(SUPERVISORS_KEY, JSON.stringify(supervisors));
}

function generateId(existing: SupervisorAccount[]): string {
  const maxNum = existing.reduce((max, s) => {
    const match = s.id.match(/^SUP(\d+)$/);
    if (match) {
      const num = Number.parseInt(match[1], 10);
      return num > max ? num : max;
    }
    return max;
  }, 0);
  return `SUP${maxNum + 1}`;
}

export function useSupervisors() {
  const [supervisors, setSupervisorsState] =
    useState<SupervisorAccount[]>(getSupervisors);

  const refresh = () => {
    setSupervisorsState(getSupervisors());
  };

  const createSupervisor = (
    username: string,
    password: string,
    name: string,
  ): { ok: boolean; error?: string } => {
    const current = getSupervisors();
    const trimmed = username.trim();

    if (!trimmed || !password.trim() || !name.trim()) {
      return { ok: false, error: "All fields are required." };
    }

    // Check uniqueness (also can't be "admin")
    if (trimmed === "admin") {
      return { ok: false, error: 'Username "admin" is reserved.' };
    }

    const exists = current.some((s) => s.username === trimmed);
    if (exists) {
      return { ok: false, error: "Username already exists." };
    }

    const newSupervisor: SupervisorAccount = {
      id: generateId(current),
      username: trimmed,
      password: password.trim(),
      name: name.trim(),
      status: "Active",
      createdAt: new Date().toISOString(),
    };

    const updated = [...current, newSupervisor];
    setSupervisors(updated);
    setSupervisorsState(updated);
    return { ok: true };
  };

  const updateSupervisor = (
    id: string,
    username: string,
    password: string,
    name: string,
    status: "Active" | "Inactive",
  ): { ok: boolean; error?: string } => {
    const current = getSupervisors();
    const trimmedUsername = username.trim();
    const trimmedName = name.trim();

    if (!trimmedUsername || !trimmedName) {
      return { ok: false, error: "Name and username are required." };
    }

    if (trimmedUsername === "admin") {
      return { ok: false, error: 'Username "admin" is reserved.' };
    }

    // Check uniqueness excluding self
    const duplicate = current.find(
      (s) => s.username === trimmedUsername && s.id !== id,
    );
    if (duplicate) {
      return { ok: false, error: "Username already exists." };
    }

    const updated = current.map((s) => {
      if (s.id !== id) return s;
      return {
        ...s,
        username: trimmedUsername,
        name: trimmedName,
        status,
        // Only update password if a new one is provided
        ...(password.trim() ? { password: password.trim() } : {}),
      };
    });

    setSupervisors(updated);
    setSupervisorsState(updated);
    return { ok: true };
  };

  const deleteSupervisor = (id: string) => {
    const current = getSupervisors();
    const updated = current.filter((s) => s.id !== id);
    setSupervisors(updated);
    setSupervisorsState(updated);
  };

  return {
    supervisors,
    refresh,
    createSupervisor,
    updateSupervisor,
    deleteSupervisor,
  };
}
