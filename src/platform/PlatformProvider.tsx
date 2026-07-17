import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { PlatformServices } from "./contracts";
import { createWebPlatform } from "./web/createWebPlatform";
import { createNativePlatform, isNativeRuntime } from "./native/createNativePlatform";

const PlatformContext = createContext<PlatformServices | null>(null);

type Props = {
  children: ReactNode;
  /** Tests and future shells can inject a complete platform implementation. */
  services?: PlatformServices;
};

export function PlatformProvider({ children, services }: Props) {
  const value = useMemo(() => {
    if (services) return services;
    return isNativeRuntime() ? createNativePlatform() : createWebPlatform();
  }, [services]);
  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

export function usePlatform(): PlatformServices {
  const services = useContext(PlatformContext);
  if (!services) throw new Error("usePlatform must be used within PlatformProvider");
  return services;
}
