import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";
import { Copy, Info, Shield, UserCog } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../../hooks/useAuth";

export default function SupervisorsPage() {
  const { session } = useAuth();
  const [copied, setCopied] = useState(false);

  const principalId = session?.principal ?? "";

  const copyPrincipal = async () => {
    if (!principalId) return;
    await navigator.clipboard.writeText(principalId);
    setCopied(true);
    toast.success("Principal ID copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
          <UserCog className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold font-display text-foreground">
            Supervisor Management
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage who has supervisor access to the ERP
          </p>
        </div>
      </div>

      {/* Info card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">
              How Supervisor Access Works
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            This ERP uses{" "}
            <span className="text-foreground font-semibold">
              Internet Identity
            </span>{" "}
            for secure, blockchain-backed authentication. To grant supervisor
            access to a new user:
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-1">
            <li>
              Ask the supervisor to open the ERP app and click{" "}
              <strong className="text-foreground">Login</strong>
            </li>
            <li>
              They will log in using Internet Identity and land on the{" "}
              <em>Access Pending</em> screen
            </li>
            <li>
              They share their{" "}
              <strong className="text-foreground">Principal ID</strong> (shown
              on their screen) with you
            </li>
            <li>
              You use the ICP console / NNS to call{" "}
              <code className="bg-muted px-1 py-0.5 rounded text-xs">
                assignCallerUserRole
              </code>{" "}
              for their principal with role{" "}
              <code className="bg-muted px-1 py-0.5 rounded text-xs">user</code>
            </li>
          </ol>
          <p className="text-xs">
            This blockchain-based access control is permanent and auditable.
          </p>
        </CardContent>
      </Card>

      {/* Your principal */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-success" />
            <CardTitle className="text-base">Your Admin Principal ID</CardTitle>
          </div>
          <CardDescription>
            Share this with the development team to confirm admin setup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 font-mono text-xs text-muted-foreground break-all">
              {principalId || "Not logged in"}
            </div>
            <Button
              data-ocid="supervisors.copy.button"
              variant="outline"
              size="sm"
              className="flex-shrink-0 gap-1.5"
              onClick={copyPrincipal}
              disabled={!principalId}
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Guide */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Role Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                role: "Admin (admin)",
                access:
                  "Full access: all modules, reports, data management, QC, Inventory",
                badge: "badge-blue",
              },
              {
                role: "Supervisor (user)",
                access:
                  "Attendance marking, production entry, QR scanning, offline mode",
                badge: "badge-green",
              },
              {
                role: "Guest (guest)",
                access: "No access — pending role assignment by admin",
                badge: "badge-red",
              },
            ].map((r) => (
              <div
                key={r.role}
                className="flex items-start gap-3 py-2 border-b border-border last:border-0"
              >
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 mt-0.5 ${r.badge}`}
                >
                  {r.role}
                </span>
                <p className="text-sm text-muted-foreground">{r.access}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
