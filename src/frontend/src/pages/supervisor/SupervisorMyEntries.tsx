import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList } from "lucide-react";
import { useState } from "react";
import {
  useGetEmployees,
  useGetEntriesByDate,
  useGetOperations,
} from "../../hooks/useQueries";

function today() {
  return new Date().toISOString().split("T")[0];
}

export default function SupervisorMyEntries() {
  const [date, setDate] = useState(today());

  const entriesQuery = useGetEntriesByDate(date);
  const employeesQuery = useGetEmployees();
  const operationsQuery = useGetOperations();

  const entries = entriesQuery.data ?? [];
  const employees = employeesQuery.data ?? [];
  const operations = operationsQuery.data ?? [];

  const empMap = new Map(employees.map((e) => [e.id, e.name]));
  const opMap = new Map(operations.map((o) => [o.id, o.name]));

  // Group entries by employee
  const grouped = entries.reduce(
    (acc, entry) => {
      const empId = entry.employeeId;
      if (!acc[empId]) acc[empId] = [];
      acc[empId].push(entry);
      return acc;
    },
    {} as Record<string, typeof entries>,
  );

  const totalPieces = entries.reduce((s, e) => s + Number(e.quantity), 0);
  const totalAmount = entries.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-4">
      {/* Date picker */}
      <div className="space-y-1.5">
        <Label htmlFor="entries-date">Date</Label>
        <Input
          id="entries-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="text-base"
        />
      </div>

      {/* Summary */}
      {entries.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border border-border rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Total Pieces</p>
            <p className="font-display font-bold text-xl">
              {totalPieces.toLocaleString()}
            </p>
          </div>
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Total Amount</p>
            <p className="font-display font-bold text-xl text-primary">
              ₹{totalAmount.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Entries by employee */}
      {entriesQuery.isLoading ? (
        <div className="space-y-3">
          {["s1", "s2", "s3", "s4", "s5"].slice(0, 3).map((skId) => (
            <Skeleton key={skId} className="h-24 w-full" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div
          className="text-center py-12 text-muted-foreground"
          data-ocid="my_entries.empty_state"
        >
          <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No entries for this date</p>
          <p className="text-xs mt-1">
            Submit production entries to see them here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(grouped).map(([empId, empEntries]) => {
            const empName = empMap.get(empId) ?? empId;
            const empTotal = empEntries.reduce((s, e) => s + e.amount, 0);
            const empPieces = empEntries.reduce(
              (s, e) => s + Number(e.quantity),
              0,
            );
            return (
              <div
                key={empId}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {empName.charAt(0)}
                    </div>
                    <span className="font-semibold text-sm">{empName}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {empPieces} pcs
                    </p>
                    <p className="text-sm font-bold text-primary">
                      ₹{empTotal.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="divide-y divide-border">
                  {empEntries.map((entry, i) => (
                    <div
                      key={entry.id}
                      data-ocid={`my_entries.item.${i + 1}`}
                      className="px-4 py-2.5 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {opMap.get(entry.operationId) ?? entry.operationId}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          Bundle: {entry.bundleId} · {Number(entry.quantity)}{" "}
                          pcs × ₹{entry.rate.toFixed(2)}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-right">
                        ₹{entry.amount.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
