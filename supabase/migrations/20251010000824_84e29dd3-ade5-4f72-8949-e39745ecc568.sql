-- Phase 3: carts + cart_items with RLS for user_id and anon_id

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  user_id uuid,
  anon_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint carts_user_or_anon check (user_id is not null or anon_id is not null)
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null,
  option_id uuid,
  qty int not null default 1 check (qty >= 0),
  price_cents_snapshot int not null default 0,
  name_snapshot text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- helper trigger to bump updated_at on change
create or replace function public.tg_bump_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists carts_bump_updated_at on public.carts;
create trigger carts_bump_updated_at
before update on public.carts
for each row execute function public.tg_bump_updated_at();

drop trigger if exists cart_items_bump_updated_at on public.cart_items;
create trigger cart_items_bump_updated_at
before update on public.cart_items
for each row execute function public.tg_bump_updated_at();

-- RLS
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;

-- Policy model:
--  1) Authenticated users can access carts where user_id = auth.uid()
--  2) Guests can access carts where anon_id matches a custom header "anon-id"
--     (surfaced to PostgREST via current_setting('request.header.anon-id', true))

-- SELECT policies
drop policy if exists carts_select_user on public.carts;
create policy carts_select_user on public.carts
for select using (
  (user_id is not null and auth.uid() = user_id)
  or
  (anon_id is not null and anon_id = current_setting('request.headers', true)::json->>'anon-id')
);

drop policy if exists cart_items_select on public.cart_items;
create policy cart_items_select on public.cart_items
for select using (
  exists (
    select 1 from public.carts c
    where c.id = cart_id
      and (
        (c.user_id is not null and auth.uid() = c.user_id)
        or
        (c.anon_id is not null and c.anon_id = current_setting('request.headers', true)::json->>'anon-id')
      )
  )
);

-- INSERT/UPDATE/DELETE policies mirror the same ownership checks

drop policy if exists carts_modify_user on public.carts;
create policy carts_modify_user on public.carts
for all using (
  (user_id is not null and auth.uid() = user_id)
  or
  (anon_id is not null and anon_id = current_setting('request.headers', true)::json->>'anon-id')
)
with check (
  (user_id is not null and auth.uid() = user_id)
  or
  (anon_id is not null and anon_id = current_setting('request.headers', true)::json->>'anon-id')
);

drop policy if exists cart_items_modify on public.cart_items;
create policy cart_items_modify on public.cart_items
for all using (
  exists (
    select 1 from public.carts c
    where c.id = cart_id
      and (
        (c.user_id is not null and auth.uid() = c.user_id)
        or
        (c.anon_id is not null and c.anon_id = current_setting('request.headers', true)::json->>'anon-id')
      )
  )
)
with check (
  exists (
    select 1 from public.carts c
    where c.id = cart_id
      and (
        (c.user_id is not null and auth.uid() = c.user_id)
        or
        (c.anon_id is not null and c.anon_id = current_setting('request.headers', true)::json->>'anon-id')
      )
  )
);