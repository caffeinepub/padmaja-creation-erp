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
import { CalendarCheck } from "lucide-react";
import { useState } from "react";
import {
  useGetAttendanceByDate,
  useGetEmployees,
} from "../../hooks/useQueries";

function today() {
  return new Date().toISOString().split("T")[0];
}

function statusBadge(status: string) {
  if (status === "Present") return "bg-green-100 text-green-800";
  if (status === "Absent") return "bg-red-100 text-red-800";
  if (status === "HalfDay") return "bg-yellow-100 text-yellow-800";
  return "bg-muted text-muted-foreground";
}

export default function AttendancePage() {
  const [date, setDate] = useState(today());

  const employeesQuery = useGetEmployees();
  const attendanceQuery = useGetAttendanceByDate(date);

  const employees = employeesQuery.data ?? [];
  const attendance = attendanceQuery.data ?? [];

  const attMap = new Map(attendance.map((a) => [a.employeeId, a.status]));

  const counts = {
    present: attendance.filter((a) => a.status === "Present").length,
    absent: attendance.filter((a) => a.status === "Absent").length,
    halfDay: attendance.filter((a) => a.status === "HalfDay").length,
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-end gap-4">
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
            ) : employees.filter((e) => e.status === "Active").length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center py-12 text-muted-foreground"
                  data-ocid="attendance.empty_state"
                >
                  <CalendarCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>No active employees found</p>
                </TableCell>
              </TableRow>
            ) : (
              employees
                .filter((e) => e.status === "Active")
                .map((emp, i) => {
                  const status = attMap.get(emp.id);
                  return (
                    <TableRow
                      key={emp.id}
                      data-ocid={`attendance.item.${i + 1}`}
                    >
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
