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
import {
  CalendarCheck,
  ClipboardList,
  FileSpreadsheet,
  Layers,
  Users,
} from "lucide-react";
import { useState } from "react";
import {
  useGetAttendanceByDate,
  useGetAttendanceByMonth,
  useGetBundles,
  useGetEmployees,
  useGetOperations,
  useGetProductionEntries,
} from "../../hooks/useQueries";
import { exportToExcel } from "../../utils/excel";

function today() {
  return new Date().toISOString().split("T")[0];
}

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function statusBadge(status: string) {
  if (status === "Present") return "bg-green-100 text-green-800";
  if (status === "Absent") return "bg-red-100 text-red-800";
  if (status === "HalfDay") return "bg-yellow-100 text-yellow-800";
  return "bg-muted text-muted-foreground";
}

// ── Employees Tab ─────────────────────────────────────────────────────────────
function EmployeesTab() {
  const employeesQuery = useGetEmployees();
  const finishing = (employeesQuery.data ?? []).filter(
    (e) => e.department.toLowerCase() === "finishing",
  );
  const active = finishing.filter((e) => e.status === "Active");
  const inactive = finishing.filter((e) => e.status === "Inactive");

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <p className="text-2xl font-display font-bold text-foreground">
            {finishing.length}
          </p>
          <p className="text-xs text-muted-foreground">Total Employees</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-center">
          <p className="text-2xl font-display font-bold text-green-700">
            {active.length}
          </p>
          <p className="text-xs text-green-600">Active</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-center">
          <p className="text-2xl font-display font-bold text-red-700">
            {inactive.length}
          </p>
          <p className="text-xs text-red-600">Inactive</p>
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-hidden bg-card shadow-card">
        <Table data-ocid="finishing.employees.table">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Employee</TableHead>
              <TableHead className="hidden sm:table-cell">Phone</TableHead>
              <TableHead>Salary Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Join Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employeesQuery.isLoading ? (
              ["s1", "s2", "s3"].map((sk) => (
                <TableRow key={sk}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : finishing.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-12 text-muted-foreground"
                  data-ocid="finishing.employees.empty_state"
                >
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>No finishing department employees found</p>
                  <p className="text-xs mt-1">
                    Tag employees with department "Finishing" in Employee
                    Management
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              finishing.map((emp, i) => (
                <TableRow
                  key={emp.id}
                  data-ocid={`finishing.employees.item.${i + 1}`}
                >
                  <TableCell>
                    <div className="font-medium text-sm">{emp.name}</div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                    {emp.phone}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {emp.salaryType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`text-xs ${emp.status === "Active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                      variant="secondary"
                    >
                      {emp.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {emp.joinDate}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ── Attendance Tab ─────────────────────────────────────────────────────────────
function AttendanceDailyTab() {
  const [date, setDate] = useState(today());
  const employeesQuery = useGetEmployees();
  const attendanceQuery = useGetAttendanceByDate(date);

  const finishing = (employeesQuery.data ?? []).filter(
    (e) => e.status === "Active" && e.department.toLowerCase() === "finishing",
  );
  const attendance = attendanceQuery.data ?? [];
  const attMap = new Map(attendance.map((a) => [a.employeeId, a.status]));

  // Only count attendance for finishing employees
  const finishingIds = new Set(finishing.map((e) => e.id));
  const finishingAtt = attendance.filter((a) => finishingIds.has(a.employeeId));
  const counts = {
    present: finishingAtt.filter((a) => a.status === "Present").length,
    absent: finishingAtt.filter((a) => a.status === "Absent").length,
    halfDay: finishingAtt.filter((a) => a.status === "HalfDay").length,
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="fin-att-date">Select Date</Label>
        <Input
          data-ocid="finishing.attendance.date.input"
          id="fin-att-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-48"
        />
      </div>

      {finishingAtt.length > 0 && (
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
              <TableHead className="hidden sm:table-cell">Phone</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employeesQuery.isLoading || attendanceQuery.isLoading ? (
              ["s1", "s2", "s3"].map((sk) => (
                <TableRow key={sk}>
                  <TableCell colSpan={3}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : finishing.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center py-12 text-muted-foreground"
                  data-ocid="finishing.attendance.empty_state"
                >
                  <CalendarCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>No finishing department employees found</p>
                </TableCell>
              </TableRow>
            ) : (
              finishing.map((emp, i) => {
                const status = attMap.get(emp.id);
                return (
                  <TableRow
                    key={emp.id}
                    data-ocid={`finishing.attendance.item.${i + 1}`}
                  >
                    <TableCell>
                      <div className="font-medium text-sm">{emp.name}</div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {emp.phone}
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

function AttendanceMonthlyTab() {
  const [month, setMonth] = useState(currentMonth());
  const employeesQuery = useGetEmployees();
  const attendanceQuery = useGetAttendanceByMonth(month);

  const finishing = (employeesQuery.data ?? []).filter(
    (e) => e.status === "Active" && e.department.toLowerCase() === "finishing",
  );
  const attendance = attendanceQuery.data ?? [];

  type EmpStats = {
    present: number;
    absent: number;
    halfDay: number;
    total: number;
  };
  const statsMap = new Map<string, EmpStats>();
  for (const emp of finishing) {
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
      <div className="space-y-1">
        <Label htmlFor="fin-att-month">Select Month</Label>
        <Input
          data-ocid="finishing.attendance.month.input"
          id="fin-att-month"
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-48"
        />
      </div>

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
              <TableHead className="text-center">
                <span className="text-green-700">Present</span>
              </TableHead>
              <TableHead className="text-center">
                <span className="text-red-700">Absent</span>
              </TableHead>
              <TableHead className="text-center hidden md:table-cell">
                <span className="text-yellow-700">Half Day</span>
              </TableHead>
              <TableHead className="text-center">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              ["s1", "s2", "s3"].map((sk) => (
                <TableRow key={sk}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : finishing.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-12 text-muted-foreground"
                  data-ocid="finishing.attendance.monthly.empty_state"
                >
                  <CalendarCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>No finishing department employees found</p>
                </TableCell>
              </TableRow>
            ) : (
              <>
                {finishing.map((emp, i) => {
                  const s = statsMap.get(emp.id) ?? {
                    present: 0,
                    absent: 0,
                    halfDay: 0,
                    total: 0,
                  };
                  return (
                    <TableRow
                      key={emp.id}
                      data-ocid={`finishing.attendance.monthly.item.${i + 1}`}
                    >
                      <TableCell className="font-medium text-sm">
                        {emp.name}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-green-700">
                        {s.present}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-red-700">
                        {s.absent}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-yellow-700 hidden md:table-cell">
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
                {finishing.length > 0 && (
                  <TableRow className="bg-muted/30 font-semibold border-t-2 border-border">
                    <TableCell className="font-bold text-sm">
                      Grand Total
                    </TableCell>
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

// ── Production Tab ─────────────────────────────────────────────────────────────
function ProductionTab() {
  const [filterDate, setFilterDate] = useState("");
  const [filterEmployee, setFilterEmployee] = useState("all");
  const [filterBundle, setFilterBundle] = useState("all");

  const entriesQuery = useGetProductionEntries();
  const employeesQuery = useGetEmployees();
  const operationsQuery = useGetOperations();
  const bundlesQuery = useGetBundles();

  const finishing = (employeesQuery.data ?? []).filter(
    (e) => e.department.toLowerCase() === "finishing",
  );
  const finishingIds = new Set(finishing.map((e) => e.id));

  const operations = operationsQuery.data ?? [];
  const empMap = new Map(
    (employeesQuery.data ?? []).map((e) => [e.id, e.name]),
  );
  const opMap = new Map(operations.map((o) => [o.id, o.name]));

  const allEntries = (entriesQuery.data ?? []).filter((e) =>
    finishingIds.has(e.employeeId),
  );

  const filtered = allEntries.filter((e) => {
    if (filterDate && e.date !== filterDate) return false;
    if (filterEmployee !== "all" && e.employeeId !== filterEmployee)
      return false;
    if (filterBundle !== "all" && e.bundleId !== filterBundle) return false;
    return true;
  });

  const totalPieces = filtered.reduce((s, e) => s + Number(e.quantity), 0);
  const totalAmount = filtered.reduce((s, e) => s + e.amount, 0);

  const handleExport = async () => {
    const data = filtered.map((e) => ({
      Date: e.date,
      Employee: empMap.get(e.employeeId) ?? e.employeeId,
      Operation: opMap.get(e.operationId) ?? e.operationId,
      Bundle: e.bundleId,
      Quantity: Number(e.quantity),
      "Rate (₹)": e.rate,
      "Amount (₹)": e.amount,
    }));
    await exportToExcel(
      data,
      `finishing_production_${new Date().toISOString().split("T")[0]}.xlsx`,
      "Finishing Production",
    );
  };

  // Employee-wise summary
  const empSummary = new Map<string, { pieces: number; amount: number }>();
  for (const e of filtered) {
    const existing = empSummary.get(e.employeeId) ?? { pieces: 0, amount: 0 };
    empSummary.set(e.employeeId, {
      pieces: existing.pieces + Number(e.quantity),
      amount: existing.amount + e.amount,
    });
  }
  const sortedSummary = Array.from(empSummary.entries())
    .map(([empId, data]) => ({
      empId,
      name: empMap.get(empId) ?? empId,
      ...data,
    }))
    .sort((a, b) => b.pieces - a.pieces);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Date</Label>
          <Input
            data-ocid="finishing.production.date.input"
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Employee</Label>
          <Select value={filterEmployee} onValueChange={setFilterEmployee}>
            <SelectTrigger data-ocid="finishing.production.employee.select">
              <SelectValue placeholder="All finishing" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Finishing Employees</SelectItem>
              {finishing.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Bundle</Label>
          <Select value={filterBundle} onValueChange={setFilterBundle}>
            <SelectTrigger data-ocid="finishing.production.bundle.select">
              <SelectValue placeholder="All bundles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Bundles</SelectItem>
              {(bundlesQuery.data ?? []).map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button
            data-ocid="finishing.production.export.button"
            variant="outline"
            className="w-full gap-2"
            onClick={handleExport}
            disabled={filtered.length === 0}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Entries</p>
            <p className="font-display font-bold text-xl">{filtered.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Total Pieces</p>
            <p className="font-display font-bold text-xl">
              {totalPieces.toLocaleString()}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Total Amount</p>
            <p className="font-display font-bold text-xl">
              ₹{totalAmount.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Employee-wise summary */}
      {sortedSummary.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden bg-card shadow-card">
          <div className="px-4 py-3 bg-muted/40 border-b border-border">
            <h3 className="font-display font-semibold text-sm text-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary inline-block" />
              Placed Pieces Summary — Employee Wise
            </h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-8 text-xs">#</TableHead>
                <TableHead className="text-xs">Employee</TableHead>
                <TableHead className="text-right text-xs">
                  Total Pieces
                </TableHead>
                <TableHead className="text-right text-xs">Amount (₹)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSummary.map((row, i) => (
                <TableRow
                  key={row.empId}
                  data-ocid={`finishing.production.summary.item.${i + 1}`}
                  className={i === 0 ? "bg-primary/5" : ""}
                >
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {i + 1}
                  </TableCell>
                  <TableCell className="font-medium text-sm">
                    {row.name}
                    {i === 0 && (
                      <span className="ml-2 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                        Top
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold">
                    {row.pieces.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    ₹
                    {row.amount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Detailed entries */}
      <div className="rounded-lg border border-border overflow-hidden bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Date</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead className="hidden sm:table-cell">Operation</TableHead>
              <TableHead>Bundle</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right hidden md:table-cell">
                Rate
              </TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entriesQuery.isLoading ? (
              ["s1", "s2", "s3"].map((sk) => (
                <TableRow key={sk}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-12 text-muted-foreground"
                  data-ocid="finishing.production.empty_state"
                >
                  <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>No finishing production entries found</p>
                  {filterDate || filterEmployee !== "all" ? (
                    <p className="text-xs mt-1">Try clearing the filters</p>
                  ) : null}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((entry, i) => (
                <TableRow
                  key={entry.id}
                  data-ocid={`finishing.production.item.${i + 1}`}
                >
                  <TableCell className="text-sm">{entry.date}</TableCell>
                  <TableCell className="text-sm font-medium">
                    {empMap.get(entry.employeeId) ?? entry.employeeId}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm">
                    {opMap.get(entry.operationId) ?? entry.operationId}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {entry.bundleId}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {Number(entry.quantity)}
                  </TableCell>
                  <TableCell className="text-right hidden md:table-cell font-mono text-sm">
                    ₹{entry.rate.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold">
                    ₹{entry.amount.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function FinishingDepartmentPage() {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Department header */}
      <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Layers className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display font-bold text-foreground">
            Finishing Department
          </h2>
          <p className="text-xs text-muted-foreground">
            Employees, attendance, and production specific to Finishing
          </p>
        </div>
      </div>

      <Tabs defaultValue="employees" data-ocid="finishing.tab">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger
            value="employees"
            className="flex-1 sm:flex-none gap-1.5"
            data-ocid="finishing.employees.tab"
          >
            <Users className="w-3.5 h-3.5" />
            Employees
          </TabsTrigger>
          <TabsTrigger
            value="attendance"
            className="flex-1 sm:flex-none gap-1.5"
            data-ocid="finishing.attendance.tab"
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            Attendance
          </TabsTrigger>
          <TabsTrigger
            value="production"
            className="flex-1 sm:flex-none gap-1.5"
            data-ocid="finishing.production.tab"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Production
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="mt-4">
          <EmployeesTab />
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">
          <Tabs defaultValue="daily" data-ocid="finishing.attendance.inner.tab">
            <TabsList className="w-full sm:w-auto mb-4">
              <TabsTrigger
                value="daily"
                className="flex-1 sm:flex-none"
                data-ocid="finishing.attendance.daily.tab"
              >
                Daily
              </TabsTrigger>
              <TabsTrigger
                value="monthly"
                className="flex-1 sm:flex-none"
                data-ocid="finishing.attendance.monthly.tab"
              >
                Monthly
              </TabsTrigger>
            </TabsList>
            <TabsContent value="daily">
              <AttendanceDailyTab />
            </TabsContent>
            <TabsContent value="monthly">
              <AttendanceMonthlyTab />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="production" className="mt-4">
          <ProductionTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
