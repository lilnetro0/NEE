# Backend integration checklist

The browser connects **only** to the NETRO backend (`VITE_API_BASE_URL`).

## Absolute rules

- [ ] Frontend connects only to the NETRO backend
- [ ] Supplier credentials remain backend-only
- [ ] Supplier APIs are never called directly from the browser
- [ ] Payment secrets remain backend-only
- [ ] Digital codes are encrypted at rest and returned only through authenticated endpoints (reauth required for reveal)
- [ ] Checkout uses server-generated short-lived quotes
- [ ] Payment status and fulfillment status remain separate fields/events
- [ ] Production must not use mock repositories (`VITE_USE_MOCKS=false`)

## Frontend readiness already in place

- Typed repository interfaces + HTTP placeholders under `src/data-access/http/`
- Shared `NetroApiClient` (timeout, correlation IDs, cookie credentials, GET-only retry, status normalization)
- Env validation that fails closed in production
- Auth session policy: cookies for PWA; secure storage for Capacitor; no tokens in `localStorage`
- Order display status derived from payment + fulfillment + refund independently

## Backend must provide before go-live

- [ ] HTTPS API with CORS + credentialed cookies
- [ ] Quote create / refresh / expiry
- [ ] Payment initiate + webhook-driven payment status (frontend never invents “paid”)
- [ ] Fulfillment pipeline updating fulfillment status independently of payment
- [ ] Authenticated code reveal endpoint (short-lived, audited)
- [ ] 401 → session expired / forced logout contract
- [ ] Rate limits (429) with safe client messaging
- [ ] Maintenance / mandatory-update signals (optional headers or `/v1/app/config`)

## Distributors (backend only)

Reloadly, LikeCard, GamesDrop, WUPEX (and any payment PSP) stay server-side. The frontend must never learn supplier product IDs or supplier names for customer surfaces.
