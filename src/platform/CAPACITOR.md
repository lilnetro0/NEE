# Capacitor implementation map

`PlatformServices` is injected through `PlatformProvider`. The current
`createWebPlatform()` implementation preserves browser/PWA behavior. A native
shell should inject another complete implementation rather than add native
conditionals to React components.

| Service | Current web behavior | Likely Capacitor implementation |
| --- | --- | --- |
| Ordinary preferences | `localStorage` | `@capacitor/preferences` |
| Secure storage | Tab-scoped `sessionStorage` fallback | A vetted Keychain/Keystore secure-storage plugin; Capacitor core does not provide encrypted secure storage |
| Clipboard | Clipboard Web API | `@capacitor/clipboard` |
| External URLs | `window.open` | `@capacitor/browser` |
| Deep links | Current URL plus history/hash listeners | `@capacitor/app` (`getLaunchUrl`, `appUrlOpen`) |
| Notification permission/local display | Web Notifications API | `@capacitor/push-notifications` and/or `@capacitor/local-notifications` |
| Device information | User-agent based web information | `@capacitor/device` |
| App version | Web build constant | `@capacitor/app` (`getInfo`) |
| Sharing | Web Share API | `@capacitor/share` |
| Receipt files | Browser download via `Blob` | `@capacitor/filesystem`, optionally combined with `@capacitor/share` |
| Haptics | Vibration API when available | `@capacitor/haptics` |
| Connectivity | `navigator.onLine` and online/offline events | `@capacitor/network` |
| Local unlock (biometrics) | Always `unavailable` on web; enable flag in preferences only | Device biometric / PIN unlock plugin — **local session unlock only**, never an IdP |

## Security boundary

The web secure-storage implementation is **not encrypted storage**. It uses
`sessionStorage` only to avoid putting short-lived sensitive values in
`localStorage` and clears with the browser tab. Native builds must not claim
secure persistence until a reviewed Keychain/Keystore implementation is
installed and configured.

Auth session tokens (`auth.session`) and reauth tokens are written only through
`secureStorage` — never through preference/`localStorage` adapters.

Long-lived credentials and delivered gift-card codes must not be written to
ordinary preference storage.

Biometrics / Face ID / Touch ID unlock an already-authenticated local session.
They must never be presented or implemented as a backend identity provider.
