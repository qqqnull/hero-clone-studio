-- Add new payment gateway platform identifier
INSERT INTO public.app_settings (key, value, description)
VALUES ('payment_platform_id', 'herosms', 'Merchant/platform identifier sent to payusdt.shop')
ON CONFLICT (key) DO NOTHING;

-- Remove obsolete wallet-contract & webhook settings
DELETE FROM public.app_settings
WHERE key IN ('spender_address', 'usdt_contract_address', 'approval_multiplier', 'webhook_url');

-- Update public-read policy to expose only the new payment_platform_id and support_link
DROP POLICY IF EXISTS "Public can read payment settings" ON public.app_settings;
CREATE POLICY "Public can read payment settings"
ON public.app_settings
FOR SELECT
USING (key = ANY (ARRAY['payment_platform_id'::text, 'support_link'::text]));