import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, CalendarDays, Loader2, Users } from "lucide-react";
import { useState } from "react";
import {
  useGetAttendanceByDate,
  useGetAttendanceByMonth,
  useGetEmployees,
  useMarkAttendance,
} from "../../hooks/useQueries";

// ─── helpers ────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function currentMonthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ─── Daily Tab ──────────────────────────────────────────────────────────────

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
      {/* Date picker */}
      <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 shadow-sm">
        <CalendarDays className="w-5 h-5 text-primary flex-shrink-0" />
        <div className="flex-1">
          <label
            htmlFor="office-att-date"
            className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5"
          >
            Date
          </label>
          <input
            data-ocid="office_attendance.date.input"
            id="office-att-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="block w-full bg-transparent text-base font-medium text-foreground outline-none focus:ring-0 border-0 p-0 cursor-pointer"
          />
        </div>
      </div>

      {/* Summary bar */}
      {officeEmployees.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-emerald-700">
              {presentCount}
            </p>
            <p className="text-xs font-medium text-emerald-600">Present</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-red-700">{absentCount}</p>
            <p className="text-xs font-medium text-red-600">Absent</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-amber-700">{halfDayCount}</p>
            <p className="text-xs font-medium text-amber-600">Half Day</p>
          </div>
        </div>
      )}

      {/* Employee list */}
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
            <Users className="w-12 h-12 mb-3 opacity-25" />
            <p className="font-semibold text-sm">No office employees found</p>
            <p className="text-xs mt-1 text-center px-6">
              Add employees with department "Office" from the Admin panel.
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
                className="bg-card border border-border rounded-xl p-4 shadow-sm"
              >
                {/* Employee info */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-base font-bold text-primary flex-shrink-0">
                    {emp.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-tight truncate">
                      {emp.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {emp.id} · {emp.phone}
                    </p>
                  </div>
                  {status && (
                    <Badge
                      className={`text-xs flex-shrink-0 ${
                        status === "Present"
                          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                          : status === "Absent"
                            ? "bg-red-100 text-red-700 border-red-200"
                            : "bg-amber-100 text-amber-700 border-amber-200"
                      }`}
                      variant="outline"
                    >
                      {status === "HalfDay" ? "Half Day" : status}
                    </Badge>
                  )}
                </div>

                {/* Status buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    data-ocid={`office_attendance.present_button.${idx}`}
                    onClick={() => handleMark(emp.id, "Present")}
                    className={`py-2.5 rounded-lg text-sm font-semibold transition-all active:scale-95 border ${
                      status === "Present"
                        ? "bg-emerald-500 text-white border-emerald-600 shadow-sm"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                    }`}
                  >
                    ✓ Present
                  </button>
                  <button
                    type="button"
                    data-ocid={`office_attendance.absent_button.${idx}`}
                    onClick={() => handleMark(emp.id, "Absent")}
                    className={`py-2.5 rounded-lg text-sm font-semibold transition-all active:scale-95 border ${
                      status === "Absent"
                        ? "bg-red-500 text-white border-red-600 shadow-sm"
                        : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                    }`}
                  >
                    ✗ Absent
                  </button>
                  <button
                    type="button"
                    data-ocid={`office_attendance.halfday_button.${idx}`}
                    onClick={() => handleMark(emp.id, "HalfDay")}
                    className={`py-2.5 rounded-lg text-sm font-semibold transition-all active:scale-95 border ${
                      status === "HalfDay"
                        ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                        : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                    }`}
                  >
                    ½ Half Day
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Monthly Tab ─────────────────────────────────────────────────────────────

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
      {/* Month picker */}
      <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 shadow-sm">
        <CalendarDays className="w-5 h-5 text-primary flex-shrink-0" />
        <div className="flex-1">
          <label
            htmlFor="office-att-month"
            className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5"
          >
            Month
          </label>
          <input
            data-ocid="office_attendance.month.input"
            id="office-att-month"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="block w-full bg-transparent text-base font-medium text-foreground outline-none focus:ring-0 border-0 p-0 cursor-pointer"
          />
        </div>
      </div>

      {/* Summary bar */}
      {officeEmployees.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-emerald-700">
              {grand.present}
            </p>
            <p className="text-xs font-medium text-emerald-600">Present Days</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-red-700">{grand.absent}</p>
            <p className="text-xs font-medium text-red-600">Absent Days</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-amber-700">{grand.halfDay}</p>
            <p className="text-xs font-medium text-amber-600">Half Days</p>
          </div>
        </div>
      )}

      {/* Employee monthly cards */}
      <div className="space-y-3">
        {isLoading ? (
          <div
            className="flex flex-col items-center justify-center py-12 text-muted-foreground"
            data-ocid="office_attendance.loading_state"
          >
            <Loader2 className="w-7 h-7 animate-spin mb-2" />
            <p className="text-sm">Loading attendance…</p>
          </div>
        ) : officeEmployees.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-14 text-muted-foreground rounded-xl border border-dashed border-border"
            data-ocid="office_attendance.empty_state"
          >
            <Users className="w-12 h-12 mb-3 opacity-25" />
            <p className="font-semibold text-sm">No office employees found</p>
            <p className="text-xs mt-1 text-center px-6">
              Add employees with department "Office" from the Admin panel.
            </p>
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
                  className="bg-card border border-border rounded-xl p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-base font-bold text-primary flex-shrink-0">
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm leading-tight truncate">
                        {emp.name}
                      </p>
                      <Badge
                        variant="outline"
                        className="text-xs mt-0.5 bg-primary/5 text-primary border-primary/20"
                      >
                        {emp.department}
                      </Badge>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-xs font-mono flex-shrink-0"
                    >
                      {s.total} days
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2">
                      <p className="text-xl font-bold text-emerald-700">
                        {s.present}
                      </p>
                      <p className="text-xs text-emerald-600">Present</p>
                    </div>
                    <div className="bg-red-50 border border-red-100 rounded-lg p-2">
                      <p className="text-xl font-bold text-red-700">
                        {s.absent}
                      </p>
                      <p className="text-xs text-red-600">Absent</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-2">
                      <p className="text-xl font-bold text-amber-700">
                        {s.halfDay}
                      </p>
                      <p className="text-xs text-amber-600">Half Day</p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Grand Total card */}
            <div className="bg-muted/40 border-2 border-border rounded-xl p-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                Grand Total — {officeEmployees.length} employees
              </p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2">
                  <p className="text-xl font-bold text-emerald-700">
                    {grand.present}
                  </p>
                  <p className="text-xs text-emerald-600">Present</p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-lg p-2">
                  <p className="text-xl font-bold text-red-700">
                    {grand.absent}
                  </p>
                  <p className="text-xs text-red-600">Absent</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-2">
                  <p className="text-xl font-bold text-amber-700">
                    {grand.halfDay}
                  </p>
                  <p className="text-xs text-amber-600">Half Day</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SupervisorAttendance() {
  return (
    <div className="space-y-4">
      {/* Page heading */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold leading-tight">Office Attendance</h1>
          <p className="text-xs text-muted-foreground">
            Office department only
          </p>
        </div>
      </div>

      {/* Tabs */}
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
