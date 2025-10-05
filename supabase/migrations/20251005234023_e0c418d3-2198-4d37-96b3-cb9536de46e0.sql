-- Auto-create profiles for every new auth user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Make FK constraints more resilient
ALTER TABLE public.businesses
  DROP CONSTRAINT IF EXISTS businesses_owner_id_fkey;

ALTER TABLE public.businesses
  ADD CONSTRAINT businesses_owner_id_fkey
  FOREIGN KEY (owner_id)
  REFERENCES public.profiles(user_id)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON public.businesses(owner_id);

-- Similar for products table
ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_user_id_fkey;

ALTER TABLE public.products
  ADD CONSTRAINT products_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.profiles(user_id)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);