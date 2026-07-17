import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { createMockRepositories } from "./mock/create-mock-repositories";
import type { Repositories } from "./repositories";

const RepositoriesContext = createContext<Repositories | null>(null);

type Props = {
  children: ReactNode;
  /** Inject fakes in tests; defaults to a fresh mock graph per provider mount. */
  repositories?: Repositories;
};

export function RepositoriesProvider({ children, repositories }: Props) {
  const value = useMemo(
    () => repositories ?? createMockRepositories(),
    [repositories],
  );

  return (
    <RepositoriesContext.Provider value={value}>{children}</RepositoriesContext.Provider>
  );
}

export function useRepositories(): Repositories {
  const ctx = useContext(RepositoriesContext);
  if (!ctx) {
    throw new Error("useRepositories must be used within RepositoriesProvider");
  }
  return ctx;
}
