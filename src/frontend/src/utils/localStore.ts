// Local storage data store - kept for offline/compatibility use
// Main data is now stored on ICP blockchain via backend actor

import type {
  Attendance,
  Bundle,
  Employee,
  Operation,
  ProductionEntry,
} from "../backend.d";

// Local Target type (not in backend.d)
export interface Target {
  id: string;
  operationId: string;
  targetQty: bigint;
  date: string;
}

// ── Storage keys ──────────────────────────────────────────────────────────────
const KEYS = {
  employees: "pc_erp_employees",
  operations: "pc_erp_operations",
  bundles: "pc_erp_bundles",
  productionEntries: "pc_erp_production",
  attendance: "pc_erp_attendance",
  targets: "pc_erp_targets",
  counters: "pc_erp_counters",
};

function getCounters(): Record<string, number> {
  try {
    const raw = localStorage.getItem(KEYS.counters);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return {};
  }
}

function nextId(key: string, prefix: string): string {
  const counters = getCounters();
  counters[key] = (counters[key] ?? 0) + 1;
  localStorage.setItem(KEYS.counters, JSON.stringify(counters));
  return `${prefix}${counters[key]}`;
}

function getAll<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

function saveAll<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items));
}

export interface ExtendedEmployee extends Employee {
  accountNumber: string;
  aadharNumber: string;
}

function serializeEmployee(e: ExtendedEmployee): object {
  return { ...e };
}

function deserializeEmployee(e: Record<string, unknown>): ExtendedEmployee {
  return {
    ...(e as unknown as Employee),
    accountNumber: String(e.accountNumber ?? ""),
    aadharNumber: String(e.aadharNumber ?? ""),
  };
}

function serializeOperation(o: Operation): object {
  return { ...o, dailyTarget: Number(o.dailyTarget) };
}

function deserializeOperation(o: Record<string, unknown>): Operation {
  return {
    ...o,
    dailyTarget: BigInt(Number(o.dailyTarget ?? 0)),
  } as unknown as Operation;
}

function serializeBundle(b: Bundle): object {
  return { ...b, quantity: Number(b.quantity) };
}

function deserializeBundle(b: Record<string, unknown>): Bundle {
  return {
    ...b,
    quantity: BigInt(Number(b.quantity ?? 0)),
  } as unknown as Bundle;
}

function serializeProductionEntry(e: ProductionEntry): object {
  return { ...e, quantity: Number(e.quantity) };
}

function deserializeProductionEntry(
  e: Record<string, unknown>,
): ProductionEntry {
  return {
    ...e,
    quantity: BigInt(Number(e.quantity ?? 0)),
  } as unknown as ProductionEntry;
}

export const employeeStore = {
  getAll(): ExtendedEmployee[] {
    return getAll<Record<string, unknown>>(KEYS.employees).map(
      deserializeEmployee,
    );
  },
  add(
    data: Omit<Employee, "id"> & {
      accountNumber?: string;
      aadharNumber?: string;
    },
  ): string {
    const id = nextId("employee", "EMP");
    const employee: ExtendedEmployee = {
      id,
      ...data,
      accountNumber: data.accountNumber ?? "",
      aadharNumber: data.aadharNumber ?? "",
    };
    const all = employeeStore.getAll();
    all.push(employee);
    saveAll(KEYS.employees, all.map(serializeEmployee));
    return id;
  },
  update(
    id: string,
    data: Omit<Employee, "id"> & {
      accountNumber?: string;
      aadharNumber?: string;
    },
  ): void {
    const all = employeeStore.getAll();
    const idx = all.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error("Employee not found");
    all[idx] = {
      id,
      ...data,
      accountNumber: data.accountNumber ?? "",
      aadharNumber: data.aadharNumber ?? "",
    };
    saveAll(KEYS.employees, all.map(serializeEmployee));
  },
  delete(id: string): void {
    const all = employeeStore.getAll().filter((e) => e.id !== id);
    saveAll(KEYS.employees, all.map(serializeEmployee));
  },
};

