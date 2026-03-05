import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import { UserRole } from "./backend.d";
import LoadingScreen from "./components/LoadingScreen";
import ProfileSetupModal from "./components/ProfileSetupModal";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  useGetCallerUserProfile,
  useGetCallerUserRole,
} from "./hooks/useQueries";
import LoginPage from "./pages/LoginPage";
import AdminLayout from "./pages/admin/AdminLayout";
import SupervisorLayout from "./pages/supervisor/SupervisorLayout";

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const profileQuery = useGetCallerUserProfile();
  const roleQuery = useGetCallerUserRole();
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

  // Show loading while initializing
  if (
    isInitializing ||
    (isAuthenticated && (profileQuery.isLoading || roleQuery.isLoading))
  ) {
    return <LoadingScreen />;
  }

  // Not logged in → login page
  if (!isAuthenticated) {
    return (
      <>
        <LoginPage />
        <Toaster richColors />
      </>
    );
  }

  // Logged in but no profile → show profile setup
  const showProfileSetup =
    isAuthenticated &&
    !profileQuery.isLoading &&
    profileQuery.isFetched &&
    profileQuery.data === null;

  if (showProfileSetup) {
    return (
      <>
        <ProfileSetupModal />
        <Toaster richColors />
      </>
    );
  }

  const role = roleQuery.data;

  // Redirect logic based on path and role
  if (role === UserRole.admin || profileQuery.data?.role === "admin") {
    if (!currentPath.startsWith("/admin")) {
      navigate("/admin");
      return <LoadingScreen />;
    }
    return (
      <>
        <AdminLayout currentPath={currentPath} navigate={navigate} />
        <Toaster richColors />
      </>
    );
  }

  if (role === UserRole.user || profileQuery.data?.role === "supervisor") {
    if (!currentPath.startsWith("/supervisor")) {
      navigate("/supervisor");
      return <LoadingScreen />;
    }
    return (
      <>
        <SupervisorLayout currentPath={currentPath} navigate={navigate} />
        <Toaster richColors />
      </>
    );
  }

  // Guest / no role assigned yet
  return (
    <>
      <LoadingScreen message="Setting up your account..." />
      <Toaster richColors />
    </>
  );
}
