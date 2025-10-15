-- Create preauth_profiles table for email capture before signup
create table if not exists public.preauth_profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  session_id text,
  created_at timestamptz default now(),
  linked_user_id uuid references auth.users(id),
  last_seen_at timestamptz default now()
);

-- Enable RLS
alter table public.preauth_profiles enable row level security;

-- Policy: Anyone can read their own session's preauth profile
create policy "preauth_profiles_select"
  on public.preauth_profiles
  for select
  using (
    session_id = (current_setting('request.headers', true)::json->>'x-session-id')
    or (linked_user_id is not null and linked_user_id = auth.uid())
  );

-- Policy: Anyone can insert with their session
create policy "preauth_profiles_insert"
  on public.preauth_profiles
  for insert
  with check (true);

-- Policy: Update own preauth profile
create policy "preauth_profiles_update"
  on public.preauth_profiles
  for update
  using (
    session_id = (current_setting('request.headers', true)::json->>'x-session-id')
    or (linked_user_id is not null and linked_user_id = auth.uid())
  );

-- Function to upsert pre-auth profile
create or replace function public.upsert_pre_auth_profile(
  p_email text,
  p_session_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.preauth_profiles (email, session_id, last_seen_at)
  values (lower(p_email), p_session_id, now())
  on conflict (email) do update set
    session_id = excluded.session_id,
    last_seen_at = now();
end;
$$;

-- Add index for performance
create index if not exists idx_preauth_profiles_session_id on public.preauth_profiles(session_id);
create index if not exists idx_preauth_profiles_email on public.preauth_profiles(email);
create index if not exists idx_preauth_profiles_linked_user on public.preauth_profiles(linked_user_id);

-- Add comment
comment on table public.preauth_profiles is 'Stores email hints from onboarding before user signup, allowing us to reconnect sessions later';
