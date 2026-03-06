import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import {
  CalendarCheck,
  ClipboardList,
  Download,
  Factory,
  List,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { importDataFromSyncCode, useAuth } from "../../hooks/useAuth";
import SupervisorAttendance from "./SupervisorAttendance";
import SupervisorMyEntries from "./SupervisorMyEntries";
import SupervisorProduction from "./SupervisorProduction";

interface SupervisorLayoutProps {
  currentPath: string;
  navigate: (path: string) => void;
}

const tabs = [
  {
    label: "Attendance",
    path: "/supervisor/attendance",
    icon: CalendarCheck,
    ocid: "nav.supervisor.attendance.tab",
  },
  {
    label: "Production",
    path: "/supervisor",
    icon: ClipboardList,
    ocid: "nav.supervisor.production.tab",
  },
  {
    label: "My Entries",
    path: "/supervisor/my-entries",
    icon: List,
    ocid: "nav.supervisor.entries.tab",
  },
];

function renderPage(path: string) {
  if (path === "/supervisor/attendance") return <SupervisorAttendance />;
  if (path === "/supervisor/my-entries") return <SupervisorMyEntries />;
  return <SupervisorProduction />;
}

function getTabTitle(path: string): string {
  if (path === "/supervisor/attendance") return "Mark Attendance";
  if (path === "/supervisor/my-entries") return "My Entries";
  return "Production Entry";
}

export default function SupervisorLayout({
  currentPath,
  navigate,
}: SupervisorLayoutProps) {
  const { session, logout } = useAuth();
  const queryClient = useQueryClient();
  const [refreshOpen, setRefreshOpen] = useState(false);
  const [syncCode, setSyncCode] = useState("");
  const [syncError, setSyncError] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const handleRefresh = () => {
    setSyncCode("");
    setSyncError("");
    setRefreshOpen(true);
  };

  const handleImportRefresh = () => {
    setSyncError("");
    if (!syncCode.trim()) {
      setSyncError("Please paste the sync code from Admin.");
      return;
    }
    setIsSyncing(true);
    setTimeout(() => {
      const result = importDataFromSyncCode(syncCode);
      setIsSyncing(false);
      if (result.ok) {
        // Invalidate all queries so UI reloads from updated localStorage
        void queryClient.invalidateQueries();
        toast.success(
          "Data updated! Employees, operations, and bundles are now refreshed.",
        );
        setSyncCode("");
        setRefreshOpen(false);
      } else {
        setSyncError(result.error ?? "Failed to import sync code.");
      }
    }, 200);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <Factory className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground leading-none">
              Padmaja Creation
            </p>
            <h1 className="font-display font-bold text-sm text-foreground leading-tight">
              {getTabTitle(currentPath)}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:block">
            {session?.name}
          </span>
          <button
            type="button"
            onClick={handleRefresh}
            data-ocid="supervisor.refresh_button"
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Refresh data from Admin"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Refresh Data Dialog */}
      <Dialog open={refreshOpen} onOpenChange={setRefreshOpen}>
        <DialogContent
          data-ocid="supervisor.refresh_dialog"
          className="sm:max-w-sm"
        >
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              Refresh Data
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <p className="text-sm text-muted-foreground">
              Ask Admin to copy the latest sync code, then paste it here. This
              will update employees, operations, and bundles on your device.
            </p>
            <div className="space-y-2">
              <Label
                htmlFor="refresh-sync-code"
                className="text-sm font-medium"
              >
                Sync Code from Admin
              </Label>
              <Textarea
                id="refresh-sync-code"
                data-ocid="supervisor.refresh_textarea"
                placeholder="Paste sync code here..."
                value={syncCode}
                onChange={(e) => {
                  setSyncCode(e.target.value);
                  if (syncError) setSyncError("");
                }}
                className="text-sm font-mono resize-none h-24 bg-background"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
            {syncError && (
              <div
                data-ocid="supervisor.refresh_error_state"
                className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs"
                role="alert"
              >
                {syncError}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              data-ocid="supervisor.refresh_cancel_button"
              onClick={() => setRefreshOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="supervisor.refresh_submit_button"
              onClick={handleImportRefresh}
              disabled={isSyncing || !syncCode.trim()}
              className="gap-2"
            >
              {isSyncing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isSyncing ? "Updating..." : "Update Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Page content */}
      <main className="flex-1 overflow-auto pb-20">
        <div className="max-w-lg mx-auto p-4">{renderPage(currentPath)}</div>
      </main>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-pb">
        <div className="max-w-lg mx-auto flex">
          {tabs.map((tab) => {
            const isActive =
              tab.path === "/supervisor"
                ? currentPath === "/supervisor" ||
                  currentPath === "/supervisor/"
                : currentPath === tab.path;
            const Icon = tab.icon;
            return (
              <button
                type="button"
                key={tab.path}
                data-ocid={tab.ocid}
                onClick={() => navigate(tab.path)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : ""}`} />
                <span
                  className={`text-xs font-medium ${isActive ? "font-semibold" : ""}`}
                >
                  {tab.label}
                </span>
                {isActive && (
                  <span className="absolute top-0 w-12 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
