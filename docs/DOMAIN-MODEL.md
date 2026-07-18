# NETRO Domain Model

> Status: architecture plan for a **distributor-API-powered marketplace**.  
> The customer-facing frontend remains mock-based until a NETRO backend exists.  
> This document defines the canonical domain language for that backend and for frontend types that must stay compatible with it.

## 1. Positioning

NETRO is primarily a **marketplace that fulfills through external distributor APIs** (examples: Reloadly, LikeCard, GamesDrop, WUPEX, or similar). Most gift cards and game top-ups are **not** drawn from manually managed local inventory.

NETRO still owns:

- The **public product catalog** shown to customers
- Customer accounts, checkout quotes, payments, and order lifecycle
- Pricing rules, supplier routing, reconciliation, and support

Distributors supply inventory and fulfillment capacity. They are never customer-facing brands.

## 2. Core principles

1. NETRO maintains its own public product catalog.
2. Customer-facing products are **not** direct copies of distributor product records.
3. Each NETRO product can map to **one or more** distributor products.
4. Distributor IDs, costs, SKUs, balances, and raw errors are **never** exposed to the frontend.
5. The frontend communicates **only** with the NETRO backend.
6. All distributor integrations use a **normalized supplier-adapter interface**.
7. Supplier routing considers availability, cost, balance, API health, priority, and fulfillment success rate.
8. Price and availability are validated through a **short-lived checkout quote**.
9. Payment confirmation and distributor fulfillment remain **separate states**.
10. Distributor requests, retries, callbacks, and webhooks are **idempotent**.
11. A timeout must **not** immediately trigger a fallback supplier (the first distributor may already have fulfilled).
12. Distributor **prepaid balances** must be monitored.
13. Supplier catalog sync must **not overwrite** NETRO public catalog content.
14. Order items store **supplier and pricing snapshots** for reconciliation and profit reporting.
15. Gift-card codes are **sensitive encrypted data**, revealed only through authenticated backend requests.
16. Direct top-up fields use **normalized NETRO fields**, converted to supplier payloads inside adapters.
17. The initial frontend stays mock-based, but repository types, quote models, order statuses, and product models must remain **compatible** with this architecture.

## 3. Boundary overview

```text
┌──────────────────────────────────────────────────────────────┐
│ Customer app (PWA / future Capacitor)                        │
│  - NETRO catalog, quotes, orders, auth, support              │
│  - No supplier names, IDs, costs, balances, or raw errors    │
└────────────────────────────┬─────────────────────────────────┘
                             │ HTTPS / typed API only
┌────────────────────────────▼─────────────────────────────────┐
│ NETRO backend                                                │
│  - Catalog, pricing, quotes, payments, orders                │
│  - Routing, snapshots, encryption, webhooks, reconciliation  │
└───────┬──────────────┬──────────────┬────────────────────────┘
        │              │              │
   Adapter A      Adapter B      Adapter N
   (Reloadly…)    (LikeCard…)    (GamesDrop…)
```

## 4. Customer-facing catalog domain

These types are already reflected (or closely mirrored) in `src/domain/*`. They are the public contract.

### 4.1 Product kinds

Discriminated union — never a single undifferentiated product shape:

| Kind | Purpose |
|------|---------|
| `gift_card` | Digital code / PIN delivery |
| `direct_topup` | Direct game account recharge |

### 4.2 Public entities

| Entity | Responsibility |
|--------|----------------|
| `Brand` | Customer-facing brand (PlayStation, PUBG, …) |
| `Category` | Browse taxonomy |
| `Region` | Sales / redemption region |
| `Product` | NETRO public product (`gift_card` \| `direct_topup`) |
| `ProductDenomination` | Gift-card face values and selling prices |
| `TopUpPackage` | Direct top-up package options |
| `DynamicTopUpField` | Normalized account fields (`player_id`, `server`, …) |

### 4.2.1 Catalog browsing hierarchy

The public catalog is browsed as:

```text
Category
  └── Brand / Game
        └── Region offering (products row)
              └── Denomination or top-up package (SKU)
```

`Brand` is the canonical customer identity. Region must never be encoded into
the brand name or brand ID. For compatibility, a `products` row remains the
region-scoped offering and keeps the stable ID referenced by carts, quotes,
orders, favorites, required fields, and supplier mappings.

`regions` is the controlled source of localized region names and currency
metadata. `products.region_id` references it. The legacy `region_code` column
is retained during the dual-read migration window.

Search and category pages return brands first. The customer chooses a region
before seeing the offering's denominations/packages.

Public products own:

