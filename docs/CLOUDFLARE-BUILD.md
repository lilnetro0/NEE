# Cloudflare Workers / Pages notes for NETRO
#
# Cloudflare auto-runs: npm clean-install (npm ci) when package-lock.json exists.
# Always regenerate the lockfile with npm 10.x (Cloudflare's version), e.g.:
#   npx npm@10.9.2 install
#   npx npm@10.9.2 ci   # must succeed locally before push
#
# If npm ci still fails on Cloudflare, set build env:
#   SKIP_DEPENDENCY_INSTALL=true
# and build command:
#   npm install && npm run build
