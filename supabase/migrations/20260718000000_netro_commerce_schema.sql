-- NETRO commerce schema for Supabase
-- RLS on every table. Financial/fulfillment writes are service-role / Edge only.

create extension if not exists "pgcrypto";

-- Enums
create type public.product_kind as enum ('gift_card', 'direct_topup');
create type public.payment_status as enum (
  'pending_payment',
  'payment_processing',
  'paid',
  'failed',
  'cancelled',
  'refunded'
);
create type public.fulfillment_status as enum (
  'not_started',
  'fulfillment_pending',
  'processing',
  'fulfilled',
  'partially_fulfilled',
  'failed',
  'manual_review'
);
create type public.refund_status as enum (
  'none',
  'requested',
  'reviewing',
  'approved',
  'rejected',
  'processing',
  'completed'
);
create type public.quote_availability as enum (
  'available',
  'price_changed',
  'product_unavailable',
  'expired'
);
create type public.notification_type as enum ('order', 'promo', 'security', 'support');
create type public.support_ticket_status as enum (
  'open',
  'waiting_for_customer',
  'in_progress',
  'resolved',
  'closed'
);

-- Profiles (1:1 auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  email text,
  phone text,
  country_code text not null default 'SA',
  preferred_currency text not null default 'SAR',
  preferred_locale text not null default 'en' check (preferred_locale in ('en', 'ar')),
  avatar_path text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.device_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  device text not null default 'Unknown',
  location text not null default '',
  last_active timestamptz not null default now(),
  refresh_jti text,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.reauth_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

-- Catalog
create table public.categories (
  id text primary key,
  name_en text not null,
  name_ar text not null,
  slug text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.brands (
  id text primary key,
  name_en text not null,
  name_ar text not null,
  slug text not null unique,
  color text not null default '#111111',
  created_at timestamptz not null default now()
);

create table public.products (
  id text primary key,
  kind public.product_kind not null,
  brand_id text not null references public.brands (id),
  category_id text not null references public.categories (id),
  title_en text not null,
  title_ar text not null,
  subtitle_en text,
  subtitle_ar text,
  description_en text not null default '',
  description_ar text not null default '',
  color text not null default '#111111',
  rating numeric(3,2) not null default 0,
  reviews_count int not null default 0,
  in_stock boolean not null default true,
  tags text[] not null default '{}',
  from_price numeric(12,2) not null default 0,
  compare_at numeric(12,2),
  display_currency text not null default 'SAR',
  region_code text not null default 'GLOBAL',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_idx on public.products (category_id);
create index products_brand_idx on public.products (brand_id);
create index products_kind_idx on public.products (kind);

create table public.denominations (
  id text primary key,
  product_id text not null references public.products (id) on delete cascade,
  face_value numeric(12,2) not null,
  price numeric(12,2) not null,
  in_stock boolean not null default true
);

create table public.topup_packages (
  id text primary key,
  product_id text not null references public.products (id) on delete cascade,
  label text not null,
  amount numeric(12,2) not null,
  price numeric(12,2) not null,
  in_stock boolean not null default true,
  bonus_en text,
  bonus_ar text
);

create table public.product_required_fields (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products (id) on delete cascade,
  field_key text not null,
  field_schema jsonb not null default '{}'::jsonb,
  unique (product_id, field_key)
);

-- Suppliers (service-role only — never exposed via anon RLS)
create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.supplier_product_mappings (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products (id) on delete cascade,
  sku text not null,
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  supplier_product_ref text not null,
  unique (product_id, sku, supplier_id)
);

-- Quotes / orders
create table public.checkout_quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  country text not null,
  payment_currency text not null,
  display_currency text not null,
  region_code text not null default 'GLOBAL',
  promo_code text,
  availability_status public.quote_availability not null default 'available',
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  fees numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  warnings jsonb not null default '[]'::jsonb,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.checkout_quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.checkout_quotes (id) on delete cascade,
  product_id text not null references public.products (id),
  sku text not null,
  title_en text not null,
  title_ar text not null,
  quantity int not null check (quantity > 0),
  unit_price numeric(12,2) not null,
  client_unit_price numeric(12,2),
  total_price numeric(12,2) not null,
  currency text not null,
  region_code text not null,
  region_label_en text not null default '',
  region_label_ar text not null default '',
  redemption_currency text,
  available boolean not null default true,
  fulfillment_fields jsonb not null default '{}'::jsonb
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete restrict,
  quote_id uuid references public.checkout_quotes (id) on delete set null,
  payment_status public.payment_status not null default 'pending_payment',
  fulfillment_status public.fulfillment_status not null default 'not_started',
  refund_status public.refund_status not null default 'none',
  payment_method text,
  payment_currency text not null,
  display_currency text not null,
  country text not null,
  subtotal numeric(12,2) not null,
  discount numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  fees numeric(12,2) not null default 0,
  total numeric(12,2) not null,
  idempotency_key text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_user_created_idx on public.orders (user_id, created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  item_index int not null,
  product_id text not null references public.products (id),
  kind public.product_kind not null,
  sku text not null,
  title_en text not null,
  title_ar text not null,
  quantity int not null,
  unit_price numeric(12,2) not null,
  total_price numeric(12,2) not null,
  currency text not null,
  fulfillment_fields jsonb not null default '{}'::jsonb,
  unique (order_id, item_index)
);

create table public.order_status_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  payment_status public.payment_status,
  fulfillment_status public.fulfillment_status,
  refund_status public.refund_status,
  note text,
  actor text not null default 'system',
  created_at timestamptz not null default now()
);

create table public.payment_sessions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  provider text not null default 'stub',
  provider_ref text,
  status public.payment_status not null default 'pending_payment',
  amount numeric(12,2) not null,
  currency text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_session_id uuid not null references public.payment_sessions (id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  status public.refund_status not null default 'requested',
  amount numeric(12,2) not null,
  currency text not null,
  reason text,
  created_at timestamptz not null default now()
);

create table public.fulfillment_attempts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  order_item_id uuid not null references public.order_items (id) on delete cascade,
  status public.fulfillment_status not null default 'fulfillment_pending',
  provider text not null default 'stub',
  provider_ref text,
  error_message text,
  created_at timestamptz not null default now()
);

-- Codes never selectable by anon/authenticated RLS
create table public.digital_codes (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references public.order_items (id) on delete cascade,
  code_ciphertext text not null,
  revealed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.idempotency_keys (
  key text primary key,
  user_id uuid references public.profiles (id) on delete set null,
  scope text not null,
  response jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.store_credits (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  balance numeric(12,2) not null default 0,
  currency text not null default 'SAR',
  updated_at timestamptz not null default now()
);

create table public.store_credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(12,2) not null,
  currency text not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create table public.promotions (
  id text primary key,
  code text not null unique,
  title_en text not null,
  title_ar text not null,
  expires_label_en text not null default '',
  expires_label_ar text not null default '',
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title_en text not null,
  title_ar text not null,
  body_en text not null,
  body_ar text not null,
  type public.notification_type not null default 'order',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_unread_idx on public.notifications (user_id, read, created_at desc);

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null,
  order_id uuid references public.orders (id) on delete set null,
  order_item_id uuid,
  description text not null,
  attachment jsonb,
  preferred_contact_method text not null default 'email',
  internal_metadata jsonb not null default '{}'::jsonb,
  status public.support_ticket_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Profile bootstrap on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(coalesce(new.email, new.phone, 'user'), '@', 1)),
    new.email,
    new.phone
  )
  on conflict (id) do nothing;
  insert into public.store_credits (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.device_sessions enable row level security;
alter table public.reauth_tokens enable row level security;
alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.denominations enable row level security;
alter table public.topup_packages enable row level security;
alter table public.product_required_fields enable row level security;
alter table public.suppliers enable row level security;
alter table public.supplier_product_mappings enable row level security;
alter table public.checkout_quotes enable row level security;
alter table public.checkout_quote_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_events enable row level security;
alter table public.payment_sessions enable row level security;
alter table public.payment_events enable row level security;
alter table public.refunds enable row level security;
alter table public.fulfillment_attempts enable row level security;
alter table public.digital_codes enable row level security;
alter table public.idempotency_keys enable row level security;
alter table public.audit_logs enable row level security;
alter table public.store_credits enable row level security;
alter table public.store_credit_transactions enable row level security;
alter table public.promotions enable row level security;
alter table public.notifications enable row level security;
alter table public.support_tickets enable row level security;

-- Catalog public read
create policy categories_select on public.categories for select using (true);
create policy brands_select on public.brands for select using (true);
create policy products_select on public.products for select using (true);
create policy denominations_select on public.denominations for select using (true);
create policy topup_packages_select on public.topup_packages for select using (true);
create policy product_required_fields_select on public.product_required_fields for select using (true);
create policy promotions_select on public.promotions for select using (active = true);

-- Profiles
create policy profiles_select_own on public.profiles for select using (auth.uid() = id);
create policy profiles_update_own on public.profiles for update using (auth.uid() = id)
  with check (auth.uid() = id and is_admin = (select p.is_admin from public.profiles p where p.id = auth.uid()));

-- Device sessions
create policy device_sessions_select_own on public.device_sessions for select using (auth.uid() = user_id);
create policy device_sessions_update_own on public.device_sessions for update using (auth.uid() = user_id);

-- Quotes / orders: read own only (writes via service role)
create policy quotes_select_own on public.checkout_quotes for select
  using (auth.uid() = user_id);
create policy quote_items_select on public.checkout_quote_items for select
  using (
    exists (
      select 1 from public.checkout_quotes q
      where q.id = quote_id and q.user_id = auth.uid()
    )
  );

create policy orders_select_own on public.orders for select using (auth.uid() = user_id);
create policy order_items_select_own on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy order_events_select_own on public.order_status_events for select
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy payment_sessions_select_own on public.payment_sessions for select
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy refunds_select_own on public.refunds for select
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy fulfillment_attempts_select_own on public.fulfillment_attempts for select
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

-- digital_codes: no client policies (Edge reveal only)
-- suppliers / mappings / idempotency / audit: no client policies

create policy store_credits_select_own on public.store_credits for select using (auth.uid() = user_id);
create policy store_credit_tx_select_own on public.store_credit_transactions for select using (auth.uid() = user_id);

create policy notifications_select_own on public.notifications for select using (auth.uid() = user_id);
create policy notifications_update_own on public.notifications for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy support_select_own on public.support_tickets for select using (auth.uid() = user_id);
create policy support_insert_own on public.support_tickets for insert with check (auth.uid() = user_id);

-- Storage buckets (run in dashboard or via storage API; policies below assume buckets exist)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true), ('support-attachments', 'support-attachments', false)
on conflict (id) do nothing;

create policy avatars_read on storage.objects for select using (bucket_id = 'avatars');
create policy avatars_write_own on storage.objects for insert with check (
  bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy support_attachments_own on storage.objects for all using (
  bucket_id = 'support-attachments' and auth.uid()::text = (storage.foldername(name))[1]
);

-- Seed minimal catalog so the app can render after migrate
insert into public.categories (id, name_en, name_ar, slug, sort_order) values
  ('cat-games', 'Games', 'ألعاب', 'games', 1),
  ('cat-cards', 'Gift Cards', 'بطاقات هدية', 'gift-cards', 2)
on conflict do nothing;

insert into public.brands (id, name_en, name_ar, slug, color) values
  ('brand-pubg', 'PUBG Mobile', 'ببجي موبايل', 'pubg-mobile', '#F2A900'),
  ('brand-itunes', 'App Store & iTunes', 'آب ستور وآيتونز', 'itunes', '#A2AAAD')
on conflict do nothing;

insert into public.products (
  id, kind, brand_id, category_id, title_en, title_ar, description_en, description_ar,
  color, rating, reviews_count, in_stock, from_price, display_currency, region_code, payload
) values
(
  'prod-pubg-uc',
  'direct_topup',
  'brand-pubg',
  'cat-games',
  'PUBG Mobile UC',
  'شدات ببجي موبايل',
  'Direct UC top-up',
  'شحن شدات مباشر',
  '#F2A900',
  4.8,
  1200,
  true,
  19.99,
  'SAR',
  'GLOBAL',
  '{"game":{"id":"pubg","name":{"en":"PUBG Mobile","ar":"ببجي موبايل"}},"validation":{"accountLookup":"unsupported","confirmationRequired":true},"fulfillmentMode":"automatic","fulfillmentEstimateMinutes":5}'::jsonb
),
(
  'prod-itunes-sa',
  'gift_card',
  'brand-itunes',
  'cat-cards',
  'App Store & iTunes (KSA)',
  'آب ستور وآيتونز (السعودية)',
  'Digital gift card code',
  'كود بطاقة هدية رقمية',
  '#A2AAAD',
  4.7,
  800,
  true,
  50,
  'SAR',
  'KSA',
  '{"redemptionCurrency":"SAR","pinDelivery":{"method":"screen","instant":true},"redemptionInstructions":{"en":"Redeem in App Store","ar":"استبدل في آب ستور"}}'::jsonb
)
on conflict do nothing;

insert into public.topup_packages (id, product_id, label, amount, price, in_stock) values
  ('pkg-pubg-60', 'prod-pubg-uc', '60 UC', 60, 19.99, true),
  ('pkg-pubg-325', 'prod-pubg-uc', '325 UC', 325, 79.99, true)
on conflict do nothing;

insert into public.denominations (id, product_id, face_value, price, in_stock) values
  ('den-itunes-50', 'prod-itunes-sa', 50, 50, true),
  ('den-itunes-100', 'prod-itunes-sa', 100, 100, true)
on conflict do nothing;

insert into public.promotions (id, code, title_en, title_ar, expires_label_en, expires_label_ar, active) values
  ('promo-welcome', 'WELCOME10', 'Welcome 10% off', 'خصم ترحيبي 10%', 'Limited time', 'لفترة محدودة', true)
on conflict do nothing;

-- Realtime for in-app notification updates
alter publication supabase_realtime add table public.notifications;
