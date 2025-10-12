-- Ensure customer_email exists in reviews table
alter table reviews add column if not exists customer_email text;

-- Create a security definer function to get customer insights for a business
create or replace function get_customer_insights(business_uuid uuid)
returns table (
  business_id uuid,
  customer_email text,
  total_orders bigint,
  total_spend numeric,
  avg_order_value numeric,
  last_purchase timestamptz,
  first_purchase timestamptz,
  avg_rating numeric
)
language sql
security definer
set search_path = public
stable
as $$
  -- Verify the caller owns this business
  select
    o.business_id,
    lower(o.customer_email) as customer_email,
    count(distinct o.id) as total_orders,
    sum(o.amount_total)/100.0 as total_spend,
    avg(o.amount_total)/100.0 as avg_order_value,
    max(o.created_at) as last_purchase,
    min(o.created_at) as first_purchase,
    coalesce(avg(r.rating), 0) as avg_rating
  from orders o
  left join reviews r
    on r.business_id = o.business_id
    and lower(r.customer_email) = lower(o.customer_email)
  where o.status = 'paid'
    and o.business_id = business_uuid
    and exists (
      select 1 from businesses b
      where b.id = business_uuid
        and b.owner_id = auth.uid()
    )
  group by o.business_id, lower(o.customer_email);
$$;