-- Enforce one business per user (non-deleted businesses only)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_owner_one_business
ON businesses (owner_id)
WHERE status IS DISTINCT FROM 'deleted';