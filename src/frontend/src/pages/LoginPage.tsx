import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Factory, Loader2, Package, Scissors, TrendingUp } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginPage() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: unknown) {
        if (
          error instanceof Error &&
          error.message === "User is already authenticated"
        ) {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
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

        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold text-foreground">
              Welcome back
            </h2>
            <p className="mt-2 text-muted-foreground text-sm">
              Sign in with Internet Identity to continue
            </p>
          </div>

          <div className="space-y-4">
            <Button
              data-ocid="login.primary_button"
              onClick={handleAuth}
              disabled={isLoggingIn}
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Factory className="mr-2 h-5 w-5" />
                  {isAuthenticated
                    ? "Sign Out"
                    : "Sign In with Internet Identity"}
                </>
              )}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Secure authentication powered by Internet Computer.
              <br />
              No passwords required.
            </p>
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
