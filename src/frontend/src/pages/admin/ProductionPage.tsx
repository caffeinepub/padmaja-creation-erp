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
import { ClipboardList, FileSpreadsheet } from "lucide-react";
import { useState } from "react";
import {
  useGetBundles,
  useGetEmployees,
  useGetOperations,
  useGetProductionEntries,
} from "../../hooks/useQueries";
import { exportToExcel } from "../../utils/excel";

export default function ProductionPage() {
  const entriesQuery = useGetProductionEntries();
  const employeesQuery = useGetEmployees();
  const operationsQuery = useGetOperations();
  const bundlesQuery = useGetBundles();

  const [filterDate, setFilterDate] = useState("");
  const [filterEmployee, setFilterEmployee] = useState("all");
  const [filterBundle, setFilterBundle] = useState("all");

  const entries = entriesQuery.data ?? [];
  const employees = employeesQuery.data ?? [];
  const operations = operationsQuery.data ?? [];

  const empMap = new Map(employees.map((e) => [e.id, e.name]));
  const opMap = new Map(operations.map((o) => [o.id, o.name]));

  const filtered = entries.filter((e) => {
    if (filterDate && e.date !== filterDate) return false;
    if (filterEmployee !== "all" && e.employeeId !== filterEmployee)
      return false;
    if (filterBundle !== "all" && e.bundleId !== filterBundle) return false;
    return true;
  });

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
      `production_report_${new Date().toISOString().split("T")[0]}.xlsx`,
      "Production",
    );
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Date</Label>
          <Input
            data-ocid="production.date.input"
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Employee</Label>
          <Select value={filterEmployee} onValueChange={setFilterEmployee}>
            <SelectTrigger>
              <SelectValue placeholder="All employees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Employees</SelectItem>
              {employees.map((e) => (
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
            <SelectTrigger>
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
            data-ocid="reports.production.button"
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

      {/* Stats summary */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Entries</p>
            <p className="font-display font-bold text-xl">{filtered.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Total Pieces</p>
            <p className="font-display font-bold text-xl">
              {filtered
                .reduce((s, e) => s + Number(e.quantity), 0)
                .toLocaleString()}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Total Amount</p>
            <p className="font-display font-bold text-xl">
              ₹{filtered.reduce((s, e) => s + e.amount, 0).toLocaleString()}
            </p>
          </div>
        </div>
      )}

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
              ["s1", "s2", "s3", "s4", "s5"].slice(0, 5).map((skId) => (
                <TableRow key={skId}>
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
                  data-ocid="production.empty_state"
                >
                  <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>No production entries found</p>
                  {filterDate || filterEmployee !== "all" ? (
                    <p className="text-xs mt-1">Try clearing the filters</p>
                  ) : null}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((entry, i) => (
                <TableRow key={entry.id} data-ocid={`production.item.${i + 1}`}>
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
