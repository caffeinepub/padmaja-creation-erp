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
import {
  CheckCircle2,
  IndianRupee,
  Loader2,
  Plus,
  QrCode,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import QRScannerModal from "../../components/QRScannerModal";
import {
  useAddProductionEntry,
  useGetEmployees,
  useGetOperations,
} from "../../hooks/useQueries";

function today() {
  return new Date().toISOString().split("T")[0];
}

type OperationRow = {
  id: string;
  operationId: string;
  bundleId: string;
  qty: string;
  rate: number;
};

function emptyRow(): OperationRow {
  return {
    id: Math.random().toString(36).slice(2),
    operationId: "",
    bundleId: "",
    qty: "",
    rate: 0,
  };
}

export default function SupervisorProduction() {
  const [date, setDate] = useState(today());
  const [employeeId, setEmployeeId] = useState("");
  const [rows, setRows] = useState<OperationRow[]>([emptyRow()]);
  const [scanRowId, setScanRowId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const employeesQuery = useGetEmployees();
  const operationsQuery = useGetOperations();
  const addEntryMutation = useAddProductionEntry();

  const employees = (employeesQuery.data ?? []).filter(
    (e) => e.status === "Active",
  );
  const operations = operationsQuery.data ?? [];
  const opMap = new Map(operations.map((o) => [o.id, o]));

  const updateRow = (id: string, updates: Partial<OperationRow>) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    );
  };

  const handleOperationChange = (rowId: string, opId: string) => {
    const op = opMap.get(opId);
    updateRow(rowId, { operationId: opId, rate: op?.ratePerPiece ?? 0 });
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);

  const removeRow = (id: string) => {
    if (rows.length === 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const calcAmount = (row: OperationRow) => {
    const qty = Number.parseFloat(row.qty) || 0;
    return qty * row.rate;
  };

  const totalPieces = rows.reduce(
    (s, r) => s + (Number.parseFloat(r.qty) || 0),
    0,
  );
  const totalAmount = rows.reduce((s, r) => s + calcAmount(r), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeeId) {
      toast.error("Please select an employee");
      return;
    }

    const validRows = rows.filter(
      (r) => r.operationId && r.bundleId && Number.parseFloat(r.qty) > 0,
    );

    if (validRows.length === 0) {
      toast.error("Please fill at least one complete operation row");
      return;
    }

    setSubmitting(true);
    try {
      await Promise.all(
        validRows.map((r) => {
          const qty = Number.parseFloat(r.qty);
          const amount = qty * r.rate;
          return addEntryMutation.mutateAsync({
            date,
            employeeId,
            operationId: r.operationId,
            bundleId: r.bundleId,
            qty: BigInt(Math.round(qty)),
            rate: r.rate,
            amount,
          });
        }),
      );

      toast.success(
        `${validRows.length} production entries saved — ₹${totalAmount.toFixed(2)}`,
      );

      // Reset form
      setEmployeeId("");
      setRows([emptyRow()]);
    } catch {
      toast.error("Failed to save production entries");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQrScan = (data: string) => {
    if (scanRowId) {
      updateRow(scanRowId, { bundleId: data });
      toast.success(`Bundle ID set: ${data}`);
    }
    setScanRowId(null);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date */}
        <div className="space-y-1.5">
          <Label htmlFor="prod-date">Date</Label>
          <Input
            data-ocid="production.date.input"
            id="prod-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="text-base"
          />
        </div>

        {/* Employee */}
        <div className="space-y-1.5">
          <Label>Employee *</Label>
          <Select value={employeeId} onValueChange={setEmployeeId}>
            <SelectTrigger
              data-ocid="production.employee.select"
              className="text-base"
            >
              <SelectValue placeholder="Select employee..." />
            </SelectTrigger>
            <SelectContent>
              {employees.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name} — {e.department}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Operation rows */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Operations</Label>
            <span className="text-xs text-muted-foreground">
              {rows.length} operation{rows.length !== 1 ? "s" : ""}
            </span>
          </div>

          {rows.map((row, i) => (
            <div
              key={row.id}
              data-ocid={`production.row.item.${i + 1}`}
              className="bg-card border border-border rounded-xl p-3 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Operation {i + 1}
                </span>
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Operation select */}
              <div className="space-y-1">
                <Select
                  value={row.operationId}
                  onValueChange={(v) => handleOperationChange(row.id, v)}
                >
                  <SelectTrigger
                    data-ocid={
                      i === 0 ? "production.operation.select" : undefined
                    }
                    className="text-base"
                  >
                    <SelectValue placeholder="Select operation..." />
                  </SelectTrigger>
                  <SelectContent>
                    {operations.map((op) => (
                      <SelectItem key={op.id} value={op.id}>
                        {op.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {row.operationId && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <IndianRupee className="w-3 h-3" />
                    Rate: ₹{row.rate.toFixed(2)} per piece
                  </p>
                )}
              </div>

              {/* Bundle ID + QR scan */}
              <div className="space-y-1">
                <div className="flex gap-2">
                  <Input
                    data-ocid={i === 0 ? "production.bundle.input" : undefined}
                    placeholder="Bundle ID (e.g. B101)"
                    value={row.bundleId}
                    onChange={(e) =>
                      updateRow(row.id, { bundleId: e.target.value })
                    }
                    className="flex-1 text-base font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-shrink-0 gap-1"
                    data-ocid={i === 0 ? "production.scan_button" : undefined}
                    onClick={() => setScanRowId(row.id)}
                  >
                    <QrCode className="w-4 h-4" />
                    Scan
                  </Button>
                </div>
              </div>

              {/* Quantity */}
              <div className="flex gap-3 items-end">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Quantity (pcs)</Label>
                  <Input
                    data-ocid={i === 0 ? "production.qty.input" : undefined}
                    type="number"
                    min="1"
                    placeholder="0"
                    value={row.qty}
                    onChange={(e) => updateRow(row.id, { qty: e.target.value })}
                    className="text-base"
                  />
                </div>
                {row.operationId && row.qty && (
                  <div className="pb-0.5 text-right">
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="font-display font-bold text-primary">
                      ₹{calcAmount(row).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add row button */}
        <Button
          type="button"
          variant="outline"
          data-ocid="production.add_row.button"
          className="w-full gap-2 border-dashed"
          onClick={addRow}
        >
          <Plus className="w-4 h-4" />
          Add Another Operation
        </Button>

        {/* Running total */}
        {totalPieces > 0 && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="text-xs text-muted-foreground">Total Pieces</p>
              <p className="font-display font-bold text-xl">
                {Math.round(totalPieces)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total Amount</p>
              <p className="font-display font-bold text-xl text-primary">
                ₹{totalAmount.toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* Submit */}
        <Button
          type="submit"
          data-ocid="production.submit_button"
          className="w-full h-12 text-base gap-2"
          disabled={submitting}
        >
          {submitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <CheckCircle2 className="w-5 h-5" />
          )}
          {submitting ? "Saving..." : "Submit Production"}
        </Button>
      </form>

      {/* QR Scanner Modal */}
      <QRScannerModal
        open={!!scanRowId}
        onClose={() => setScanRowId(null)}
        onScan={handleQrScan}
      />
    </div>
  );
}
