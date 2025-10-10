-- Fix search_path for the trigger function
create or replace function public.tg_bump_updated_at() 
returns trigger 
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;