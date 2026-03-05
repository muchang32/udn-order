-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create stores table
CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand_color TEXT NOT NULL DEFAULT '#D4AF37',
  logo_url TEXT,
  google_sheet_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on stores
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- Create menu_categories table
CREATE TABLE public.menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on menu_categories
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;

-- Create menu_items table
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.menu_categories(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  price_m INTEGER NOT NULL,
  price_l INTEGER NOT NULL,
  description TEXT,
  is_special BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on menu_items
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Create menu_options table for sugar, ice, toppings
CREATE TABLE public.menu_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  option_type TEXT NOT NULL CHECK (option_type IN ('sugar', 'ice', 'topping')),
  name TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on menu_options
ALTER TABLE public.menu_options ENABLE ROW LEVEL SECURITY;

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  customer_name TEXT NOT NULL,
  item_name TEXT NOT NULL,
  size TEXT NOT NULL CHECK (size IN ('M', 'L')),
  temperature TEXT NOT NULL,
  sweetness TEXT NOT NULL,
  topping TEXT,
  price INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check admin role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- Create view for public store info (without sensitive google_sheet_url)
CREATE VIEW public.stores_public
WITH (security_invoker = on) AS
SELECT id, name, brand_color, logo_url, created_at, updated_at
FROM public.stores;

-- RLS Policies for user_roles
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.is_admin());

-- RLS Policies for stores (public can read basic info, admins can manage)
CREATE POLICY "Anyone can view stores"
  ON public.stores FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert stores"
  ON public.stores FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update stores"
  ON public.stores FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete stores"
  ON public.stores FOR DELETE
  USING (public.is_admin());

-- RLS Policies for menu_categories
CREATE POLICY "Anyone can view categories"
  ON public.menu_categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert categories"
  ON public.menu_categories FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update categories"
  ON public.menu_categories FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete categories"
  ON public.menu_categories FOR DELETE
  USING (public.is_admin());

-- RLS Policies for menu_items
CREATE POLICY "Anyone can view items"
  ON public.menu_items FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert items"
  ON public.menu_items FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update items"
  ON public.menu_items FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete items"
  ON public.menu_items FOR DELETE
  USING (public.is_admin());

-- RLS Policies for menu_options
CREATE POLICY "Anyone can view options"
  ON public.menu_options FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert options"
  ON public.menu_options FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update options"
  ON public.menu_options FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete options"
  ON public.menu_options FOR DELETE
  USING (public.is_admin());

-- RLS Policies for orders (public can create and view by store, admins can manage all)
CREATE POLICY "Anyone can view orders"
  ON public.orders FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update orders"
  ON public.orders FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete orders"
  ON public.orders FOR DELETE
  USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for stores updated_at
CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();-- Drop existing RLS policies that use is_admin()
DROP POLICY IF EXISTS "Admins can insert stores" ON public.stores;
DROP POLICY IF EXISTS "Admins can update stores" ON public.stores;
DROP POLICY IF EXISTS "Admins can delete stores" ON public.stores;
DROP POLICY IF EXISTS "Admins can insert categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Admins can insert items" ON public.menu_items;
DROP POLICY IF EXISTS "Admins can update items" ON public.menu_items;
DROP POLICY IF EXISTS "Admins can delete items" ON public.menu_items;
DROP POLICY IF EXISTS "Admins can insert options" ON public.menu_options;
DROP POLICY IF EXISTS "Admins can update options" ON public.menu_options;
DROP POLICY IF EXISTS "Admins can delete options" ON public.menu_options;

-- Create new public access policies for stores
CREATE POLICY "Anyone can insert stores" ON public.stores FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update stores" ON public.stores FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete stores" ON public.stores FOR DELETE USING (true);

-- Create new public access policies for menu_categories
CREATE POLICY "Anyone can insert categories" ON public.menu_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update categories" ON public.menu_categories FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete categories" ON public.menu_categories FOR DELETE USING (true);

