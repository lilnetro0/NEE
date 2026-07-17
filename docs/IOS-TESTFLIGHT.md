# iOS / TestFlight (Codemagic)

## Canonical identifiers

| Item | Value |
|------|--------|
| Bundle ID | `com.lilnetro0.netro` |
| Team ID | `T8KY6PR359` |
| App Store Connect app | NNN |
| ASC API Key ID | `PC52DBNDLS` |
| ASC Issuer ID | `e3140c78-ce9e-40ac-8a10-2f850f3d57f9` |

Capacitor `appId`, Xcode `PRODUCT_BUNDLE_IDENTIFIER`, and Codemagic `ios_signing.bundle_identifier` must all match the Bundle ID above.

## Codemagic secrets (never commit)

1. **Distribution signing**
   - Upload `.p12` + App Store `.mobileprovision` for `com.lilnetro0.netro`
2. **App Store Connect API**
   - Environment variable `APP_STORE_CONNECT_PRIVATE_KEY` = full contents of `AuthKey_PC52DBNDLS.p8`
3. **Release web env**
   - `VITE_APP_ENV=production`
   - `VITE_USE_MOCKS=false`
   - `VITE_API_BASE_URL=https://<real-netro-api>/api` (required; Release fails without a non-placeholder URL)

## Workflow order (Release)

`npm ci --include=optional` → production web build → `prepare:capacitor` → `cap sync ios` → `xcode-project use-profiles` → IPA → TestFlight publish

## Export compliance

`Info.plist` sets `ITSAppUsesNonExemptEncryption` to `false` (HTTPS-only assumption). Change it if you add non-exempt crypto.
