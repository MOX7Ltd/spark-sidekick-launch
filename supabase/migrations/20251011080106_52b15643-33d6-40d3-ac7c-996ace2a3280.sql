-- Create social_posts table for performance tracking
create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  platform text check (platform in ('instagram','tiktok','facebook','x','linkedin','other')) default 'other',
  caption text,
  impressions int default 0,
  clicks int default 0,
  conversions int default 0,
  posted_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.social_posts enable row level security;

-- Policy: owners can view their posts
create policy "owner_view_social_posts"
on public.social_posts for select
using (business_id in (select id from public.businesses where owner_id = auth.uid()));

-- Policy: owners can manage their posts
create policy "owner_manage_social_posts"
on public.social_posts for all
using (business_id in (select id from public.businesses where owner_id = auth.uid()))
with check (business_id in (select id from public.businesses where owner_id = auth.uid()));

-- Insert mock data for testing
insert into public.social_posts (business_id, platform, caption, impressions, clicks, conversions, posted_at)
select 
  b.id,
  unnest(array['instagram','tiktok','facebook','x','linkedin','instagram','tiktok','facebook']),
  unnest(array[
    'Behind the scenes of our latest product',
    'Customer testimonial reel',
    'Weekend sale announcement',
    'Tips for new users',
    'Product demo shorts',
    'New collection reveal',
    'Team spotlight series',
    'Industry trends discussion'
  ]),
  (1000 + (random()*4000)::int),
  (100 + (random()*900)::int),
  (10 + (random()*80)::int),
  now() - (random()*30 || ' days')::interval
from public.businesses b 
limit 1;