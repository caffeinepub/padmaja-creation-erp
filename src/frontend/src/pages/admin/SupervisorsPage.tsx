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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  CheckCircle2,
  Copy,
  Download,
  Edit2,
  Eye,
  EyeOff,
  Info,
  KeyRound,
  Plus,
  RefreshCw,
  Share2,
  Shield,
  Sparkles,
  Trash2,
  Upload,
  UserCog,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { SupervisorAccount } from "../../hooks/useAuth";
import { exportSyncCode, importUploadCode } from "../../hooks/useAuth";
import { useAdminAutoSync } from "../../hooks/useAutoSync";
import { useSupervisors } from "../../hooks/useSupervisors";

const ALL_DATA_KEYS = [
  "pc_erp_supervisors",
  "pc_erp_employees",
  "pc_erp_operations",
  "pc_erp_bundles",
  "pc_erp_production",
  "pc_erp_attendance",
  "pc_erp_targets",
  "pc_erp_counters",
  "pc_erp_session",
];

function clearAllData() {
  for (const key of ALL_DATA_KEYS) {
    localStorage.removeItem(key);
  }
}

interface FormState {
  name: string;
  username: string;
  password: string;
  status: "Active" | "Inactive";
}

const emptyForm: FormState = {
  name: "",
  username: "",
  password: "",
  status: "Active",
};