-- Create new public access policies for menu_items
CREATE POLICY "Anyone can insert items" ON public.menu_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update items" ON public.menu_items FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete items" ON public.menu_items FOR DELETE USING (true);

-- Create new public access policies for menu_options
CREATE POLICY "Anyone can insert options" ON public.menu_options FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update options" ON public.menu_options FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete options" ON public.menu_options FOR DELETE USING (true);-- Add spreadsheet_url column to stores table for the actual Google Sheets link
ALTER TABLE public.stores 
ADD COLUMN spreadsheet_url text;-- Create app_settings table for global settings
CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies - anyone can read, only admins can write
CREATE POLICY "Anyone can view settings"
ON public.app_settings
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert settings"
ON public.app_settings
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update settings"
ON public.app_settings
FOR UPDATE
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default global settings
INSERT INTO public.app_settings (key, value) VALUES 
  ('global_gas_url', NULL),
  ('global_spreadsheet_url', NULL);-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Create user_settings table for API keys
CREATE TABLE public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  gemini_api_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- User settings policies - users can only access their own settings
CREATE POLICY "Users can view own settings" 
ON public.user_settings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" 
ON public.user_settings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" 
ON public.user_settings FOR UPDATE 
USING (auth.uid() = user_id);

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add trigger for updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on user_settings
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();-- 刪除現有的 SELECT 政策
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;

-- 建立新的 SELECT 政策：使用者可以查看自己的角色，管理員可以查看所有角色
CREATE POLICY "Users can view own roles or admins can view all"
ON user_roles FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR public.is_admin()
);-- Fix PUBLIC_DATA_EXPOSURE: Restrict orders table to admins only
DROP POLICY IF EXISTS "Anyone can view orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can update orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can delete orders" ON public.orders;

CREATE POLICY "Admins can view orders" ON public.orders 
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can create orders" ON public.orders 
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update orders" ON public.orders 
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete orders" ON public.orders 
  FOR DELETE USING (public.is_admin());

-- Fix SECRETS_EXPOSED: Restrict app_settings to admins only
DROP POLICY IF EXISTS "Anyone can view settings" ON public.app_settings;
DROP POLICY IF EXISTS "Anyone can insert settings" ON public.app_settings;
DROP POLICY IF EXISTS "Anyone can update settings" ON public.app_settings;

CREATE POLICY "Admins can manage settings" ON public.app_settings 
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Fix PUBLIC_WRITE_ACCESS on stores: Keep public read but restrict write to admins
DROP POLICY IF EXISTS "Anyone can insert stores" ON public.stores;
DROP POLICY IF EXISTS "Anyone can update stores" ON public.stores;
DROP POLICY IF EXISTS "Anyone can delete stores" ON public.stores;

CREATE POLICY "Admins can insert stores" ON public.stores 
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update stores" ON public.stores 
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete stores" ON public.stores 
  FOR DELETE USING (public.is_admin());

-- Fix menu_categories, menu_items, menu_options: Keep public read but restrict write to admins
DROP POLICY IF EXISTS "Anyone can insert categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Anyone can update categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Anyone can delete categories" ON public.menu_categories;

CREATE POLICY "Admins can insert categories" ON public.menu_categories 
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update categories" ON public.menu_categories 
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete categories" ON public.menu_categories 
  FOR DELETE USING (public.is_admin());

DROP POLICY IF EXISTS "Anyone can insert items" ON public.menu_items;
DROP POLICY IF EXISTS "Anyone can update items" ON public.menu_items;
DROP POLICY IF EXISTS "Anyone can delete items" ON public.menu_items;

CREATE POLICY "Admins can insert items" ON public.menu_items 
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update items" ON public.menu_items 
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete items" ON public.menu_items 
  FOR DELETE USING (public.is_admin());

DROP POLICY IF EXISTS "Anyone can insert options" ON public.menu_options;
DROP POLICY IF EXISTS "Anyone can update options" ON public.menu_options;
DROP POLICY IF EXISTS "Anyone can delete options" ON public.menu_options;

