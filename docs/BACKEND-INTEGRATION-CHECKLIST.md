# Backend / Supabase integration checklist

The browser connects to **Supabase** (`VITE_SUPABASE_URL` + publishable key) and invokes Edge Functions for commerce writes. The Laravel REST API is deprecated for this client.

## Before production cutover

- [ ] Supabase project created; URL + publishable key set in frontend env
- [ ] Phone + Email auth providers enabled; SMS provider configured for OTP
- [ ] SQL migrations applied; RLS verified on all commerce tables
- [ ] Realtime enabled on `notifications`
- [ ] Edge Functions deployed; stub flags off in production (`PAYMENT_STUB_ENABLED` unset/false)
- [ ] Catalog seeded; no supplier IDs/names exposed to clients
- [ ] Quote → order → payment webhook skeleton → fulfillment stub path smoke-tested in preview
- [ ] Reveal requires reauth and never logs codes
- [ ] Codemagic / Railway / CI use `VITE_SUPABASE_*` (not `VITE_API_BASE_URL` / mocks)

## Explicit stubs (non-prod)

- Payment initiate and fulfillment write fake/stub data only when secrets allow it.
- Webhook skeleton is the only path that may set `paid` after verification.
- Live Moyasar / Reloadly / LikeCard / GamesDrop adapters are out of scope until wired.
