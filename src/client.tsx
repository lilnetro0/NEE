import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { StartClient } from "@tanstack/react-start/client";

/**
 * Capacitor / static-shell bootstrap.
 *
 * TanStack Start's default client always calls hydrateRoot(document) and
 * hydrateStart(), which require window.$_TSR.router (SSR/SPA shell data).
 * Our Capacitor prepare script cannot run Start's Nitro SPA prerender
 * (it looks for dist/server/server.js). Without $_TSR.router, production
 * hydrate() throws "Invariant failed" and the WebView stays black.
 *
 * This entry injects a minimal SPA shell before StartClient runs, and paints
 * a visible boot error if anything still fails before React can recover.
 */

declare global {
  interface Window {
    $_TSR?: {
      router?: {
        manifest: undefined;
        matches: Array<{
          i: string;
          u: number;
          s: string;
          ssr?: boolean | "data-only";
        }>;
        lastMatchId?: string;
      };
      h: () => void;
      e: () => void;
      c: () => void;
      p: (script: () => void) => void;
      buffer: Array<() => void>;
      initialized?: boolean;
      hydrated?: boolean;
      streamEnded?: boolean;
      t?: Map<string, (value: unknown) => unknown>;
    };
  }
}

const BOOT_STYLE = [
  "position:fixed",
  "inset:0",
  "z-index:2147483647",
  "display:flex",
  "align-items:center",
  "justify-content:center",
  "padding:24px",
  "box-sizing:border-box",
  "background:#0d0f1a",
  "color:#f4f6fb",
  "font-family:system-ui,-apple-system,Segoe UI,sans-serif",
  "text-align:center",
].join(";");

function ensureSpaShell(): void {
  if (typeof window === "undefined") return;

  if (!window.$_TSR) {
    window.$_TSR = {
      h() {
        this.hydrated = true;
        this.c();
      },
      e() {
        this.streamEnded = true;
        this.c();
      },
      c() {
        // Keep $_TSR available for Cap/native shells; Start may delete after
        // full SSR streams. We only mark stream ended for SPA bootstrap.
      },
      p(script) {
        if (!this.initialized) this.buffer.push(script);
        else script();
      },
      buffer: [],
    };
  }

  if (!window.$_TSR.router) {
    // Minimal dehydrated root match → Start treats this as SPA shell mode
    // (client match tree continues past lastMatchId and runs router.load()).
    window.$_TSR.router = {
      manifest: undefined,
      matches: [
        {
          i: "__root__",
          u: Date.now(),
          s: "success",
          ssr: true,
        },
      ],
      lastMatchId: "__root__",
    };
  }

  // Mark stream complete so StartClient does not wait forever for SSR chunks.
  window.$_TSR.streamEnded = true;
}

function paintBootError(error: unknown): void {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Startup failed before the UI could render.";

  const existing = document.getElementById("netro-boot-error");
  if (existing) {
    const detail = existing.querySelector("[data-detail]");
    if (detail) detail.textContent = message;
    return;
  }

  const root = document.createElement("div");
  root.id = "netro-boot-error";
  root.setAttribute("role", "alert");
  root.style.cssText = BOOT_STYLE;
  root.innerHTML = [
    '<div style="max-width:22rem">',
    '<div style="width:64px;height:64px;margin:0 auto 16px;border-radius:18px;display:grid;place-items:center;font-weight:900;font-size:28px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff">N</div>',
    '<h1 style="margin:0;font-size:1.25rem;font-weight:800">NETRO failed to start</h1>',
    '<p data-detail style="margin:12px 0 0;font-size:0.875rem;line-height:1.45;color:#a8b0c2;word-break:break-word"></p>',
    '<p style="margin:16px 0 0;font-size:0.75rem;color:#7b8499">If this continues, rebuild with VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY set, then re-sync Capacitor.</p>',
    '<button type="button" style="margin-top:20px;border:0;border-radius:999px;padding:12px 20px;font-weight:700;background:#3b82f6;color:#fff">Reload</button>',
    "</div>",
  ].join("");

  const detail = root.querySelector("[data-detail]");
  if (detail) detail.textContent = message;
  root.querySelector("button")?.addEventListener("click", () => {
    window.location.reload();
  });

  document.body?.appendChild(root);
}

function installBootGuards(): void {
  window.addEventListener("error", (event) => {
    paintBootError(event.error ?? event.message);
  });
  window.addEventListener("unhandledrejection", (event) => {
    paintBootError(event.reason);
  });
}

installBootGuards();
ensureSpaShell();

startTransition(() => {
  try {
    hydrateRoot(
      document,
      <StrictMode>
        <StartClient />
      </StrictMode>,
      {
        onUncaughtError: (error) => {
          paintBootError(error);
        },
        onCaughtError: (error) => {
          paintBootError(error);
        },
        onRecoverableError: (error) => {
          // Hydration mismatches against the static Capacitor shell are expected;
          // keep them visible in the console but do not blank the screen.
          console.warn("[NETRO] recoverable hydration error", error);
        },
      },
    );
  } catch (error) {
    paintBootError(error);
  }
});
