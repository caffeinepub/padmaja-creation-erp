import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Attendance,
  Bundle,
  Employee,
  InventoryItem,
  Operation,
  ProductionEntry,
  QualityControl,
  Report,
  UserProfile,
} from "../backend.d";
import { useActor } from "./useActor";

// Local derived type (no backend endpoint for targets)
export interface Target {
  id: string;
  operationId: string;
  targetQty: bigint;
  date: string;
}

function today() {
  return new Date().toISOString().split("T")[0];
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching } = useActor();
  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });
  return {
    ...query,
    isLoading: isFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const qc = useQueryClient();
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["currentUserProfile"] });
      void qc.invalidateQueries({ queryKey: ["callerUserProfile"] });
    },
  });
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export function useGetDashboardStats() {
  const { actor, isFetching } = useActor();
  return useQuery<{
    todayPieces: bigint;
    todayAmount: number;
    activeBundles: number;
    presentWorkers: number;
  }>({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      if (!actor)
        return {
          todayPieces: BigInt(0),
          todayAmount: 0,
          activeBundles: 0,
          presentWorkers: 0,
        };
      const [prodSummary, bundles, attendance] = await Promise.all([
        actor.getProductionSummaryForToday(),
        actor.getBundles(),
        actor.getAttendanceByDate(today()),
      ]);
      return {
        todayPieces: prodSummary[0],
        todayAmount: prodSummary[1],
        activeBundles: bundles.filter(
          (b) => b.status === "Running" || b.status === "InProgress",
        ).length,
        presentWorkers: attendance.filter((a) => a.status === "Present").length,
      };
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
  });
}

export function useGetOperatorRankingToday(date: string) {
  const { actor, isFetching } = useActor();
  return useQuery<{ employeeId: string; totalQty: bigint }[]>({
    queryKey: ["operatorRankingToday", date],
    queryFn: async () => {
      if (!actor) return [];
      const entries = await actor.getEntriesByDate(date);
      const map = new Map<string, bigint>();
      for (const entry of entries) {
        const prev = map.get(entry.employeeId) ?? BigInt(0);
        map.set(entry.employeeId, prev + entry.quantity);
      }
      return Array.from(map.entries()).map(([employeeId, totalQty]) => ({
        employeeId,
        totalQty,
      }));
    },
    enabled: !!actor && !isFetching,
  });
}

// ── Targets (derived from Operations) ────────────────────────────────────────

export function useGetTargets() {
  const { actor, isFetching } = useActor();
  const todayStr = today();
  return useQuery<Target[]>({
    queryKey: ["targets"],
    queryFn: async () => {
      if (!actor) return [];
      const ops = await actor.getOperations();
      return ops.map((op) => ({
        id: op.id,
        operationId: op.id,
        targetQty: op.dailyTarget,
        date: todayStr,
      }));
    },
    enabled: !!actor && !isFetching,
  });
}

// ── Employees ─────────────────────────────────────────────────────────────────

export function useGetEmployees() {
  const { actor, isFetching } = useActor();
  return useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getEmployees();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddEmployee() {
  const qc = useQueryClient();
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      phone: string;
      dept: string;
      salaryType: string;
      rate: number;
      bank: string;
      aadhaar: string;
      joinDate: string;
      status: string;
      skill: string;
      specialization: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.addEmployee(
        data.name,
        data.phone,
        data.dept,
        data.salaryType,
        data.rate,
        data.bank,
        data.aadhaar,
        data.joinDate,
        data.status,
        data.skill,
        data.specialization,
      );
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["employees"] }),
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (data: {
      id: string;
      name: string;
      phone: string;
      dept: string;
      salaryType: string;
      rate: number;
      bank: string;
      aadhaar: string;
      joinDate: string;
      status: string;
      skill: string;
      specialization: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.updateEmployee(
        data.id,
        data.name,
        data.phone,
        data.dept,
        data.salaryType,
        data.rate,
        data.bank,
        data.aadhaar,
        data.joinDate,
        data.status,
        data.skill,
        data.specialization,
      );
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["employees"] }),
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.deleteEmployee(id);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["employees"] }),
  });
}

// ── Operations ────────────────────────────────────────────────────────────────

export function useGetOperations() {
  const { actor, isFetching } = useActor();
  return useQuery<Operation[]>({
    queryKey: ["operations"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOperations();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddOperation() {
  const qc = useQueryClient();
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      dept: string;
      rate: number;
      target: bigint;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.addOperation(data.name, data.dept, data.rate, data.target);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["operations"] });
      void qc.invalidateQueries({ queryKey: ["targets"] });
    },
  });
}

