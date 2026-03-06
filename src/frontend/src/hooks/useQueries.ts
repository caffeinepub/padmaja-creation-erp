import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Attendance,
  Bundle,
  Employee,
  Operation,
  ProductionEntry,
  Target,
  UserProfile,
} from "../backend.d";
import {
  attendanceStore,
  bundleStore,
  employeeStore,
  operationStore,
  productionStore,
  targetStore,
} from "../utils/localStore";

// ── Auth (kept for compatibility, but no longer used for data) ─────────────────

export function useGetCallerUserProfile() {
  return useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => null,
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function useGetCallerUserRole() {
  return useQuery({
    queryKey: ["callerUserRole"],
    queryFn: async () => "user" as const,
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function useSaveCallerUserProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (_profile: UserProfile) => {
      // no-op for local auth
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

// ── Employees ─────────────────────────────────────────────────────────────────

export function useGetEmployees() {
  return useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: async () => employeeStore.getAll(),
    staleTime: 0,
  });
}

export function useAddEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      phone: string;
      dept: string;
      salaryType: string;
      joinDate: string;
      status: string;
      accountNumber: string;
      aadharNumber: string;
    }): Promise<string> => {
      return employeeStore.add({
        name: data.name,
        phone: data.phone,
        department: data.dept,
        salaryType: data.salaryType,
        joinDate: data.joinDate,
        status: data.status,
        accountNumber: data.accountNumber,
        aadharNumber: data.aadharNumber,
      });
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["employees"] }),
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: string;
      name: string;
      phone: string;
      dept: string;
      salaryType: string;
      joinDate: string;
      status: string;
      accountNumber: string;
      aadharNumber: string;
    }): Promise<void> => {
      employeeStore.update(data.id, {
        name: data.name,
        phone: data.phone,
        department: data.dept,
        salaryType: data.salaryType,
        joinDate: data.joinDate,
        status: data.status,
        accountNumber: data.accountNumber,
        aadharNumber: data.aadharNumber,
      });
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["employees"] }),
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      employeeStore.delete(id);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["employees"] }),
  });
}

// ── Operations ────────────────────────────────────────────────────────────────

export function useGetOperations() {
  return useQuery<Operation[]>({
    queryKey: ["operations"],
    queryFn: async () => operationStore.getAll(),
    staleTime: 0,
  });
}

export function useAddOperation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      rate: number;
      dept: string;
      target: bigint;
    }): Promise<string> => {
      return operationStore.add({
        name: data.name,
        ratePerPiece: data.rate,
        department: data.dept,
        dailyTarget: data.target,
      });
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["operations"] }),
  });
}

export function useUpdateOperation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: string;
      name: string;
      rate: number;
      dept: string;
      target: bigint;
    }): Promise<void> => {
      operationStore.update(data.id, {
        name: data.name,
        ratePerPiece: data.rate,
        department: data.dept,
        dailyTarget: data.target,
      });
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["operations"] }),
  });
}

export function useDeleteOperation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      operationStore.delete(id);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["operations"] }),
  });
}

// ── Bundles ───────────────────────────────────────────────────────────────────

export function useGetBundles() {
  return useQuery<Bundle[]>({
    queryKey: ["bundles"],
    queryFn: async () => bundleStore.getAll(),
    staleTime: 0,
  });
}

export function useAddBundle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      styleNumber: string;
      size: string;
      color: string;
      qty: bigint;
      createdDate: string;
      status: string;
    }): Promise<string> => {
      return bundleStore.add({
        styleNumber: data.styleNumber,
        size: data.size,
        color: data.color,
        quantity: data.qty,
        createdDate: data.createdDate,
        status: data.status,
      });
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["bundles"] }),
  });
}

export function useUpdateBundle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: string;
      styleNumber: string;
      size: string;
      color: string;
      qty: bigint;
      createdDate: string;
      status: string;
    }): Promise<void> => {
      bundleStore.update(data.id, {
        styleNumber: data.styleNumber,
        size: data.size,
        color: data.color,
        quantity: data.qty,
        createdDate: data.createdDate,
        status: data.status,
      });
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["bundles"] }),
  });
}

export function useDeleteBundle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      bundleStore.delete(id);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["bundles"] }),
  });
}

export function useGetBundleProgress(bundleId: string) {
  return useQuery<Array<{ completed: boolean; operationId: string }>>({
    queryKey: ["bundleProgress", bundleId],
    queryFn: async () => {
      if (!bundleId) return [];
      const entries = productionStore
        .getAll()
        .filter((e) => e.bundleId === bundleId);
      const opSet = new Set(entries.map((e) => e.operationId));
      return Array.from(opSet).map((opId) => ({
        operationId: opId,
        completed: true,
      }));
    },
    enabled: !!bundleId,
    staleTime: 0,
  });
}

// ── Production Entries ────────────────────────────────────────────────────────

export function useGetProductionEntries() {
  return useQuery<ProductionEntry[]>({
    queryKey: ["productionEntries"],
    queryFn: async () => productionStore.getAll(),
    staleTime: 0,
  });
}

