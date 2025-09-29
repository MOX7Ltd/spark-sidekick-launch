-- Enable RLS on profiles and ai_usage tables that were missing it
alter table profiles enable row level security;
alter table ai_usage enable row level security;

-- Create policies for profiles table
create policy "users can view and edit their own profile"
on profiles for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Create policy for ai_usage table  
create policy "users can view their own usage"
on ai_usage for select
using (user_id = auth.uid());

create policy "users can insert their own usage"
on ai_usage for insert
with check (user_id = auth.uid());