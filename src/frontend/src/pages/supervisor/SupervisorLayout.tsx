import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import {
  CalendarCheck,
  ClipboardList,
  Factory,
  List,
  LogOut,
  User,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
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
  const qc = useQueryClient();

  const handleLogout = async () => {
    await logout();
    qc.clear();
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top header */}
      <header className="flex items-center gap-3 px-4 h-14 bg-card border-b border-border flex-shrink-0">
        <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
          <Factory className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold text-foreground leading-tight">
            {getTabTitle(currentPath)}
          </h1>
          <p className="text-xs text-muted-foreground truncate">
            {session?.name ?? "Supervisor"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <div
            className="w-2 h-2 rounded-full bg-success"
            title="Connected to blockchain"
          />
          <Button
            data-ocid="supervisor.logout.button"
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0"
            onClick={handleLogout}
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-4">
          {renderPage(currentPath)}
        </div>
      </main>

      {/* Bottom tab bar */}
      <nav
        data-ocid="supervisor.tab"
        className="flex-shrink-0 bg-card border-t border-border safe-area-pb"
      >
        <div className="flex items-stretch">
          {tabs.map((tab) => {
            const isActive = currentPath === tab.path;
            return (
              <button
                key={tab.path}
                type="button"
                data-ocid={tab.ocid}
                onClick={() => navigate(tab.path)}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon
                  className={`w-5 h-5 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 w-12 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