export function useGetEntriesByDate(date: string) {
  return useQuery<ProductionEntry[]>({
    queryKey: ["productionEntries", "date", date],
    queryFn: async () => {
      if (!date) return [];
      return productionStore.getByDate(date);
    },
    enabled: !!date,
    staleTime: 0,
  });
}

export function useGetEntriesByMonth(year: number, month: number) {
  return useQuery<ProductionEntry[]>({
    queryKey: ["productionEntries", "month", year, month],
    queryFn: async () => productionStore.getByMonth(year, month),
    staleTime: 0,
  });
}

export function useAddProductionEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      date: string;
      employeeId: string;
      operationId: string;
      bundleId: string;
      qty: bigint;
      rate: number;
      amount: number;
    }): Promise<string> => {
      return productionStore.add({
        date: data.date,
        employeeId: data.employeeId,
        operationId: data.operationId,
        bundleId: data.bundleId,
        quantity: data.qty,
        rate: data.rate,
        amount: data.amount,
      });
    },
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: ["productionEntries"] }),
  });
}

// ── Attendance ────────────────────────────────────────────────────────────────

export function useGetAttendanceByDate(date: string) {
  return useQuery<Attendance[]>({
    queryKey: ["attendance", "date", date],
    queryFn: async () => {
      if (!date) return [];
      return attendanceStore.getByDate(date);
    },
    enabled: !!date,
    staleTime: 0,
  });
}

export function useGetAllAttendance() {
  return useQuery<Attendance[]>({
    queryKey: ["attendance", "all"],
    queryFn: async () => attendanceStore.getAll(),
    staleTime: 0,
  });
}

export function useMarkAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      date: string;
      employeeId: string;
      status: string;
    }): Promise<string> => {
      return attendanceStore.mark(data.date, data.employeeId, data.status);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["attendance"] }),
  });
}

export function useUpdateAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: string;
      date: string;
      employeeId: string;
      status: string;
    }): Promise<void> => {
      attendanceStore.update(data.id, data.date, data.employeeId, data.status);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["attendance"] }),
  });
}

export function useGetAttendanceByMonth(month: string) {
  return useQuery<Attendance[]>({
    queryKey: ["attendance", "month", month],
    queryFn: async () => {
      if (!month) return [];
      return attendanceStore.getAll().filter((a) => a.date.startsWith(month));
    },
    enabled: !!month,
    staleTime: 0,
  });
}

// ── Targets ───────────────────────────────────────────────────────────────────

export function useGetTargets() {
  return useQuery<Target[]>({
    queryKey: ["targets"],
    queryFn: async () => targetStore.getAll(),
    staleTime: 0,
  });
}

export function useSetTarget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      operationId: string;
      qty: bigint;
      date: string;
    }): Promise<string> => {
      return targetStore.set(data.operationId, data.qty, data.date);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["targets"] }),
  });
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export function useGetDashboardStats() {
  return useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const todayEntries = productionStore.getByDate(today);
      const todayProduction = BigInt(
        todayEntries.reduce((s, e) => s + Number(e.quantity), 0),
      );
      const runningBundlesCount = BigInt(
        bundleStore
          .getAll()
          .filter((b) => b.status === "Running" || b.status === "running")
          .length,
      );
      return { todayProduction, runningBundlesCount };
    },
    staleTime: 0,
  });
}

export function useGetOperatorRankingToday(todayDate: string) {
  return useQuery<Array<{ totalQty: bigint; employeeId: string }>>({
    queryKey: ["operatorRanking", todayDate],
    queryFn: async () => {
      if (!todayDate) return [];
      const entries = productionStore.getByDate(todayDate);
      const empMap = new Map<string, number>();
      for (const e of entries) {
        empMap.set(
          e.employeeId,
          (empMap.get(e.employeeId) ?? 0) + Number(e.quantity),
        );
      }
      return Array.from(empMap.entries())
        .map(([employeeId, qty]) => ({ employeeId, totalQty: BigInt(qty) }))
        .sort((a, b) => Number(b.totalQty - a.totalQty));
    },
    enabled: !!todayDate,
    staleTime: 0,
  });
}

export function useGetMonthlySalary(year: number, month: number) {
  return useQuery<
    Array<{ totalPieces: bigint; employeeId: string; totalAmount: number }>
  >({
    queryKey: ["monthlySalary", year, month],
    queryFn: async () => {
      const entries = productionStore.getByMonth(year, month);
      const empMap = new Map<string, { pieces: number; amount: number }>();
      for (const e of entries) {
        const existing = empMap.get(e.employeeId) ?? { pieces: 0, amount: 0 };
        empMap.set(e.employeeId, {
          pieces: existing.pieces + Number(e.quantity),
          amount: existing.amount + e.amount,
        });
      }
      return Array.from(empMap.entries()).map(([employeeId, data]) => ({
        employeeId,
        totalPieces: BigInt(data.pieces),
        totalAmount: data.amount,
      }));
    },
    staleTime: 0,
  });
}
