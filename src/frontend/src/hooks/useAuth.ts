import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserRole } from "../backend.d";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

export interface Session {
  role: "admin" | "supervisor";
  username: string;
  name: string;
  principal?: string;
}

export function useAuth() {
  const { identity, login, clear, isInitializing, loginStatus } =
    useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const qc = useQueryClient();

  const isAuthenticated = !!identity;

  const roleQuery = useQuery<UserRole>({
    queryKey: ["callerUserRole"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserRole();
    },
    enabled: isAuthenticated && !!actor && !actorFetching,
    retry: 1,
  });

  const profileQuery = useQuery({
    queryKey: ["callerUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: isAuthenticated && !!actor && !actorFetching,
    retry: 1,
  });

  const isLoading =
    isInitializing ||
    actorFetching ||
    (isAuthenticated && (roleQuery.isLoading || profileQuery.isLoading));

  let session: Session | null = null;
  if (isAuthenticated && roleQuery.data) {
    const role = roleQuery.data;
    const principal = identity?.getPrincipal().toString() ?? "";
    const displayName =
      profileQuery.data?.name ?? `User-${principal.slice(0, 6)}`;
    session = {
      role: role === UserRole.admin ? "admin" : "supervisor",
      username: displayName,
      name: displayName,
      principal,
    };
  }

  const logout = async () => {
    await clear();
    qc.clear();
  };

  return {
    session,
    isLoading,
    isAuthenticated,
    loginStatus,
    login,
    logout,
  };
}
