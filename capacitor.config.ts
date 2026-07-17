import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor loads a static web shell from `webDir`.
 *
 * After `npm run build`, run `npm run prepare:capacitor` to write `index.html`
 * into `.output/public` (TanStack Start + Nitro does not emit one by default).
 *
 *   npm run cap:sync:android
 *
 * Optional live reload (Android emulator → host Vite):
 *   CAP_SERVER_URL=http://10.0.2.2:3000 npx cap sync android
 */
const serverUrl = process.env.CAP_SERVER_URL?.trim();

const config: CapacitorConfig = {
  appId: "com.lilnetro0.netr",
  appName: "NETRO",
  webDir: ".output/public",
  ...(serverUrl
    ? {
        server: {
          url: serverUrl,
          cleartext: serverUrl.startsWith("http://"),
        },
      }
    : {}),
};

export default config;
