/**
 * useAutoSync.ts
 * Auto-sync engine for Padmaja Creation ERP.
 *
 * How it works:
 * - Admin generates a 6-digit PIN and writes master data to `pc_sync_<PIN>_master`
 * - Supervisor enters the PIN once; polls `pc_sync_<PIN>_master` every 30s
 * - Supervisor writes their entries to `pc_sync_<PIN>_entries_<username>`
 * - Admin polls all `pc_sync_<PIN>_entries_*` keys every 30s
 * - BroadcastChannel fires instant sync for same-browser tabs
 */

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

// ── Storage key helpers ────────────────────────────────────────────────────────
const SYNC_PIN_KEY = "pc_erp_sync_pin";
const SYNC_ROLE_KEY = "pc_erp_sync_role";
const SYNC_LAST_SEEN_KEY = "pc_erp_sync_last_seen";
const BC_CHANNEL = "pc_erp_auto_sync";

export function getMasterKey(pin: string): string {
  return `pc_sync_${pin}_master`;
}
export function getEntriesKey(pin: string, username: string): string {
  return `pc_sync_${pin}_entries_${username}`;
}

// ── PIN management ─────────────────────────────────────────────────────────────
export function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getStoredPin(): string | null {
  return localStorage.getItem(SYNC_PIN_KEY);
}

export function savePin(pin: string): void {
  localStorage.setItem(SYNC_PIN_KEY, pin);
  localStorage.setItem(SYNC_ROLE_KEY, "admin");
}

export function clearPin(): void {
  const pin = getStoredPin();
  if (pin) {
    // Remove master key when disabling
    localStorage.removeItem(getMasterKey(pin));
  }
  localStorage.removeItem(SYNC_PIN_KEY);
  localStorage.removeItem(SYNC_ROLE_KEY);
}

export function getSupervisorPin(): string | null {
  return localStorage.getItem(SYNC_PIN_KEY);
}

export function saveSupervisorPin(pin: string): void {
  localStorage.setItem(SYNC_PIN_KEY, pin);
  localStorage.setItem(SYNC_ROLE_KEY, "supervisor");
}

// ── Raw key helpers (avoid localStore re-serialization) ───────────────────────
function getRaw(key: string): unknown[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) as unknown[];
  } catch {
    return [];
  }
}

function setRaw(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// ── Master data payload ───────────────────────────────────────────────────────
interface MasterPayload {
  updatedAt: number;
  employees: unknown[];
  operations: unknown[];
  bundles: unknown[];
  supervisors: unknown[];
}

/** Admin: write all master data to the shared sync key */
export function pushMasterData(pin: string): void {
  if (!pin) return;
  const payload: MasterPayload = {
    updatedAt: Date.now(),
    employees: getRaw("pc_erp_employees"),
    operations: getRaw("pc_erp_operations"),
    bundles: getRaw("pc_erp_bundles"),
    supervisors: getRaw("pc_erp_supervisors"),
  };
  setRaw(getMasterKey(pin), payload);

  // Broadcast instant sync to other tabs
  try {
    const bc = new BroadcastChannel(BC_CHANNEL);
    bc.postMessage({ type: "master_updated", pin });
    bc.close();
  } catch {
    // BroadcastChannel not supported — polling only
  }
}

/** Admin: pull supervisor entries from all pc_sync_<PIN>_entries_* keys */
export function pullSupervisorEntries(pin: string): {
  entriesAdded: number;
  attendanceAdded: number;
} {
  if (!pin) return { entriesAdded: 0, attendanceAdded: 0 };

  const prefix = `pc_sync_${pin}_entries_`;
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(prefix)) keys.push(key);
  }

  const PRODUCTION_KEY = "pc_erp_production";
  const ATTENDANCE_KEY = "pc_erp_attendance";
  let totalEntriesAdded = 0;
  let totalAttendanceAdded = 0;

  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const payload = JSON.parse(raw) as {
        productionEntries?: Array<{ id?: string }>;
        attendance?: Array<{ id?: string }>;
      };

      // Merge production entries
      if (Array.isArray(payload.productionEntries)) {
        const existing = getRaw(PRODUCTION_KEY) as Array<{ id?: string }>;
        const existingIds = new Set(existing.map((e) => e.id));
        const toAdd = payload.productionEntries.filter(
          (e) => e.id && !existingIds.has(e.id),
        );
        if (toAdd.length > 0) {
          setRaw(PRODUCTION_KEY, [...existing, ...toAdd]);
          totalEntriesAdded += toAdd.length;
        }
      }

      // Merge attendance (upsert by id)
      if (Array.isArray(payload.attendance)) {
        const existing = getRaw(ATTENDANCE_KEY) as Array<{ id?: string }>;
        const existingMap = new Map(existing.map((a) => [a.id, a]));
        let changed = 0;
        for (const a of payload.attendance) {
          if (a.id && !existingMap.has(a.id)) {
            existingMap.set(a.id, a);
            changed++;
          } else if (a.id) {
            existingMap.set(a.id, a); // update existing
          }
        }
        if (changed > 0) {
          setRaw(ATTENDANCE_KEY, Array.from(existingMap.values()));
          totalAttendanceAdded += changed;
        }
      }
    } catch {
      // skip malformed keys
    }
  }

  return {
    entriesAdded: totalEntriesAdded,
    attendanceAdded: totalAttendanceAdded,
  };
}

