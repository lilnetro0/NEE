import { useCallback, useEffect, useMemo, useState } from "react";
import {
  canPurchaseProduct,
  DEFAULT_MARKET_COUNTRY,
  resolveCapabilities,
  resolvePaymentRails,
  type Capabilities,
  type CapabilityContext,
  type CapabilityId,
  type PaymentRailCapabilities,
  type ProductType,
} from "./capabilities";
import type { PlatformKind } from "./contracts";
import { usePlatform } from "./PlatformProvider";

export type UseCapabilitiesResult = {
  status: "loading" | "ready";
  context: CapabilityContext;
  capabilities: Capabilities;
  paymentRails: PaymentRailCapabilities;
  isEnabled: (id: CapabilityId) => boolean;
  canPurchase: (productType: ProductType) => boolean;
};

/**
 * Reusable market/platform capability access for screens and actions.
 * Country defaults to the local development market until remote config exists.
 */
export function useCapabilities(productType?: ProductType): UseCapabilitiesResult {
  const { device, appVersion } = usePlatform();
  const [platform, setPlatform] = useState<PlatformKind>("web");
  const [version, setVersion] = useState("1.0.0");
  const [status, setStatus] = useState<"loading" | "ready">("loading");

  useEffect(() => {
    let active = true;
    void Promise.all([device.getInfo(), appVersion.getInfo()]).then(([deviceInfo, versionInfo]) => {
      if (!active) return;
      setPlatform(deviceInfo.platform);
      setVersion(versionInfo.version);
      setStatus("ready");
    });
    return () => {
      active = false;
    };
  }, [appVersion, device]);

  const context = useMemo<CapabilityContext>(
    () => ({
      platform,
      country: DEFAULT_MARKET_COUNTRY,
      appVersion: version,
      productType,
    }),
    [platform, productType, version],
  );

  const capabilities = useMemo(() => resolveCapabilities(context), [context]);
  const paymentRails = useMemo(
    () => resolvePaymentRails(context, capabilities),
    [capabilities, context],
  );

  const isEnabled = useCallback((id: CapabilityId) => capabilities[id], [capabilities]);
  const canPurchase = useCallback(
    (kind: ProductType) => canPurchaseProduct(capabilities, kind),
    [capabilities],
  );

  return {
    status,
    context,
    capabilities,
    paymentRails,
    isEnabled,
    canPurchase,
  };
}
