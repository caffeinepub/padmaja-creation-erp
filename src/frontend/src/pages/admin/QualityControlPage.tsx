import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { CheckSquare, Loader2, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useGetBundles, useGetOperations } from "../../hooks/useQueries";

const QC_KEY = "qc_records";

interface QCRecord {
  id: string;
  bundleId: string;
  operationId: string;
  rejectedQty: number;
  reason: string;
  reworkDone: boolean;
  createdAt: string;
}

function getQCRecords(): QCRecord[] {
  try {
    return JSON.parse(localStorage.getItem(QC_KEY) ?? "[]") as QCRecord[];
  } catch {
    return [];
  }
}

function saveQCRecords(records: QCRecord[]): void {
  localStorage.setItem(QC_KEY, JSON.stringify(records));
}

type QCForm = {
  bundleId: string;
  operationId: string;
  rejectedQty: string;
  reason: string;
  reworkDone: boolean;
};

const emptyForm: QCForm = {
  bundleId: "",
  operationId: "",
  rejectedQty: "",
  reason: "",
  reworkDone: false,
};

export default function QualityControlPage() {
  const bundlesQuery = useGetBundles();
  const opsQuery = useGetOperations();

  const [records, setRecords] = useState<QCRecord[]>(getQCRecords);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<QCForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const bundles = bundlesQuery.data ?? [];
  const operations = opsQuery.data ?? [];
  const opMap = new Map(operations.map((o) => [o.id, o]));
  const bundleMap = new Map(bundles.map((b) => [b.id, b]));

  const totalRejected = records.reduce((s, r) => s + r.rejectedQty, 0);
  const pendingRework = records.filter((r) => !r.reworkDone).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bundleId || !form.operationId || !form.rejectedQty) {
      toast.error("Please fill all required fields");
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 200));
    const newRecord: QCRecord = {
      id: `QC${Date.now()}`,
      bundleId: form.bundleId,
      operationId: form.operationId,
      rejectedQty: Number(form.rejectedQty),
      reason: form.reason,
      reworkDone: form.reworkDone,
      createdAt: new Date().toISOString().split("T")[0],
    };
    const updated = [newRecord, ...records];
    saveQCRecords(updated);
    setRecords(updated);
    setSaving(false);
    setDialogOpen(false);
    setForm(emptyForm);
    toast.success("QC record added");
  };

  const handleDelete = () => {
    if (!deleteId) return;
    const updated = records.filter((r) => r.id !== deleteId);
    saveQCRecords(updated);
    setRecords(updated);
    setDeleteId(null);
    toast.success("QC record deleted");
  };

  const toggleRework = (id: string) => {
    const updated = records.map((r) =>
      r.id === id ? { ...r, reworkDone: !r.reworkDone } : r,
    );
    saveQCRecords(updated);
    setRecords(updated);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{records.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Total QC Checks
          </p>
        </div>
        <div className="bg-card border border-red-500/30 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-400">{totalRejected}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Total Rejected</p>
        </div>
        <div className="bg-card border border-amber-500/30 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">{pendingRework}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Pending Rework</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-semibold text-foreground">
            Quality Control Records
          </h2>
        </div>
        <Button
          data-ocid="qc.add_button"
          onClick={() => {
            setForm(emptyForm);
            setDialogOpen(true);
          }}
          className="gap-2"
          size="sm"
        >
          <Plus className="w-4 h-4" />
          Add QC Entry
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden bg-card shadow-card">
        <Table data-ocid="qc.table">
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground text-xs">
                Bundle
              </TableHead>
              <TableHead className="text-muted-foreground text-xs hidden sm:table-cell">
                Operation
              </TableHead>
              <TableHead className="text-muted-foreground text-xs">
                Rejected
              </TableHead>
              <TableHead className="text-muted-foreground text-xs hidden md:table-cell">
                Reason
              </TableHead>
              <TableHead className="text-muted-foreground text-xs">
                Rework
              </TableHead>
              <TableHead className="text-muted-foreground text-xs">
                Date
              </TableHead>
              <TableHead className="text-muted-foreground text-xs w-16">
                Del
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground py-12"
                  data-ocid="qc.empty_state"
                >
                  <CheckSquare className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p>No QC records yet</p>
                </TableCell>
              </TableRow>
            ) : (
              records.map((r, i) => (
                <TableRow
                  key={r.id}
                  data-ocid={`qc.item.${i + 1}`}
                  className="border-border"
                >
                  <TableCell>
                    <span className="text-sm font-mono text-foreground">
                      {r.bundleId}
                    </span>
                    {bundleMap.get(r.bundleId) && (
                      <p className="text-xs text-muted-foreground">
                        {bundleMap.get(r.bundleId)?.style}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-foreground">
                    {opMap.get(r.operationId)?.name ?? r.operationId}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-bold text-red-400">
                      {r.rejectedQty}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      pcs
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[150px] truncate">
                    {r.reason || "—"}
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => toggleRework(r.id)}
                      className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                        r.reworkDone
                          ? "badge-green cursor-default"
                          : "badge-amber cursor-pointer hover:bg-amber-500/25"
                      }`}
                    >
                      {r.reworkDone ? "Done" : "Pending"}
                    </button>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {r.createdAt}
                  </TableCell>
                  <TableCell>
                    <Button
                      data-ocid={`qc.delete_button.${i + 1}`}
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteId(r.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-ocid="qc.dialog" className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add QC Entry</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Bundle *</Label>
              <Select
                value={form.bundleId}
                onValueChange={(v) => setForm((f) => ({ ...f, bundleId: v }))}
              >
                <SelectTrigger data-ocid="qc.bundle.select">
                  <SelectValue placeholder="Select bundle..." />
                </SelectTrigger>
                <SelectContent>
                  {bundles.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.id} — {b.style} ({b.size}/{b.color})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Operation *</Label>
              <Select
                value={form.operationId}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, operationId: v }))
                }
              >
                <SelectTrigger data-ocid="qc.operation.select">
                  <SelectValue placeholder="Select operation..." />
                </SelectTrigger>
                <SelectContent>
                  {operations.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qc-qty">Rejected Quantity *</Label>
              <Input
                id="qc-qty"
                data-ocid="qc.qty.input"
                type="number"
                min="1"
                value={form.rejectedQty}
                onChange={(e) =>
                  setForm((f) => ({ ...f, rejectedQty: e.target.value }))
                }
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qc-reason">Reason / Defect Description</Label>
              <Textarea
                id="qc-reason"
                data-ocid="qc.reason.textarea"
                value={form.reason}
                onChange={(e) =>
                  setForm((f) => ({ ...f, reason: e.target.value }))
                }
                placeholder="Describe the defect..."
                rows={2}
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="qc-rework"
                data-ocid="qc.rework.checkbox"
                checked={form.reworkDone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, reworkDone: e.target.checked }))
                }
                className="w-4 h-4 rounded border-border"
              />
              <Label htmlFor="qc-rework">Rework Already Done</Label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                data-ocid="qc.cancel_button"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                data-ocid="qc.submit_button"
                disabled={saving}
              >
                {saving && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
                Save QC Entry
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent data-ocid="qc.modal">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete QC Record</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="qc.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="qc.confirm_button"
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
