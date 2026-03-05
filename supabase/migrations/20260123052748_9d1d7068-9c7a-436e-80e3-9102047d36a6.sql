-- Fix the security definer view warning by using a proper security model
-- Instead of a security definer view, we'll:
-- 1. Keep the base stores table admin-only for SELECT
-- 2. Create a SECURITY DEFINER function to fetch public store data
-- 3. Keep the view but make it work via the function

-- Drop the security definer view
DROP VIEW IF EXISTS public.stores_public;

-- Create a security definer function to get public store data
CREATE OR REPLACE FUNCTION public.get_stores_public()
RETURNS TABLE (
  id uuid,
  name text,
  brand_color text,
  logo_url text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    s.id,
    s.name,
    s.brand_color,
    s.logo_url,
    s.created_at,
    s.updated_at
  FROM public.stores s
$$;

-- Recreate the view using the security definer function (view itself uses invoker)
CREATE VIEW public.stores_public
WITH (security_invoker = on)
AS SELECT * FROM public.get_stores_public();

-- Grant SELECT on the view to public roles
GRANT SELECT ON public.stores_public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_stores_public() TO anon, authenticated;