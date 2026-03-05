import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Attendance,
  Bundle,
  Employee,
  Operation,
  ProductionEntry,
  Target,
  UserProfile,
  UserRole,
} from "../backend.d";
import { useActor } from "./useActor";

// ── Auth ──────────────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetCallerUserRole() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<UserRole>({
    queryKey: ["callerUserRole"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["currentUserProfile"] });
      void qc.invalidateQueries({ queryKey: ["callerUserRole"] });
    },
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
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      phone: string;
      dept: string;
      salaryType: string;
      joinDate: string;
      status: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addEmployee(
        data.name,
        data.phone,
        data.dept,
        data.salaryType,
        data.joinDate,
        data.status,
      );
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["employees"] }),
  });
}

export function useUpdateEmployee() {
  const { actor } = useActor();
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
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateEmployee(
        data.id,
        data.name,
        data.phone,
        data.dept,
        data.salaryType,
        data.joinDate,
        data.status,
      );
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["employees"] }),
  });
}

export function useDeleteEmployee() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
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
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      rate: number;
      dept: string;
      target: bigint;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addOperation(data.name, data.rate, data.dept, data.target);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["operations"] }),
  });
}

export function useUpdateOperation() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: string;
      name: string;
      rate: number;
      dept: string;
      target: bigint;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateOperation(
        data.id,
        data.name,
        data.rate,
        data.dept,
        data.target,
      );
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["operations"] }),
  });
}

export function useDeleteOperation() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteOperation(id);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["operations"] }),
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
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      styleNumber: string;
      size: string;
      color: string;
      qty: bigint;
      createdDate: string;
      status: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addBundle(
        data.styleNumber,
        data.size,
        data.color,
        data.qty,
        data.createdDate,
        data.status,
      );
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["bundles"] }),
  });
}

export function useUpdateBundle() {
  const { actor } = useActor();
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
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateBundle(
        data.id,
        data.styleNumber,
        data.size,
        data.color,
        data.qty,
        data.createdDate,
        data.status,
      );
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["bundles"] }),
  });
}

export function useDeleteBundle() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteBundle(id);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["bundles"] }),
  });
}

export function useGetBundleProgress(bundleId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Array<{ completed: boolean; operationId: string }>>({
    queryKey: ["bundleProgress", bundleId],
    queryFn: async () => {
      if (!actor || !bundleId) return [];
      return actor.getBundleProgress(bundleId);
    },
    enabled: !!actor && !isFetching && !!bundleId,
  });
}

// ── Production Entries ────────────────────────────────────────────────────────

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
      if (!actor || !date) return [];
      return actor.getEntriesByDate(date);
    },
    enabled: !!actor && !isFetching && !!date,
  });
}

export function useGetEntriesByMonth(year: number, month: number) {
  const { actor, isFetching } = useActor();
  return useQuery<ProductionEntry[]>({
    queryKey: ["productionEntries", "month", year, month],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getEntriesByMonth(BigInt(year), BigInt(month));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddProductionEntry() {
  const { actor } = useActor();
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
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addProductionEntry(
        data.date,
        data.employeeId,
        data.operationId,
        data.bundleId,
        data.qty,
        data.rate,
        data.amount,
      );
    },
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: ["productionEntries"] }),
  });
}

// ── Attendance ────────────────────────────────────────────────────────────────

export function useGetAttendanceByDate(date: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Attendance[]>({
    queryKey: ["attendance", "date", date],
    queryFn: async () => {
      if (!actor || !date) return [];
      return actor.getAttendanceByDate(date);
    },
    enabled: !!actor && !isFetching && !!date,
  });
}

export function useGetAllAttendance() {
  const { actor, isFetching } = useActor();
  return useQuery<Attendance[]>({
    queryKey: ["attendance", "all"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllAttendance();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMarkAttendance() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      date: string;
      employeeId: string;
      status: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.markAttendance(data.date, data.employeeId, data.status);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["attendance"] }),
  });
}

export function useUpdateAttendance() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: string;
      date: string;
      employeeId: string;
      status: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateAttendance(
        data.id,
        data.date,
        data.employeeId,
        data.status,
      );
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["attendance"] }),
  });
}

// ── Targets ───────────────────────────────────────────────────────────────────

export function useGetTargets() {
  const { actor, isFetching } = useActor();
  return useQuery<Target[]>({
    queryKey: ["targets"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTargets();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetTarget() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      operationId: string;
      qty: bigint;
      date: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setTarget(data.operationId, data.qty, data.date);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["targets"] }),
  });
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export function useGetDashboardStats() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      if (!actor)
        return { todayProduction: BigInt(0), runningBundlesCount: BigInt(0) };
      return actor.getDashboardStats();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetOperatorRankingToday(todayDate: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Array<{ totalQty: bigint; employeeId: string }>>({
    queryKey: ["operatorRanking", todayDate],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOperatorRankingToday(todayDate);
    },
    enabled: !!actor && !isFetching && !!todayDate,
  });
}

export function useGetMonthlySalary(year: number, month: number) {
  const { actor, isFetching } = useActor();
  return useQuery<
    Array<{ totalPieces: bigint; employeeId: string; totalAmount: number }>
  >({
    queryKey: ["monthlySalary", year, month],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMonthlySalary(BigInt(year), BigInt(month));
    },
    enabled: !!actor && !isFetching,
  });
}
