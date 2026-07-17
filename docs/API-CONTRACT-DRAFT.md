# NETRO API Contract Draft

> Draft contract between:
> 1. **Customer frontend ↔ NETRO backend** (public)
> 2. **NETRO backend ↔ supplier adapters** (internal)
>
> No real distributor HTTP calls are implemented yet. This document freezes the intended shapes so the mock frontend and future backend stay aligned.

## 1. Design rules

| Rule | Implication |
|------|-------------|
| Frontend talks only to NETRO | No Reloadly / LikeCard / GamesDrop / WUPEX URLs or keys in the app |
| Public DTOs are customer-safe | No supplier IDs, costs, SKUs, balances, raw errors |
| Quotes are authoritative | Checkout totals come from `CheckoutQuote` |
| Payment ≠ fulfillment | Separate status fields and endpoints |
| Idempotency everywhere | `Idempotency-Key` on pay, fulfill, refund, webhook ingest |
| Codes are sensitive | Reveal requires authenticated step-up; never list plaintext codes in order list |

Conventions:

- JSON over HTTPS
- Timestamps: ISO-8601 UTC
- Money: decimal numbers + ISO currency codes
- Errors: `{ "code": "PRICE_CHANGED", "message": "…", "details"?: {} }` with **normalized** codes
- Locales: `en` \| `ar` where copy is returned

## 2. Public API — Catalog

### `GET /v1/catalog/products`

Query: `category`, `brand`, `kind`, `region`, `q`, cursor pagination.

Response item (gift card example):

```json
{
  "id": "prod_psn_100",
  "kind": "gift_card",
  "brandId": "brand_playstation",
  "categoryId": "cat_gift_cards",
  "title": { "en": "PlayStation Store", "ar": "…" },
  "fromPrice": 105,
  "displayCurrency": "SAR",
  "inStock": true,
  "region": { "code": "KSA", "label": { "en": "Saudi Arabia", "ar": "…" } },
  "denominations": [
    { "id": "den_100", "faceValue": 100, "price": 105, "inStock": true }
  ]
}
```

**Omitted forever:** supplier product IDs, cost, margin, balance, adapter names.

### `GET /v1/catalog/products/{productId}`

Full product including `requiredFields` for `direct_topup` (normalized NETRO field schema).

### `POST /v1/catalog/products/{productId}/validate-account`

Optional account validation for top-ups.

Request:

```json
{
  "packageId": "pkg_uc_60",
  "fields": { "player_id": "5123456789", "server_id": "…" }
}
```

Response:

```json
{
  "status": "valid" | "invalid" | "unavailable",
  "displayName": "Player***",
  "warnings": []
}
```

Backend may call a supplier adapter internally. Failures return NETRO statuses only.

## 3. Public API — Checkout quotes

### `POST /v1/checkout/quotes`

Creates a short-lived quote. Server validates availability and sell price (using internal supplier quotes + pricing rules).

Request:

```json
{
  "currency": "SAR",
  "country": "SA",
  "items": [
    {
      "productId": "prod_psn_100",
      "sellableUnitId": "den_100",
      "quantity": 1,
      "clientUnitPrice": 105
    }
  ],
  "promoCode": null
}
```

Response:

```json
{
  "id": "quote_…",
  "createdAt": "…",
  "expiresAt": "…",
  "availabilityStatus": "available",
  "currency": "SAR",
  "paymentCurrency": "SAR",
  "displayCurrency": "SAR",
  "subtotal": 105,
  "discount": 0,
  "tax": 0,
  "fees": 0,
  "total": 105,
  "items": [
    {
      "productId": "prod_psn_100",
      "sku": "den_100",
      "title": { "en": "…", "ar": "…" },
      "quantity": 1,
      "unitPrice": 105,
      "totalPrice": 105,
      "available": true
    }
  ],
  "warnings": []
}
```

`availabilityStatus`:

- `available`
- `price_changed`
- `product_unavailable`
- `expired`

### `POST /v1/checkout/quotes/{quoteId}/refresh`

