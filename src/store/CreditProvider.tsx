/**
 * NETRO Store Credit provider.
 * Replaces the old "Wallet". Read-only from the UI's perspective —
 * no deposits, withdrawals, or peer-to-peer transfers.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { StoreCredit } from "@/domain/order";
import { creditApi } from "@/api/services";

type CreditCtx = {
  status: "loading" | "ready" | "error";
  credit: StoreCredit | null;
  refresh: () => void;
};

const Ctx = createContext<CreditCtx | null>(null);

export function CreditProvider({ children }: { children: ReactNode }) {
  const [credit, setCredit] = useState<StoreCredit | null>(null);
  const [status, setStatus] = useState<CreditCtx["status"]>("loading");

  const load = () => {
    setStatus("loading");
    creditApi
      .get()
      .then((c) => {
        setCredit(c);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  };

  useEffect(() => {
    load();
  }, []);

  return <Ctx.Provider value={{ status, credit, refresh: load }}>{children}</Ctx.Provider>;
}

export function useStoreCredit() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStoreCredit must be used within CreditProvider");
  return c;
}