CREATE POLICY "Admins can insert options" ON public.menu_options 
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update options" ON public.menu_options 
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete options" ON public.menu_options 
  FOR DELETE USING (public.is_admin());-- Create api_rate_limits table for rate limiting edge functions
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint)
);

-- Enable RLS
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table (used by edge functions)
-- No user-facing policies needed as edge functions use service role key
CREATE POLICY "Service role only" ON public.api_rate_limits
  FOR ALL USING (false);

-- Add index for faster lookups
CREATE INDEX idx_api_rate_limits_user_endpoint ON public.api_rate_limits(user_id, endpoint);
CREATE INDEX idx_api_rate_limits_window_start ON public.api_rate_limits(window_start);

-- Trigger for updated_at
CREATE TRIGGER update_api_rate_limits_updated_at
  BEFORE UPDATE ON public.api_rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();-- Fix: Restrict stores table SELECT to admin-only, public should use stores_public view
-- This prevents exposure of google_sheet_url and spreadsheet_url to public users

-- Drop the existing public SELECT policy on stores
DROP POLICY IF EXISTS "Anyone can view stores" ON public.stores;

-- Create admin-only SELECT policy on stores (for full data including URLs)
DROP POLICY IF EXISTS "Admins can view stores" ON public.stores; 
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
-- And public users can use stores_public view which bypasses RLS but only shows safe columns-- Fix the security definer view warning by using a proper security model
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
GRANT EXECUTE ON FUNCTION public.get_stores_public() TO anon, authenticated;-- Add super_admin role to the enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';-- Update mu.chang32@gmail.com to super_admin role
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
WITH CHECK (is_super_admin());-- Drop old conflicting policies
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
WITH CHECK (is_super_admin());-- Drop existing overly permissive policies on stores table
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
USING (true);-- Update stores_public view to include google_sheet_url (but not spreadsheet_url)
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
DROP POLICY IF EXISTS "Admins can view stores" ON public.stores; 
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
USING (is_admin());-- =====================================================
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
  -- Check if the email is the super admin email
  IF NEW.email = 'mu.chang32@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- Assign default 'user' role to all other users
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
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

-- 4. Retroactive fix: Ensure mu.chang32@gmail.com has super_admin role
DO $$
DECLARE
  super_admin_user_id uuid;
BEGIN
  -- Find the user by email from profiles
  SELECT id INTO super_admin_user_id
  FROM public.profiles
  WHERE email = 'mu.chang32@gmail.com';
  
  IF super_admin_user_id IS NOT NULL THEN
    -- Delete any existing role for this user
    DELETE FROM public.user_roles WHERE user_id = super_admin_user_id;
    
    -- Insert super_admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (super_admin_user_id, 'super_admin');
  END IF;
END $$;

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
-- "Super admins can manage roles" already exists with ALL command-- Drop existing restrictive INSERT policy
DROP POLICY IF EXISTS "Admins can create orders" ON public.orders;

-- Create new policy allowing anyone (including anonymous) to insert orders
CREATE POLICY "Anyone can create orders"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Keep existing policies for viewing/updating/deleting orders (admin only)-- =============================================
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
USING (is_admin());-- Add max_price_per_item column to stores table
ALTER TABLE public.stores ADD COLUMN max_price_per_item integer DEFAULT NULL;

-- Drop and recreate the stores_public view with the new column
DROP VIEW IF EXISTS public.stores_public;
CREATE VIEW public.stores_public AS
SELECT id, name, brand_color, logo_url, google_sheet_url, spreadsheet_url, max_price_per_item, created_at, updated_at
FROM public.stores;
-- Remove spreadsheet_url from stores_public view
DROP VIEW IF EXISTS public.stores_public;
CREATE VIEW public.stores_public AS
SELECT id, name, brand_color, logo_url, google_sheet_url, max_price_per_item, created_at, updated_at
FROM public.stores;