export function useUpdateOperation() {
  const qc = useQueryClient();
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (data: {
      id: string;
      name: string;
      dept: string;
      rate: number;
      target: bigint;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.updateOperation(
        data.id,
        data.name,
        data.dept,
        data.rate,
        data.target,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["operations"] });
      void qc.invalidateQueries({ queryKey: ["targets"] });
    },
  });
}

export function useDeleteOperation() {
  const qc = useQueryClient();
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.deleteOperation(id);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["operations"] });
      void qc.invalidateQueries({ queryKey: ["targets"] });
    },
  });
}

// ── Bundles ───────────────────────────────────────────────────────────────────

export function useGetBundles() {
  const { actor, isFetching } = useActor();
  return useQuery<Bundle[]>({
    queryKey: ["bundles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBundles();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddBundle() {
  const qc = useQueryClient();
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (data: {
      style: string;
      size: string;
      color: string;
      qty: bigint;
      date: string;
      status: string;
      stage: string;
      priority: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.addBundle(
        data.style,
        data.size,
        data.color,
        data.qty,
        data.date,
        data.status,
        data.stage,
        data.priority,
      );
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["bundles"] }),
  });
}

export function useUpdateBundle() {
  const qc = useQueryClient();
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (data: {
      id: string;
      style: string;
      size: string;
      color: string;
      qty: bigint;
      date: string;
      status: string;
      stage: string;
      priority: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.updateBundle(
        data.id,
        data.style,
        data.size,
        data.color,
        data.qty,
        data.date,
        data.status,
        data.stage,
        data.priority,
      );
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["bundles"] }),
  });
}

export function useDeleteBundle() {
  const qc = useQueryClient();
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.deleteBundle(id);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["bundles"] }),
  });
}

export function useGetBundleByQRCode() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (qrCode: string) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.getBundleByQRCode(qrCode);
    },
  });
}

// ── Production ────────────────────────────────────────────────────────────────

export function useGetProductionEntries() {
  const { actor, isFetching } = useActor();
  return useQuery<ProductionEntry[]>({
    queryKey: ["productionEntries"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getProductionEntries();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetEntriesByDate(date: string) {
  const { actor, isFetching } = useActor();
  return useQuery<ProductionEntry[]>({
    queryKey: ["productionEntries", "date", date],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getEntriesByDate(date);
    },
    enabled: !!actor && !isFetching && !!date,
  });
}

export function useGetEntriesByEmployee(employeeId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<ProductionEntry[]>({
    queryKey: ["productionEntries", "employee", employeeId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getEntriesByEmployee(employeeId);
    },
    enabled: !!actor && !isFetching && !!employeeId,
  });
}

export function useGetEntriesByBundle(bundleId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<ProductionEntry[]>({
    queryKey: ["productionEntries", "bundle", bundleId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getEntriesByBundle(bundleId);
    },
    enabled: !!actor && !isFetching && !!bundleId,
  });
}

export function useAddProductionEntry() {
  const qc = useQueryClient();
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (data: {
      date: string;
      employeeId: string;
      supervisorId?: string;
      operationId: string;
      bundleId: string;
      qty: bigint;
      rate: number;
      amount: number;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.addProductionEntry(
        data.date,
        data.employeeId,
        data.supervisorId ?? "",
        data.operationId,
        data.bundleId,
        data.qty,
        data.rate,
        data.amount,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["productionEntries"] });
      void qc.invalidateQueries({ queryKey: ["dashboardStats"] });
      void qc.invalidateQueries({ queryKey: ["operatorRankingToday"] });
    },
  });
}

// ── Attendance ────────────────────────────────────────────────────────────────

export function useGetAttendanceByDate(date: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Attendance[]>({
    queryKey: ["attendance", "date", date],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAttendanceByDate(date);
    },
    enabled: !!actor && !isFetching && !!date,
  });
}

export function useGetAttendanceByMonth(month: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Attendance[]>({
    queryKey: ["attendance", "monthly", month],
    queryFn: async () => {
      if (!actor) return [];
      const [yearStr, monStr] = month.split("-");
      const year = Number.parseInt(yearStr);
      const mon = Number.parseInt(monStr);
      const daysInMonth = new Date(year, mon, 0).getDate();
      const dates = Array.from(
        { length: daysInMonth },
        (_, i) =>
          `${year}-${String(mon).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`,
      );
      const results = await Promise.all(
        dates.map((d) => actor.getAttendanceByDate(d)),
      );
      return results.flat();
    },
    enabled: !!actor && !isFetching && !!month,
  });
}

