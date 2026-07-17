# NETRO Admin Panel

Separate Vite React SPA in [`admin/`](../admin/). The customer PWA stays at the repo root (Lovable).

## Run locally

```bash
cp admin/.env.example admin/.env
# set VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY

npm --prefix admin install
npm run admin:dev
```

Open http://localhost:5174

## Access control

1. Sign in with Supabase Auth (same project as the customer app).
2. Grant access by either:
   - `profiles.is_admin = true` (Super Admin shortcut), or
   - rows in `admin_user_roles` + permissions in `admin_role_permissions`.

## API

All admin mutations go through Edge Function `admin-api`:

```json
{ "resource": "catalog", "action": "listProducts", "payload": {} }
```

Resources: `me`, `dashboard`, `catalog`, `suppliers`, `orders`, `users`, `support`, `notifications`, `settings`, `audit`, `roles`.

Supplier credentials are never returned to the Admin UI — only a `credentialsConfigured` flag. Set `credentials_secret_id` to a Vault/Edge secret name.

## Supplier adapters

Placeholder adapters live in `supabase/functions/_shared/suppliers/`:

- `reloadly`, `likecard`, `gamesdrop`, `stub`

No real HTTP calls. Future fulfillment selects mappings by priority and calls `getSupplierAdapter(adapter_code)`.

Webhook inbox: Edge Function `supplier-webhook` writes `supplier_webhook_events`.

## Variants

Sellable SKUs remain `denominations.id` and `topup_packages.id`. Admin presents them as variants and maps suppliers on `(product_id, sku)`.