- Localized titles, descriptions, redemption copy
- Customer selling prices and stock flags **as NETRO decides to present them**
- Normalized top-up field schemas

Public products **do not** contain:

- Distributor product IDs or SKUs
- Distributor cost / FX / margin
- Supplier names or adapter codes
- Prepaid balance information

### 4.3 Mapping rule

```text
NETRO Product (public)
   └── SupplierProductMapping[]  (1..N)
         └── SupplierProduct      (distributor catalog projection)
               └── Supplier
```

A single NETRO denomination or top-up package may map to multiple supplier SKUs for failover and cost optimization.

**Implemented now:** sellable SKUs remain `denominations` / `topup_packages` (no unified `product_variants` table). Admin SPA + Edge `admin-api` manage mappings; placeholder adapters live under `supabase/functions/_shared/suppliers/`. See [ADMIN.md](./ADMIN.md).

## 5. Distributor / supplier domain (backend-only)

These models live in the NETRO backend (and admin tooling). They must **not** appear in customer UI, analytics payloads, or public API responses.

### 5.1 `Supplier`

Represents an integrated distributor / provider.

| Field | Notes |
|-------|-------|
| `id` | Internal NETRO UUID |
| `code` | Stable internal code (`reloadly`, `likecard`, …) — never public |
| `displayName` | Internal ops name |
| `status` | `active` \| `paused` \| `disabled` |
| `capabilities` | `gift_card`, `direct_topup`, `account_validation`, webhooks, … |
| `priority` | Default routing priority |
| `health` | Derived from recent API success / latency |
| `credentialsRef` | Secret store reference — never in DB plaintext logs |
| `createdAt` / `updatedAt` | Audit |

### 5.2 `SupplierProduct`

Normalized projection of a distributor catalog item after sync. **Not** shown to customers.

| Field | Notes |
|-------|-------|
| `id` | Internal UUID |
| `supplierId` | FK → `Supplier` |
| `externalProductId` | Distributor’s product ID |
| `externalSku` | Distributor SKU / offer code |
| `kind` | `gift_card` \| `direct_topup` |
| `title` | Supplier-provided title (ops only) |
| `faceValue` / `currency` | Face / denomination where applicable |
| `cost` / `costCurrency` | Current distributor cost |
| `available` | Last known availability |
| `rawPayloadHash` | For sync change detection — raw payload stored encrypted/offline if needed |
| `lastSyncedAt` | |

Sync **updates** `SupplierProduct` only. It never overwrites NETRO `Product` marketing content or public prices unless an explicit pricing rule says so.

### 5.3 `SupplierProductMapping`

Links a NETRO sellable unit to one or more supplier products.

| Field | Notes |
|-------|-------|
| `id` | |
| `productId` | NETRO public product |
| `sellableUnitId` | Denomination ID or top-up package ID |
| `supplierProductId` | FK → `SupplierProduct` |
| `enabled` | |
| `priority` | Mapping-level priority override |
| `minBalanceRequired` | Optional prepaid floor |
| `maxDailyVolume` | Optional throttle |
| `createdAt` / `updatedAt` | |

### 5.4 `SupplierBalance`

Prepaid wallet / credit balance for a supplier.

| Field | Notes |
|-------|-------|
| `id` | |
| `supplierId` | |
| `currency` | |
| `available` | Spendable balance |
| `held` | Optional reserved amount |
| `lowBalanceThreshold` | Alert when `available` ≤ threshold |
| `asOf` | Snapshot time |
| `source` | `api_poll` \| `webhook` \| `manual` |

Low balance must influence routing and ops alerts. Balances are never returned to the customer app.

### 5.5 `SupplierQuote`

Backend quote from one supplier for a specific sellable unit, used during checkout pricing / routing.

| Field | Notes |
|-------|-------|
| `id` | |
| `supplierId` | |
| `supplierProductId` | |
| `sellableUnitId` | NETRO denomination / package |
| `cost` / `costCurrency` | |
| `available` | |
| `expiresAt` | Short-lived |
| `latencyMs` | Optional health signal |
| `idempotencyKey` | |
| `rawStatus` | Normalized: `ok` \| `unavailable` \| `error` — raw body not exposed publicly |

Multiple `SupplierQuote` records may feed one customer-facing `CheckoutQuote`.

### 5.6 `SupplierOrder`

Supplier-side fulfillment record created after payment capture (or equivalent).