/** Supervisor: pull master data from shared key; returns whether it was updated */
export function pullMasterData(pin: string): {
  updated: boolean;
  error?: string;
} {
  if (!pin) return { updated: false };
  try {
    const raw = localStorage.getItem(getMasterKey(pin));
    if (!raw)
      return {
        updated: false,
        error:
          "No data found for this PIN. Make sure Admin has enabled Auto-Sync.",
      };

    const payload = JSON.parse(raw) as MasterPayload;
    const lastSeen = Number(localStorage.getItem(SYNC_LAST_SEEN_KEY) ?? "0");

    if (payload.updatedAt <= lastSeen) return { updated: false };

    // Write master data
    if (Array.isArray(payload.employees))
      setRaw("pc_erp_employees", payload.employees);
    if (Array.isArray(payload.operations))
      setRaw("pc_erp_operations", payload.operations);
    if (Array.isArray(payload.bundles))
      setRaw("pc_erp_bundles", payload.bundles);
    if (Array.isArray(payload.supervisors))
      setRaw("pc_erp_supervisors", payload.supervisors);

    // Update counters so IDs don't clash
    updateCountersFromPayload(payload);

    localStorage.setItem(SYNC_LAST_SEEN_KEY, String(payload.updatedAt));
    return { updated: true };
  } catch {
    return { updated: false, error: "Failed to read sync data." };
  }
}

function updateCountersFromPayload(payload: MasterPayload): void {
  try {
    const existingCounters = JSON.parse(
      localStorage.getItem("pc_erp_counters") ?? "{}",
    ) as Record<string, number>;

    const maxBundle = (payload.bundles as Array<{ id?: string }>).reduce(
      (max, b) => {
        const m = String(b.id ?? "").match(/^B(\d+)$/);
        return m ? Math.max(max, Number.parseInt(m[1], 10)) : max;
      },
      existingCounters.bundle ?? 0,
    );
    const maxEmp = (payload.employees as Array<{ id?: string }>).reduce(
      (max, e) => {
        const m = String(e.id ?? "").match(/^EMP(\d+)$/);
        return m ? Math.max(max, Number.parseInt(m[1], 10)) : max;
      },
      existingCounters.employee ?? 0,
    );
    const maxOp = (payload.operations as Array<{ id?: string }>).reduce(
      (max, o) => {
        const m = String(o.id ?? "").match(/^OP(\d+)$/);
        return m ? Math.max(max, Number.parseInt(m[1], 10)) : max;
      },
      existingCounters.operation ?? 0,
    );

    setRaw("pc_erp_counters", {
      ...existingCounters,
      bundle: maxBundle,
      employee: maxEmp,
      operation: maxOp,
    });
  } catch {
    // ignore
  }
}