export function useMarkAttendance() {
  const qc = useQueryClient();
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (data: {
      date: string;
      employeeId: string;
      status: string;
      checkIn?: string;
      checkOut?: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.markAttendance(
        data.date,
        data.employeeId,
        data.status,
        data.checkIn ?? "",
        data.checkOut ?? "",
      );
    },
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({
        queryKey: ["attendance", "date", variables.date],
      });
      void qc.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useUpdateAttendance() {
  const qc = useQueryClient();
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (data: {
      id: string;
      date: string;
      employeeId: string;
      status: string;
      checkIn: string;
      checkOut: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.updateAttendance(
        data.id,
        data.date,
        data.employeeId,
        data.status,
        data.checkIn,
        data.checkOut,
      );
    },
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({
        queryKey: ["attendance", "date", variables.date],
      });
    },
  });
}

// ── Inventory ─────────────────────────────────────────────────────────────────

export function useGetInventory() {
  const { actor, isFetching } = useActor();
  return useQuery<InventoryItem[]>({
    queryKey: ["inventory"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getInventory();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetLowStockItems() {
  const { actor, isFetching } = useActor();
  return useQuery<InventoryItem[]>({
    queryKey: ["inventory", "lowStock"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLowStockItems();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddInventoryItem() {
  const qc = useQueryClient();
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (data: {
      itemName: string;
      stockQty: bigint;
      unit: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.addInventoryItem(data.itemName, data.stockQty, data.unit);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["inventory"] }),
  });
}

export function useUpdateInventoryItem() {
  const qc = useQueryClient();
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (data: {
      id: string;
      itemName: string;
      stockQty: bigint;
      unit: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.updateInventoryItem(
        data.id,
        data.itemName,
        data.stockQty,
        data.unit,
      );
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["inventory"] }),
  });
}

export function useIssueInventoryToBundle() {
  const qc = useQueryClient();
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (data: { id: string; qty: bigint }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.issueInventoryToBundle(data.id, data.qty);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["inventory"] }),
  });
}

// ── Quality Control ───────────────────────────────────────────────────────────

export function useGetQualityControl() {
  const { actor, isFetching } = useActor();
  return useQuery<QualityControl[]>({
    queryKey: ["qualityControl"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getQualityControl();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddQualityControl() {
  const qc = useQueryClient();
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (data: {
      bundleId: string;
      operationId: string;
      qty: bigint;
      reason: string;
      rework: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.addQualityControl(
        data.bundleId,
        data.operationId,
        data.qty,
        data.reason,
        data.rework,
      );
    },
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: ["qualityControl"] }),
  });
}

// ── Reports ───────────────────────────────────────────────────────────────────

export function useGetMonthlySalary(year: number, month: number) {
  const { actor, isFetching } = useActor();
  return useQuery<Report[]>({
    queryKey: ["salary", year, month],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSalarySheet(BigInt(year), BigInt(month));
    },
    enabled: !!actor && !isFetching && year > 0 && month > 0,
  });
}

export function useGetPerformanceRanking() {
  const { actor, isFetching } = useActor();
  return useQuery<{ totalPieces: bigint; employeeId: string }[]>({
    queryKey: ["performanceRanking"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPerformanceRanking();
    },
    enabled: !!actor && !isFetching,
  });
}

// ── Set Target (updates operation's dailyTarget) ─────────────────────────────

export function useSetTarget() {
  const qc = useQueryClient();
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (data: {
      operationId: string;
      qty: bigint;
      date: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      const op = await actor.getOperation(data.operationId);
      if (!op) throw new Error("Operation not found");
      return actor.updateOperation(
        data.operationId,
        op.name,
        op.department,
        op.ratePerPiece,
        data.qty,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["operations"] });
      void qc.invalidateQueries({ queryKey: ["targets"] });
    },
  });
}

// ── Bundle Progress ───────────────────────────────────────────────────────────

export function useGetBundleProgress(bundleId: string) {
  const { actor, isFetching } = useActor();
  const operationsQuery = useGetOperations();
  return useQuery<
    { operationId: string; completed: boolean; totalQty: number }[]
  >({
    queryKey: ["bundleProgress", bundleId],
    queryFn: async () => {
      if (!actor || !bundleId) return [];
      const entries = await actor.getEntriesByBundle(bundleId);
      const ops: import("../backend.d").Operation[] =
        operationsQuery.data ?? (await actor.getOperations());
      const completedOps = new Set(entries.map((e) => e.operationId));
      return ops.map((op) => ({
        operationId: op.id,
        completed: completedOps.has(op.id),
        totalQty: entries
          .filter((e) => e.operationId === op.id)
          .reduce((s, e) => s + Number(e.quantity), 0),
      }));
    },
    enabled: !!actor && !isFetching && !!bundleId,
  });
}
