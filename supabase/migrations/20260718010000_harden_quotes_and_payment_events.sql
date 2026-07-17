-- Harden quote RLS: never expose anonymous (null user_id) quotes to all authenticated users.
drop policy if exists quotes_select_own on public.checkout_quotes;
create policy quotes_select_own on public.checkout_quotes for select
  using (auth.uid() = user_id);

drop policy if exists quote_items_select on public.checkout_quote_items;
create policy quote_items_select on public.checkout_quote_items for select
  using (
    exists (
      select 1 from public.checkout_quotes q
      where q.id = quote_id and q.user_id = auth.uid()
    )
  );

alter table public.checkout_quotes
  add column if not exists consumed_at timestamptz;

create index if not exists checkout_quotes_user_created_idx
  on public.checkout_quotes (user_id, created_at desc);

-- Prepare payment_events for provider webhook idempotency (Moyasar/Stripe later).
alter table public.payment_events
  add column if not exists provider text,
  add column if not exists provider_event_id text;

create unique index if not exists payment_events_provider_event_uidx
  on public.payment_events (provider, provider_event_id)
  where provider is not null and provider_event_id is not null;
