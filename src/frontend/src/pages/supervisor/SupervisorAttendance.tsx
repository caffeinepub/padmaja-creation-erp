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
import { CalendarCheck, CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useGetAttendanceByDate,
  useGetEmployees,
  useMarkAttendance,
  useUpdateAttendance,
} from "../../hooks/useQueries";

function today() {
  return new Date().toISOString().split("T")[0];
}

type AttendanceStatus = "Present" | "Absent" | "HalfDay";

export default function SupervisorAttendance() {
  const [date, setDate] = useState(today());
  const [statusMap, setStatusMap] = useState<Record<string, AttendanceStatus>>(
    {},
  );
  const [submitting, setSubmitting] = useState(false);

  const employeesQuery = useGetEmployees();
  const attendanceQuery = useGetAttendanceByDate(date);
  const markMutation = useMarkAttendance();
  const updateMutation = useUpdateAttendance();

  const employees = (employeesQuery.data ?? []).filter(
    (e) => e.status === "Active",
  );
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
    if (Object.keys(statusMap).length === 0) {
      toast.error("Please mark attendance for at least one employee");
      return;
    }
    setSubmitting(true);
    try {
      const existingMap = new Map(attendance.map((a) => [a.employeeId, a]));
      const promises = Object.entries(statusMap).map(([empId, status]) => {
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
        `Attendance saved for ${Object.keys(statusMap).length} employees`,
      );
    } catch {
      toast.error("Failed to save attendance");
    } finally {
      setSubmitting(false);
    }
  };

  const counts = {
    present: Object.values(statusMap).filter((s) => s === "Present").length,
    absent: Object.values(statusMap).filter((s) => s === "Absent").length,
    halfDay: Object.values(statusMap).filter((s) => s === "HalfDay").length,
  };

  const statusColor: Record<AttendanceStatus, string> = {
    Present: "bg-green-100 text-green-800",
    Absent: "bg-red-100 text-red-800",
    HalfDay: "bg-yellow-100 text-yellow-800",
  };

  return (
    <div className="space-y-4">
      {/* Date picker */}
      <div className="space-y-1.5">
        <Label htmlFor="att-date">Date</Label>
        <Input
          data-ocid="attendance.date.input"
          id="att-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="text-base"
        />
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
            <p>No active employees found</p>
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
            disabled={submitting || Object.keys(statusMap).length === 0}
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
