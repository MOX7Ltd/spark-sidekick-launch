-- Create customer_messages table for shopfront messaging
create table public.customer_messages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  product_id uuid references products(id) on delete set null,
  customer_email text not null,
  customer_name text,
  topic text check (topic in ('general','shipping','booking','pricing','other')) default 'general',
  last_message_at timestamptz default now(),
  status text check (status in ('open','waiting','closed')) default 'open',
  created_at timestamptz default now()
);

create index idx_customer_messages_business on customer_messages(business_id);
create index idx_customer_messages_status on customer_messages(status);

-- Create customer_message_replies table
create table public.customer_message_replies (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references customer_messages(id) on delete cascade not null,
  sender_type text check (sender_type in ('customer','user')) not null,
  sender_id uuid,
  body text not null,
  attachments jsonb default '[]'::jsonb,
  via text check (via in ('email','in_app')) default 'in_app',
  created_at timestamptz default now()
);

create index idx_customer_message_replies_message on customer_message_replies(message_id);

-- Enable RLS
alter table public.customer_messages enable row level security;
alter table public.customer_message_replies enable row level security;

-- Customer messages policies: anyone can create (for shopfront contact forms)
create policy "anyone_can_create_customer_message"
on public.customer_messages for insert
with check (true);

-- Owners can view/manage messages for their business
create policy "owner_customer_message_access"
on public.customer_messages for select
using (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "owner_customer_message_update"
on public.customer_messages for update
using (business_id in (select id from businesses where owner_id = auth.uid()));

-- Customer message replies policies
create policy "anyone_can_create_reply"
on public.customer_message_replies for insert
with check (true);

create policy "owner_customer_message_reply_access"
on public.customer_message_replies for select
using (
  message_id in (
    select m.id from customer_messages m
    join businesses b on m.business_id = b.id
    where b.owner_id = auth.uid()
  )
);