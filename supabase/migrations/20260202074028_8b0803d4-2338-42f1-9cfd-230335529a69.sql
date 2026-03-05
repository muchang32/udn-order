-- =============================================
-- Fix app_settings RLS: Allow anon SELECT, restrict write to admins
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view settings" ON public.app_settings;
DROP POLICY IF EXISTS "Authenticated users can insert settings" ON public.app_settings;
DROP POLICY IF EXISTS "Authenticated users can update settings" ON public.app_settings;

-- Allow anyone (including anonymous) to read settings
-- This is needed for guests to get the GAS URL for ordering
CREATE POLICY "Anyone can view settings"
ON public.app_settings
FOR SELECT
TO anon, authenticated
USING (true);

-- Only admins can insert settings
CREATE POLICY "Admins can insert settings"
ON public.app_settings
FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- Only admins can update settings
CREATE POLICY "Admins can update settings"
ON public.app_settings
FOR UPDATE
TO authenticated
USING (is_admin());

-- Only admins can delete settings
CREATE POLICY "Admins can delete settings"
ON public.app_settings
FOR DELETE
TO authenticated
USING (is_admin());