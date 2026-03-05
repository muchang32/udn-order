-- Add max_price_per_item column to stores table
ALTER TABLE public.stores ADD COLUMN max_price_per_item integer DEFAULT NULL;

-- Drop and recreate the stores_public view with the new column
DROP VIEW IF EXISTS public.stores_public;
CREATE VIEW public.stores_public AS
SELECT id, name, brand_color, logo_url, google_sheet_url, spreadsheet_url, max_price_per_item, created_at, updated_at
FROM public.stores;