-- Update stores_public view to include google_sheet_url (but not spreadsheet_url)
-- Use security_invoker = false so the view bypasses RLS using owner's permissions
DROP VIEW IF EXISTS public.stores_public;
CREATE VIEW public.stores_public 
WITH (security_invoker = false)
AS
SELECT 
  id,
  name,
  brand_color,
  logo_url,
  google_sheet_url,
  created_at,
  updated_at
FROM public.stores;

-- Grant SELECT on the view to anon and authenticated
GRANT SELECT ON public.stores_public TO anon, authenticated;

-- Drop existing overly permissive policies on stores table
DROP POLICY IF EXISTS "Public can view stores" ON public.stores;
DROP POLICY IF EXISTS "Authenticated users can insert stores" ON public.stores;
DROP POLICY IF EXISTS "Authenticated users can update stores" ON public.stores;
DROP POLICY IF EXISTS "Authenticated users can delete stores" ON public.stores;

-- Create new admin-only policies on stores base table
-- Only admins can view the full stores table (with spreadsheet_url)
CREATE POLICY "Admins can view stores"
ON public.stores FOR SELECT
TO authenticated
USING (is_admin());

-- Only admins can insert stores
CREATE POLICY "Admins can insert stores"
ON public.stores FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- Only admins can update stores
CREATE POLICY "Admins can update stores"
ON public.stores FOR UPDATE
TO authenticated
USING (is_admin());

-- Only admins can delete stores
CREATE POLICY "Admins can delete stores"
ON public.stores FOR DELETE
TO authenticated
USING (is_admin());