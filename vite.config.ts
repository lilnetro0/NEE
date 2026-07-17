// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    // Custom client entry: src/client.tsx (auto-resolved). Injects Capacitor SPA
    // $_TSR bootstrap so hydrateStart does not throw "Invariant failed" on a
    // static index.html shell.
    //
    // NOTE: Official SPA prerender (`spa.enabled`) is intentionally off. With
    // Nitro's `.output` layout it looks for `dist/server/server.js` and fails.
    // Capacitor gets index.html from `npm run prepare:capacitor` instead.
  },
});
