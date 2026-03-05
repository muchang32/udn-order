-- Fix PUBLIC_DATA_EXPOSURE: Restrict orders table to admins only
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
  FOR DELETE USING (public.is_admin());