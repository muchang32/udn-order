-- Update an existing user to super_admin role manually if needed
UPDATE public.user_roles 
SET role = 'super_admin' 
WHERE user_id = '22114131-46f1-40f2-bd25-f20226ef3f39';

-- Create a helper function to check if user is super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'super_admin')
$$;

-- Update the is_admin function to also return true for super_admins
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
$$;

-- Super admins can manage all roles (insert, update, delete)
DROP POLICY IF EXISTS "Super admins can manage roles" ON public.user_roles;
CREATE POLICY "Super admins can manage roles"
ON public.user_roles
FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());