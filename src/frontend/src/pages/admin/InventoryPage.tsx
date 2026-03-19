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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  Loader2,
  Pencil,
  Plus,
  Search,
  Warehouse,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { InventoryItem } from "../../backend.d";
import {
  useAddInventoryItem,
  useGetBundles,
  useGetInventory,
  useIssueInventoryToBundle,
  useUpdateInventoryItem,
} from "../../hooks/useQueries";

const LOW_STOCK_THRESHOLD = 10;

type ItemForm = {
  itemName: string;
  stockQty: string;
  unit: string;
};

const emptyForm: ItemForm = {
  itemName: "",
  stockQty: "",
  unit: "meters",
};

const UNITS = [
  "meters",
  "kg",
  "pieces",
  "rolls",
  "boxes",
  "liters",
  "pairs",
  "dozens",
];

export default function InventoryPage() {
  const inventoryQuery = useGetInventory();
  const bundlesQuery = useGetBundles();
  const addMutation = useAddInventoryItem();
  const updateMutation = useUpdateInventoryItem();
  const issueMutation = useIssueInventoryToBundle();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState<ItemForm>(emptyForm);
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [issueItem, setIssueItem] = useState<InventoryItem | null>(null);
  const [issueQty, setIssueQty] = useState("");
  const [issueBundleId, setIssueBundleId] = useState("");
  const [alertItem, setAlertItem] = useState<InventoryItem | null>(null);

  const inventory = inventoryQuery.data ?? [];
  const bundles = bundlesQuery.data ?? [];
  const activeBundles = bundles.filter(
    (b) => b.status === "Running" || b.status === "InProgress",
  );

  const filtered = inventory.filter((item) =>
    item.itemName.toLowerCase().includes(search.toLowerCase()),
  );

  const lowStockItems = inventory.filter(
    (item) => Number(item.stockQty) <= LOW_STOCK_THRESHOLD,
  );

  const openAdd = () => {
    setEditItem(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditItem(item);
    setForm({
      itemName: item.itemName,
      stockQty: String(Number(item.stockQty)),
      unit: item.unit,
    });
    setDialogOpen(true);
  };

  const openIssue = (item: InventoryItem) => {
    setIssueItem(item);
    setIssueQty("");
    setIssueBundleId("");
    setIssueDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.itemName.trim()) {
      toast.error("Item name is required");
      return;
    }
    const qty = Number.parseInt(form.stockQty);
    if (Number.isNaN(qty) || qty < 0) {
      toast.error("Enter a valid stock quantity");
      return;
    }
    try {
      if (editItem) {
        await updateMutation.mutateAsync({
          id: editItem.id,
          itemName: form.itemName.trim(),
          stockQty: BigInt(qty),
          unit: form.unit,
        });
        toast.success("Item updated");
      } else {
        await addMutation.mutateAsync({
          itemName: form.itemName.trim(),
          stockQty: BigInt(qty),
          unit: form.unit,
        });
        toast.success("Item added to inventory");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save item");
    }
  };

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueItem) return;
    const qty = Number.parseInt(issueQty);
    if (Number.isNaN(qty) || qty <= 0) {
      toast.error("Enter a valid quantity to issue");
      return;
    }
    if (qty > Number(issueItem.stockQty)) {
      toast.error("Quantity exceeds available stock");
      return;
    }
    try {
      await issueMutation.mutateAsync({ id: issueItem.id, qty: BigInt(qty) });
      toast.success(`Issued ${qty} ${issueItem.unit} of ${issueItem.itemName}`);
      setIssueDialogOpen(false);
    } catch {
      toast.error("Failed to issue inventory");
    }
  };

  const isPending = addMutation.isPending || updateMutation.isPending;

  const getStockStatus = (qty: number) => {
    if (qty === 0) return { label: "Out of Stock", cls: "badge-red" };
    if (qty <= LOW_STOCK_THRESHOLD)
      return { label: "Low Stock", cls: "badge-amber" };
    return { label: "In Stock", cls: "badge-green" };
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Low stock alert banner */}
      {lowStockItems.length > 0 && (
        <div
          data-ocid="inventory.error_state"
          className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3"
        >
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-300">
              {lowStockItems.length} item{lowStockItems.length > 1 ? "s" : ""}{" "}
              running low
            </p>
            <p className="text-xs text-amber-400/80 mt-0.5">
              {lowStockItems.map((i) => i.itemName).join(", ")}
            </p>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Total Items",
            value: inventory.length,
            icon: Boxes,
            color: "text-primary",
          },
          {
            label: "In Stock",
            value: inventory.filter(
              (i) => Number(i.stockQty) > LOW_STOCK_THRESHOLD,
            ).length,
            icon: Warehouse,
            color: "text-success",
          },
          {
            label: "Low Stock",
            value: inventory.filter(
              (i) =>
                Number(i.stockQty) > 0 &&
                Number(i.stockQty) <= LOW_STOCK_THRESHOLD,
            ).length,
            icon: AlertTriangle,
            color: "text-warning",
          },
          {
            label: "Out of Stock",
            value: inventory.filter((i) => Number(i.stockQty) === 0).length,
            icon: AlertTriangle,
            color: "text-destructive",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-card border border-border rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground font-medium">
                {stat.label}
              </p>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className={`text-2xl font-bold font-display ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-ocid="inventory.search_input"
            placeholder="Search inventory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          data-ocid="inventory.add_button"
          onClick={openAdd}
          className="gap-2 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden bg-card shadow-card">
        <Table data-ocid="inventory.table">
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground text-xs">
                Item Name
              </TableHead>
              <TableHead className="text-muted-foreground text-xs">
                Stock Qty
              </TableHead>
              <TableHead className="text-muted-foreground text-xs hidden sm:table-cell">
                Unit
              </TableHead>
              <TableHead className="text-muted-foreground text-xs">
                Status
              </TableHead>
              <TableHead className="text-muted-foreground text-xs w-24">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventoryQuery.isLoading ? (
              [1, 2, 3, 4].map((sk) => (
                <TableRow key={sk}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-14"
                  data-ocid="inventory.empty_state"
                >
                  <Boxes className="w-10 h-10 mx-auto mb-2 text-muted-foreground opacity-20" />
                  <p className="text-muted-foreground">
                    No inventory items found
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Add fabric, thread, buttons, and other materials
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item, i) => {
                const qty = Number(item.stockQty);
                const status = getStockStatus(qty);
                return (
                  <TableRow
                    key={item.id}
                    data-ocid={`inventory.item.${i + 1}`}
                    className={`border-border ${
                      qty === 0
                        ? "bg-destructive/5"
                        : qty <= LOW_STOCK_THRESHOLD
                          ? "bg-amber-500/5"
                          : ""
                    }`}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {qty <= LOW_STOCK_THRESHOLD && (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        )}
                        <span className="font-medium text-sm text-foreground">
                          {item.itemName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono font-semibold text-foreground">
                        {qty.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {item.unit}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.cls}`}
                      >
                        {status.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          data-ocid={`inventory.edit_button.${i + 1}`}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => openEdit(item)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          data-ocid={`inventory.secondary_button.${i + 1}`}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-primary hover:text-primary"
                          onClick={() => openIssue(item)}
                          title="Issue to Bundle"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm" data-ocid="inventory.dialog">
          <DialogHeader>
            <DialogTitle>
              {editItem ? "Edit Inventory Item" : "Add Inventory Item"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="inv-name">Item Name *</Label>
              <Input
                id="inv-name"
                data-ocid="inventory.input"
                value={form.itemName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, itemName: e.target.value }))
                }
                placeholder="e.g. Cotton Fabric, Thread, Buttons"
                required
                list="item-suggestions"
              />
              <datalist id="item-suggestions">
                {[
                  "Cotton Fabric",
                  "Polyester Thread",
                  "Nylon Thread",
                  "Buttons",
                  "Zippers",
                  "Labels",
                  "Interlining",
                  "Elastic",
                ].map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-qty">Stock Quantity *</Label>
              <Input
                id="inv-qty"
                type="number"
                min="0"
                value={form.stockQty}
                onChange={(e) =>
                  setForm((f) => ({ ...f, stockQty: e.target.value }))
                }
                placeholder="0"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Unit</Label>
              <Select
                value={form.unit}
                onValueChange={(v) => setForm((f) => ({ ...f, unit: v }))}
              >
                <SelectTrigger data-ocid="inventory.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                data-ocid="inventory.cancel_button"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                data-ocid="inventory.save_button"
                disabled={isPending}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editItem ? "Update" : "Add Item"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Issue to Bundle Dialog */}
      <Dialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen}>
        <DialogContent className="max-w-sm" data-ocid="inventory.modal">
          <DialogHeader>
            <DialogTitle>Issue to Bundle</DialogTitle>
          </DialogHeader>
          {issueItem && (
            <form onSubmit={handleIssue} className="space-y-4">
              <div className="bg-muted/30 rounded-xl p-3 space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  {issueItem.itemName}
                </p>
                <p className="text-xs text-muted-foreground">
                  Available: {Number(issueItem.stockQty).toLocaleString()}{" "}
                  {issueItem.unit}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Bundle (Optional)</Label>
                <Select value={issueBundleId} onValueChange={setIssueBundleId}>
                  <SelectTrigger data-ocid="inventory.issue.select">
                    <SelectValue placeholder="Select bundle (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeBundles.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.id} — {b.style} ({b.size})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="issue-qty">Quantity to Issue *</Label>
                <Input
                  id="issue-qty"
                  data-ocid="inventory.issue.input"
                  type="number"
                  min="1"
                  max={Number(issueItem.stockQty)}
                  value={issueQty}
                  onChange={(e) => setIssueQty(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  data-ocid="inventory.cancel_button"
                  onClick={() => setIssueDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  data-ocid="inventory.confirm_button"
                  disabled={issueMutation.isPending}
                >
                  {issueMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Issue Stock
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Low stock alert dialog for single item */}
      <AlertDialog
        open={!!alertItem}
        onOpenChange={(o) => !o && setAlertItem(null)}
      >
        <AlertDialogContent data-ocid="inventory.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Low Stock Warning</AlertDialogTitle>
            <AlertDialogDescription>
              {alertItem?.itemName} has only {Number(alertItem?.stockQty ?? 0)}{" "}
              {alertItem?.unit} remaining. Consider restocking soon.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="inventory.cancel_button">
              Dismiss
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="inventory.confirm_button"
              onClick={() => {
                openEdit(alertItem!);
                setAlertItem(null);
              }}
            >
              Update Stock
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