export const operationStore = {
  getAll(): Operation[] {
    return getAll<Record<string, unknown>>(KEYS.operations).map(
      deserializeOperation,
    );
  },
  add(data: Omit<Operation, "id">): string {
    const id = nextId("operation", "OP");
    const op: Operation = { id, ...data };
    const all = operationStore.getAll();
    all.push(op);
    saveAll(KEYS.operations, all.map(serializeOperation));
    return id;
  },
  update(id: string, data: Omit<Operation, "id">): void {
    const all = operationStore.getAll();
    const idx = all.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error("Operation not found");
    all[idx] = { id, ...data };
    saveAll(KEYS.operations, all.map(serializeOperation));
  },
  delete(id: string): void {
    const all = operationStore.getAll().filter((o) => o.id !== id);
    saveAll(KEYS.operations, all.map(serializeOperation));
  },
};

export const bundleStore = {
  getAll(): Bundle[] {
    return getAll<Record<string, unknown>>(KEYS.bundles).map(deserializeBundle);
  },
  add(data: Omit<Bundle, "id">): string {
    const id = nextId("bundle", "B");
    const bundle: Bundle = { id, ...data };
    const all = bundleStore.getAll();
    all.push(bundle);
    saveAll(KEYS.bundles, all.map(serializeBundle));
    return id;
  },
  update(id: string, data: Omit<Bundle, "id">): void {
    const all = bundleStore.getAll();
    const idx = all.findIndex((b) => b.id === id);
    if (idx === -1) throw new Error("Bundle not found");
    all[idx] = { id, ...data };
    saveAll(KEYS.bundles, all.map(serializeBundle));
  },
  delete(id: string): void {
    const all = bundleStore.getAll().filter((b) => b.id !== id);
    saveAll(KEYS.bundles, all.map(serializeBundle));
  },
};

export const productionStore = {
  getAll(): ProductionEntry[] {
    return getAll<Record<string, unknown>>(KEYS.productionEntries).map(
      deserializeProductionEntry,
    );
  },
  add(data: Omit<ProductionEntry, "id">): string {
    const id = `PE${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const entry: ProductionEntry = { id, ...data };
    const all = productionStore.getAll();
    all.push(entry);
    saveAll(KEYS.productionEntries, all.map(serializeProductionEntry));
    return id;
  },
  getByDate(date: string): ProductionEntry[] {
    return productionStore.getAll().filter((e) => e.date === date);
  },
  getByEmployee(employeeId: string): ProductionEntry[] {
    return productionStore.getAll().filter((e) => e.employeeId === employeeId);
  },
  getByMonth(year: number, month: number): ProductionEntry[] {
    const prefix = `${year}-${String(month).padStart(2, "0")}`;
    return productionStore.getAll().filter((e) => e.date.startsWith(prefix));
  },
};

export const attendanceStore = {
  getAll(): Attendance[] {
    return getAll<Attendance>(KEYS.attendance);
  },
  mark(date: string, employeeId: string, status: string): string {
    const id = `A${employeeId}${date}`;
    const all = attendanceStore
      .getAll()
      .filter((a) => !(a.date === date && a.employeeId === employeeId));
    const rec: Attendance = {
      id,
      date,
      employeeId,
      status,
      checkIn: "",
      checkOut: "",
    };
    all.push(rec);
    saveAll(KEYS.attendance, all);
    return id;
  },
  update(id: string, date: string, employeeId: string, status: string): void {
    const all = attendanceStore.getAll();
    const idx = all.findIndex((a) => a.id === id);
    if (idx === -1) {
      attendanceStore.mark(date, employeeId, status);
      return;
    }
    all[idx] = {
      id,
      date,
      employeeId,
      status,
      checkIn: all[idx].checkIn,
      checkOut: all[idx].checkOut,
    };
    saveAll(KEYS.attendance, all);
  },
  getByDate(date: string): Attendance[] {
    return attendanceStore.getAll().filter((a) => a.date === date);
  },
};

export const targetStore = {
  getAll(): Target[] {
    return getAll<Record<string, unknown>>(KEYS.targets).map(
      (t) =>
        ({
          ...t,
          targetQty: BigInt(
            Number((t as { targetQty?: unknown }).targetQty ?? 0),
          ),
        }) as unknown as Target,
    );
  },
  set(operationId: string, qty: bigint, date: string): string {
    const id = `T${operationId}${date}`;
    const all = targetStore.getAll().filter((t) => t.id !== id);
    all.push({ id, operationId, targetQty: qty, date });
    saveAll(
      KEYS.targets,
      all.map((t) => ({ ...t, targetQty: Number(t.targetQty) })),
    );
    return id;
  },
};
