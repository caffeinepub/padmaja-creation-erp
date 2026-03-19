import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart2,
  Boxes,
  CalendarCheck,
  CheckSquare,
  ClipboardList,
  Cog,
  DollarSign,
  Factory,
  FileSpreadsheet,
  LayoutDashboard,
  LogOut,
  Medal,
  Menu,
  Package,
  Target,
  UserCog,
  Users,
  Warehouse,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";

import AdminDashboard from "./AdminDashboard";
import AttendancePage from "./AttendancePage";
import BundleProgressPage from "./BundleProgressPage";
import BundlesPage from "./BundlesPage";
import EmployeesPage from "./EmployeesPage";
import InventoryPage from "./InventoryPage";
import OperationsPage from "./OperationsPage";
import PerformanceRankingPage from "./PerformanceRankingPage";
import ProductionPage from "./ProductionPage";
import QualityControlPage from "./QualityControlPage";
import ReportsPage from "./ReportsPage";
import SalaryPage from "./SalaryPage";
import SupervisorsPage from "./SupervisorsPage";
import TargetsPage from "./TargetsPage";

interface AdminLayoutProps {
  currentPath: string;
  navigate: (path: string) => void;
}

const navGroups = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", path: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "Management",
    items: [
      { label: "Employees", path: "/admin/employees", icon: Users },
      { label: "Operations", path: "/admin/operations", icon: Cog },
      { label: "Bundles", path: "/admin/bundles", icon: Package },
      { label: "Supervisors", path: "/admin/supervisors", icon: UserCog },
    ],
  },
  {
    label: "Production",
    items: [
      {
        label: "Production Entries",
        path: "/admin/production",
        icon: ClipboardList,
      },
      { label: "Attendance", path: "/admin/attendance", icon: CalendarCheck },
      { label: "Salary Sheet", path: "/admin/salary", icon: DollarSign },
    ],
  },
  {
    label: "Analytics",
    items: [
      {
        label: "Bundle Progress",
        path: "/admin/bundle-progress",
        icon: BarChart2,
      },
      { label: "Performance", path: "/admin/performance", icon: Medal },
      { label: "Targets", path: "/admin/targets", icon: Target },
      { label: "Reports", path: "/admin/reports", icon: FileSpreadsheet },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Inventory", path: "/admin/inventory", icon: Warehouse },
      { label: "Quality Control", path: "/admin/quality", icon: CheckSquare },
    ],
  },
];

function renderPage(path: string) {
  if (path === "/admin/employees") return <EmployeesPage />;
  if (path === "/admin/operations") return <OperationsPage />;
  if (path === "/admin/bundles") return <BundlesPage />;
  if (path === "/admin/production") return <ProductionPage />;
  if (path === "/admin/attendance") return <AttendancePage />;
  if (path === "/admin/salary") return <SalaryPage />;
  if (path === "/admin/bundle-progress") return <BundleProgressPage />;
  if (path === "/admin/performance") return <PerformanceRankingPage />;
  if (path === "/admin/targets") return <TargetsPage />;
  if (path === "/admin/reports") return <ReportsPage />;
  if (path === "/admin/supervisors") return <SupervisorsPage />;
  if (path === "/admin/inventory") return <InventoryPage />;
  if (path === "/admin/quality") return <QualityControlPage />;
  return <AdminDashboard />;
}

function getPageTitle(path: string): string {
  for (const group of navGroups) {
    for (const item of group.items) {
      if (item.path === path) return item.label;
    }
  }
  return "Dashboard";
}

export default function AdminLayout({
  currentPath,
  navigate,
}: AdminLayoutProps) {
  const { session, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const qc = useQueryClient();

  const handleLogout = async () => {
    await logout();
    qc.clear();
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const SidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
            <Factory className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-display font-bold text-sm text-foreground leading-tight truncate">
              Padmaja Creation
            </p>
            <p className="text-xs text-muted-foreground">ERP System</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 px-3 py-3">
        <nav className="space-y-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = currentPath === item.path;
                  return (
                    <button
                      key={item.path}
                      type="button"
                      data-ocid={`nav.${item.label.toLowerCase().replace(/ /g, "_")}.link`}
                      onClick={() => handleNavigate(item.path)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? "bg-primary/15 text-primary border border-primary/20"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-accent-foreground"
                      }`}
                    >
                      <item.icon
                        className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                      />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* User / Logout */}
      <div className="border-t border-sidebar-border px-3 py-3">
        <div className="flex items-center gap-2.5 px-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
            {(session?.name ?? "A").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">
              {session?.name ?? "Admin"}
            </p>
            <p className="text-xs text-muted-foreground">Administrator</p>
          </div>
        </div>
        <button
          type="button"
          data-ocid="nav.logout.button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 flex-col bg-sidebar border-r border-sidebar-border flex-shrink-0">
        {SidebarContent}
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center gap-3 px-4 flex-shrink-0">
          {/* Mobile hamburger */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden h-9 w-9 p-0"
                data-ocid="nav.menu.button"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="p-0 w-60 bg-sidebar border-sidebar-border"
            >
              {SidebarContent}
            </SheetContent>
          </Sheet>

          <h1 className="font-display font-semibold text-foreground flex-1">
            {getPageTitle(currentPath)}
          </h1>

          <div className="hidden sm:flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-muted-foreground">
              Live Blockchain
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 sm:p-6">
            {renderPage(currentPath)}
          </div>
        </main>
      </div>
    </div>
  );
}
