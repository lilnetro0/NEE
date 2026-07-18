-- Catalog hierarchy: Category -> Brand -> Region offering -> Variants
-- Additive migration. Existing product and SKU identifiers remain unchanged.

create table if not exists public.regions (
  code text primary key,
  name_en text not null,
  name_ar text not null,
  currency_code text not null default 'SAR',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint regions_code_uppercase check (code = upper(code))
);

alter table public.regions enable row level security;

create policy "Public can read active regions"
  on public.regions for select
  using (is_active = true);

insert into public.regions (code, name_en, name_ar, currency_code, sort_order)
values
  ('GLOBAL', 'Global', 'عالمي', 'USD', 0),
  ('SA', 'Saudi Arabia', 'السعودية', 'SAR', 10),
  ('AE', 'United Arab Emirates', 'الإمارات', 'AED', 20),
  ('US', 'United States', 'الولايات المتحدة', 'USD', 30),
  ('TR', 'Turkey', 'تركيا', 'TRY', 40),
  ('GB', 'United Kingdom', 'المملكة المتحدة', 'GBP', 50),
  ('JP', 'Japan', 'اليابان', 'JPY', 60),
  ('AR', 'Argentina', 'الأرجنتين', 'ARS', 70),
  ('KW', 'Kuwait', 'الكويت', 'KWD', 80),
  ('QA', 'Qatar', 'قطر', 'QAR', 90),
  ('BH', 'Bahrain', 'البحرين', 'BHD', 100),
  ('OM', 'Oman', 'عُمان', 'OMR', 110),
  ('EG', 'Egypt', 'مصر', 'EGP', 120)
on conflict (code) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  currency_code = excluded.currency_code,
  sort_order = excluded.sort_order;

-- Preserve unknown legacy region codes instead of rejecting existing catalog rows.
insert into public.regions (code, name_en, name_ar, currency_code, sort_order)
select distinct
  case when upper(region_code) = 'KSA' then 'SA' else upper(region_code) end,
  case when upper(region_code) = 'KSA' then 'Saudi Arabia' else upper(region_code) end,
  case when upper(region_code) = 'KSA' then 'السعودية' else upper(region_code) end,
  display_currency,
  1000
from public.products
where region_code is not null and btrim(region_code) <> ''
on conflict (code) do nothing;

alter table public.products
  add column if not exists region_id text references public.regions (code);

update public.products
set region_id = case
  when upper(region_code) = 'KSA' then 'SA'
  else upper(region_code)
end
where region_id is null;

alter table public.products
  alter column region_id set default 'GLOBAL',
  alter column region_id set not null;

-- A brand has one canonical category for brand-first browsing. Products keep
-- category_id during the compatibility window.
alter table public.brands
  add column if not exists primary_category_id text references public.categories (id);

update public.brands as brand
set primary_category_id = source.category_id
from (
  select distinct on (brand_id)
    brand_id,
    category_id
  from public.products
  order by brand_id, sort_order, id
) as source
where brand.id = source.brand_id
  and brand.primary_category_id is null;

create unique index if not exists products_brand_kind_region_unique
  on public.products (brand_id, kind, region_id)
  where is_archived = false;

create index if not exists products_region_idx
  on public.products (region_id, is_visible, is_archived);

create index if not exists brands_primary_category_idx
  on public.brands (primary_category_id, is_hidden);