| Field | Notes |
|-------|-------|
| `id` | Internal |
| `orderItemId` | NETRO order item |
| `supplierId` | |
| `supplierProductId` | |
| `externalOrderId` | Distributor order / transaction ID |
| `status` | `submitted` \| `accepted` \| `processing` \| `fulfilled` \| `failed` \| `unknown` \| `manual_review` |
| `idempotencyKey` | Required on create / retry |
| `costSnapshot` | Locked cost at submit time |
| `submittedAt` / `completedAt` | |
| `lastErrorCode` | Normalized NETRO error code — not raw supplier text in public APIs |

### 5.7 `FulfillmentAttempt`

One attempt to fulfill an order item through a chosen supplier. Timeouts create an attempt in `unknown` / `pending_confirmation`, **not** an automatic second supplier call.

| Field | Notes |
|-------|-------|
| `id` | |
| `orderItemId` | |
| `supplierOrderId?` | Set when a supplier order was created |
| `supplierId` | |
| `attemptNumber` | 1-based |
| `decisionId` | FK → `SupplierRoutingDecision` |
| `status` | `started` \| `succeeded` \| `failed` \| `timed_out` \| `cancelled` |
| `startedAt` / `finishedAt` | |
| `timeoutPolicy` | e.g. wait-for-webhook / poll-before-fallback |
| `errorCode?` | Normalized |

**Timeout rule:** if attempt `N` times out, the system must first **reconcile** with the same supplier (status poll / webhook) before starting attempt `N+1` on a different supplier.

### 5.8 `SupplierWebhookEvent`

Inbound webhook / callback envelope.

| Field | Notes |
|-------|-------|
| `id` | |
| `supplierId` | |
| `externalEventId` | Supplier event ID when present |
| `idempotencyKey` | Deduplicate processing |
| `receivedAt` | |
| `payloadRef` | Encrypted / restricted storage reference |
| `processingStatus` | `received` \| `processed` \| `ignored` \| `failed` |
| `relatedSupplierOrderId?` | |

### 5.9 `CatalogSyncRun`

A supplier catalog synchronization job.

| Field | Notes |
|-------|-------|
| `id` | |
| `supplierId` | |
| `startedAt` / `finishedAt` | |
| `status` | `running` \| `succeeded` \| `failed` \| `partial` |
| `productsSeen` / `productsUpserted` / `productsDisabled` | Counters |
| `errorSummary?` | Ops only |

Sync writes `SupplierProduct` rows. It does **not** mutate NETRO public titles, images, or customer-facing copy.

### 5.10 `PricingRule`

How NETRO turns supplier cost into customer sell price.

| Field | Notes |
|-------|-------|
| `id` | |
| `scope` | `global` \| `brand` \| `product` \| `sellable_unit` \| `supplier` |
| `scopeId?` | |
| `strategy` | `margin_percent` \| `margin_fixed` \| `fixed_price` \| `manual` |
| `value` | Percent / absolute depending on strategy |
| `currency` | |
| `priority` | Rule resolution order |
| `enabled` | |
| `validFrom` / `validTo` | Optional |

Customer quotes use **NETRO sell prices** after rules. Cost remains backend-only.

### 5.11 `SupplierRoutingDecision`

Auditable record of why a supplier was chosen for an item.

| Field | Notes |
|-------|-------|
| `id` | |
| `orderItemId` / `quoteId` | Context |
| `candidates` | List of evaluated supplier products with scored factors |
| `selectedSupplierId` | |
| `selectedSupplierProductId` | |
| `factors` | Structured scores: availability, cost, balance, health, priority, successRate |
| `rejected` | Reasons others were skipped (e.g. `low_balance`, `unhealthy`, `unavailable`) |
| `decidedAt` | |

## 6. Checkout & order domain (cross-cutting)

### 6.1 `CheckoutQuote` (customer-facing)

Short-lived server quote. Final payable totals **must** come from a quote, never from cart-only math.

Includes:

- Line items with trusted unit prices
- Discount, tax, fees, total
- `availabilityStatus`: `available` \| `price_changed` \| `product_unavailable` \| `expired`
- `expiresAt`

Internally, quote creation may gather multiple `SupplierQuote`s and apply `PricingRule`s + routing preview. Those internals are omitted from the public quote DTO.

### 6.2 Separate status machines

| Machine | Examples |
|---------|----------|
| `PaymentStatus` | `not_started`, `processing`, `authorized`, `captured`, `failed`, `cancelled`, `refunded`, `partially_refunded` |
| `FulfillmentStatus` | `not_started`, `queued`, `processing`, `fulfilled`, `partially_fulfilled`, `failed`, `manual_review` |
| `RefundStatus` | `none`, `requested`, `reviewing`, `approved`, `rejected`, `processing`, `completed` |

