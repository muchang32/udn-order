-- Drop existing restrictive INSERT policy
DROP POLICY IF EXISTS "Admins can create orders" ON public.orders;

-- Create new policy allowing anyone (including anonymous) to insert orders
CREATE POLICY "Anyone can create orders"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Keep existing policies for viewing/updating/deleting orders (admin only)