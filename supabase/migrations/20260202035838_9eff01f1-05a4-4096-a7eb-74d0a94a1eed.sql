-- =====================================================
-- COMPREHENSIVE ROLE-BASED ACCESS CONTROL MIGRATION
-- =====================================================

-- 1. Create a function to handle automatic role assignment on user creation
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Assign default 'user' role to all new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 2. Create trigger on auth.users for new user role assignment
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- 3. Add unique constraint on user_roles if not exists (for ON CONFLICT)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_roles_user_id_role_key'
  ) THEN
    ALTER TABLE public.user_roles 
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- 4. Retroactive fix: (Removed to prevent email exposure)
-- To manually assign a super_admin, please insert directly into user_roles via Supabase dashboard

-- 5. Update stores_public view to include spreadsheet_url for public ordering
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
  spreadsheet_url,  -- Now exposed for public order verification
  created_at,
  updated_at
FROM public.stores;

-- Grant select on the view to anon and authenticated
GRANT SELECT ON public.stores_public TO anon;
GRANT SELECT ON public.stores_public TO authenticated;

-- 6. Update profiles RLS to allow super_admin to view all profiles
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
CREATE POLICY "Super admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_super_admin() OR auth.uid() = id);

-- 7. Allow super_admin to delete profiles (for user account deletion)
DROP POLICY IF EXISTS "Super admins can delete profiles" ON public.profiles;
CREATE POLICY "Super admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (is_super_admin());

-- 8. Update user_roles RLS policies for super_admin management
DROP POLICY IF EXISTS "Super admins can view all roles" ON public.user_roles;
CREATE POLICY "Super admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (is_super_admin() OR auth.uid() = user_id);

-- Super admins can insert/update/delete roles (existing policy covers this)
-- "Super admins can manage roles" already exists with ALL command