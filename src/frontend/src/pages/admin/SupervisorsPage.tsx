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
import {
  Copy,
  Edit2,
  Eye,
  EyeOff,
  Info,
  KeyRound,
  Plus,
  Share2,
  Shield,
  Trash2,
  UserCog,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { SupervisorAccount } from "../../hooks/useAuth";
import { exportSyncCode } from "../../hooks/useAuth";
import { useSupervisors } from "../../hooks/useSupervisors";

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

export default function SupervisorsPage() {
  const { supervisors, createSupervisor, updateSupervisor, deleteSupervisor } =
    useSupervisors();

  const [dialogOpen, setDialogOpen] = useState(false);
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

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
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
        <div className="flex items-center gap-2 flex-shrink-0">
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
