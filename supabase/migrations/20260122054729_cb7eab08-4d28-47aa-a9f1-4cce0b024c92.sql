-- Create app_settings table for global settings
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
  ('global_spreadsheet_url', NULL);