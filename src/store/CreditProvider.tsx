/**
 * NETRO Store Credit provider.
 * Replaces the old "Wallet". Read-only from the UI's perspective —
 * no deposits, withdrawals, or peer-to-peer transfers.
 */

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { StoreCredit } from "@/domain/order";
import { useRepositories } from "@/data-access/RepositoriesProvider";

type CreditCtx = {
  status: "loading" | "ready" | "error";
  credit: StoreCredit | null;
  refresh: () => void;
};

const Ctx = createContext<CreditCtx | null>(null);

export function CreditProvider({ children }: { children: ReactNode }) {
  const { users } = useRepositories();
  const [credit, setCredit] = useState<StoreCredit | null>(null);
  const [status, setStatus] = useState<CreditCtx["status"]>("loading");

  const load = useCallback(() => {
    const controller = new AbortController();
    setStatus("loading");
    void users.getStoreCredit({ signal: controller.signal }).then((result) => {
      if (controller.signal.aborted) return;
      if (!result.ok) {
        setStatus("error");
        return;
      }
      setCredit(result.data);
      setStatus("ready");
    });
    return () => controller.abort();
  }, [users]);

  useEffect(() => {
    const cancel = load();
    return cancel;
  }, [load]);

  return <Ctx.Provider value={{ status, credit, refresh: () => void load() }}>{children}</Ctx.Provider>;
}

export function useStoreCredit() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStoreCredit must be used within CreditProvider");
  return c;
}
