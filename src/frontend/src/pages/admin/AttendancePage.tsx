import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarCheck } from "lucide-react";
import { useState } from "react";
import {
  useGetAttendanceByDate,
  useGetAttendanceByMonth,
  useGetEmployees,
} from "../../hooks/useQueries";

function today() {
  return new Date().toISOString().split("T")[0];
}

function currentMonth() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function statusBadge(status: string) {
  if (status === "Present") return "bg-green-100 text-green-800";
  if (status === "Absent") return "bg-red-100 text-red-800";
  if (status === "HalfDay") return "bg-yellow-100 text-yellow-800";
  return "bg-muted text-muted-foreground";
}

// ── Dept filter chips (reusable) ───────────────────────────────────────────────
function DeptFilterChips({
  value,
  onChange,
  allOcid,
  finishingOcid,
}: {
  value: "All" | "Finishing";
  onChange: (v: "All" | "Finishing") => void;
  allOcid: string;
  finishingOcid: string;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      <button
        type="button"
        data-ocid={allOcid}
        onClick={() => onChange("All")}
        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
          value === "All"
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-background text-muted-foreground border-border hover:border-primary/50"
        }`}
      >
        All Departments
      </button>
      <button
        type="button"
        data-ocid={finishingOcid}
        onClick={() => onChange("Finishing")}
        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
          value === "Finishing"
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-background text-muted-foreground border-border hover:border-primary/50"
        }`}
      >
        Finishing Only
      </button>
    </div>
  );
}

