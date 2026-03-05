-- Drop old conflicting policies
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Update the SELECT policy to be PERMISSIVE (default) and allow users to view their own roles
DROP POLICY IF EXISTS "Users can view own roles or admins can view all" ON public.user_roles;
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Keep super admin management policy for INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Super admins can manage roles" ON public.user_roles;
CREATE POLICY "Super admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());