# NETRO Frontend Refactor Plan

> Goal: keep the **mock-based** customer app shippable while ensuring domain types, repositories, quotes, and order statuses stay compatible with the distributor-API backend described in `DOMAIN-MODEL.md` and `API-CONTRACT-DRAFT.md`.

## 1. Non-goals (this plan)

- Calling Reloadly, LikeCard, GamesDrop, WUPEX, or any distributor from the browser
- Showing supplier names, costs, SKUs, balances, or raw errors in UI
- Implementing real payment PSP or real encrypted code vault in the client
- Rewriting unrelated screens for visual redesign

## 2. Current baseline (completed phases)

The frontend already approximates the public side of the architecture:

| Area | Status |
|------|--------|
| Discriminated products (`gift_card` / `direct_topup`) | Done |
| Repository interfaces + mock graph | Done |
| Platform abstraction (secure storage, device, version) | Done |
| Capability flags | Done |
| Dynamic top-up field schemas | Done |
| Quote-driven checkout | Done |
| Separate payment / fulfillment / refund machines | Done |
| Operational status screens | Done |
| Auth repository + secure session storage | Done |
| Structured order support tickets | Done |

Remaining work is **alignment and hardening**, not a greenfield rewrite.

## 3. Hard compatibility rules for all future frontend work

1. **Public DTOs only** in `src/domain` modules consumed by routes.
2. **No** `supplierId`, `supplierName`, `supplierSku`, `cost`, `balance`, or raw upstream error strings on customer models.
3. Cart / checkout **must** treat `CheckoutQuote` as the source of payable totals.
4. Order UI **must** derive display status from payment + fulfillment + refund.
5. Payment success screens **must not** claim delivery completion.
6. Gift-card codes: reveal via repository method that models a backend-controlled action; never persist codes in preferences/`localStorage`.
7. Top-up forms submit **normalized** field keys from `DynamicTopUpField`; never supplier-specific payload shapes in the UI layer.
8. Customer-safe outage copy only (e.g. “Temporarily unavailable”) — path names like `/status/supplier-outage` may remain for compatibility but must not surface the word “supplier” to users.
9. All user-facing strings stay in i18n dictionaries (EN/AR, RTL).

## 4. Target frontend architecture

```text
Routes / UI
  → hooks (useOrders, useAuth, …)
    → repository interfaces
      → mock implementations (now)
      → HTTP NETRO API client (later)
        → NETRO backend
          → supplier adapters (never from UI)
```

`RepositoriesProvider` remains the seam. Swapping mocks for HTTP should not require route rewrites.

## 5. Domain alignment checklist

### Keep / extend in frontend domain

| Model | Notes |
|-------|-------|
| `Product` union | Already correct split |
| `CheckoutQuote` / availability | Keep; ensure expiry + price_changed + unavailable UX stays |
| `PaymentStatus` / `FulfillmentStatus` / `RefundStatus` | Keep separate |
| `Order` + `OrderItem` | Customer-safe fields only |
| `SupportTicket` | Reasons + contact + attachment placeholder + non-displayed metadata |
| Auth session types | Tokens via `secureStorage` only |

### Do **not** add to frontend domain

| Backend model | Why |
|---------------|-----|
| `Supplier` | Ops / backend |
| `SupplierProduct` | Sync projection |
| `SupplierProductMapping` | Routing config |
| `SupplierBalance` | Prepaid monitoring |
| `SupplierQuote` | Internal pricing input |
| `SupplierOrder` | Fulfillment trace |
| `FulfillmentAttempt` | Worker state |
| `SupplierWebhookEvent` | Ingress |
| `CatalogSyncRun` | Jobs |
| `PricingRule` | Pricing engine |
| `SupplierRoutingDecision` | Audit |

If TypeScript types for those are ever shared in a monorepo package, put them in a **backend-only** or **admin-only** package, not in the PWA bundle.

## 6. Repository contract alignment

### ProductRepository

- List/get/search NETRO products
- Validate accounts using NETRO field maps
- Mock may simulate `unavailable` without naming a distributor

### OrderRepository

- `createQuote` / `refreshQuote` → public quote DTO
- `create` from `quoteId` + payment method
- `pollFulfillment` advances fulfillment independently of payment
- `revealCode` requires reauth token argument (already shaped for backend)

