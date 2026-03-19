import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, CalendarDays, Loader2, Users } from "lucide-react";
import { useState } from "react";
import {
  useGetAttendanceByDate,
  useGetAttendanceByMonth,
  useGetEmployees,
  useMarkAttendance,
} from "../../hooks/useQueries";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function currentMonthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function DailyTab() {
  const [date, setDate] = useState(todayStr());
  const employeesQuery = useGetEmployees();
  const attendanceQuery = useGetAttendanceByDate(date);
  const markAttendance = useMarkAttendance();

  const officeEmployees = (employeesQuery.data ?? []).filter(
    (e) => e.status === "Active" && e.department.toLowerCase() === "office",
  );

  const attendanceMap = new Map<string, string>();
  for (const rec of attendanceQuery.data ?? []) {
    attendanceMap.set(rec.employeeId, rec.status);
  }

  const presentCount = officeEmployees.filter(
    (e) => attendanceMap.get(e.id) === "Present",
  ).length;
  const absentCount = officeEmployees.filter(
    (e) => attendanceMap.get(e.id) === "Absent",
  ).length;
  const halfDayCount = officeEmployees.filter(
    (e) => attendanceMap.get(e.id) === "HalfDay",
  ).length;

  const isLoading = employeesQuery.isLoading || attendanceQuery.isLoading;

  function handleMark(employeeId: string, status: string) {
    const current = attendanceMap.get(employeeId);
    if (current === status) return;
    markAttendance.mutate({ date, employeeId, status });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
        <CalendarDays className="w-5 h-5 text-primary flex-shrink-0" />
        <div className="flex-1">
          <label
            htmlFor="att-date"
            className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5"
          >
            Date
          </label>
          <input
            data-ocid="office_attendance.date.input"
            id="att-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="block w-full bg-transparent text-base font-medium text-foreground outline-none focus:ring-0 border-0 p-0 cursor-pointer"
          />
        </div>
      </div>

      {officeEmployees.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-400">{presentCount}</p>
            <p className="text-xs font-medium text-green-500/80">Present</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-red-400">{absentCount}</p>
            <p className="text-xs font-medium text-red-500/80">Absent</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-amber-400">{halfDayCount}</p>
            <p className="text-xs font-medium text-amber-500/80">Half Day</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {isLoading ? (
          <div
            className="flex flex-col items-center justify-center py-12 text-muted-foreground"
            data-ocid="office_attendance.loading_state"
          >
            <Loader2 className="w-7 h-7 animate-spin mb-2" />
            <p className="text-sm">Loading employees…</p>
          </div>
        ) : officeEmployees.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-14 text-muted-foreground rounded-xl border border-dashed border-border"
            data-ocid="office_attendance.empty_state"
          >
            <Users className="w-12 h-12 mb-3 opacity-20" />
            <p className="font-semibold text-sm">No office employees found</p>
            <p className="text-xs mt-1 text-center px-6 text-muted-foreground">
              Add employees with department "Office" from Admin panel.
            </p>
          </div>
        ) : (
          officeEmployees.map((emp, i) => {
            const status = attendanceMap.get(emp.id) ?? null;
            const idx = i + 1;
            return (
              <div
                key={emp.id}
                data-ocid={`office_attendance.item.${idx}`}
                className="bg-card border border-border rounded-xl p-4"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-base font-bold text-primary flex-shrink-0">
                    {emp.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-tight truncate text-foreground">
                      {emp.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {emp.id} · {emp.phone}
                    </p>
                  </div>
                  {status && (
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                        status === "Present"
                          ? "badge-green"
                          : status === "Absent"
                            ? "badge-red"
                            : "badge-amber"
                      }`}
                    >
                      {status === "HalfDay" ? "Half Day" : status}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      label: "✓ Present",
                      value: "Present",
                      active: "bg-green-500 text-white border-green-600",
                      inactive:
                        "bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20",
                    },
                    {
                      label: "✗ Absent",
                      value: "Absent",
                      active: "bg-red-500 text-white border-red-600",
                      inactive:
                        "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20",
                    },
                    {
                      label: "½ Half Day",
                      value: "HalfDay",
                      active: "bg-amber-500 text-white border-amber-600",
                      inactive:
                        "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20",
                    },
                  ].map((btn) => (
                    <button
                      key={btn.value}
                      type="button"
                      data-ocid={`office_attendance.${btn.value.toLowerCase()}_button.${idx}`}
                      onClick={() => handleMark(emp.id, btn.value)}
                      className={`py-2.5 rounded-lg text-xs font-semibold transition-all active:scale-95 border ${
                        status === btn.value ? btn.active : btn.inactive
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function MonthlyTab() {
  const [month, setMonth] = useState(currentMonthStr());
  const employeesQuery = useGetEmployees();
  const attendanceQuery = useGetAttendanceByMonth(month);

  const officeEmployees = (employeesQuery.data ?? []).filter(
    (e) => e.status === "Active" && e.department.toLowerCase() === "office",
  );

  const attendance = attendanceQuery.data ?? [];

  type EmpStats = {
    present: number;
    absent: number;
    halfDay: number;
    total: number;
  };
  const statsMap = new Map<string, EmpStats>();
  for (const emp of officeEmployees) {
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
      <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
        <CalendarDays className="w-5 h-5 text-primary flex-shrink-0" />
        <div className="flex-1">
          <label
            htmlFor="att-month"
            className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5"
          >
            Month
          </label>
          <input
            data-ocid="office_attendance.month.input"
            id="att-month"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="block w-full bg-transparent text-base font-medium text-foreground outline-none focus:ring-0 border-0 p-0 cursor-pointer"
          />
        </div>
      </div>

      {officeEmployees.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-400">{grand.present}</p>
            <p className="text-xs font-medium text-green-500/80">Present</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-red-400">{grand.absent}</p>
            <p className="text-xs font-medium text-red-500/80">Absent</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-amber-400">{grand.halfDay}</p>
            <p className="text-xs font-medium text-amber-500/80">Half Day</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {isLoading ? (
          <div
            className="flex flex-col items-center py-12 text-muted-foreground"
            data-ocid="office_attendance.loading_state"
          >
            <Loader2 className="w-7 h-7 animate-spin mb-2" />
            <p className="text-sm">Loading…</p>
          </div>
        ) : officeEmployees.length === 0 ? (
          <div
            className="flex flex-col items-center py-14 text-muted-foreground rounded-xl border border-dashed border-border"
            data-ocid="office_attendance.empty_state"
          >
            <Users className="w-12 h-12 mb-3 opacity-20" />
            <p className="font-semibold text-sm">No office employees</p>
          </div>
        ) : (
          <>
            {officeEmployees.map((emp, i) => {
              const s = statsMap.get(emp.id) ?? {
                present: 0,
                absent: 0,
                halfDay: 0,
                total: 0,
              };
              return (
                <div
                  key={emp.id}
                  data-ocid={`office_attendance.item.${i + 1}`}
                  className="bg-card border border-border rounded-xl p-4"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">
                        {emp.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {s.total} days recorded
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2">
                      <p className="text-xl font-bold text-green-400">
                        {s.present}
                      </p>
                      <p className="text-xs text-green-500/70">Present</p>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                      <p className="text-xl font-bold text-red-400">
                        {s.absent}
                      </p>
                      <p className="text-xs text-red-500/70">Absent</p>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
                      <p className="text-xl font-bold text-amber-400">
                        {s.halfDay}
                      </p>
                      <p className="text-xs text-amber-500/70">Half Day</p>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="bg-muted/20 border-2 border-border rounded-xl p-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                Grand Total — {officeEmployees.length} employees
              </p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2">
                  <p className="text-xl font-bold text-green-400">
                    {grand.present}
                  </p>
                  <p className="text-xs text-green-500/70">Present</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                  <p className="text-xl font-bold text-red-400">
                    {grand.absent}
                  </p>
                  <p className="text-xs text-red-500/70">Absent</p>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
                  <p className="text-xl font-bold text-amber-400">
                    {grand.halfDay}
                  </p>
                  <p className="text-xs text-amber-500/70">Half Day</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function SupervisorAttendance() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold leading-tight text-foreground">
            Office Attendance
          </h1>
          <p className="text-xs text-muted-foreground">
            Office department employees only
          </p>
        </div>
      </div>

      <Tabs defaultValue="daily" data-ocid="office_attendance.tab">
        <TabsList className="w-full grid grid-cols-2 h-11">
          <TabsTrigger
            value="daily"
            data-ocid="office_attendance.daily.tab"
            className="text-sm font-semibold"
          >
            Daily
          </TabsTrigger>
          <TabsTrigger
            value="monthly"
            data-ocid="office_attendance.monthly.tab"
            className="text-sm font-semibold"
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
