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
  Loader2,
  Package,
  Pencil,
  Plus,
  Printer,
  QrCode,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Bundle } from "../../backend.d";
import {
  useAddBundle,
  useDeleteBundle,
  useGetBundles,
  useUpdateBundle,
} from "../../hooks/useQueries";

function BundleQRDisplay({
  value,
  size = 200,
}: { value: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!value) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, size, size);
      setLoaded(true);
    };
    img.onerror = () => setLoaded(true);
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&format=png&margin=10`;
  }, [value, size]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="bg-white p-3 rounded-lg">
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="block"
          style={{ display: loaded ? "block" : "none" }}
        />
        {!loaded && (
          <div
            className="flex items-center justify-center"
            style={{ width: size, height: size }}
          >
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        )}
      </div>
      <p className="text-xs font-mono text-muted-foreground">{value}</p>
    </div>
  );
}

type BundleForm = {
  style: string;
  size: string;
  color: string;
  qty: string;
  dateCreated: string;
  status: string;
  stage: string;
  priority: string;
};

const emptyForm: BundleForm = {
  style: "",
  size: "M",
  color: "",
  qty: "",
  dateCreated: new Date().toISOString().split("T")[0],
  status: "Running",
  stage: "Cutting",
  priority: "Normal",
};

export default function BundlesPage() {
  const bundlesQuery = useGetBundles();
  const addMutation = useAddBundle();
  const updateMutation = useUpdateBundle();
  const deleteMutation = useDeleteBundle();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editBundle, setEditBundle] = useState<Bundle | null>(null);
  const [form, setForm] = useState<BundleForm>(emptyForm);
  const [qrBundle, setQrBundle] = useState<Bundle | null>(null);
  const [search, setSearch] = useState("");

  const bundles = bundlesQuery.data ?? [];
  const filteredBundles = bundles.filter(
    (b) =>
      b.id.toLowerCase().includes(search.toLowerCase()) ||
      b.style.toLowerCase().includes(search.toLowerCase()) ||
      b.color.toLowerCase().includes(search.toLowerCase()),
  );

  const openAdd = () => {
    setEditBundle(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };
  const openEdit = (bundle: Bundle) => {
    setEditBundle(bundle);
    setForm({
      style: bundle.style,
      size: bundle.size,
      color: bundle.color,
      qty: bundle.quantity.toString(),
      dateCreated: bundle.dateCreated,
      status: bundle.status,
      stage: bundle.stage || "Cutting",
      priority: bundle.priority || "Normal",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = BigInt(Number.parseInt(form.qty) || 0);
    try {
      if (editBundle) {
        await updateMutation.mutateAsync({
          id: editBundle.id,
          style: form.style,
          size: form.size,
          color: form.color,
          qty,
          date: form.dateCreated,
          status: form.status,
          stage: form.stage,
          priority: form.priority,
        });
        toast.success("Bundle updated");
        setDialogOpen(false);
      } else {
        const newId = await addMutation.mutateAsync({
          style: form.style,
          size: form.size,
          color: form.color,
          qty,
          date: form.dateCreated,
          status: form.status,
          stage: form.stage,
          priority: form.priority,
        });
        toast.success("Bundle created");
        setDialogOpen(false);
        const newBundle: Bundle = {
          id: newId,
          style: form.style,
          size: form.size,
          color: form.color,
          quantity: qty,
          dateCreated: form.dateCreated,
          status: form.status,
          stage: form.stage,
          priority: form.priority,
          qrCode: newId,
        };
        setQrBundle(newBundle);
      }
    } catch {
      toast.error("Failed to save bundle");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success("Bundle deleted");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete bundle");
    }
  };

  const handlePrint = (bundle: Bundle) => {
    const printContent = `
      <html><head><title>Bundle QR - ${bundle.id}</title>
      <style>body{font-family:sans-serif;padding:20px;text-align:center;}.label{border:2px solid #000;padding:20px;display:inline-block;max-width:300px;}h2{margin:0 0 10px;}p{margin:4px 0;font-size:14px;}</style>
      </head><body><div class="label">
      <h2>Padmaja Creation Pvt Ltd</h2>
      <p><strong>Bundle ID:</strong> ${bundle.id}</p>
      <p><strong>Style:</strong> ${bundle.style}</p>
      <p><strong>Size:</strong> ${bundle.size} | <strong>Color:</strong> ${bundle.color}</p>
      <p><strong>Qty:</strong> ${Number(bundle.quantity)}</p>
      <p><strong>Date:</strong> ${bundle.dateCreated}</p>
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(bundle.id)}&format=png&margin=10" width="200" height="200" />
      </div><script>window.onload=function(){window.print();}</script></body></html>`;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(printContent);
      win.document.close();
    }
  };

  const isPending = addMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-ocid="bundle.search_input"
            type="text"
            placeholder="Search by ID, style, or color..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          data-ocid="bundle.add_button"
          onClick={openAdd}
          className="gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create Bundle
        </Button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-card shadow-card">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs">
                  Bundle ID
                </TableHead>
                <TableHead className="text-muted-foreground text-xs">
                  Style
                </TableHead>
                <TableHead className="text-muted-foreground text-xs hidden sm:table-cell">
                  Size
                </TableHead>
                <TableHead className="text-muted-foreground text-xs hidden md:table-cell">
                  Color
                </TableHead>
                <TableHead className="text-muted-foreground text-xs hidden md:table-cell">
                  Qty
                </TableHead>
                <TableHead className="text-muted-foreground text-xs">
                  Status
                </TableHead>
                <TableHead className="text-muted-foreground text-xs w-28">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bundlesQuery.isLoading ? (
                [1, 2, 3, 4].map((sk) => (
                  <TableRow key={sk}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredBundles.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-12 text-muted-foreground"
                    data-ocid="bundle.empty_state"
                  >
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p>
                      {search
                        ? `No bundles match "${search}"`
                        : "No bundles created yet"}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredBundles.map((bundle, i) => (
                  <TableRow
                    key={bundle.id}
                    data-ocid={`bundle.item.${i + 1}`}
                    className="border-border"
                  >
                    <TableCell className="font-mono text-sm font-bold text-foreground">
                      {bundle.id}
                    </TableCell>
                    <TableCell className="text-sm text-foreground">
                      {bundle.style}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {bundle.size}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {bundle.color}
                    </TableCell>
                    <TableCell className="hidden md:table-cell font-mono text-sm text-foreground">
                      {Number(bundle.quantity)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          bundle.status === "Running"
                            ? "badge-amber"
                            : "badge-green"
                        }`}
                      >
                        {bundle.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          data-ocid={`bundle.qr_button.${i + 1}`}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300"
                          onClick={() => setQrBundle(bundle)}
                          title="View QR"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          data-ocid={`bundle.edit_button.${i + 1}`}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => openEdit(bundle)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          data-ocid={`bundle.delete_button.${i + 1}`}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(bundle.id)}
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
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md" data-ocid="bundle.dialog">
          <DialogHeader>
            <DialogTitle>
              {editBundle ? "Edit Bundle" : "Create Bundle"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="b-style">Style Number *</Label>
                <Input
                  id="b-style"
                  value={form.style}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, style: e.target.value }))
                  }
                  required
                  placeholder="e.g. PC-102"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Size *</Label>
                <Select
                  value={form.size}
                  onValueChange={(v) => setForm((f) => ({ ...f, size: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["XS", "S", "M", "L", "XL", "XXL"].map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="b-color">Color *</Label>
                <Input
                  id="b-color"
                  value={form.color}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, color: e.target.value }))
                  }
                  required
                  placeholder="e.g. Blue"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="b-qty">Quantity *</Label>
                <Input
                  id="b-qty"
                  type="number"
                  min="1"
                  value={form.qty}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, qty: e.target.value }))
                  }
                  required
                  placeholder="50"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="b-date">Created Date</Label>
                <Input
                  id="b-date"
                  type="date"
                  value={form.dateCreated}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dateCreated: e.target.value }))
                  }
                />
              </div>
              {editBundle && (
                <div className="col-span-2 space-y-1.5">
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Running">Running</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                data-ocid="bundle.cancel_button"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                data-ocid="bundle.save_button"
                disabled={isPending}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editBundle ? "Update" : "Create Bundle"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={!!qrBundle} onOpenChange={(o) => !o && setQrBundle(null)}>
        <DialogContent className="max-w-sm" data-ocid="bundle.modal">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-blue-400" />
              Bundle QR Code
            </DialogTitle>
          </DialogHeader>
          {qrBundle && (
            <div className="flex flex-col items-center gap-4 py-2">
              <BundleQRDisplay value={qrBundle.id} size={200} />
              <div className="w-full space-y-2 text-sm bg-muted/30 rounded-lg p-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bundle ID</span>
                  <span className="font-mono font-bold text-foreground">
                    {qrBundle.id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Style</span>
                  <span className="text-foreground">{qrBundle.style}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Size / Color</span>
                  <span className="text-foreground">
                    {qrBundle.size} / {qrBundle.color}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantity</span>
                  <span className="font-mono text-foreground">
                    {Number(qrBundle.quantity)}
                  </span>
                </div>
              </div>
              <Button
                className="w-full gap-2"
                variant="outline"
                onClick={() => handlePrint(qrBundle)}
              >
                <Printer className="w-4 h-4" />
                Print QR Label
              </Button>
            </div>
          )}
          <div className="flex justify-end">
            <Button
              variant="outline"
              data-ocid="bundle.close_button"
              onClick={() => setQrBundle(null)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bundle</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this bundle.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="bundle.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="bundle.confirm_button"
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
