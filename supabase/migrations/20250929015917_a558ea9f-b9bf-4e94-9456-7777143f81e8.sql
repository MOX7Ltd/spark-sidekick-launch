-- profiles
create table if not exists profiles (
  user_id uuid primary key references auth.users on delete cascade,
  display_name text,
  email text,
  timezone text,
  created_at timestamptz default now()
);

-- businesses
create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(user_id) on delete cascade,
  idea text,
  audience text,
  experience text,
  naming_preference text check (naming_preference in ('with_personal_name','anonymous','custom')),
  business_name text,
  tagline text,
  bio text,
  brand_colors jsonb,      -- e.g. ["#111","#EDD1B0","#4994D5"]
  logo_svg text,           -- sanitized inline SVG (simple wordmark/icon)
  status text default 'draft' check (status in ('draft','active')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- campaigns
create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text,
  type text check (type in ('intro','quick_win','conversion','custom')),
  objective text,
  status text default 'draft' check (status in ('draft','scheduled','posted')),
  created_at timestamptz default now()
);

-- campaign_items (text-only for now; image_url reserved for premium)
create table if not exists campaign_items (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  platform text check (platform in ('tiktok','instagram','youtube','facebook','linkedin','twitter')),
  hook text,
  caption text,
  hashtags text[],
  scheduled_at timestamptz,
  posted_at timestamptz,
  created_at timestamptz default now()
);

-- simple rate limit / usage ledger
create table if not exists ai_usage (
  id bigserial primary key,
  user_id uuid not null,
  kind text,               -- 'identity' | 'campaign'
  created_at timestamptz default now()
);

-- RLS
alter table businesses enable row level security;
alter table campaigns enable row level security;
alter table campaign_items enable row level security;

create policy "owners read/write businesses"
on businesses for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "owners read/write campaigns"
on campaigns for all
using (business_id in (select id from businesses where owner_id = auth.uid()))
with check (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "owners read/write campaign_items"
on campaign_items for all
using (
  campaign_id in (
    select c.id from campaigns c join businesses b on c.business_id=b.id where b.owner_id = auth.uid()
  )
)
with check (
  campaign_id in (
    select c.id from campaigns c join businesses b on c.business_id=b.id where b.owner_id = auth.uid()
  )
);