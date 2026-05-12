INSERT INTO public.app_settings (key, value, description)
VALUES ('payment_gateway_url', 'https://payusdt.buzz/', '支付网关跳转域名')
ON CONFLICT (key) DO NOTHING;

DROP POLICY IF EXISTS "Public can read payment settings" ON public.app_settings;
CREATE POLICY "Public can read payment settings"
ON public.app_settings
FOR SELECT
USING (key = ANY (ARRAY['payment_platform_id'::text, 'support_link'::text, 'payment_gateway_url'::text]));