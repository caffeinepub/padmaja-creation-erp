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
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function statusBadgeClass(status: string) {
  if (status === "Present") return "badge-green";
  if (status === "Absent") return "badge-red";
  if (status === "HalfDay") return "badge-amber";
  return "";
}

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
      {(["All", "Finishing"] as const).map((opt) => (
        <button
          key={opt}
          type="button"
          data-ocid={opt === "All" ? allOcid : finishingOcid}
          onClick={() => onChange(opt)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
            value === opt
              ? "bg-primary/20 text-primary border-primary/40"
              : "bg-muted/40 text-muted-foreground border-border hover:border-primary/40"
          }`}
        >
          {opt === "All" ? "All Departments" : "Finishing Only"}
        </button>
      ))}
    </div>
  );
}

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

      {attendance.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-400">
              {counts.present}
            </p>
            <p className="text-xs text-green-500/70">Present</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-red-400">{counts.absent}</p>
            <p className="text-xs text-red-500/70">Absent</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-amber-400">
              {counts.halfDay}
            </p>
            <p className="text-xs text-amber-500/70">Half Day</p>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border overflow-hidden bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground text-xs">
                Employee
              </TableHead>
              <TableHead className="text-muted-foreground text-xs hidden sm:table-cell">
                Department
              </TableHead>
              <TableHead className="text-muted-foreground text-xs">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employeesQuery.isLoading || attendanceQuery.isLoading ? (
              [1, 2, 3, 4, 5].map((sk) => (
                <TableRow key={sk}>
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
                  <CalendarCheck className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p>No active employees found</p>
                </TableCell>
              </TableRow>
            ) : (
              employees.map((emp, i) => {
                const status = attMap.get(emp.id);
                return (
                  <TableRow
                    key={emp.id}
                    data-ocid={`attendance.item.${i + 1}`}
                    className="border-border"
                  >
                    <TableCell>
                      <div className="font-medium text-sm text-foreground">
                        {emp.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {emp.phone}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {emp.department}
                    </TableCell>
                    <TableCell>
                      {status ? (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(status)}`}
                        >
                          {status === "HalfDay" ? "Half Day" : status}
                        </span>
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

      {attendance.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-400">{grand.present}</p>
            <p className="text-xs text-green-500/70">Present Days</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-red-400">{grand.absent}</p>
            <p className="text-xs text-red-500/70">Absent Days</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-amber-400">{grand.halfDay}</p>
            <p className="text-xs text-amber-500/70">Half Days</p>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border overflow-hidden bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground text-xs">
                Employee
              </TableHead>
              <TableHead className="text-muted-foreground text-xs hidden sm:table-cell">
                Dept
              </TableHead>
              <TableHead className="text-muted-foreground text-xs text-center">
                Present
              </TableHead>
              <TableHead className="text-muted-foreground text-xs text-center">
                Absent
              </TableHead>
              <TableHead className="text-muted-foreground text-xs text-center hidden md:table-cell">
                Half Day
              </TableHead>
              <TableHead className="text-muted-foreground text-xs text-center">
                Total
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [1, 2, 3, 4, 5].map((sk) => (
                <TableRow key={sk}>
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
                  <CalendarCheck className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p>No employees found</p>
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
                      className="border-border"
                    >
                      <TableCell className="font-medium text-sm text-foreground">
                        {emp.name}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {emp.department}
                      </TableCell>
                      <TableCell className="text-center text-green-400 font-semibold">
                        {s.present}
                      </TableCell>
                      <TableCell className="text-center text-red-400 font-semibold">
                        {s.absent}
                      </TableCell>
                      <TableCell className="text-center text-amber-400 font-semibold hidden md:table-cell">
                        {s.halfDay}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs font-mono">
                          {s.total}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {employees.length > 0 && (
                  <TableRow className="bg-muted/20 border-t-2 border-border">
                    <TableCell className="text-sm font-bold text-foreground">
                      Grand Total
                    </TableCell>
                    <TableCell className="hidden sm:table-cell" />
                    <TableCell className="text-center text-green-400 font-bold">
                      {grand.present}
                    </TableCell>
                    <TableCell className="text-center text-red-400 font-bold">
                      {grand.absent}
                    </TableCell>
                    <TableCell className="text-center text-amber-400 font-bold hidden md:table-cell">
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