// ── Daily Tab ─────────────────────────────────────────────────────────────────
function DailyTab() {
  const [date, setDate] = useState(today());
  const [deptFilter, setDeptFilter] = useState<"All" | "Finishing">("All");
  const employeesQuery = useGetEmployees();
  const attendanceQuery = useGetAttendanceByDate(date);

  const allActive = (employeesQuery.data ?? []).filter(
    (e) => e.status === "Active",
  );
  const employees =
    deptFilter === "Finishing"
      ? allActive.filter((e) => e.department.toLowerCase() === "finishing")
      : allActive;

  const attendance = attendanceQuery.data ?? [];
  const attMap = new Map(attendance.map((a) => [a.employeeId, a.status]));

  const counts = {
    present: attendance.filter(
      (a) =>
        a.status === "Present" && employees.some((e) => e.id === a.employeeId),
    ).length,
    absent: attendance.filter(
      (a) =>
        a.status === "Absent" && employees.some((e) => e.id === a.employeeId),
    ).length,
    halfDay: attendance.filter(
      (a) =>
        a.status === "HalfDay" && employees.some((e) => e.id === a.employeeId),
    ).length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-4 flex-wrap">
        <div className="space-y-1">
          <Label htmlFor="att-date">Select Date</Label>
          <Input
            data-ocid="attendance.date.input"
            id="att-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-48"
          />
        </div>
      </div>

      <DeptFilterChips
        value={deptFilter}
        onChange={setDeptFilter}
        allOcid="attendance.daily.all_filter.toggle"
        finishingOcid="attendance.daily.finishing_filter.toggle"
      />

      {/* Summary */}
      {attendance.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-center">
            <p className="text-2xl font-display font-bold text-green-700">
              {counts.present}
            </p>
            <p className="text-xs text-green-600">Present</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-center">
            <p className="text-2xl font-display font-bold text-red-700">
              {counts.absent}
            </p>
            <p className="text-xs text-red-600">Absent</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 text-center">
            <p className="text-2xl font-display font-bold text-yellow-700">
              {counts.halfDay}
            </p>
            <p className="text-xs text-yellow-600">Half Day</p>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border overflow-hidden bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Employee</TableHead>
              <TableHead className="hidden sm:table-cell">Department</TableHead>
              <TableHead>Attendance Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employeesQuery.isLoading || attendanceQuery.isLoading ? (
              ["s1", "s2", "s3", "s4", "s5"].slice(0, 5).map((skId) => (
                <TableRow key={skId}>
                  <TableCell colSpan={3}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center py-12 text-muted-foreground"
                  data-ocid="attendance.empty_state"
                >
                  <CalendarCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>
                    {deptFilter === "Finishing"
                      ? "No finishing department employees found"
                      : "No active employees found"}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              employees.map((emp, i) => {
                const status = attMap.get(emp.id);
                return (
                  <TableRow key={emp.id} data-ocid={`attendance.item.${i + 1}`}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">{emp.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {emp.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {emp.department}
                    </TableCell>
                    <TableCell>
                      {status ? (
                        <Badge
                          className={`text-xs ${statusBadge(status)}`}
                          variant="secondary"
                        >
                          {status}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          Not marked
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
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

  // Build per-employee counts
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

  // Grand totals
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
      <div className="flex items-end gap-4">
        <div className="space-y-1">
          <Label htmlFor="att-month">Select Month</Label>
          <Input
            data-ocid="attendance.month.input"
            id="att-month"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-48"
          />
        </div>
      </div>

      <DeptFilterChips
        value={deptFilter}
        onChange={setDeptFilter}
        allOcid="attendance.monthly.all_filter.toggle"
        finishingOcid="attendance.monthly.finishing_filter.toggle"
      />

      {/* Monthly summary cards */}
      {attendance.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-center">
            <p className="text-2xl font-display font-bold text-green-700">
              {grand.present}
            </p>
            <p className="text-xs text-green-600">Total Present Days</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-center">
            <p className="text-2xl font-display font-bold text-red-700">
              {grand.absent}
            </p>
            <p className="text-xs text-red-600">Total Absent Days</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 text-center">
            <p className="text-2xl font-display font-bold text-yellow-700">
              {grand.halfDay}
            </p>
            <p className="text-xs text-yellow-600">Total Half Days</p>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border overflow-hidden bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Employee</TableHead>
              <TableHead className="hidden sm:table-cell">Department</TableHead>
              <TableHead className="text-center">
                <span className="text-green-700">Present</span>
              </TableHead>
              <TableHead className="text-center">
                <span className="text-red-700">Absent</span>
              </TableHead>
              <TableHead className="text-center hidden md:table-cell">
                <span className="text-yellow-700">Half Day</span>
              </TableHead>
              <TableHead className="text-center">Total Days</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              ["s1", "s2", "s3", "s4", "s5"].map((skId) => (
                <TableRow key={skId}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-12 text-muted-foreground"
                  data-ocid="attendance.monthly_empty_state"
                >
                  <CalendarCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>
                    {deptFilter === "Finishing"
                      ? "No finishing department employees found"
                      : "No active employees found"}
                  </p>
                </TableCell>
              </TableRow>
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
                    <TableRow
                      key={emp.id}
                      data-ocid={`attendance.monthly.item.${i + 1}`}
                    >
                      <TableCell>
                        <div className="font-medium text-sm">{emp.name}</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {emp.department}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold text-green-700">
                          {s.present}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold text-red-700">
                          {s.absent}
                        </span>
                      </TableCell>
                      <TableCell className="text-center hidden md:table-cell">
                        <span className="font-semibold text-yellow-700">
                          {s.halfDay}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs font-mono">
                          {s.total}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {/* Grand totals row */}
                {employees.length > 0 && (
                  <TableRow className="bg-muted/30 font-semibold border-t-2 border-border">
                    <TableCell className="text-sm font-bold" colSpan={1}>
                      Grand Total
                    </TableCell>
                    <TableCell className="hidden sm:table-cell" />
                    <TableCell className="text-center text-green-700 font-bold">
                      {grand.present}
                    </TableCell>
                    <TableCell className="text-center text-red-700 font-bold">
                      {grand.absent}
                    </TableCell>
                    <TableCell className="text-center text-yellow-700 font-bold hidden md:table-cell">
                      {grand.halfDay}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="text-xs font-mono font-bold">
                        {grand.total}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function AttendancePage() {
  return (
    <div className="space-y-4 animate-fade-in">
      <Tabs defaultValue="daily" data-ocid="attendance.tab">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger
            value="daily"
            className="flex-1 sm:flex-none"
            data-ocid="attendance.daily.tab"
          >
            Daily
          </TabsTrigger>
          <TabsTrigger
            value="monthly"
            className="flex-1 sm:flex-none"
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
