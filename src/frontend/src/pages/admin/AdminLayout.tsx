import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart2,
  CalendarCheck,
  ChevronRight,
  ClipboardList,
  Cog,
  DollarSign,
  Factory,
  FileSpreadsheet,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Target,
  UserCog,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";

// Admin page imports
import AdminDashboard from "./AdminDashboard";
import AttendancePage from "./AttendancePage";
import BundleProgressPage from "./BundleProgressPage";
import BundlesPage from "./BundlesPage";
import EmployeesPage from "./EmployeesPage";
import OperationsPage from "./OperationsPage";
import ProductionPage from "./ProductionPage";
import ReportsPage from "./ReportsPage";
import SalaryPage from "./SalaryPage";
import SupervisorsPage from "./SupervisorsPage";
import TargetsPage from "./TargetsPage";

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  ocid: string;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    path: "/admin",
    icon: LayoutDashboard,
    ocid: "nav.dashboard.link",
  },
  {
    label: "Employees",
    path: "/admin/employees",
    icon: Users,
    ocid: "nav.employees.link",
  },
  {
    label: "Operations",
    path: "/admin/operations",
    icon: Cog,
    ocid: "nav.operations.link",
  },
  {
    label: "Bundles",
    path: "/admin/bundles",
    icon: Package,
    ocid: "nav.bundles.link",
  },
  {
    label: "Production",
    path: "/admin/production",
    icon: ClipboardList,
    ocid: "nav.production.link",
  },
  {
    label: "Attendance",
    path: "/admin/attendance",
    icon: CalendarCheck,
    ocid: "nav.attendance.link",
  },
  {
    label: "Bundle Progress",
    path: "/admin/bundle-progress",
    icon: BarChart2,
    ocid: "nav.bundle_progress.link",
  },
  {
    label: "Salary",
    path: "/admin/salary",
    icon: DollarSign,
    ocid: "nav.salary.link",
  },
  {
    label: "Reports",
    path: "/admin/reports",
    icon: FileSpreadsheet,
    ocid: "nav.reports.link",
  },
  {
    label: "Targets",
    path: "/admin/targets",
    icon: Target,
    ocid: "nav.targets.link",
  },
  {
    label: "Supervisors",
    path: "/admin/supervisors",
    icon: UserCog,
    ocid: "nav.supervisors.link",
  },
];

interface AdminLayoutProps {
  currentPath: string;
  navigate: (path: string) => void;
}

function renderPage(currentPath: string) {
  if (currentPath === "/admin/employees") return <EmployeesPage />;
  if (currentPath === "/admin/operations") return <OperationsPage />;
  if (currentPath === "/admin/bundles") return <BundlesPage />;
  if (currentPath === "/admin/production") return <ProductionPage />;
  if (currentPath === "/admin/attendance") return <AttendancePage />;
  if (currentPath === "/admin/bundle-progress") return <BundleProgressPage />;
  if (currentPath === "/admin/salary") return <SalaryPage />;
  if (currentPath === "/admin/reports") return <ReportsPage />;
  if (currentPath === "/admin/targets") return <TargetsPage />;
  if (currentPath === "/admin/supervisors") return <SupervisorsPage />;
  return <AdminDashboard />;
}

function SidebarContent({
  currentPath,
  navigate,
  onClose,
}: {
  currentPath: string;
  navigate: (path: string) => void;
  onClose?: () => void;
}) {
  const { session, logout } = useAuth();
  const queryClient = useQueryClient();

  const handleNav = (path: string) => {
    navigate(path);
    onClose?.();
  };

  const handleLogout = () => {
    logout();
    queryClient.clear();
  };

  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
            <Factory className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div className="min-w-0">
            <div className="font-display font-bold text-sm text-sidebar-foreground leading-tight truncate">
              Padmaja Creation
            </div>
            <div className="text-xs text-sidebar-foreground/50">Pvt Ltd</div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <ScrollArea className="flex-1 py-3">
        <nav className="px-2 space-y-0.5">
          {navItems.map((item) => {
            const isActive = currentPath === item.path;
            const Icon = item.icon;
            return (
              <button
                type="button"
                key={item.path}
                data-ocid={item.ocid}
                onClick={() => handleNav(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {isActive && (
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                )}
              </button>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User + logout */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
          <div className="w-7 h-7 rounded-full bg-sidebar-primary/20 flex items-center justify-center text-xs font-bold text-sidebar-primary">
            {session?.name?.charAt(0)?.toUpperCase() ?? "A"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-sidebar-foreground truncate">
              {session?.name ?? "Admin"}
            </div>
            <div className="text-xs text-sidebar-foreground/40">
              Administrator
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent gap-2"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

export default function AdminLayout({
  currentPath,
  navigate,
}: AdminLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentNav = navItems.find((n) => n.path === currentPath);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-60 flex-col flex-shrink-0 border-r border-sidebar-border">
        <SidebarContent currentPath={currentPath} navigate={navigate} />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="p-0 w-64 bg-sidebar border-sidebar-border"
        >
          <SidebarContent
            currentPath={currentPath}
            navigate={navigate}
            onClose={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="lg:hidden p-2">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
          </Sheet>
          <div>
            <h1 className="font-display font-bold text-foreground leading-tight">
              {currentNav?.label ?? "Dashboard"}
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Padmaja Creation Pvt Ltd — Admin Panel
            </p>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6">{renderPage(currentPath)}</div>
        </main>
      </div>
    </div>
  );
}