Reprices / rechecks stock. Same response shape.

**Not returned:** which supplier would fulfill, cost, or routing decision IDs.

## 4. Public API — Orders & payment

### `POST /v1/orders`

Headers: `Idempotency-Key: …`

```json
{
  "quoteId": "quote_…",
  "paymentMethod": "mada"
}
```

Creates an order bound to the quote. Payment may be started in the same call or via a follow-up payment intent endpoint (implementation choice). Initial statuses:

```json
{
  "id": "NTR-…",
  "quoteId": "quote_…",
  "paymentStatus": "processing",
  "fulfillmentStatus": "not_started",
  "refundStatus": "none",
  "displayStatus": "payment_processing",
  "total": 105,
  "paymentCurrency": "SAR",
  "items": [/* customer-safe */]
}
```

### Payment webhooks / confirmations (NETRO ← PSP)

Update `paymentStatus` only. On `captured` / equivalent:

- Set `displayStatus` toward `payment_confirmed` / `fulfillment_processing`
- Enqueue fulfillment workers
- **Do not** mark the order fulfilled

### `GET /v1/orders` / `GET /v1/orders/{id}`

Customer-safe order DTOs. Codes appear as:

```json
{ "code": { "state": "available" } }
```

or omitted until reveal. Never include supplier snapshot fields.

### `POST /v1/orders/{id}/items/{itemId}/reveal-code`

Requires fresh reauthentication token / step-up.

Response:

```json
{
  "value": "AAAA-BBBB-CCCC-DDDD",
  "revealedAt": "…"
}
```

Audit this access. Rate-limit and encrypt at rest.

## 5. Public API — Auth, support, operational

Existing frontend contracts remain:

- Phone OTP primary auth; email secondary; optional password
- Sessions / revoke / delete account
- Support ticket create with reasons such as `code_not_working`, `topup_not_received`, …
- Support submissions may include **internal metadata placeholders** prepared by the client (`appVersion`, `devicePlatform`) but **must not** include supplier names or raw upstream payloads
- Operational status endpoints / screens use customer-safe copy (`service temporarily unavailable`), never distributor branding

## 6. Public error codes (normalized)

| Code | Typical meaning |
|------|-----------------|
| `VALIDATION` | Bad input |
| `UNAUTHORIZED` / `FORBIDDEN` | Auth |
| `NOT_FOUND` | Missing entity |
| `QUOTE_EXPIRED` | Re-quote required |
| `PRICE_CHANGED` | Sell price drifted |
| `PRODUCT_UNAVAILABLE` | Cannot sell now |
| `PAYMENT_FAILED` | PSP failure |
| `FULFILLMENT_PENDING` | Waiting on delivery |
| `FULFILLMENT_FAILED` | Delivery failed after safe confirmation |
| `RATE_LIMITED` | Too many attempts |
| `SERVICE_UNAVAILABLE` | Temporary outage (no supplier name) |

Raw distributor messages are logged internally and mapped via adapters.

## 7. Internal API — Supplier adapter contract

Implemented as an in-process interface (preferred) or private service. **Not** callable from the customer app.

```ts
interface SupplierAdapter {
  readonly supplierCode: string;

  syncCatalog(runId: string): Promise<CatalogSyncResult>;
  getBalance(): Promise<SupplierBalanceSnapshot>;

  quote(input: AdapterQuoteInput): Promise<AdapterQuoteResult>;
  validateAccount?(input: AdapterValidateInput): Promise<AdapterValidateResult>;

  createOrder(input: AdapterCreateOrderInput): Promise<AdapterOrderResult>;
  getOrder(input: { externalOrderId: string; idempotencyKey: string }): Promise<AdapterOrderResult>;

  parseWebhook(headers: Record<string, string>, rawBody: string): Promise<ParsedWebhook>;
  mapError(error: unknown): NormalizedSupplierError;
}
```

### 7.1 Idempotency

