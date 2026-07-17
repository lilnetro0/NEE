# Cloudflare Workers / Pages notes for NETRO

Cloudflare auto-runs `npm clean-install` (`npm ci`) when `package-lock.json` exists.

## Lockfile / npm version

Regenerate the lockfile with npm 10.x (Cloudflare’s version), e.g.:

```bash
npx npm@10.9.2 install
npx npm@10.9.2 ci   # must succeed locally before push
```

## Rolldown / native bindings

Vite 8 uses Rolldown, which needs platform-specific optional packages (e.g. `@rolldown/binding-linux-x64-gnu`). A lockfile produced on Windows often only resolves the Windows binding, so Linux CI fails with:

`Cannot find module '@rolldown/binding-linux-x64-gnu'`

This repo pins the Linux bindings (and related oxide/lightningcss/oxc Linux packages) as top-level `optionalDependencies`, and forces a single `rolldown` version via `overrides`, so `npm ci` on Cloudflare installs the Linux native binding.

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
