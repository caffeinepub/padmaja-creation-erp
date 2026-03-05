import { Button } from "@/components/ui/button";
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
import { DollarSign, Download } from "lucide-react";
import { useState } from "react";
import { useGetEmployees, useGetMonthlySalary } from "../../hooks/useQueries";
import { exportToExcel } from "../../utils/excel";

export default function SalaryPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear().toString());
  const [month, setMonth] = useState(
    (now.getMonth() + 1).toString().padStart(2, "0"),
  );

  const salaryQuery = useGetMonthlySalary(
    Number.parseInt(year),
    Number.parseInt(month),
  );
  const employeesQuery = useGetEmployees();

  const salaryData = salaryQuery.data ?? [];
  const employees = employeesQuery.data ?? [];
  const empMap = new Map(employees.map((e) => [e.id, e]));

  const totalAmount = salaryData.reduce((s, r) => s + r.totalAmount, 0);
  const totalPieces = salaryData.reduce((s, r) => s + Number(r.totalPieces), 0);

  const MONTH_NAMES = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const handleExport = () => {
    const data = salaryData.map((r) => {
      const emp = empMap.get(r.employeeId);
      return {
        "Employee ID": r.employeeId,
        "Employee Name": emp?.name ?? r.employeeId,
        Department: emp?.department ?? "",
        "Salary Type": emp?.salaryType ?? "",
        "Total Pieces": Number(r.totalPieces),
        "Total Amount (₹)": r.totalAmount.toFixed(2),
      };
    });
    exportToExcel(
      data,
      `salary_${MONTH_NAMES[Number.parseInt(month) - 1]}_${year}.xlsx`,
      "Salary Report",
    );
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Controls */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label htmlFor="sal-month">Month</Label>
          <Input
            data-ocid="salary.month.input"
            id="sal-month"
            type="month"
            value={`${year}-${month}`}
            onChange={(e) => {
              const [y, m] = e.target.value.split("-");
              setYear(y);
              setMonth(m);
            }}
            className="w-44"
          />
        </div>
        <Button
          data-ocid="salary.export_button"
          variant="outline"
          className="gap-2"
          onClick={handleExport}
          disabled={salaryData.length === 0}
        >
          <Download className="w-4 h-4" />
          Export Excel
        </Button>
      </div>

      {/* Summary */}
      {salaryData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground">Total Employees</p>
            <p className="font-display font-bold text-2xl">
              {salaryData.length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground">Total Pieces</p>
            <p className="font-display font-bold text-2xl">
              {totalPieces.toLocaleString()}
            </p>
          </div>
          <div className="col-span-2 md:col-span-1 bg-primary/5 border border-primary/20 rounded-lg p-4">
            <p className="text-xs text-muted-foreground">Total Salary</p>
            <p className="font-display font-bold text-2xl">
              ₹
              {totalAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border overflow-hidden bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>#</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead className="hidden sm:table-cell">Department</TableHead>
              <TableHead className="text-right">Total Pieces</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {salaryQuery.isLoading ? (
              ["s1", "s2", "s3", "s4", "s5"].slice(0, 5).map((skId) => (
                <TableRow key={skId}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : salaryData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-12 text-muted-foreground"
                  data-ocid="salary.empty_state"
                >
                  <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>No salary data for this period</p>
                </TableCell>
              </TableRow>
            ) : (
              salaryData.map((r, i) => {
                const emp = empMap.get(r.employeeId);
                return (
                  <TableRow
                    key={r.employeeId}
                    data-ocid={`salary.item.${i + 1}`}
                  >
                    <TableCell className="text-muted-foreground text-sm">
                      {i + 1}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">
                          {emp?.name ?? r.employeeId}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {emp?.salaryType}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {emp?.department ?? "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {Number(r.totalPieces).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-sm">
                      ₹
                      {r.totalAmount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
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
