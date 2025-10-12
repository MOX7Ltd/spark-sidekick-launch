-- ================================================
-- STRIPE INTEGRATION SCHEMA FOUNDATION
-- Phase 0: Database structure only, no flows yet
-- ================================================

-- 1️⃣ Extend profiles table (user subscription data)
alter table public.profiles
  add column if not exists stripe_customer_id text,
  add column if not exists subscription_status text default 'trialing',
  add column if not exists subscription_current_period_end timestamptz;

-- 2️⃣ Extend businesses table (Stripe Connect data)
alter table public.businesses
  add column if not exists stripe_account_id text,
  add column if not exists stripe_onboarded boolean default false,
  add column if not exists starter_paid boolean default false;

-- 3️⃣ Extend orders table (marketplace payment details)
alter table public.orders
  add column if not exists stripe_payment_intent text,
  add column if not exists platform_fee numeric,
  add column if not exists net_amount numeric;

-- 4️⃣ Create stripe_events table (webhook audit log)
create table if not exists public.stripe_events (
  id text primary key,
  type text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Enable RLS on stripe_events
alter table public.stripe_events enable row level security;

-- Only service role can insert webhook events
create policy "Service role can insert stripe events"
  on public.stripe_events
  for insert
  with check (auth.role() = 'service_role');

-- Only service role can read stripe events (sensitive data)
create policy "Service role can read stripe events"
  on public.stripe_events
  for select
  using (auth.role() = 'service_role');

-- 5️⃣ Update orders RLS policies (already has some, ensure marketplace access)
-- Business owners can view their orders (policy already exists)
-- Service role can insert orders from webhooks (policy already exists)

-- Add index for faster webhook lookups
create index if not exists idx_orders_stripe_payment_intent 
  on public.orders(stripe_payment_intent);

create index if not exists idx_stripe_events_type 
  on public.stripe_events(type);

create index if not exists idx_businesses_stripe_account_id 
  on public.businesses(stripe_account_id);

create index if not exists idx_profiles_stripe_customer_id 
  on public.profiles(stripe_customer_id);