Future HTTP mapping:

| Mock method | Public endpoint |
|-------------|-----------------|
| `createQuote` | `POST /v1/checkout/quotes` |
| `refreshQuote` | `POST /v1/checkout/quotes/{id}/refresh` |
| `create` | `POST /v1/orders` |
| `pollFulfillment` | `GET /v1/orders/{id}` or dedicated status |
| `revealCode` | `POST /v1/orders/.../reveal-code` |

### AuthRepository / SupportRepository / UserRepository

Remain NETRO-backend shaped; no supplier concerns.

## 7. Planned frontend phases (post–Phase 10)

Work one phase at a time; run typecheck + production build after each.

### Phase 11 — Quote & catalog DTO freeze

- Audit public types against `API-CONTRACT-DRAFT.md`
- Ensure sellable unit IDs (`denominationId` / `packageId`) are consistent in cart → quote → order
- Add explicit “no supplier fields” comments on public types
- Fix any customer-visible copy that still says “supplier” / “مورّد” in order events or toasts

### Phase 12 — Fulfillment UX vs timeout semantics

- Document in UI copy that payment confirmed ≠ delivered
- Ensure poll / manual review / failed / partial paths match backend timeout policy (no client-side “try another provider”)
- Keep retry actions customer-safe (retry checkout, contact support, home)

### Phase 13 — Code reveal hardening

- Route all reveals through repository + reauth
- Confirm no code values in analytics, logs, or preference storage
- LTR rendering for codes and Player IDs in Arabic layouts

### Phase 14 — HTTP repository adapter (NETRO API)

- Implement `createHttpRepositories()` behind the same interfaces
- Env-based switch; mocks remain default for local/dev
- Map normalized error codes to existing operational screens

### Phase 15 — Capability & maintenance gates

- Wire backend capability / maintenance flags to existing status routes
- Mandatory update remains platform-driven

### Explicitly deferred

- Real distributor adapters
- Admin UI for mappings / balances / sync
- Real PSP integration beyond mock authorization
- Native biometric unlock beyond platform stub

## 8. UI surfaces — allowed vs forbidden

| Surface | Allowed | Forbidden |
|---------|---------|-----------|
| Home / PDP | NETRO brand, price, region, stock | Distributor badges, “powered by X” |
| Checkout | Quote totals, payment method | Cost, margin, supplier pickers |
| Order detail | Display status, code reveal, support | Routing decisions, attempt logs |
| Support form | Order/item/reason/contact | Supplier refs, raw errors |
| Status screens | Customer-safe outage/update copy | Supplier brand names |
| Dev galleries | Mock lifecycle scenarios | Live supplier credentials |

## 9. Data access testing strategy

- Unit-test pure helpers (`deriveOrderDisplayStatus`, quote expiry checks)
- Mock repositories simulate: quote expiry, price change, unavailable, fulfillment delay, partial fail, manual review
- Never assert on supplier IDs in frontend tests

## 10. Migration path when backend lands

1. Keep mock repos for Storybook / offline demos  
2. Add HTTP client implementing the same interfaces  
3. Point staging builds at NETRO API  
4. Compare fixture shapes with contract tests shared from `API-CONTRACT-DRAFT.md`  
5. Remove only mock **data**, not the repository boundary  

## 11. Immediate doc-driven actions (no distributor calls)

From this documentation update:

1. Treat `docs/DOMAIN-MODEL.md` as the source of truth for backend entities  
2. Treat `docs/API-CONTRACT-DRAFT.md` as the public/internal API boundary  
3. Use this plan to sequence frontend work without introducing supplier leakage  
4. Do **not** implement real distributor API calls in the PWA  

## 12. Success criteria

The frontend is “distributor-architecture compatible” when:

- [ ] A backend engineer can implement adapters without changing customer DTO field names unexpectedly  
- [ ] Swapping mock → HTTP repositories requires no route-level supplier awareness  
- [ ] Security review finds no supplier commercial data in the JS bundle’s customer paths  
- [ ] Checkout and order status machines still match payment ≠ fulfillment  
- [ ] Typecheck and production build remain green after each phase  
