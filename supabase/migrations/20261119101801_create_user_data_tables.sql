create table public.portfolio_holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  crypto_id text not null check (char_length(crypto_id) between 2 and 100 and crypto_id ~ '^[a-z0-9-]+$'),
  quantity numeric(38, 18) not null check (quantity > 0 and quantity <= 1000000000000),
  purchase_price numeric(38, 18) not null check (purchase_price > 0 and purchase_price <= 1000000000000),
  created_at timestamptz not null default now()
);

create table public.watchlist_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  crypto_id text not null check (char_length(crypto_id) between 2 and 100 and crypto_id ~ '^[a-z0-9-]+$'),
  created_at timestamptz not null default now(),
  unique (user_id, crypto_id)
);

create table public.price_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  crypto_id text not null check (char_length(crypto_id) between 2 and 100 and crypto_id ~ '^[a-z0-9-]+$'),
  direction text not null check (direction in ('above', 'below')),
  target_price numeric(38, 18) not null check (target_price > 0 and target_price <= 1000000000000),
  created_at timestamptz not null default now()
);

create index portfolio_holdings_owner_created_idx on public.portfolio_holdings (user_id, created_at);
create index watchlist_entries_owner_created_idx on public.watchlist_entries (user_id, created_at);
create index price_alerts_owner_created_idx on public.price_alerts (user_id, created_at);

alter table public.portfolio_holdings enable row level security;
alter table public.watchlist_entries enable row level security;
alter table public.price_alerts enable row level security;

alter table public.portfolio_holdings force row level security;
alter table public.watchlist_entries force row level security;
alter table public.price_alerts force row level security;

revoke all on table public.portfolio_holdings from public, anon, authenticated;
revoke all on table public.watchlist_entries from public, anon, authenticated;
revoke all on table public.price_alerts from public, anon, authenticated;

grant select, insert, delete on table public.portfolio_holdings to authenticated;
grant select, insert, delete on table public.watchlist_entries to authenticated;
grant select, insert, delete on table public.price_alerts to authenticated;

create policy "Owners can read their holdings"
  on public.portfolio_holdings for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Owners can add their holdings"
  on public.portfolio_holdings for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Owners can remove their holdings"
  on public.portfolio_holdings for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Owners can read their watchlist"
  on public.watchlist_entries for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Owners can add their watchlist entries"
  on public.watchlist_entries for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Owners can remove their watchlist entries"
  on public.watchlist_entries for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Owners can read their alerts"
  on public.price_alerts for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Owners can add their alerts"
  on public.price_alerts for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Owners can remove their alerts"
  on public.price_alerts for delete to authenticated
  using ((select auth.uid()) = user_id);
