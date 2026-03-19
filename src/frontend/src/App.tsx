import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import LoadingScreen from "./components/LoadingScreen";
import { useAuth } from "./hooks/useAuth";
import LoginPage from "./pages/LoginPage";
import AdminLayout from "./pages/admin/AdminLayout";
import SupervisorLayout from "./pages/supervisor/SupervisorLayout";

export default function App() {
  const { session, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePop = () => setCurrentPath(window.location.pathname);
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, "", path);
    setCurrentPath(path);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!session) {
    return (
      <>
        <LoginPage />
        <Toaster richColors />
      </>
    );
  }

  if (session.role === "admin") {
    const adminPath = currentPath.startsWith("/admin") ? currentPath : "/admin";
    if (!currentPath.startsWith("/admin")) {
      window.history.replaceState({}, "", "/admin");
    }
    return (
      <>
        <AdminLayout currentPath={adminPath} navigate={navigate} />
        <Toaster richColors />
      </>
    );
  }

  if (session.role === "supervisor") {
    const supervisorPath = currentPath.startsWith("/supervisor")
      ? currentPath
      : "/supervisor";
    if (!currentPath.startsWith("/supervisor")) {
      window.history.replaceState({}, "", "/supervisor");
    }
    return (
      <>
        <SupervisorLayout currentPath={supervisorPath} navigate={navigate} />
        <Toaster richColors />
      </>
    );
  }

  // Guest or unknown role — show access pending
  return (
    <>
      <AccessPendingPage />
      <Toaster richColors />
    </>
  );
}

function AccessPendingPage() {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-warning/20 border border-warning/40 flex items-center justify-center mx-auto">
          <span className="text-3xl">⏳</span>
        </div>
        <h2 className="text-xl font-bold text-foreground">Access Pending</h2>
        <p className="text-muted-foreground text-sm">
          Your account is awaiting role assignment. Please contact the Admin to
          grant you access to the Padmaja Creation ERP system.
        </p>
        <button
          type="button"
          onClick={logout}
          className="mt-2 px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
