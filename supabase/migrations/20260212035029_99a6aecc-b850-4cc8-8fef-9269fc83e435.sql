
-- Remove spreadsheet_url from stores_public view
DROP VIEW IF EXISTS public.stores_public;
CREATE VIEW public.stores_public AS
SELECT id, name, brand_color, logo_url, google_sheet_url, max_price_per_item, created_at, updated_at
FROM public.stores;
