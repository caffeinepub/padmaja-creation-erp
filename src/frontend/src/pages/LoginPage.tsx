import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronDown,
  ChevronUp,
  Download,
  Factory,
  Package,
  Scissors,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { importSyncCode, useAuth } from "../hooks/useAuth";

interface LoginPageProps {
  onLogin: (path: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Sync code import state
  const [syncExpanded, setSyncExpanded] = useState(false);
  const [syncCode, setSyncCode] = useState("");
  const [syncError, setSyncError] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  const handleImportSync = () => {
    setSyncError("");
    if (!syncCode.trim()) {
      setSyncError("Please paste the sync code first.");
      return;
    }
    setIsSyncing(true);
    // Small timeout for UX feedback
    setTimeout(() => {
      const result = importSyncCode(syncCode);
      setIsSyncing(false);
      if (result.ok) {
        toast.success(
          `${result.count} supervisor account(s) loaded successfully. You can now log in.`,
        );
        setSyncCode("");
        setSyncExpanded(false);
      } else {
        setSyncError(result.error ?? "Failed to import sync code.");
      }
    }, 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = login(username, password);
    if (result.ok) {
      // Navigate based on role — App.tsx will handle routing
      onLogin("/");
    } else {
      setError(result.error ?? "Invalid credentials.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left panel - branding */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{ background: "oklch(0.22 0.04 220)" }}
      >
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
              <span className="text-lg font-display font-bold text-sidebar-primary-foreground">
                PC
              </span>
            </div>
            <div>
              <div className="font-display font-bold text-white text-lg leading-tight">
                Padmaja Creation
              </div>
              <div className="text-xs text-white/50">Pvt Ltd</div>
            </div>
          </div>

          <h1 className="font-display text-4xl font-bold text-white leading-tight mb-4">
            Garment Production
            <br />
            <span className="text-sidebar-primary">Management ERP</span>
          </h1>
          <p className="text-white/60 text-lg leading-relaxed max-w-sm">
            Track production from cutting to dispatch. Monitor worker
            performance, automate salaries, and generate reports.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Scissors, label: "Bundle Tracking" },
            { icon: TrendingUp, label: "Performance Analytics" },
            { icon: Package, label: "Salary Automation" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5"
            >
              <Icon className="w-6 h-6 text-sidebar-primary" />
              <span className="text-xs text-white/60 text-center">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-3">
            <Factory className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Padmaja Creation
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Production Management ERP
          </p>
        </div>

        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h2 className="font-display text-3xl font-bold text-foreground">
              Welcome back
            </h2>
            <p className="mt-2 text-muted-foreground text-sm">
              Sign in to your account to continue
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
            noValidate
            autoComplete="off"
          >
            <div className="space-y-2">
              <Label
                htmlFor="login-username"
                className="text-sm font-medium text-foreground"
              >
                Login ID
              </Label>
              <Input
                id="login-username"
                data-ocid="login.username_input"
                type="text"
                placeholder="Enter your login ID"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError("");
                }}
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="h-11 text-base"
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="login-password"
                className="text-sm font-medium text-foreground"
              >
                Password
              </Label>
              <Input
                id="login-password"
                data-ocid="login.password_input"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                autoComplete="current-password"
                className="h-11 text-base"
                disabled={isLoading}
                required
              />
            </div>

            {error && (
              <div
                data-ocid="login.error_state"
                className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
                role="alert"
                aria-live="polite"
              >
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </div>
            )}

            <Button
              data-ocid="login.primary_button"
              type="submit"
              disabled={isLoading}
              className="w-full h-11 text-base font-semibold mt-2"
              size="lg"
            >
              {isLoading ? (
                <>
                  <svg
                    className="mr-2 h-5 w-5 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  <Factory className="mr-2 h-5 w-5" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          {/* Sync code import section */}
          <div className="mt-6 border border-border rounded-xl overflow-hidden">
            <button
              type="button"
              data-ocid="login.sync_toggle"
              onClick={() => {
                setSyncExpanded((v) => !v);
                setSyncError("");
              }}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
              aria-expanded={syncExpanded}
            >
              <div className="flex items-center gap-2.5">
                <Download className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm text-muted-foreground font-medium">
                  First time on this device? Import sync code
                </span>
              </div>
              {syncExpanded ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              )}
            </button>

            {syncExpanded && (
              <div className="px-4 pb-4 space-y-3 border-t border-border bg-muted/20">
                <p className="text-xs text-muted-foreground pt-3 leading-relaxed">
                  Ask your Admin to share the sync code via WhatsApp. Paste it
                  below to load your account on this device.
                </p>

                <div className="space-y-2">
                  <Label
                    htmlFor="sync-code-input"
                    className="text-xs font-medium text-foreground"
                  >
                    Sync Code
                  </Label>
                  <Textarea
                    id="sync-code-input"
                    data-ocid="login.sync_textarea"
                    placeholder="Paste the sync code here..."
                    value={syncCode}
                    onChange={(e) => {
                      setSyncCode(e.target.value);
                      if (syncError) setSyncError("");
                    }}
                    className="text-sm font-mono resize-none h-20 bg-background"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </div>

                {syncError && (
                  <div
                    data-ocid="login.sync_error_state"
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs"
                    role="alert"
                    aria-live="polite"
                  >
                    {syncError}
                  </div>
                )}

                <Button
                  type="button"
                  data-ocid="login.sync_submit_button"
                  onClick={handleImportSync}
                  disabled={isSyncing || !syncCode.trim()}
                  variant="outline"
                  className="w-full h-10 text-sm"
                >
                  {isSyncing ? (
                    <>
                      <svg
                        className="mr-2 h-4 w-4 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Importing...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Import & Continue
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        <footer className="mt-auto pt-8 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()}.{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              className="hover:text-foreground transition-colors"
              target="_blank"
              rel="noreferrer"
            >
              Built with love using caffeine.ai
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
