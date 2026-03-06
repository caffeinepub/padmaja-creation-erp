import {
  CalendarCheck,
  ClipboardList,
  Factory,
  List,
  LogOut,
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

  const handleLogout = () => {
    logout();
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
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

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
