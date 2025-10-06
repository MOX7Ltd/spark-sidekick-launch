-- Prevent duplicate products per session before claim
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_session_title
ON public.products(session_id, title)
WHERE session_id IS NOT NULL;