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
  EXECUTE FUNCTION public.update_updated_at_column();