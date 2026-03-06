import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarCheck, CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useGetAttendanceByDate,
  useGetAttendanceByMonth,
  useGetEmployees,
  useMarkAttendance,
  useUpdateAttendance,
} from "../../hooks/useQueries";

function today() {
  return new Date().toISOString().split("T")[0];
}

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

type AttendanceStatus = "Present" | "Absent" | "HalfDay";

const statusColor: Record<AttendanceStatus, string> = {
  Present: "bg-green-100 text-green-800",
  Absent: "bg-red-100 text-red-800",
  HalfDay: "bg-yellow-100 text-yellow-800",
};

// ── Daily Tab ─────────────────────────────────────────────────────────────────
function DailyTab() {
  const [date, setDate] = useState(today());
  const [deptFilter, setDeptFilter] = useState<"All" | "Finishing">("All");
  const [statusMap, setStatusMap] = useState<Record<string, AttendanceStatus>>(
    {},
  );
  const [submitting, setSubmitting] = useState(false);

  const employeesQuery = useGetEmployees();
  const attendanceQuery = useGetAttendanceByDate(date);
  const markMutation = useMarkAttendance();
  const updateMutation = useUpdateAttendance();

  const allActive = (employeesQuery.data ?? []).filter(
    (e) => e.status === "Active",
  );
  const employees =
    deptFilter === "Finishing"
      ? allActive.filter((e) => e.department.toLowerCase() === "finishing")
      : allActive;

  const attendance = attendanceQuery.data ?? [];

  // Pre-fill existing attendance
  useEffect(() => {
    const map: Record<string, AttendanceStatus> = {};
    for (const a of attendance) {
      map[a.employeeId] = a.status as AttendanceStatus;
    }
    setStatusMap(map);
  }, [attendance]);

  const handleStatusChange = (empId: string, status: AttendanceStatus) => {
    setStatusMap((prev) => ({ ...prev, [empId]: status }));
  };

  const handleSubmitAll = async () => {
    const markedInView = Object.fromEntries(
      Object.entries(statusMap).filter(([empId]) =>
        employees.some((e) => e.id === empId),
      ),
    );
    if (Object.keys(markedInView).length === 0) {
      toast.error("Please mark attendance for at least one employee");
      return;
    }
    setSubmitting(true);
    try {
      const existingMap = new Map(attendance.map((a) => [a.employeeId, a]));
      const promises = Object.entries(markedInView).map(([empId, status]) => {
        const existing = existingMap.get(empId);
        if (existing) {
          return updateMutation.mutateAsync({
            id: existing.id,
            date,
            employeeId: empId,
            status,
          });
        }
        return markMutation.mutateAsync({ date, employeeId: empId, status });
      });
      await Promise.all(promises);
      toast.success(
        `Attendance saved for ${Object.keys(markedInView).length} employees`,
      );
    } catch {
      toast.error("Failed to save attendance");
    } finally {
      setSubmitting(false);
    }
  };

  const counts = {
    present: employees.filter((e) => statusMap[e.id] === "Present").length,
    absent: employees.filter((e) => statusMap[e.id] === "Absent").length,
    halfDay: employees.filter((e) => statusMap[e.id] === "HalfDay").length,
  };

  return (
    <div className="space-y-4">
      {/* Date picker */}
      <div className="space-y-1.5">
        <Label htmlFor="att-date-daily">Date</Label>
        <Input
          data-ocid="attendance.date.input"
          id="att-date-daily"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="text-base"
        />
      </div>

      {/* Department filter chips */}
      <div className="flex gap-2">
        <button
          type="button"
          data-ocid="attendance.daily.all_filter.toggle"
          onClick={() => setDeptFilter("All")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
            deptFilter === "All"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-muted-foreground border-border hover:border-primary/50"
          }`}
        >
          All Departments
        </button>
        <button
          type="button"
          data-ocid="attendance.daily.finishing_filter.toggle"
          onClick={() => setDeptFilter("Finishing")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
            deptFilter === "Finishing"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-muted-foreground border-border hover:border-primary/50"
          }`}
        >
          Finishing Only
        </button>
      </div>

      {/* Quick summary */}
      {Object.keys(statusMap).length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <Badge className="bg-green-100 text-green-800">
            {counts.present} Present
          </Badge>
          <Badge className="bg-red-100 text-red-800">
            {counts.absent} Absent
          </Badge>
          <Badge className="bg-yellow-100 text-yellow-800">
            {counts.halfDay} Half Day
          </Badge>
        </div>
      )}

      {/* Employee list */}
      <div className="space-y-2">
        {employeesQuery.isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : employees.length === 0 ? (
          <div
            className="text-center py-8 text-muted-foreground"
            data-ocid="attendance.empty_state"
          >
            <CalendarCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>
              {deptFilter === "Finishing"
                ? "No finishing department employees found"
                : "No active employees found"}
            </p>
            {deptFilter === "Finishing" && (
              <p className="text-xs mt-1">
                Tag employees with department "Finishing" to see them here
              </p>
            )}
          </div>
        ) : (
          employees.map((emp, i) => {
            const currentStatus = statusMap[emp.id];
            return (
              <div
                key={emp.id}
                data-ocid={`attendance.item.${i + 1}`}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  currentStatus
                    ? currentStatus === "Present"
                      ? "border-green-200 bg-green-50"
                      : currentStatus === "Absent"
                        ? "border-red-200 bg-red-50"
                        : "border-yellow-200 bg-yellow-50"
                    : "border-border bg-card"
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                  {emp.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{emp.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {emp.department}
                  </p>
                </div>
                <div className="flex-shrink-0 w-36">
                  <Select
                    value={currentStatus ?? ""}
                    onValueChange={(v) =>
                      handleStatusChange(emp.id, v as AttendanceStatus)
                    }
                  >
                    <SelectTrigger
                      data-ocid={`attendance.status.select.${i + 1}`}
                      className={`h-9 text-sm ${currentStatus ? statusColor[currentStatus] : ""}`}
                    >
                      <SelectValue placeholder="Mark..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Present">Present</SelectItem>
                      <SelectItem value="Absent">Absent</SelectItem>
                      <SelectItem value="HalfDay">Half Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Submit button */}
      {employees.length > 0 && (
        <div className="sticky bottom-20 pt-2">
          <Button
            data-ocid="attendance.submit_button"
            className="w-full h-12 text-base gap-2"
            onClick={handleSubmitAll}
            disabled={
              submitting ||
              employees.every((e) => statusMap[e.id] === undefined)
            }
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
            {submitting ? "Saving..." : "Submit Attendance"}
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Monthly Tab ───────────────────────────────────────────────────────────────
function MonthlyTab() {
  const [month, setMonth] = useState(currentMonth());
  const [deptFilter, setDeptFilter] = useState<"All" | "Finishing">("All");

  const employeesQuery = useGetEmployees();
  const attendanceQuery = useGetAttendanceByMonth(month);

  const allActive = (employeesQuery.data ?? []).filter(
    (e) => e.status === "Active",
  );
  const employees =
    deptFilter === "Finishing"
      ? allActive.filter((e) => e.department.toLowerCase() === "finishing")
      : allActive;

  const attendance = attendanceQuery.data ?? [];

  type EmpStats = {
    present: number;
    absent: number;
    halfDay: number;
    total: number;
  };

  const statsMap = new Map<string, EmpStats>();
  for (const emp of employees) {
    statsMap.set(emp.id, { present: 0, absent: 0, halfDay: 0, total: 0 });
  }
  for (const rec of attendance) {
    const s = statsMap.get(rec.employeeId);
    if (!s) continue;
    s.total += 1;
    if (rec.status === "Present") s.present += 1;
    else if (rec.status === "Absent") s.absent += 1;
    else if (rec.status === "HalfDay") s.halfDay += 1;
  }

  const grand = { present: 0, absent: 0, halfDay: 0, total: 0 };
  for (const s of statsMap.values()) {
    grand.present += s.present;
    grand.absent += s.absent;
    grand.halfDay += s.halfDay;
    grand.total += s.total;
  }

  const isLoading = employeesQuery.isLoading || attendanceQuery.isLoading;

  return (
    <div className="space-y-4">
      {/* Month picker */}
      <div className="space-y-1.5">
        <Label htmlFor="att-month-sv">Month</Label>
        <Input
          data-ocid="attendance.month.input"
          id="att-month-sv"
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="text-base"
        />
      </div>

      {/* Department filter chips */}
      <div className="flex gap-2">
        <button
          type="button"
          data-ocid="attendance.monthly.all_filter.toggle"
          onClick={() => setDeptFilter("All")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
            deptFilter === "All"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-muted-foreground border-border hover:border-primary/50"
          }`}
        >
          All Departments
        </button>
        <button
          type="button"
          data-ocid="attendance.monthly.finishing_filter.toggle"
          onClick={() => setDeptFilter("Finishing")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
            deptFilter === "Finishing"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-muted-foreground border-border hover:border-primary/50"
          }`}
        >
          Finishing Only
        </button>
      </div>

      {/* Monthly summary cards */}
      {attendance.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-center">
            <p className="text-2xl font-display font-bold text-green-700">
              {grand.present}
            </p>
            <p className="text-xs text-green-600">Present Days</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-center">
            <p className="text-2xl font-display font-bold text-red-700">
              {grand.absent}
            </p>
            <p className="text-xs text-red-600">Absent Days</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 text-center">
            <p className="text-2xl font-display font-bold text-yellow-700">
              {grand.halfDay}
            </p>
            <p className="text-xs text-yellow-600">Half Days</p>
          </div>
        </div>
      )}

      {/* Employee monthly table */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : employees.length === 0 ? (
          <div
            className="text-center py-8 text-muted-foreground"
            data-ocid="attendance.monthly_empty_state"
          >
            <CalendarCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>
              {deptFilter === "Finishing"
                ? "No finishing department employees found"
                : "No active employees found"}
            </p>
          </div>
        ) : (
          <>
            {employees.map((emp, i) => {
              const s = statsMap.get(emp.id) ?? {
                present: 0,
                absent: 0,
                halfDay: 0,
                total: 0,
              };
              return (
                <div
                  key={emp.id}
                  data-ocid={`attendance.monthly.item.${i + 1}`}
                  className="bg-card border border-border rounded-lg p-3"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                      {emp.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{emp.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {emp.department}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs font-mono">
                      {s.total} days
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-green-50 rounded p-1.5">
                      <p className="text-lg font-bold text-green-700">
                        {s.present}
                      </p>
                      <p className="text-xs text-green-600">Present</p>
                    </div>
                    <div className="bg-red-50 rounded p-1.5">
                      <p className="text-lg font-bold text-red-700">
                        {s.absent}
                      </p>
                      <p className="text-xs text-red-600">Absent</p>
                    </div>
                    <div className="bg-yellow-50 rounded p-1.5">
                      <p className="text-lg font-bold text-yellow-700">
                        {s.halfDay}
                      </p>
                      <p className="text-xs text-yellow-600">Half Day</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {/* Grand total card */}
            {employees.length > 0 && (
              <div className="bg-muted/30 border border-border rounded-lg p-3 mt-2">
                <p className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">
                  Grand Total
                </p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-green-50 rounded p-1.5">
                    <p className="text-lg font-bold text-green-700">
                      {grand.present}
                    </p>
                    <p className="text-xs text-green-600">Present</p>
                  </div>
                  <div className="bg-red-50 rounded p-1.5">
                    <p className="text-lg font-bold text-red-700">
                      {grand.absent}
                    </p>
                    <p className="text-xs text-red-600">Absent</p>
                  </div>
                  <div className="bg-yellow-50 rounded p-1.5">
                    <p className="text-lg font-bold text-yellow-700">
                      {grand.halfDay}
                    </p>
                    <p className="text-xs text-yellow-600">Half Day</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function SupervisorAttendance() {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="daily" data-ocid="attendance.tab">
        <TabsList className="w-full">
          <TabsTrigger
            value="daily"
            className="flex-1"
            data-ocid="attendance.daily.tab"
          >
            Daily (DD Basis)
          </TabsTrigger>
          <TabsTrigger
            value="monthly"
            className="flex-1"
            data-ocid="attendance.monthly.tab"
          >
            Monthly
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-4">
          <DailyTab />
        </TabsContent>

        <TabsContent value="monthly" className="mt-4">
          <MonthlyTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
