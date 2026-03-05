-- Add spreadsheet_url column to stores table for the actual Google Sheets link
ALTER TABLE public.stores 
ADD COLUMN spreadsheet_url text;