`OrderDisplayStatus` / checkout UI status is **derived** from the three machines. Payment success must never alone mean “order completed.”

### 6.3 Order item snapshots (backend)

At fulfillment time (and preferably at quote lock), each order item stores an immutable snapshot for reconciliation and profit:

| Snapshot field | Purpose |
|----------------|---------|
| `productId` / `sellableUnitId` | NETRO catalog identity |
| `customerUnitPrice` / `currency` | What the customer paid |
| `supplierId` / `supplierProductId` | Who fulfilled (backend only) |
| `supplierCost` / `costCurrency` | Cost basis |
| `fxRate?` | If cost currency ≠ payment currency |
| `routingDecisionId` | Traceability |
| `supplierOrderId?` | Link to `SupplierOrder` |

Public order APIs return customer-safe item fields only (title, quantity, unit price, fulfillment status, redacted code state). Snapshots stay internal.

### 6.4 Gift-card codes

- Stored encrypted at rest
- Never in logs, analytics, or `localStorage`
- Revealed only via authenticated backend action (reauth / step-up)
- Frontend receives the plaintext code only in that controlled response and renders it LTR

### 6.5 Direct top-ups

- Customer submits **normalized** NETRO field values (`player_id`, `server_id`, …)
- Adapters map those values into supplier-specific payloads
- Wrong Player ID cases remain non-refundable per policy; support reasons stay customer-safe

## 7. Supplier adapter interface (normalized)

Every distributor is integrated behind one adapter contract. Conceptual operations:

| Operation | Responsibility |
|-----------|----------------|
| `syncCatalog` | Pull / normalize products → `SupplierProduct` + `CatalogSyncRun` |
| `getBalance` | Refresh `SupplierBalance` |
| `quote` | Return `SupplierQuote` for a mapped SKU |
| `validateAccount?` | Optional account lookup for top-ups |
| `createOrder` | Idempotent fulfillment create → `SupplierOrder` |
| `getOrder` | Poll / reconcile status |
| `parseWebhook` | Normalize callbacks → `SupplierWebhookEvent` |
| `mapError` | Map raw errors → NETRO error codes |

Adapters may retain supplier-specific DTOs **inside** the adapter module only.

## 8. Critical flows

### 8.1 Catalog sync

```text
Scheduler / admin
  → CatalogSyncRun(running)
  → Adapter.syncCatalog
  → Upsert SupplierProduct
  → Do NOT overwrite NETRO Product marketing fields
  → CatalogSyncRun(succeeded|partial|failed)
```

Operators create/update `SupplierProductMapping` and `PricingRule` separately.

### 8.2 Checkout quote

```text
Cart lines
  → Resolve mappings
  → Collect SupplierQuote(s) (parallel, short TTL)
  → Apply PricingRule + availability
  → Persist CheckoutQuote (customer DTO without supplier internals)
  → Client must re-quote on expiry / price_changed / unavailable
```

### 8.3 Pay then fulfill

```text
CheckoutQuote (available, not expired)
  → Payment authorize/capture
  → PaymentStatus = captured  (customer may see payment_confirmed)
  → Enqueue fulfillment (FulfillmentStatus = queued)
  → SupplierRoutingDecision
  → FulfillmentAttempt #1 + SupplierOrder (idempotent key)
  → Success → fulfill item / deliver code
  → Timeout → reconcile SAME supplier first (poll/webhook)
  → Only after confirmed failure / safe cancel → optional next supplier
```

### 8.4 Webhook / callback

```text
Supplier HTTP callback
  → Persist SupplierWebhookEvent (idempotent)
  → Match SupplierOrder
  → Update attempt + item fulfillment
  → Never expose raw payload to customers
```

## 9. What the frontend may know

Allowed:

- NETRO product / brand / category / region
- Checkout quotes and availability statuses
- Payment / fulfillment / refund / display statuses
- Redacted order details and controlled code reveal
- Customer-safe operational screens (“temporarily unavailable”)

Forbidden:

- Supplier / distributor names as commercial identity
- Supplier product IDs, SKUs, costs, balances
- Raw supplier errors or webhook bodies
- Direct calls to distributor APIs

## 10. Compatibility note

Frontend Phase 1–10 models (`Product`, `CheckoutQuote`, `PaymentStatus`, `FulfillmentStatus`, repositories) should continue to evolve toward this document without introducing supplier fields into customer DTOs. Backend-only models (`Supplier*`, routing, sync, snapshots) are implemented server-side when the NETRO API is built.
