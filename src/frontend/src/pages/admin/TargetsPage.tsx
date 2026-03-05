import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Loader2, Plus, Target } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useGetOperations,
  useGetTargets,
  useSetTarget,
} from "../../hooks/useQueries";

function today() {
  return new Date().toISOString().split("T")[0];
}

export default function TargetsPage() {
  const targetsQuery = useGetTargets();
  const operationsQuery = useGetOperations();
  const setTargetMutation = useSetTarget();

  const [form, setForm] = useState({
    operationId: "",
    qty: "",
    date: today(),
  });

  const targets = targetsQuery.data ?? [];
  const operations = operationsQuery.data ?? [];
  const opMap = new Map(operations.map((o) => [o.id, o.name]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.operationId || !form.qty || !form.date) {
      toast.error("Please fill all fields");
      return;
    }
    try {
      await setTargetMutation.mutateAsync({
        operationId: form.operationId,
        qty: BigInt(Number.parseInt(form.qty)),
        date: form.date,
      });
      toast.success("Target set successfully");
      setForm((f) => ({ ...f, operationId: "", qty: "" }));
    } catch {
      toast.error("Failed to set target");
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Form */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display flex items-center gap-2">
            <Target className="w-4 h-4" />
            Set Daily Target
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="flex flex-wrap gap-3 items-end"
          >
            <div className="space-y-1 flex-1 min-w-40">
              <Label>Operation *</Label>
              <Select
                value={form.operationId}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, operationId: v }))
                }
              >
                <SelectTrigger data-ocid="targets.operation.select">
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
            </div>
            <div className="space-y-1 w-32">
              <Label htmlFor="target-qty">Target Qty *</Label>
              <Input
                id="target-qty"
                data-ocid="targets.qty.input"
                type="number"
                min="1"
                value={form.qty}
                onChange={(e) =>
                  setForm((f) => ({ ...f, qty: e.target.value }))
                }
                placeholder="1000"
                required
              />
            </div>
            <div className="space-y-1 w-44">
              <Label htmlFor="target-date">Date *</Label>
              <Input
                id="target-date"
                data-ocid="targets.date.input"
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
                required
              />
            </div>
            <Button
              type="submit"
              data-ocid="targets.submit_button"
              disabled={setTargetMutation.isPending}
              className="gap-2"
            >
              {setTargetMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Set Target
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Targets table */}
      <div className="rounded-lg border border-border overflow-hidden bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Date</TableHead>
              <TableHead>Operation</TableHead>
              <TableHead className="text-right">Target Qty</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {targetsQuery.isLoading ? (
              ["s1", "s2", "s3", "s4", "s5"].slice(0, 4).map((skId) => (
                <TableRow key={skId}>
                  <TableCell colSpan={3}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : targets.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center py-12 text-muted-foreground"
                  data-ocid="targets.empty_state"
                >
                  <Target className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>No targets set yet</p>
                </TableCell>
              </TableRow>
            ) : (
              [...targets]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((t, i) => (
                  <TableRow key={t.id} data-ocid={`targets.item.${i + 1}`}>
                    <TableCell className="text-sm">{t.date}</TableCell>
                    <TableCell className="font-medium text-sm">
                      {opMap.get(t.operationId) ?? t.operationId}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {Number(t.targetQty).toLocaleString()}
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
