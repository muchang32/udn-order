-- Drop existing RLS policies that use is_admin()
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
CREATE POLICY "Anyone can delete options" ON public.menu_options FOR DELETE USING (true);