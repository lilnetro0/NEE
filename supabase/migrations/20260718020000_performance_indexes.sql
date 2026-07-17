-- Performance indexes for catalog search and commerce lists
create index if not exists products_category_id_idx on public.products (category_id);
create index if not exists products_brand_id_idx on public.products (brand_id);
create index if not exists products_kind_idx on public.products (kind);
create index if not exists products_title_en_idx on public.products (title_en);
create index if not exists products_title_ar_idx on public.products (title_ar);
create index if not exists denominations_product_id_idx on public.denominations (product_id);
create index if not exists topup_packages_product_id_idx on public.topup_packages (product_id);
create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists orders_user_created_idx on public.orders (user_id, created_at desc);
create index if not exists notifications_user_created_idx on public.notifications (user_id, created_at desc);