| Call | Key |
|------|-----|
| `createOrder` | Stable key derived from `orderItemId` + `attemptNumber` (or NETRO-generated UUID stored before the call) |
| Webhook ingest | `supplierId + externalEventId` or body hash |
| Balance / sync | Run IDs for observability; safe to retry |

Retries of `createOrder` with the **same** idempotency key must return the same supplier order outcome, not create duplicates.

### 7.2 Timeout policy

```text
createOrder started
  → timeout waiting for HTTP response
  → FulfillmentAttempt.status = timed_out
  → MUST call getOrder / wait for webhook for SAME supplier
  → if fulfilled: commit success
  → if confirmed failed / cancelled: may route to next supplier
  → if still unknown: manual_review — do NOT dual-fulfill
```

### 7.3 Adapter quote input (internal)

```json
{
  "supplierProductId": "…",
  "quantity": 1,
  "regionCode": "KSA",
  "idempotencyKey": "…"
}
```

### 7.4 Adapter create order input (internal)

Gift card:

```json
{
  "idempotencyKey": "fulfill:item_…:attempt:1",
  "supplierProductId": "…",
  "quantity": 1
}
```

Direct top-up — **normalized fields in, supplier payload out inside adapter**:

```json
{
  "idempotencyKey": "fulfill:item_…:attempt:1",
  "supplierProductId": "…",
  "fields": {
    "player_id": "5123456789",
    "server_id": "1450"
  }
}
```

## 8. Internal services (backend modules)

| Module | Owns |
|--------|------|
| Catalog service | NETRO `Product`, mappings (admin write) |
| Sync worker | `CatalogSyncRun`, `SupplierProduct` upserts |
| Pricing service | `PricingRule` evaluation |
| Quote service | Customer `CheckoutQuote` + internal `SupplierQuote` gathering |
| Routing service | `SupplierRoutingDecision` |
| Payment service | PSP + `PaymentStatus` |
| Fulfillment worker | `FulfillmentAttempt`, `SupplierOrder`, code encryption |
| Balance monitor | `SupplierBalance` polls / alerts |
| Webhook ingress | `SupplierWebhookEvent` idempotent processing |
| Reconciliation | Snapshots, profit, mismatch detection |

## 9. Admin / ops APIs (non-customer)

Separate authZ. May expose supplier names, costs, balances, raw error summaries, routing decisions, and sync runs to operators. Never share these routes with the mobile/PWA client.

Examples:

- `GET /admin/suppliers`
- `GET /admin/suppliers/{id}/balance`
- `POST /admin/suppliers/{id}/sync`
- `PUT /admin/mappings/{id}`
- `GET /admin/orders/{id}/fulfillment-trace`

## 10. Eventing (suggested)

Internal events (queue / bus):

- `quote.created`
- `payment.captured`
- `fulfillment.attempt_started`
- `fulfillment.succeeded`
- `fulfillment.timed_out`
- `fulfillment.failed_confirmed`
- `supplier.balance_low`
- `catalog.sync_completed`

Customers subscribe only to sanitized push/email notifications (“Your code is ready”), never to supplier events.

## 11. Security checklist for API responses

Before any public response leaves the edge:

- [ ] Strip `supplierId`, `supplierProductId`, `externalSku`, `cost*`, `balance*`
- [ ] Strip raw adapter payloads and webhook bodies
- [ ] Encrypt / omit gift-card plaintext except reveal endpoint
- [ ] Avoid logging Player IDs, emails, phones, PANs, full codes
- [ ] Ensure error `message` is localized customer-safe text

## 12. Mock frontend mapping

Until the real API exists, `src/data-access` repositories emulate the **public** surface only:

| Repository | Mirrors |
|------------|---------|
| `ProductRepository` | Catalog section |
| `OrderRepository` | Quotes + orders + reveal + poll fulfillment |
| `AuthRepository` | Auth section |
| `SupportRepository` | Support tickets |
| `UserRepository` | Profile / store credit |

Mocks must not invent public fields that leak supplier concepts. When the backend ships, swap repository implementations without rewriting route components.