function formatSyncTime(date: Date | null): string {
  if (!date) return "Never";
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 5) return "Just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function SupervisorsPage() {
  const { supervisors, createSupervisor, updateSupervisor, deleteSupervisor } =
    useSupervisors();
  const queryClient = useQueryClient();
  const autoSync = useAdminAutoSync();

  // Force re-render every 10s to update "last synced X seconds ago"
  const [, setTick] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useState(() => {
    const id = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(id);
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importCode, setImportCode] = useState("");
  const [importError, setImportError] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [editingSupervisor, setEditingSupervisor] =
    useState<SupervisorAccount | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<SupervisorAccount | null>(
    null,
  );
  const [visiblePasswords, setVisiblePasswords] = useState<
    Record<string, boolean>
  >({});
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenImport = () => {
    setImportCode("");
    setImportError("");
    setImportOpen(true);
  };

  const handleImportEntries = () => {
    setImportError("");
    if (!importCode.trim()) {
      setImportError("Please paste the upload code from the supervisor.");
      return;
    }
    setIsImporting(true);
    setTimeout(() => {
      const result = importUploadCode(importCode);
      setIsImporting(false);
      if (result.ok) {
        void queryClient.invalidateQueries();
        toast.success(
          `Import successful! ${result.entriesAdded} new production entries and ${result.attendanceAdded} attendance records added.`,
        );
        setImportCode("");
        setImportOpen(false);
      } else {
        setImportError(result.error ?? "Failed to import upload code.");
      }
    }, 200);
  };

  const handleCopySyncCode = async () => {
    if (supervisors.length === 0) {
      toast.error("No supervisor accounts to export. Add supervisors first.");
      return;
    }
    const code = exportSyncCode();
    try {
      await navigator.clipboard.writeText(code);
      toast.success(
        "Sync code copied! Share this with your supervisor via WhatsApp or message. They must paste it in the login page first.",
      );
    } catch {
      // Fallback: show the code in a prompt so user can copy manually
      window.prompt(
        "Copy this sync code and share it with your supervisors:",
        code,
      );
    }
  };

  const openAdd = () => {
    setEditingSupervisor(null);
    setForm(emptyForm);
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (supervisor: SupervisorAccount) => {
    setEditingSupervisor(supervisor);
    setForm({
      name: supervisor.name,
      username: supervisor.username,
      password: "",
      status: supervisor.status,
    });
    setFormError("");
    setDialogOpen(true);
  };

  const handleSave = () => {
    setFormError("");

    if (editingSupervisor) {
      const result = updateSupervisor(
        editingSupervisor.id,
        form.username,
        form.password,
        form.name,
        form.status,
      );
      if (!result.ok) {
        setFormError(result.error ?? "Failed to update supervisor.");
        return;
      }
      toast.success(`Supervisor "${form.name}" updated successfully.`);
    } else {
      const result = createSupervisor(form.username, form.password, form.name);
      if (!result.ok) {
        setFormError(result.error ?? "Failed to create supervisor.");
        return;
      }
      toast.success(`Supervisor "${form.name}" created successfully.`);
    }

    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteSupervisor(deleteTarget.id);
    toast.success(`Supervisor "${deleteTarget.name}" deleted.`);
    setDeleteTarget(null);
  };

  const handleFactoryReset = () => {
    clearAllData();
    toast.success("All data cleared. Please refresh the page to log in again.");
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            Supervisor Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage supervisor accounts for the production team.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
          <Button
            data-ocid="supervisors.factory_reset_button"
            variant="outline"
            onClick={() => {
              setResetConfirmText("");
              setResetConfirmOpen(true);
            }}
            className="border-destructive/40 text-destructive hover:bg-destructive/10 hidden sm:flex gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            Clear All Data
          </Button>
          <Button
            data-ocid="supervisors.factory_reset_button_mobile"
            variant="outline"
            size="sm"
            onClick={() => {
              setResetConfirmText("");
              setResetConfirmOpen(true);
            }}
            className="sm:hidden border-destructive/40 text-destructive hover:bg-destructive/10"
            title="Clear All Data"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            data-ocid="supervisors.import_entries_button"
            variant="outline"
            onClick={handleOpenImport}
            className="hidden sm:flex gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
          >
            <Download className="w-4 h-4" />
            Import Entries
          </Button>
          <Button
            data-ocid="supervisors.import_entries_button_mobile"
            variant="outline"
            size="sm"
            onClick={handleOpenImport}
            className="sm:hidden border-primary/40 text-primary hover:bg-primary/10"
            title="Import Supervisor Entries"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            data-ocid="supervisors.sync_button"
            variant="outline"
            onClick={handleCopySyncCode}
            className="hidden sm:flex"
          >
            <Copy className="w-4 h-4 mr-1.5" />
            Copy Sync Code
          </Button>
          <Button
            data-ocid="supervisors.sync_button_mobile"
            variant="outline"
            size="sm"
            onClick={handleCopySyncCode}
            className="sm:hidden"
            title="Copy Sync Code"
          >
            <Share2 className="w-4 h-4" />
          </Button>
          <Button data-ocid="supervisors.add_button" onClick={openAdd}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Supervisor
          </Button>
        </div>
      </div>

      {/* ── Auto-Sync Card (Recommended) ────────────────────────────────────── */}
      <Card
        className={`border-2 ${autoSync.isEnabled ? "border-emerald-500/40 bg-emerald-500/5" : "border-emerald-500/20 bg-emerald-500/3"}`}
        data-ocid="auto_sync.card"
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${autoSync.isEnabled ? "bg-emerald-500/15" : "bg-emerald-500/10"}`}
              >
                {autoSync.isEnabled ? (
                  <Wifi className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Zap className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-base font-semibold text-foreground">
                    Auto Sync
                  </CardTitle>
                  <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] px-1.5 py-0 font-semibold uppercase tracking-wide">
                    <Sparkles className="w-2.5 h-2.5 mr-1" />
                    Recommended
                  </Badge>
                  {autoSync.isEnabled && (
                    <Badge className="bg-emerald-500 text-white border-emerald-500 text-[10px] px-1.5 py-0">
                      <Activity className="w-2.5 h-2.5 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-sm text-muted-foreground mt-0.5">
                  {autoSync.isEnabled
                    ? "Supervisors sync automatically every 30 seconds. No WhatsApp codes needed!"
                    : "Enable this to automatically sync data with supervisors. No more WhatsApp codes!"}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!autoSync.isEnabled ? (
            // Disabled state
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Share a 6-digit PIN with your supervisors. They enter it once in
                the app and everything syncs automatically — employees,
                operations, bundles, and production entries.
              </p>
              <Button
                data-ocid="auto_sync.enable_button"
                onClick={() => {
                  const pin = autoSync.enable();
                  toast.success(
                    `Auto-Sync enabled! Your PIN is ${pin}. Share it with supervisors.`,
                  );
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                <Zap className="w-4 h-4" />
                Enable Auto-Sync
              </Button>
            </div>
          ) : (
            // Enabled state
            <div className="space-y-4">
              {/* PIN display */}
              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1.5">
                    Sync PIN — share this with supervisors
                  </p>
                  <div
                    data-ocid="auto_sync.pin_display"
                    className="font-mono text-3xl font-bold tracking-[0.2em] text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-xl inline-block"
                  >
                    {autoSync.pin}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Button
                    data-ocid="auto_sync.copy_pin_button"
                    variant="outline"
                    size="sm"
                    className="border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 gap-1.5"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(autoSync.pin ?? "");
                        toast.success("PIN copied to clipboard!");
                      } catch {
                        window.prompt("Your Sync PIN:", autoSync.pin ?? "");
                      }
                    }}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy PIN
                  </Button>
                  <Button
                    data-ocid="auto_sync.sync_now_button"
                    variant="outline"
                    size="sm"
                    className="border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 gap-1.5"
                    onClick={() => {
                      autoSync.syncNow();
                      void queryClient.invalidateQueries();
                      toast.success("Synced successfully!");
                    }}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Sync Now
                  </Button>
                </div>
              </div>

              {/* Last sync time */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>
                  Last synced:{" "}
                  <span className="font-medium text-foreground">
                    {formatSyncTime(autoSync.lastSyncAt)}
                  </span>{" "}
                  · Polls every 30 seconds
                </span>
              </div>

              {/* Instructions */}
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 space-y-1.5">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
                  Supervisor setup (one time)
                </p>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside leading-relaxed">
                  <li>Supervisor opens the app login page on their phone</li>
                  <li>
                    Tap{" "}
                    <span className="font-semibold text-foreground">
                      "Have a sync PIN? Enter it here"
                    </span>{" "}
                    at the bottom
                  </li>
                  <li>
                    Enter the 6-digit PIN:{" "}
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                      {autoSync.pin}
                    </span>
                  </li>
                  <li>Done! Everything syncs automatically from now on.</li>
                </ol>
              </div>

              {/* Disable button */}
              <Button
                data-ocid="auto_sync.disable_button"
                variant="outline"
                size="sm"
                className="border-destructive/30 text-destructive hover:bg-destructive/10 gap-1.5"
                onClick={() => {
                  autoSync.disable();
                  toast.success("Auto-Sync disabled.");
                }}
              >
                <WifiOff className="w-3.5 h-3.5" />
                Disable Auto-Sync
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin credentials info card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <CardTitle className="text-base font-semibold text-foreground">
              Admin Login Credentials
            </CardTitle>
          </div>
          <CardDescription className="text-sm text-muted-foreground">
            Use these credentials to log in as Administrator
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:flex sm:items-center sm:gap-8">
            <div className="flex items-center gap-3">
              <KeyRound className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Username
                </div>
                <code className="text-sm font-mono font-bold text-foreground bg-muted px-2 py-0.5 rounded">
                  admin
                </code>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <KeyRound className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Password
                </div>
                <code className="text-sm font-mono font-bold text-foreground bg-muted px-2 py-0.5 rounded">
                  admin123
                </code>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Import entries info card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Upload className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Get Production Entries from Supervisors
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-1">
                Supervisors submit production on their phones. Use this to pull
                their entries into your Admin panel.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            <li>
              Supervisor opens the app on their phone and taps the{" "}
              <span className="font-semibold text-foreground">
                Upload icon (arrow up)
              </span>{" "}
              in the top bar.
            </li>
            <li>
              They tap{" "}
              <span className="font-semibold text-foreground">
                "Copy Upload Code"
              </span>{" "}
              and send the code to you via WhatsApp.
            </li>
            <li>
              You click{" "}
              <span className="font-semibold text-foreground">
                "Import Entries"
              </span>{" "}
              above, paste the code, and click Import.
            </li>
            <li>
              All their production entries and attendance will appear in the
              Production and Attendance pages immediately.
            </li>
          </ol>
          <Button
            data-ocid="supervisors.import_card_button"
            variant="outline"
            size="sm"
            onClick={handleOpenImport}
            className="mt-4 border-primary/30 text-primary hover:bg-primary/10"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Import Entries Now
          </Button>
        </CardContent>
      </Card>

      {/* Sync code info card */}
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                How to Share with Supervisors
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-1">
                The sync code includes supervisor accounts AND all employees,
                operations, and bundles — so supervisors see everything you have
                added.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            <li>
              Click{" "}
              <span className="font-semibold text-foreground">
                "Copy Sync Code"
              </span>{" "}
              above. This includes all supervisor accounts, employees,
              operations, and bundles.
            </li>
            <li>
              Send the code to your supervisor via{" "}
              <span className="font-semibold text-foreground">
                WhatsApp or SMS
              </span>
              .
            </li>
            <li>
              First time: supervisor opens the app login page, taps{" "}
              <span className="font-semibold text-foreground">
                "First time? Import sync code"
              </span>
              , pastes the code, and taps Import.
            </li>
            <li>
              Whenever you add new employees or operations,{" "}
              <span className="font-semibold text-foreground">
                copy a fresh sync code and send again
              </span>
              . Supervisor uses "Refresh Data" in the app to update.
            </li>
          </ol>
          <Button
            data-ocid="supervisors.sync_card_button"
            variant="outline"
            size="sm"
            onClick={handleCopySyncCode}
            className="mt-4 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
          >
            <Copy className="w-3.5 h-3.5 mr-1.5" />
            Copy Sync Code Now
          </Button>
        </CardContent>
      </Card>

      {/* Supervisors table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <UserCog className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-base">
              Supervisor Accounts ({supervisors.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {supervisors.length === 0 ? (
            <div
              data-ocid="supervisors.empty_state"
              className="flex flex-col items-center justify-center py-16 text-center px-4"
            >
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
                <UserCog className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="font-semibold text-foreground mb-1">
                No supervisors yet
              </p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Click "Add Supervisor" to create the first supervisor account.
              </p>
              <Button variant="outline" className="mt-4" onClick={openAdd}>
                <Plus className="w-4 h-4 mr-1.5" />
                Add First Supervisor
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table data-ocid="supervisors.table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Password</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supervisors.map((supervisor, index) => (
                    <TableRow
                      key={supervisor.id}
                      data-ocid={`supervisors.item.${index + 1}`}
                    >
                      <TableCell className="font-medium">
                        {supervisor.name}
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-1.5 py-0.5 rounded font-mono">
                          {supervisor.username}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <code className="text-sm bg-muted px-1.5 py-0.5 rounded font-mono">
                            {visiblePasswords[supervisor.id]
                              ? supervisor.password
                              : "••••••"}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            data-ocid={`supervisors.toggle.${index + 1}`}
                            onClick={() =>
                              togglePasswordVisibility(supervisor.id)
                            }
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                            title={
                              visiblePasswords[supervisor.id]
                                ? "Hide password"
                                : "Show password"
                            }
                          >
                            {visiblePasswords[supervisor.id] ? (
                              <EyeOff className="w-3 h-3" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            supervisor.status === "Active"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            supervisor.status === "Active"
                              ? "bg-success text-success-foreground hover:bg-success/90"
                              : ""
                          }
                        >
                          {supervisor.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(supervisor.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            data-ocid={`supervisors.edit_button.${index + 1}`}
                            onClick={() => openEdit(supervisor)}
                            className="h-8 w-8 p-0"
                            title="Edit supervisor"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            data-ocid={`supervisors.delete_button.${index + 1}`}
                            onClick={() => setDeleteTarget(supervisor)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Delete supervisor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Entries Dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent
          data-ocid="supervisors.import_dialog"
          className="sm:max-w-sm"
        >
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              Import Supervisor Entries
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <p className="text-sm text-muted-foreground">
              Ask your supervisor to tap the <strong>Upload icon</strong> on
              their phone, copy the upload code, and send it to you. Paste it
              below.
            </p>
            <div className="space-y-2">
              <Label htmlFor="import-code" className="text-sm font-medium">
                Upload Code from Supervisor
              </Label>
              <Textarea
                id="import-code"
                data-ocid="supervisors.import_textarea"
                placeholder="Paste upload code here..."
                value={importCode}
                onChange={(e) => {
                  setImportCode(e.target.value);
                  if (importError) setImportError("");
                }}
                className="text-sm font-mono resize-none h-24 bg-background"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
            {importError && (
              <div
                data-ocid="supervisors.import_error_state"
                className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs"
                role="alert"
              >
                {importError}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              data-ocid="supervisors.import_cancel_button"
              onClick={() => setImportOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="supervisors.import_submit_button"
              onClick={handleImportEntries}
              disabled={isImporting || !importCode.trim()}
              className="gap-2"
            >
              {isImporting ? (
                <Upload className="w-4 h-4 animate-pulse" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isImporting ? "Importing..." : "Import Entries"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-ocid="supervisors.dialog" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingSupervisor ? "Edit Supervisor" : "Add Supervisor"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="supervisor-name">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="supervisor-name"
                data-ocid="supervisor.name_input"
                placeholder="e.g. Ravi Kumar"
                value={form.name}
                onChange={(e) => {
                  setForm((f) => ({ ...f, name: e.target.value }));
                  setFormError("");
                }}
                autoComplete="off"
              />
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="supervisor-username">
                Username / Login ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="supervisor-username"
                data-ocid="supervisor.username_input"
                placeholder="e.g. ravi.sup"
                value={form.username}
                onChange={(e) => {
                  setForm((f) => ({
                    ...f,
                    username: e.target.value.toLowerCase().replace(/\s/g, ""),
                  }));
                  setFormError("");
                }}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="supervisor-password">
                Password{" "}
                {!editingSupervisor && (
                  <span className="text-destructive">*</span>
                )}
              </Label>
              <Input
                id="supervisor-password"
                data-ocid="supervisor.password_input"
                type="password"
                placeholder={
                  editingSupervisor
                    ? "Leave blank to keep current password"
                    : "Enter a password"
                }
                value={form.password}
                onChange={(e) => {
                  setForm((f) => ({ ...f, password: e.target.value }));
                  setFormError("");
                }}
                autoComplete="new-password"
              />
            </div>

            {/* Status - only for edit */}
            {editingSupervisor && (
              <div className="space-y-2">
                <Label htmlFor="supervisor-status">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(val: "Active" | "Inactive") =>
                    setForm((f) => ({ ...f, status: val }))
                  }
                >
                  <SelectTrigger
                    id="supervisor-status"
                    data-ocid="supervisor.status_select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Error */}
            {formError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {formError}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              data-ocid="supervisor.cancel_button"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button data-ocid="supervisor.save_button" onClick={handleSave}>
              {editingSupervisor ? "Save Changes" : "Create Supervisor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Factory Reset confirmation */}
      <AlertDialog
        open={resetConfirmOpen}
        onOpenChange={(open) => {
          if (!open) setResetConfirmOpen(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              Clear All Data
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                This will permanently delete <strong>ALL</strong> data:
                supervisors, employees, operations, bundles, production entries,
                attendance records, and targets.
              </span>
              <span className="block mt-2">
                After clearing, you will be taken back to the login screen. The
                admin login will remain as{" "}
                <code className="font-mono bg-muted px-1 rounded">admin</code> /{" "}
                <code className="font-mono bg-muted px-1 rounded">
                  admin123
                </code>
                .
              </span>
              <span className="block mt-3 font-semibold text-foreground">
                Type{" "}
                <code className="font-mono bg-muted px-1 rounded">CLEAR</code>{" "}
                below to confirm:
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-1 pb-1">
            <Input
              data-ocid="supervisors.reset_confirm_input"
              placeholder="Type CLEAR to confirm"
              value={resetConfirmText}
              onChange={(e) => setResetConfirmText(e.target.value)}
              className="border-destructive/40 focus-visible:ring-destructive"
              autoComplete="off"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="supervisors.reset_cancel_button"
              onClick={() => setResetConfirmOpen(false)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="supervisors.reset_confirm_button"
              onClick={handleFactoryReset}
              disabled={resetConfirmText.trim().toUpperCase() !== "CLEAR"}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-40"
            >
              Clear All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supervisor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget?.name}</strong>? This action cannot be
              undone. The supervisor will no longer be able to log in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="supervisor.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="supervisor.confirm_button"
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
