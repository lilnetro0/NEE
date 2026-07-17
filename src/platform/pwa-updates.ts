/**
 * PWA update prompt helpers.
 * Wire to a registered service worker when hosting enables SW.
 * Never cache checkout, payment, auth, or digital-code responses — see docs/PWA-CACHING-POLICY.md.
 */

export type ServiceWorkerUpdateState =
  | { status: "idle" }
  | { status: "update_available"; registration: ServiceWorkerRegistration }
  | { status: "unsupported" };

export function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return Promise.resolve(null);
  }
  return navigator.serviceWorker.getRegistration().then((reg) => reg ?? null);
}

/** Ask the waiting worker to activate (call only after user confirms update). */
export async function applyWaitingServiceWorkerUpdate(
  registration: ServiceWorkerRegistration,
): Promise<void> {
  registration.waiting?.postMessage({ type: "SKIP_WAITING" });
}

export function subscribeToControllerChange(onChange: () => void): () => void {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return () => undefined;
  }
  const handler = () => onChange();
  navigator.serviceWorker.addEventListener("controllerchange", handler);
  return () => navigator.serviceWorker.removeEventListener("controllerchange", handler);
}