/** Supervisor: push local entries to the shared sync key */
export function pushEntries(pin: string, username: string): void {
  if (!pin || !username) return;
  const payload = {
    pushedAt: Date.now(),
    supervisorUsername: username,
    productionEntries: getRaw("pc_erp_production"),
    attendance: getRaw("pc_erp_attendance"),
  };
  setRaw(getEntriesKey(pin, username), payload);

  // Broadcast to other tabs
  try {
    const bc = new BroadcastChannel(BC_CHANNEL);
    bc.postMessage({ type: "entries_updated", pin, username });
    bc.close();
  } catch {
    // polling fallback
  }
}

// ── Admin Auto-Sync Hook ───────────────────────────────────────────────────────
export interface AdminAutoSyncState {
  pin: string | null;
  isEnabled: boolean;
  lastSyncAt: Date | null;
  syncNow: () => void;
  enable: (pin?: string) => string;
  disable: () => void;
}

export function useAdminAutoSync(): AdminAutoSyncState {
  const queryClient = useQueryClient();
  const [pin, setPin] = useState<string | null>(() => {
    const stored = getStoredPin();
    const role = localStorage.getItem(SYNC_ROLE_KEY);
    return role === "admin" ? stored : null;
  });
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bcRef = useRef<BroadcastChannel | null>(null);

  const doSync = useCallback(
    (currentPin: string) => {
      try {
        const { entriesAdded } = pullSupervisorEntries(currentPin);
        pushMasterData(currentPin);
        setLastSyncAt(new Date());
        if (entriesAdded > 0) {
          void queryClient.invalidateQueries({
            queryKey: ["productionEntries"],
          });
          void queryClient.invalidateQueries({ queryKey: ["attendance"] });
          void queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
          void queryClient.invalidateQueries({ queryKey: ["operatorRanking"] });
        }
      } catch {
        // fail silently
      }
    },
    [queryClient],
  );

  const startPolling = useCallback(
    (activePin: string) => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        doSync(activePin);
      }, 30000);

      // BroadcastChannel listener for instant sync from supervisor tabs
      try {
        if (bcRef.current) bcRef.current.close();
        const bc = new BroadcastChannel(BC_CHANNEL);
        bc.onmessage = (e: MessageEvent<{ type: string; pin: string }>) => {
          if (e.data.pin === activePin && e.data.type === "entries_updated") {
            doSync(activePin);
          }
        };
        bcRef.current = bc;
      } catch {
        // no BroadcastChannel
      }
    },
    [doSync],
  );

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (bcRef.current) {
      bcRef.current.close();
      bcRef.current = null;
    }
  }, []);

  // Auto-start polling on mount if PIN is set
  useEffect(() => {
    if (pin) {
      doSync(pin); // immediate sync on mount
      startPolling(pin);
    }
    return () => stopPolling();
  }, [pin, doSync, startPolling, stopPolling]);

  const enable = useCallback(
    (customPin?: string): string => {
      const newPin = customPin ?? generatePin();
      savePin(newPin);
      setPin(newPin);
      pushMasterData(newPin);
      setLastSyncAt(new Date());
      startPolling(newPin);
      return newPin;
    },
    [startPolling],
  );

  const disable = useCallback(() => {
    stopPolling();
    clearPin();
    setPin(null);
    setLastSyncAt(null);
  }, [stopPolling]);

  const syncNow = useCallback(() => {
    if (!pin) return;
    doSync(pin);
  }, [pin, doSync]);

  return { pin, isEnabled: !!pin, lastSyncAt, syncNow, enable, disable };
}

// ── Supervisor Auto-Sync Hook ──────────────────────────────────────────────────
export type SyncStatus = "idle" | "syncing" | "synced" | "error";

