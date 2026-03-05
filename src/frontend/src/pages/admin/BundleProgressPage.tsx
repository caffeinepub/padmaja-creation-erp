import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart2, CheckCircle2, Clock, Package } from "lucide-react";
import { useState } from "react";
import {
  useGetBundleProgress,
  useGetBundles,
  useGetOperations,
} from "../../hooks/useQueries";

export default function BundleProgressPage() {
  const [selectedBundleId, setSelectedBundleId] = useState("");

  const bundlesQuery = useGetBundles();
  const operationsQuery = useGetOperations();
  const progressQuery = useGetBundleProgress(selectedBundleId);

  const bundles = bundlesQuery.data ?? [];
  const operations = operationsQuery.data ?? [];
  const progress = progressQuery.data ?? [];

  const opMap = new Map(operations.map((o) => [o.id, o.name]));
  const selectedBundle = bundles.find((b) => b.id === selectedBundleId);

  const completedCount = progress.filter((p) => p.completed).length;
  const totalCount = progress.length;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-1.5">
        <Label>Select Bundle</Label>
        <Select value={selectedBundleId} onValueChange={setSelectedBundleId}>
          <SelectTrigger
            className="max-w-xs"
            data-ocid="bundle_progress.select"
          >
            <SelectValue placeholder="Choose a bundle..." />
          </SelectTrigger>
          <SelectContent>
            {bundles.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.id} — {b.styleNumber} ({b.size}/{b.color})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedBundle && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Bundle ID</p>
              <p className="font-mono font-bold">{selectedBundle.id}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Style</p>
              <p className="font-medium">{selectedBundle.styleNumber}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Size / Color</p>
              <p>
                {selectedBundle.size} / {selectedBundle.color}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge
                className={`text-xs ${selectedBundle.status === "Running" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}
                variant="secondary"
              >
                {selectedBundle.status}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {selectedBundleId && (
        <div className="space-y-3">
          {/* Progress bar */}
          {totalCount > 0 && (
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm font-mono">
                  {completedCount}/{totalCount} operations
                </span>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${(completedCount / totalCount) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((completedCount / totalCount) * 100)}% complete
              </p>
            </div>
          )}

          {/* Operations list */}
          {progressQuery.isLoading ? (
            <div className="space-y-2">
              {["s1", "s2", "s3", "s4", "s5"].slice(0, 4).map((skId) => (
                <Skeleton key={skId} className="h-14 w-full" />
              ))}
            </div>
          ) : progress.length === 0 ? (
            <div
              className="text-center py-12 text-muted-foreground bg-card border border-border rounded-lg"
              data-ocid="bundle_progress.empty_state"
            >
              <BarChart2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No operation data for this bundle yet</p>
              <p className="text-xs mt-1">
                Production entries will appear here once supervisors submit them
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {progress.map((p, i) => {
                const opName = opMap.get(p.operationId) ?? p.operationId;
                return (
                  <div
                    key={p.operationId}
                    data-ocid={`bundle_progress.item.${i + 1}`}
                    className={`flex items-center gap-3 p-4 rounded-lg border ${
                      p.completed
                        ? "bg-green-50 border-green-100"
                        : "bg-card border-border"
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {p.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <span className="flex-1 font-medium text-sm">{opName}</span>
                    <Badge
                      className={`text-xs ${p.completed ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"}`}
                      variant="secondary"
                    >
                      {p.completed ? "✓ Completed" : "Pending"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!selectedBundleId && (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Select a bundle to view its production progress</p>
        </div>
      )}
    </div>
  );
}
