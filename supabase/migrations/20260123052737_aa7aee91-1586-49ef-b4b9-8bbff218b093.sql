-- Fix: Restrict stores table SELECT to admin-only, public should use stores_public view
-- This prevents exposure of google_sheet_url and spreadsheet_url to public users

-- Drop the existing public SELECT policy on stores
DROP POLICY IF EXISTS "Anyone can view stores" ON public.stores;

-- Create admin-only SELECT policy on stores (for full data including URLs)
CREATE POLICY "Admins can view stores"
ON public.stores
FOR SELECT
USING (public.is_admin());

-- The stores_public view already exists with security_invoker=on
-- It only exposes: id, name, brand_color, logo_url, created_at, updated_at
-- And excludes: google_sheet_url, spreadsheet_url

-- Create an explicit policy to allow public SELECT on the base table
-- when accessed through the stores_public view (for non-sensitive columns only)
-- Actually, we need a different approach - let anonymous/authenticated users read via the view

-- Create a permissive policy that allows SELECT for the view's limited columns
-- Since stores_public uses security_invoker, we need the base table to allow access
-- We'll use a function to check if this is a view access

-- Alternative approach: Allow SELECT but the view restricts what's visible
-- Let's keep stores restricted to admin and have public use the view directly

-- Add a policy that allows all authenticated and anon users to SELECT via the view
-- The view itself only exposes safe columns

-- For the view to work with security_invoker=on, we need the calling user to have access
-- Solution: Create a PERMISSIVE policy for SELECT that works with the view

CREATE POLICY "Public can view stores via view"
ON public.stores
FOR SELECT
USING (true);

-- Wait, this brings back the problem. Let me reconsider.
-- The proper solution is:
-- 1. Deny direct SELECT on stores table (admin only)
-- 2. Recreate the view with security_definer to bypass RLS

-- Let's drop and recreate the approach properly:
DROP POLICY IF EXISTS "Public can view stores via view" ON public.stores;

-- The stores_public view needs to be recreated with SECURITY DEFINER
-- First drop the existing view
DROP VIEW IF EXISTS public.stores_public;

-- Recreate the view with security_definer (not invoker) so it bypasses RLS
CREATE VIEW public.stores_public
WITH (security_barrier=true)
AS SELECT 
  id, 
  name, 
  brand_color, 
  logo_url, 
  created_at, 
  updated_at
FROM public.stores;

-- Grant SELECT on the view to public roles
GRANT SELECT ON public.stores_public TO anon, authenticated;

-- Now the base stores table is admin-only for SELECT (policy already created above)
-- And public users can use stores_public view which bypasses RLS but only shows safe columns