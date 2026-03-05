-- Drop existing overly permissive policies on stores table
DROP POLICY IF EXISTS "Anyone can view stores" ON public.stores;
DROP POLICY IF EXISTS "Anyone can insert stores" ON public.stores;
DROP POLICY IF EXISTS "Anyone can update stores" ON public.stores;
DROP POLICY IF EXISTS "Anyone can delete stores" ON public.stores;

-- Create new policies for stores table
-- Public can view stores (for menu browsing)
CREATE POLICY "Public can view stores"
ON public.stores FOR SELECT
USING (true);

-- Only authenticated users can insert stores
CREATE POLICY "Authenticated users can insert stores"
ON public.stores FOR INSERT
TO authenticated
WITH CHECK (true);

-- Only authenticated users can update stores
CREATE POLICY "Authenticated users can update stores"
ON public.stores FOR UPDATE
TO authenticated
USING (true);

-- Only authenticated users can delete stores
CREATE POLICY "Authenticated users can delete stores"
ON public.stores FOR DELETE
TO authenticated
USING (true);

-- Drop existing overly permissive policies on app_settings table
DROP POLICY IF EXISTS "Anyone can view settings" ON public.app_settings;
DROP POLICY IF EXISTS "Anyone can manage settings" ON public.app_settings;

-- Create new policies for app_settings table (authenticated only)
CREATE POLICY "Authenticated users can view settings"
ON public.app_settings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert settings"
ON public.app_settings FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update settings"
ON public.app_settings FOR UPDATE
TO authenticated
USING (true);