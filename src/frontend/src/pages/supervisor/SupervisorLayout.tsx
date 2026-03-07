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
  Upload,
  Wifi,
  WifiOff,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  exportUploadCode,
  importDataFromSyncCode,
  useAuth,
} from "../../hooks/useAuth";
import { useSupervisorAutoSync } from "../../hooks/useAutoSync";
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

/** Small status dot in the header */
function SyncStatusDot({
  status,
}: { status: "idle" | "syncing" | "synced" | "error" }) {
  if (status === "syncing") {
    return (
      <span
        data-ocid="supervisor.sync_status_indicator"
        className="inline-flex items-center gap-1.5"
        title="Syncing..."
      >
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <Wifi className="w-3.5 h-3.5 text-amber-500" />
      </span>
    );
  }
  if (status === "synced") {
    return (
      <span
        data-ocid="supervisor.sync_status_indicator"
        className="inline-flex items-center gap-1.5"
        title="Auto-sync active"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <Wifi className="w-3.5 h-3.5 text-emerald-500" />
      </span>
    );
  }
  if (status === "error") {
    return (
      <span
        data-ocid="supervisor.sync_status_indicator"
        className="inline-flex items-center gap-1.5"
        title="Sync error"
      >
        <span className="w-2 h-2 rounded-full bg-destructive" />
        <WifiOff className="w-3.5 h-3.5 text-destructive" />
      </span>
    );
  }
  return null;
}

