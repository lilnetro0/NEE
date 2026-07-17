import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Repositories } from "./repositories";
import { createRepositoriesFromEnv } from "./http/create-http-repositories";

const RepositoriesContext = createContext<Repositories | null>(null);

type Props = {
  children: ReactNode;
  /** Inject fakes in tests; otherwise selected from public env (mock vs HTTP). */
  repositories?: Repositories;
};

export function RepositoriesProvider({ children, repositories }: Props) {
  const value = useMemo(() => {
    if (repositories) return repositories;
    return createRepositoriesFromEnv().repositories;
  }, [repositories]);

  return <RepositoriesContext.Provider value={value}>{children}</RepositoriesContext.Provider>;
}

export function useRepositories(): Repositories {
  const ctx = useContext(RepositoriesContext);
  if (!ctx) {
    throw new Error("useRepositories must be used within RepositoriesProvider");
  }
  return ctx;
}
