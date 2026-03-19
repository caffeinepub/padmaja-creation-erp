import { Button } from "@/components/ui/button";
import { Factory, Loader2, Shield, Zap } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const { login, loginStatus } = useAuth();
  const isLoggingIn = loginStatus === "logging-in";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background grid */}
      <div
        className="fixed inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(oklch(91% 0.01 260) 1px, transparent 1px), linear-gradient(90deg, oklch(91% 0.01 260) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      {/* Glow blob */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-[0.07] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, oklch(60% 0.2 250), transparent 70%)",
        }}
      />

      <div className="w-full max-w-sm relative">
        {/* Logo area */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/40 flex items-center justify-center shadow-glow">
              <Factory className="w-10 h-10 text-primary" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-success flex items-center justify-center border-2 border-background">
              <Zap className="w-3 h-3 text-success-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground tracking-tight text-center">
            Padmaja Creation
          </h1>
          <p className="text-sm text-muted-foreground mt-1 text-center">
            Garment Manufacturing ERP System
          </p>
        </div>

        {/* Login card */}
        <div className="bg-card border border-border rounded-2xl shadow-card p-7 space-y-6">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground">Sign In</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Authenticate securely via Internet Identity
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-muted/30 rounded-xl p-3">
              <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground">
                  Blockchain-secured access
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your data is stored permanently on the Internet Computer
                  blockchain
                </p>
              </div>
            </div>
          </div>

          <Button
            data-ocid="login.primary_button"
            onClick={() => login()}
            disabled={isLoggingIn}
            className="w-full h-12 text-base font-semibold gap-2"
          >
            {isLoggingIn ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Factory className="w-5 h-5" />
            )}
            {isLoggingIn ? "Connecting..." : "Login with Internet Identity"}
          </Button>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              New users: Login and request access from Admin
            </p>
          </div>
        </div>

        {/* Roles info */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          {[
            {
              label: "Admin",
              desc: "Full factory management",
              color: "text-primary",
            },
            {
              label: "Supervisor",
              desc: "Production & attendance",
              color: "text-success",
            },
          ].map((r) => (
            <div
              key={r.label}
              className="bg-card/50 border border-border rounded-xl p-3 text-center"
            >
              <p className={`text-sm font-bold ${r.color}`}>{r.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <p className="mt-10 text-xs text-muted-foreground text-center">
        © {new Date().getFullYear()} Padmaja Creation Pvt Ltd.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground transition-colors"
        >
          Built with caffeine.ai
        </a>
      </p>
    </div>
  );
}
