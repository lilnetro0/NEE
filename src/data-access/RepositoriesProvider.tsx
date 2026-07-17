import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Repositories } from "./repositories";
import { createRepositoriesFromEnv } from "./supabase/create-supabase-repositories";
import { configureSupabaseAuthStorage } from "@/lib/supabase";
import { usePlatform } from "@/platform/PlatformProvider";

const RepositoriesContext = createContext<Repositories | null>(null);

type Props = {
  children: ReactNode;
  /** Inject fakes in tests; otherwise Supabase repositories from public env. */
  repositories?: Repositories;
};

export function RepositoriesProvider({ children, repositories }: Props) {
  const { secureStorage } = usePlatform();

  const value = useMemo(() => {
    configureSupabaseAuthStorage(secureStorage);
    if (repositories) return repositories;
    return createRepositoriesFromEnv().repositories;
  }, [repositories, secureStorage]);

  return <RepositoriesContext.Provider value={value}>{children}</RepositoriesContext.Provider>;
}

export function useRepositories(): Repositories {
  const ctx = useContext(RepositoriesContext);
  if (!ctx) {
    throw new Error("useRepositories must be used within RepositoriesProvider");
  }
  return ctx;
}
