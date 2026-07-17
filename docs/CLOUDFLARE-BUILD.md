# Cloudflare Workers / Pages notes for NETRO

Cloudflare auto-runs `npm clean-install` (`npm ci`) when `package-lock.json` exists.

## Lockfile / npm version

Regenerate the lockfile with npm 10.x (Cloudflare’s version), e.g.:

```bash
npx npm@10.9.2 install
npx npm@10.9.2 ci   # must succeed locally before push
```

## Rolldown / native bindings

Vite 8 uses Rolldown (`1.2.0` via `overrides`), which needs platform-specific optional packages. A lockfile produced on one OS often skips other platforms’ bindings.

This repo pins top-level `optionalDependencies` for:

- Linux: `@rolldown/binding-linux-x64-gnu` / `musl` (Cloudflare)
- macOS: `@rolldown/binding-darwin-arm64` / `darwin-x64` (Codemagic `mac_mini_m2`)

Note: Rolldown’s loader also tries `@rolldown/binding-darwin-universal`, but that package is **not published** for `1.2.0`. The real macOS packages are arch-specific (`darwin-arm64` / `darwin-x64`).

Codemagic must use `npm ci --include=optional` (see `codemagic.yaml`).

## Build command

Prefer Cloudflare’s default install +:

```bash
npm run build
```

If you set `SKIP_DEPENDENCY_INSTALL=true`, use:

```bash
npm install && npm run build
```

Do not delete `package-lock.json` on Cloudflare unless you are regenerating it on purpose.
