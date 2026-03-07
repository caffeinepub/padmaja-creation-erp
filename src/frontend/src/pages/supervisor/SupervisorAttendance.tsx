import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarCheck, Loader2 } from "lucide-react";
import { useState } from "react";
import {
  useGetAttendanceByMonth,
  useGetEmployees,
} from "../../hooks/useQueries";

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function SupervisorAttendance() {
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
