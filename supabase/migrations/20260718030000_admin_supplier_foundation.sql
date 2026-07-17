-- Admin + supplier foundation
-- NETRO owns catalog; suppliers fulfill. No customer RLS on supplier/admin tables.

-- ---------------------------------------------------------------------------
-- Profiles: account status for admin user management
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists account_status text not null default 'active'
    check (account_status in ('active', 'suspended', 'banned'));

-- ---------------------------------------------------------------------------
-- Catalog admin fields on products / categories / brands / variants
-- ---------------------------------------------------------------------------
alter table public.products
  add column if not exists is_visible boolean not null default true,
  add column if not exists is_featured boolean not null default false,
  add column if not exists is_archived boolean not null default false,
  add column if not exists sort_order int not null default 0,
  add column if not exists image_path text,
  add column if not exists seo_title_en text,
  add column if not exists seo_title_ar text,
  add column if not exists seo_description_en text,
  add column if not exists seo_description_ar text;

alter table public.categories
  add column if not exists image_path text,
  add column if not exists is_hidden boolean not null default false;

alter table public.brands
  add column if not exists image_path text,
  add column if not exists is_hidden boolean not null default false;

alter table public.denominations
  add column if not exists sort_order int not null default 0,
  add column if not exists is_active boolean not null default true,
  add column if not exists label_en text,
  add column if not exists label_ar text;

alter table public.topup_packages
  add column if not exists sort_order int not null default 0,
  add column if not exists is_active boolean not null default true;

-- ---------------------------------------------------------------------------
-- Suppliers (enriched)
-- ---------------------------------------------------------------------------
alter table public.suppliers
  add column if not exists priority int not null default 100,
  add column if not exists is_active boolean not null default true,
  add column if not exists adapter_code text not null default 'stub',
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists credentials_secret_id text,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists suppliers_active_priority_idx
  on public.suppliers (is_active, priority);

-- ---------------------------------------------------------------------------
-- Supplier products (supplier-side offer catalog)
-- ---------------------------------------------------------------------------
create table if not exists public.supplier_products (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  supplier_product_id text not null,
  supplier_sku text,
  supplier_cost numeric(12,2),
  currency text not null default 'SAR',
  country text,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (supplier_id, supplier_product_id)
);

create index if not exists supplier_products_supplier_idx
  on public.supplier_products (supplier_id, is_active);

alter table public.supplier_products enable row level security;

-- ---------------------------------------------------------------------------
-- Supplier product mappings (NETRO sku -> supplier offer)
-- ---------------------------------------------------------------------------
alter table public.supplier_product_mappings
  add column if not exists supplier_product_row_id uuid references public.supplier_products (id) on delete set null,
  add column if not exists supplier_sku text,
  add column if not exists supplier_cost numeric(12,2),
  add column if not exists currency text not null default 'SAR',
  add column if not exists country text,
  add column if not exists priority int not null default 100,
  add column if not exists is_active boolean not null default true,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- Backfill supplier_sku from legacy supplier_product_ref when empty
update public.supplier_product_mappings
set supplier_sku = coalesce(supplier_sku, supplier_product_ref)
where supplier_sku is null;

create index if not exists supplier_mappings_sku_priority_idx
  on public.supplier_product_mappings (product_id, sku, is_active, priority);

