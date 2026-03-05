import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { useState } from "react";
import {
  useGetBundles,
  useGetEmployees,
  useGetMonthlySalary,
  useGetOperations,
  useGetProductionEntries,
} from "../../hooks/useQueries";
import { exportMultiSheetExcel, exportToExcel } from "../../utils/excel";

export default function ReportsPage() {
  const now = new Date();
  const [reportYear, setReportYear] = useState(now.getFullYear().toString());
  const [reportMonth, setReportMonth] = useState(
    (now.getMonth() + 1).toString().padStart(2, "0"),
  );

  const entriesQuery = useGetProductionEntries();
  const employeesQuery = useGetEmployees();
  const operationsQuery = useGetOperations();
  const bundlesQuery = useGetBundles();
  const salaryQuery = useGetMonthlySalary(
    Number.parseInt(reportYear),
    Number.parseInt(reportMonth),
  );

  const employees = employeesQuery.data ?? [];
  const operations = operationsQuery.data ?? [];
  const bundles = bundlesQuery.data ?? [];
  const entries = entriesQuery.data ?? [];
  const salaryData = salaryQuery.data ?? [];

  const empMap = new Map(employees.map((e) => [e.id, e]));
  const opMap = new Map(operations.map((o) => [o.id, o]));

  const isLoading =
    entriesQuery.isLoading ||
    employeesQuery.isLoading ||
    operationsQuery.isLoading;

  // Report 1: Production Report
  const exportProductionReport = () => {
    const data = entries.map((e) => ({
      Date: e.date,
      Employee: empMap.get(e.employeeId)?.name ?? e.employeeId,
      Operation: opMap.get(e.operationId)?.name ?? e.operationId,
      Bundle: e.bundleId,
      Quantity: Number(e.quantity),
      "Rate (₹)": e.rate,
      "Amount (₹)": e.amount,
    }));
    exportToExcel(
      data,
      `production_report_${new Date().toISOString().split("T")[0]}.xlsx`,
      "Production",
    );
  };

  // Report 2: Employee Salary Report
  const exportSalaryReport = () => {
    const data = salaryData.map((r) => {
      const emp = empMap.get(r.employeeId);
      return {
        "Employee Name": emp?.name ?? r.employeeId,
        Department: emp?.department ?? "",
        "Salary Type": emp?.salaryType ?? "",
        "Total Pieces": Number(r.totalPieces),
        "Total Amount (₹)": r.totalAmount.toFixed(2),
      };
    });
    exportToExcel(
      data,
      `salary_report_${reportYear}_${reportMonth}.xlsx`,
      "Salary",
    );
  };

  // Report 3: Monthly Production Report (3 sheets)
  const exportMonthlyReport = () => {
    const yearNum = Number.parseInt(reportYear);
    const monthNum = Number.parseInt(reportMonth);

    const monthEntries = entries.filter((e) => {
      const [y, m] = e.date.split("-");
      return Number.parseInt(y) === yearNum && Number.parseInt(m) === monthNum;
    });

    // Operation-wise
    const opWise = new Map<string, { pieces: number; amount: number }>();
    for (const e of monthEntries) {
      const key = e.operationId;
      const prev = opWise.get(key) ?? { pieces: 0, amount: 0 };
      opWise.set(key, {
        pieces: prev.pieces + Number(e.quantity),
        amount: prev.amount + e.amount,
      });
    }
    const opSheet = Array.from(opWise.entries()).map(([opId, stats]) => ({
      Operation: opMap.get(opId)?.name ?? opId,
      "Total Pieces": stats.pieces,
      "Total Amount (₹)": stats.amount.toFixed(2),
    }));

    // Employee-wise
    const empWise = new Map<string, { pieces: number; amount: number }>();
    for (const e of monthEntries) {
      const key = e.employeeId;
      const prev = empWise.get(key) ?? { pieces: 0, amount: 0 };
      empWise.set(key, {
        pieces: prev.pieces + Number(e.quantity),
        amount: prev.amount + e.amount,
      });
    }
    const empSheet = Array.from(empWise.entries()).map(([empId, stats]) => ({
      Employee: empMap.get(empId)?.name ?? empId,
      "Total Pieces": stats.pieces,
      "Total Amount (₹)": stats.amount.toFixed(2),
    }));

    // Bundle-wise
    const bundleWise = new Map<string, { pieces: number; amount: number }>();
    for (const e of monthEntries) {
      const key = e.bundleId;
      const prev = bundleWise.get(key) ?? { pieces: 0, amount: 0 };
      bundleWise.set(key, {
        pieces: prev.pieces + Number(e.quantity),
        amount: prev.amount + e.amount,
      });
    }
    const bMap = new Map(bundles.map((b) => [b.id, b]));
    const bundleSheet = Array.from(bundleWise.entries()).map(([bid, stats]) => {
      const b = bMap.get(bid);
      return {
        "Bundle ID": bid,
        Style: b?.styleNumber ?? "",
        Size: b?.size ?? "",
        "Total Pieces": stats.pieces,
        "Total Amount (₹)": stats.amount.toFixed(2),
      };
    });

    exportMultiSheetExcel(
      [
        { name: "Operation-Wise", data: opSheet as Record<string, unknown>[] },
        { name: "Employee-Wise", data: empSheet as Record<string, unknown>[] },
        { name: "Bundle-Wise", data: bundleSheet as Record<string, unknown>[] },
      ],
      `monthly_report_${reportYear}_${reportMonth}.xlsx`,
    );
  };

  const reports = [
    {
      title: "Production Report",
      description:
        "All production entries with date, employee, operation, bundle, qty, rate, and amount",
      icon: FileSpreadsheet,
      action: exportProductionReport,
      ocid: "reports.production.button",
      disabled: entries.length === 0,
    },
    {
      title: "Employee Salary Report",
      description: `Salary summary for ${reportMonth}/${reportYear} — total pieces and amount per employee`,
      icon: Download,
      action: exportSalaryReport,
      ocid: "reports.salary.button",
      disabled: salaryData.length === 0,
    },
    {
      title: "Monthly Production Report",
      description:
        "Three-sheet report: operation-wise, employee-wise, and bundle-wise breakdown",
      icon: FileSpreadsheet,
      action: exportMonthlyReport,
      ocid: "reports.monthly.button",
      disabled: entries.length === 0,
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Month selector */}
      <div className="space-y-1">
        <Label htmlFor="report-month">Report Period</Label>
        <Input
          id="report-month"
          type="month"
          value={`${reportYear}-${reportMonth}`}
          onChange={(e) => {
            const [y, m] = e.target.value.split("-");
            setReportYear(y);
            setReportMonth(m);
          }}
          className="w-44"
        />
      </div>

      {/* Report cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.title} className="shadow-card">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-base font-display">
                  {report.title}
                </CardTitle>
                <CardDescription className="text-xs">
                  {report.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  data-ocid={report.ocid}
                  className="w-full gap-2"
                  onClick={report.action}
                  disabled={isLoading || report.disabled}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Download Excel
                </Button>
                {report.disabled && !isLoading && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    No data available for this period
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary stats */}
      {!isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="bg-card border border-border rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Total Entries</p>
            <p className="font-bold text-lg">{entries.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Employees</p>
            <p className="font-bold text-lg">{employees.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Operations</p>
            <p className="font-bold text-lg">{operations.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Bundles</p>
            <p className="font-bold text-lg">{bundles.length}</p>
          </div>
        </div>
      )}
    </div>
  );
}
