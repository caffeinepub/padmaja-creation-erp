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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Cog, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Operation } from "../../backend.d";
import {
  useAddOperation,
  useDeleteOperation,
  useGetOperations,
  useUpdateOperation,
} from "../../hooks/useQueries";

type OpForm = {
  name: string;
  rate: string;
  dept: string;
  target: string;
};

const emptyForm: OpForm = {
  name: "",
  rate: "",
  dept: "",
  target: "1000",
};

const SAMPLE_OPERATIONS = [
  "Collar Attach",
  "Sleeve Join",
  "Button Attach",
  "Side Stitch",
  "Overlock",
  "Ironing",
  "Packing",
];

export default function OperationsPage() {
  const opsQuery = useGetOperations();
  const addMutation = useAddOperation();
  const updateMutation = useUpdateOperation();
  const deleteMutation = useDeleteOperation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editOp, setEditOp] = useState<Operation | null>(null);
  const [form, setForm] = useState<OpForm>(emptyForm);

  const operations = opsQuery.data ?? [];

  const openAdd = () => {
    setEditOp(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (op: Operation) => {
    setEditOp(op);
    setForm({
      name: op.name,
      rate: op.ratePerPiece.toString(),
      dept: op.department,
      target: op.dailyTarget.toString(),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rate = Number.parseFloat(form.rate);
    const target = BigInt(Number.parseInt(form.target) || 0);
    if (Number.isNaN(rate) || rate <= 0) {
      toast.error("Rate must be a positive number");
      return;
    }
    try {
      if (editOp) {
        await updateMutation.mutateAsync({
          id: editOp.id,
          name: form.name,
          rate,
          dept: form.dept,
          target,
        });
        toast.success("Operation updated");
      } else {
        await addMutation.mutateAsync({
          name: form.name,
          rate,
          dept: form.dept,
          target,
        });
        toast.success("Operation added");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save operation");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success("Operation deleted");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete operation");
    }
  };

  const isPending = addMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-end">
        <Button
          data-ocid="operation.add_button"
          onClick={openAdd}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Operation
        </Button>
      </div>

      <div className="rounded-lg border border-border overflow-hidden bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Operation Name</TableHead>
              <TableHead className="hidden sm:table-cell">Department</TableHead>
              <TableHead>Rate/Piece</TableHead>
              <TableHead className="hidden md:table-cell">
                Daily Target
              </TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {opsQuery.isLoading ? (
              ["s1", "s2", "s3", "s4", "s5"].slice(0, 4).map((skId) => (
                <TableRow key={skId}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : operations.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-12 text-muted-foreground"
                  data-ocid="operation.empty_state"
                >
                  <Cog className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>No operations defined yet</p>
                  <p className="text-xs mt-1">
                    Examples: {SAMPLE_OPERATIONS.slice(0, 3).join(", ")}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              operations.map((op, i) => (
                <TableRow key={op.id} data-ocid={`operation.item.${i + 1}`}>
                  <TableCell className="font-medium">{op.name}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                    {op.department}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    ₹{op.ratePerPiece.toFixed(2)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell font-mono text-sm">
                    {Number(op.dailyTarget).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        data-ocid={`operation.edit_button.${i + 1}`}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => openEdit(op)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        data-ocid={`operation.delete_button.${i + 1}`}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(op.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md" data-ocid="operation.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editOp ? "Edit Operation" : "Add Operation"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="op-name">Operation Name *</Label>
              <Input
                id="op-name"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                required
                placeholder="e.g. Collar Attach"
                list="op-suggestions"
              />
              <datalist id="op-suggestions">
                {SAMPLE_OPERATIONS.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="op-rate">Rate per Piece (₹) *</Label>
                <Input
                  id="op-rate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.rate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, rate: e.target.value }))
                  }
                  required
                  placeholder="2.50"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="op-target">Daily Target (pcs) *</Label>
                <Input
                  id="op-target"
                  type="number"
                  min="1"
                  value={form.target}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, target: e.target.value }))
                  }
                  required
                  placeholder="1000"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="op-dept">Department *</Label>
              <Input
                id="op-dept"
                value={form.dept}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dept: e.target.value }))
                }
                required
                placeholder="e.g. Stitching"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                data-ocid="operation.cancel_button"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                data-ocid="operation.save_button"
                disabled={isPending}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editOp ? "Update" : "Add Operation"}
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
        <AlertDialogContent data-ocid="operation.modal">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Operation</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this operation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="operation.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="operation.confirm_button"
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