export interface SupervisorAutoSyncState {
  pin: string | null;
  isSetup: boolean;
  syncStatus: SyncStatus;
  lastSyncAt: Date | null;
  errorMessage: string | null;
  setup: (pin: string) => Promise<{ ok: boolean; error?: string }>;
  disconnect: () => void;
  pushNow: (username: string) => void;
}

export function useSupervisorAutoSync(
  username: string,
): SupervisorAutoSyncState {
  const queryClient = useQueryClient();
  const [pin, setPin] = useState<string | null>(() => {
    const stored = getSupervisorPin();
    const role = localStorage.getItem(SYNC_ROLE_KEY);
    return role === "supervisor" ? stored : null;
  });
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bcRef = useRef<BroadcastChannel | null>(null);

  const doPull = useCallback(
    (currentPin: string, currentUsername: string) => {
      setSyncStatus("syncing");
      try {
        const result = pullMasterData(currentPin);
        if (result.error) {
          setSyncStatus("error");
          setErrorMessage(result.error);
          return;
        }
        if (result.updated) {
          void queryClient.invalidateQueries();
        }
        // Push our own entries
        if (currentUsername) {
          pushEntries(currentPin, currentUsername);
        }
        setSyncStatus("synced");
        setLastSyncAt(new Date());
        setErrorMessage(null);
      } catch {
        setSyncStatus("error");
        setErrorMessage("Sync failed. Check your PIN.");
      }
    },
    [queryClient],
  );

  const startPolling = useCallback(
    (activePin: string, activeUsername: string) => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        doPull(activePin, activeUsername);
      }, 30000);

      // BroadcastChannel for instant sync when admin updates master data
      try {
        if (bcRef.current) bcRef.current.close();
        const bc = new BroadcastChannel(BC_CHANNEL);
        bc.onmessage = (e: MessageEvent<{ type: string; pin: string }>) => {
          if (e.data.pin === activePin && e.data.type === "master_updated") {
            doPull(activePin, activeUsername);
          }
        };
        bcRef.current = bc;
      } catch {
        // no BroadcastChannel
      }
    },
    [doPull],
  );

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (bcRef.current) {
      bcRef.current.close();
      bcRef.current = null;
    }
  }, []);

  // Auto-start on mount if PIN is already set
  useEffect(() => {
    if (pin && username) {
      doPull(pin, username); // immediate on mount
      startPolling(pin, username);
    }
    return () => stopPolling();
  }, [pin, username, doPull, startPolling, stopPolling]);

  const setup = useCallback(
    async (newPin: string): Promise<{ ok: boolean; error?: string }> => {
      const trimmed = newPin.trim();
      if (!/^\d{6}$/.test(trimmed)) {
        return { ok: false, error: "PIN must be exactly 6 digits." };
      }
      // Try pulling to verify PIN is valid
      const result = pullMasterData(trimmed);
      if (result.error) {
        return { ok: false, error: result.error };
      }
      saveSupervisorPin(trimmed);
      setPin(trimmed);
      setSyncStatus("synced");
      setLastSyncAt(new Date());
      setErrorMessage(null);
      if (username) {
        pushEntries(trimmed, username);
      }
      void queryClient.invalidateQueries();
      startPolling(trimmed, username);
      return { ok: true };
    },
    [username, queryClient, startPolling],
  );

  const disconnect = useCallback(() => {
    stopPolling();
    localStorage.removeItem(SYNC_PIN_KEY);
    localStorage.removeItem(SYNC_ROLE_KEY);
    localStorage.removeItem(SYNC_LAST_SEEN_KEY);
    setPin(null);
    setSyncStatus("idle");
    setLastSyncAt(null);
    setErrorMessage(null);
  }, [stopPolling]);

  const pushNow = useCallback(
    (currentUsername: string) => {
      if (!pin || !currentUsername) return;
      pushEntries(pin, currentUsername);
    },
    [pin],
  );

  return {
    pin,
    isSetup: !!pin,
    syncStatus,
    lastSyncAt,
    errorMessage,
    setup,
    disconnect,
    pushNow,
  };
}
