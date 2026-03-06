import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import { useAuth } from "./hooks/useAuth";
import LoginPage from "./pages/LoginPage";
import AdminLayout from "./pages/admin/AdminLayout";
import SupervisorLayout from "./pages/supervisor/SupervisorLayout";

export default function App() {
  const { session } = useAuth();
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

  // Not logged in → login page
  if (!session) {
    return (
      <>
        <LoginPage onLogin={(path) => navigate(path)} />
        <Toaster richColors />
      </>
    );
  }

  // Admin role
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

  // Supervisor role
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

  // Fallback
  return (
    <>
      <LoginPage onLogin={(path) => navigate(path)} />
      <Toaster richColors />
    </>
  );
}