export default function SupervisorLayout({
  currentPath,
  navigate,
}: SupervisorLayoutProps) {
  const { session, logout } = useAuth();
  const queryClient = useQueryClient();
  const autoSync = useSupervisorAutoSync(session?.username ?? "");

  // Manual sync state (kept as fallback)
  const [refreshOpen, setRefreshOpen] = useState(false);
  const [syncCode, setSyncCode] = useState("");
  const [syncError, setSyncError] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadCode, setUploadCode] = useState("");

  // Auto-sync PIN setup dialog
  const [pinSetupOpen, setPinSetupOpen] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  // Banner dismissed state
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const handleRefresh = () => {
    setSyncCode("");
    setSyncError("");
    setRefreshOpen(true);
  };

  const handleOpenUpload = () => {
    if (!session?.username) return;
    const code = exportUploadCode(session.username);
    setUploadCode(code);
    setUploadOpen(true);
  };

  const handleCopyUploadCode = async () => {
    try {
      await navigator.clipboard.writeText(uploadCode);
      toast.success("Upload code copied! Send it to Admin via WhatsApp.");
    } catch {
      window.prompt("Copy this upload code and send it to Admin:", uploadCode);
    }
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

  const handlePinConnect = useCallback(async () => {
    setPinError("");
    const trimmed = pinInput.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      setPinError("PIN must be exactly 6 digits.");
      return;
    }
    setIsConnecting(true);
    const result = await autoSync.setup(trimmed);
    setIsConnecting(false);
    if (result.ok) {
      setPinSetupOpen(false);
      setPinInput("");
      setBannerDismissed(true);
      toast.success(
        "Auto-Sync connected! Data will sync automatically every 30 seconds.",
      );
    } else {
      setPinError(
        result.error ??
          "Could not connect. Ask Admin to enable Auto-Sync first.",
      );
    }
  }, [pinInput, autoSync]);

  // Expose pushNow to production page via a custom event for after-submit push
  // (SupervisorProduction will call window.dispatchEvent("supervisor:push-entries"))
  // We listen here so we can call autoSync.pushNow
  useState(() => {
    const handler = () => {
      if (session?.username) autoSync.pushNow(session.username);
    };
    window.addEventListener("supervisor:push-entries", handler);
    return () => window.removeEventListener("supervisor:push-entries", handler);
  });

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

          {/* Auto-sync status OR manual buttons */}
          {autoSync.isSetup ? (
            <SyncStatusDot status={autoSync.syncStatus} />
          ) : (
            <>
              <button
                type="button"
                onClick={handleOpenUpload}
                data-ocid="supervisor.upload_button"
                className="p-2 rounded-lg hover:bg-muted transition-colors text-primary hover:text-primary/80"
                title="Upload entries to Admin"
              >
                <Upload className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRefresh}
                data-ocid="supervisor.refresh_button"
                className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                title="Refresh data from Admin"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </>
          )}

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

      {/* Auto-Sync setup banner (shown when not set up and not dismissed) */}
      {!autoSync.isSetup && !bannerDismissed && (
        <button
          type="button"
          data-ocid="supervisor.autosync_setup_banner"
          onClick={() => {
            setPinInput("");
            setPinError("");
            setPinSetupOpen(true);
          }}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-amber-500/10 border-b border-amber-500/20 hover:bg-amber-500/15 transition-colors text-left"
        >
          <div className="flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <span className="text-sm text-amber-800 dark:text-amber-300 font-medium">
              Setup Auto-Sync to avoid manual sync codes — Tap to enter PIN
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setBannerDismissed(true);
            }}
            className="p-1 rounded hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex-shrink-0"
            title="Dismiss"
            aria-label="Dismiss auto-sync banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </button>
      )}

      {/* Refresh Data Dialog (manual fallback) */}
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

      {/* Upload Entries Dialog (manual fallback) */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent
          data-ocid="supervisor.upload_dialog"
          className="sm:max-w-sm"
        >
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Send Entries to Admin
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <p className="text-sm text-muted-foreground">
              This code contains all your production entries and attendance.
              Copy it and send to Admin via WhatsApp. Admin will paste it in the
              Admin panel to see your entries.
            </p>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Your Upload Code</Label>
              <textarea
                data-ocid="supervisor.upload_code_textarea"
                readOnly
                value={uploadCode}
                className="w-full h-24 text-xs font-mono p-2 rounded-md border border-border bg-muted resize-none select-all"
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    (e.target as HTMLTextAreaElement).select();
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Tap the code above to select it, or use the Copy button below.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              data-ocid="supervisor.upload_cancel_button"
              onClick={() => setUploadOpen(false)}
            >
              Close
            </Button>
            <Button
              data-ocid="supervisor.upload_copy_button"
              onClick={handleCopyUploadCode}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              Copy Upload Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auto-Sync PIN Setup Dialog */}
      <Dialog open={pinSetupOpen} onOpenChange={setPinSetupOpen}>
        <DialogContent
          data-ocid="supervisor.pin_setup_dialog"
          className="sm:max-w-sm"
        >
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Setup Auto-Sync
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Ask Admin for the{" "}
              <strong className="text-foreground">6-digit sync PIN</strong>.
              Enter it once and the app syncs automatically every 30 seconds —
              no more WhatsApp codes!
            </p>
            <div className="space-y-2">
              <Label htmlFor="pin-input" className="text-sm font-medium">
                Sync PIN from Admin
              </Label>
              <Input
                id="pin-input"
                data-ocid="supervisor.pin_input"
                type="number"
                inputMode="numeric"
                placeholder="Enter 6-digit PIN"
                value={pinInput}
                onChange={(e) => {
                  // Limit to 6 digits
                  const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setPinInput(val);
                  if (pinError) setPinError("");
                }}
                className="text-center text-2xl font-mono tracking-[0.3em] h-12"
                maxLength={6}
                autoComplete="off"
                autoFocus
              />
            </div>
            {pinError && (
              <div
                data-ocid="supervisor.pin_error_state"
                className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs"
                role="alert"
              >
                {pinError}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Don&apos;t have a PIN?{" "}
              <button
                type="button"
                className="underline hover:text-foreground transition-colors"
                onClick={() => {
                  setPinSetupOpen(false);
                  handleRefresh();
                }}
              >
                Use Manual Sync Instead
              </button>
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              data-ocid="supervisor.pin_cancel_button"
              onClick={() => setPinSetupOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="supervisor.pin_connect_button"
              onClick={() => void handlePinConnect()}
              disabled={isConnecting || pinInput.length !== 6}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              {isConnecting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Wifi className="w-4 h-4" />
              )}
              {isConnecting ? "Connecting..." : "Connect"}
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