-- ---------------------------------------------------------------------------
-- Fulfillment attempts (enriched logging)
-- ---------------------------------------------------------------------------
alter table public.fulfillment_attempts
  add column if not exists supplier_id uuid references public.suppliers (id) on delete set null,
  add column if not exists supplier_product_ref text,
  add column if not exists attempt_number int not null default 1,
  add column if not exists request_id text,
  add column if not exists safe_request jsonb not null default '{}'::jsonb,
  add column if not exists safe_response jsonb not null default '{}'::jsonb,
  add column if not exists error_code text,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists fulfillment_attempts_order_idx
  on public.fulfillment_attempts (order_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Generic supplier webhook inbox
-- ---------------------------------------------------------------------------
create table if not exists public.supplier_webhook_events (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references public.suppliers (id) on delete set null,
  event_type text not null,
  provider_event_id text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'received'
    check (status in ('received', 'processing', 'processed', 'ignored', 'failed')),
  error_message text,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists supplier_webhook_events_idempotency_idx
  on public.supplier_webhook_events (supplier_id, provider_event_id)
  where supplier_id is not null and provider_event_id is not null;

alter table public.supplier_webhook_events enable row level security;

-- ---------------------------------------------------------------------------
-- RBAC
-- ---------------------------------------------------------------------------
create table if not exists public.admin_roles (
  id text primary key,
  name_en text not null,
  name_ar text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_role_permissions (
  role_id text not null references public.admin_roles (id) on delete cascade,
  permission text not null,
  primary key (role_id, permission)
);

create table if not exists public.admin_user_roles (
  user_id uuid not null references public.profiles (id) on delete cascade,
  role_id text not null references public.admin_roles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, role_id)
);

alter table public.admin_roles enable row level security;
alter table public.admin_role_permissions enable row level security;
alter table public.admin_user_roles enable row level security;

insert into public.admin_roles (id, name_en, name_ar, description) values
  ('super_admin', 'Super Admin', 'مدير عام', 'Full access'),
  ('admin', 'Admin', 'مدير', 'Most operations except role grants'),
  ('support', 'Support', 'دعم', 'Tickets and user lookups'),
  ('content_manager', 'Content Manager', 'مدير محتوى', 'Catalog and content'),
  ('operations', 'Operations', 'عمليات', 'Orders and fulfillment review')
on conflict (id) do nothing;

-- Permission catalog (granular)
insert into public.admin_role_permissions (role_id, permission)
select r.id, p.permission
from (
  values
    ('dashboard.read'),
    ('catalog.read'), ('catalog.write'),
    ('suppliers.read'), ('suppliers.write'),
    ('orders.read'), ('orders.write'),
    ('users.read'), ('users.write'),
    ('support.read'), ('support.write'),
    ('notifications.write'),
    ('settings.read'), ('settings.write'),
    ('audit.read'),
    ('roles.read'), ('roles.write')
) as p(permission)
cross join public.admin_roles r
where r.id = 'super_admin'
on conflict do nothing;

insert into public.admin_role_permissions (role_id, permission)
select 'admin', permission from (values
  ('dashboard.read'),
  ('catalog.read'), ('catalog.write'),
  ('suppliers.read'), ('suppliers.write'),
  ('orders.read'), ('orders.write'),
  ('users.read'), ('users.write'),
  ('support.read'), ('support.write'),
  ('notifications.write'),
  ('settings.read'), ('settings.write'),
  ('audit.read'),
  ('roles.read')
) as v(permission)
on conflict do nothing;

insert into public.admin_role_permissions (role_id, permission)
select 'support', permission from (values
  ('dashboard.read'),
  ('orders.read'),
  ('users.read'),
  ('support.read'), ('support.write'),
  ('audit.read')
) as v(permission)
on conflict do nothing;

insert into public.admin_role_permissions (role_id, permission)
select 'content_manager', permission from (values
  ('dashboard.read'),
  ('catalog.read'), ('catalog.write'),
  ('notifications.write'),
  ('audit.read')
) as v(permission)
on conflict do nothing;

insert into public.admin_role_permissions (role_id, permission)
select 'operations', permission from (values
  ('dashboard.read'),
  ('orders.read'), ('orders.write'),
  ('suppliers.read'),
  ('users.read'),
  ('audit.read')
) as v(permission)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- App settings (feature flags / ops config)
-- ---------------------------------------------------------------------------
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

alter table public.app_settings enable row level security;

insert into public.app_settings (key, value) values
  ('maintenance_mode', 'false'::jsonb),
  ('registration_enabled', 'true'::jsonb),
  ('purchasing_enabled', 'false'::jsonb),
  ('external_payments_enabled', 'false'::jsonb),
  ('gift_card_purchase_enabled', 'false'::jsonb),
  ('direct_game_topup_enabled', 'false'::jsonb),
  ('default_currency', '"SAR"'::jsonb),
  ('supported_locales', '["en","ar"]'::jsonb),
  ('support_email', '""'::jsonb),
  ('support_phone', '""'::jsonb),
  ('privacy_policy_url', '""'::jsonb),
  ('terms_url', '""'::jsonb),
  ('feature_flags', '{}'::jsonb)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Support ticket messages
-- ---------------------------------------------------------------------------
create table if not exists public.support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  author_role text not null default 'customer'
    check (author_role in ('customer', 'admin', 'system')),
  body text not null,
  attachment_path text,
  created_at timestamptz not null default now()
);

create index if not exists support_ticket_messages_ticket_idx
  on public.support_ticket_messages (ticket_id, created_at);

alter table public.support_tickets
  add column if not exists assigned_to uuid references public.profiles (id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

alter table public.support_ticket_messages enable row level security;

-- Customers can read/insert messages on their own tickets
create policy support_ticket_messages_select_own on public.support_ticket_messages
  for select using (
    exists (
      select 1 from public.support_tickets t
      where t.id = ticket_id and t.user_id = auth.uid()
    )
  );

create policy support_ticket_messages_insert_own on public.support_ticket_messages
  for insert with check (
    author_role = 'customer'
    and author_id = auth.uid()
    and exists (
      select 1 from public.support_tickets t
      where t.id = ticket_id and t.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Audit indexes
-- ---------------------------------------------------------------------------
create index if not exists audit_logs_entity_idx
  on public.audit_logs (entity_type, entity_id);

create index if not exists audit_logs_user_created_idx
  on public.audit_logs (user_id, created_at desc);

create index if not exists audit_logs_action_created_idx
  on public.audit_logs (action, created_at desc);

-- ---------------------------------------------------------------------------
-- Admin product variants view (denominations ∪ packages)
-- ---------------------------------------------------------------------------
create or replace view public.admin_product_variants as
select
  d.id as sku,
  d.product_id,
  'gift_card'::public.product_kind as product_kind,
  'denomination'::text as variant_kind,
  coalesce(d.label_en, d.face_value::text) as label_en,
  coalesce(d.label_ar, d.face_value::text) as label_ar,
  d.face_value as amount,
  d.price,
  d.in_stock,
  d.is_active,
  d.sort_order
from public.denominations d
union all
select
  p.id as sku,
  p.product_id,
  'direct_topup'::public.product_kind as product_kind,
  'package'::text as variant_kind,
  p.label as label_en,
  p.label as label_ar,
  p.amount,
  p.price,
  p.in_stock,
  p.is_active,
  p.sort_order
from public.topup_packages p;

-- ---------------------------------------------------------------------------
-- Seed placeholder suppliers (inactive; architecture only)
-- ---------------------------------------------------------------------------
insert into public.suppliers (code, name, adapter_code, priority, is_active, metadata)
values
  ('reloadly', 'Reloadly', 'reloadly', 10, false, '{"note":"placeholder adapter"}'::jsonb),
  ('likecard', 'LikeCard', 'likecard', 20, false, '{"note":"placeholder adapter"}'::jsonb),
  ('gamesdrop', 'GamesDrop', 'gamesdrop', 30, false, '{"note":"placeholder adapter"}'::jsonb)
on conflict (code) do nothing;

-- Catalog images bucket (admin uploads via signed URL from Edge)
insert into storage.buckets (id, name, public)
values ('catalog-images', 'catalog-images', true)
on conflict (id) do nothing;
