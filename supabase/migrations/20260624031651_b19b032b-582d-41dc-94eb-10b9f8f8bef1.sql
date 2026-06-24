
INSERT INTO public.services (name, icon, is_active, sort_order)
VALUES 
  ('Ozon', '/icons/services/ozon.svg', true, 200),
  ('CodeBuddy', '/icons/services/codebuddy.svg', true, 201);

INSERT INTO public.service_prices (service_id, country_id, price, stock, is_active)
SELECT s.id, c.id, 0.30, 500, true
FROM public.services s
CROSS JOIN public.countries c
WHERE s.name IN ('Ozon', 'CodeBuddy')
  AND c.is_active = true
ON CONFLICT DO NOTHING;
