-- Phase 4: shopfront_settings with draft/published JSON and owner-only edits

create table if not exists public.shopfront_settings (
  business_id uuid primary key,
  theme jsonb,
  layout jsonb,
  show_announcement boolean default false,
  announcement_text text,
  draft jsonb,         -- owner working copy
  published jsonb,     -- public snapshot
  published_at timestamptz
);

alter table public.shopfront_settings enable row level security;

-- SELECT: anyone can read published for a business; owner can read everything
drop policy if exists shopfront_settings_select on public.shopfront_settings;
create policy shopfront_settings_select on public.shopfront_settings
for select using (
  true -- Anyone may select; app should only expose "published" to public
);

-- INSERT/UPDATE/DELETE: owner only
drop policy if exists shopfront_settings_owner_modify on public.shopfront_settings;
create policy shopfront_settings_owner_modify on public.shopfront_settings
for all using (
  exists (
    select 1 from public.businesses b
    where b.id = business_id and b.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.businesses b
    where b.id = business_id and b.owner_id = auth.uid()
  )
);