-- Create services table (服务表)
CREATE TABLE public.services (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  icon text,
  code text UNIQUE,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create countries table (国家表)
CREATE TABLE public.countries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  code text NOT NULL,
  flag text,
  phone_code text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create service_prices table (服务价格表)
CREATE TABLE public.service_prices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id uuid REFERENCES public.services(id) ON DELETE CASCADE,
  country_id uuid REFERENCES public.countries(id) ON DELETE CASCADE,
  price numeric(10,4) NOT NULL DEFAULT 0.05,
  stock integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(service_id, country_id)
);

-- Create phone_numbers table (电话号码表)
CREATE TABLE public.phone_numbers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  number text NOT NULL,
  country_id uuid REFERENCES public.countries(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.services(id) ON DELETE CASCADE,
  status text DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'used', 'expired')),
  user_id uuid,
  sms_code text,
  sms_content text,
  activated_at timestamp with time zone,
  expires_at timestamp with time zone,
  price numeric(10,4),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create orders table (订单表)
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  phone_number_id uuid REFERENCES public.phone_numbers(id),
  service_id uuid REFERENCES public.services(id),
  country_id uuid REFERENCES public.countries(id),
  phone_number text,
  sms_code text,
  sms_content text,
  price numeric(10,4),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled', 'expired')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create transactions table (交易记录表)
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('recharge', 'purchase', 'refund')),
  amount numeric(10,4) NOT NULL,
  balance_after numeric(10,4),
  order_id uuid REFERENCES public.orders(id),
  payment_method text,
  payment_address text,
  tx_hash text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  note text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create api_keys table (API密钥表)
CREATE TABLE public.api_keys (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  key_hash text NOT NULL,
  name text DEFAULT 'Default Key',
  is_active boolean DEFAULT true,
  last_used_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies for services (public read, admin write)
CREATE POLICY "Anyone can view active services" ON public.services
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage services" ON public.services
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for countries (public read, admin write)
CREATE POLICY "Anyone can view active countries" ON public.countries
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage countries" ON public.countries
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for service_prices (public read, admin write)
CREATE POLICY "Anyone can view active prices" ON public.service_prices
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage prices" ON public.service_prices
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for phone_numbers (admin only)
CREATE POLICY "Admins can manage phone numbers" ON public.phone_numbers
FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own numbers" ON public.phone_numbers
FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for orders
CREATE POLICY "Users can view their own orders" ON public.orders
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" ON public.orders
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders" ON public.orders
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all orders" ON public.orders
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions" ON public.transactions
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions" ON public.transactions
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all transactions" ON public.transactions
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for api_keys
CREATE POLICY "Users can view their own api keys" ON public.api_keys
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own api keys" ON public.api_keys
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all api keys" ON public.api_keys
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Insert initial services data
INSERT INTO public.services (name, icon, code, sort_order) VALUES
('Instagram+Threads', '📸', 'instagram', 1),
('Amazon', '📦', 'amazon', 2),
('Google,Youtube,Gmail', '🔴', 'google', 3),
('WhatsApp', '💬', 'whatsapp', 4),
('Facebook', '👤', 'facebook', 5),
('Twitter', '🐦', 'twitter', 6),
('Telegram', '✈️', 'telegram', 7),
('WeChat', '💚', 'wechat', 8),
('Tinder', '🔥', 'tinder', 9),
('Discord', '💜', 'discord', 10),
('Yahoo', '🔴', 'yahoo', 11),
('Baidu', '🔵', 'baidu', 12);

-- Insert initial countries data
INSERT INTO public.countries (name, code, flag, phone_code, sort_order) VALUES
('Indonesia', 'ID', '🇮🇩', '+62', 1),
('Philippines', 'PH', '🇵🇭', '+63', 2),
('Brazil', 'BR', '🇧🇷', '+55', 3),
('Colombia', 'CO', '🇨🇴', '+57', 4),
('Chile', 'CL', '🇨🇱', '+56', 5),
('Netherlands', 'NL', '🇳🇱', '+31', 6),
('United Kingdom', 'GB', '🇬🇧', '+44', 7),
('USA', 'US', '🇺🇸', '+1', 8),
('Russia', 'RU', '🇷🇺', '+7', 9),
('China', 'CN', '🇨🇳', '+86', 10),
('India', 'IN', '🇮🇳', '+91', 11),
('Germany', 'DE', '🇩🇪', '+49', 12);

-- Insert initial service prices
INSERT INTO public.service_prices (service_id, country_id, price, stock)
SELECT s.id, c.id, 
  CASE 
    WHEN c.code = 'ID' THEN 0.03 + random() * 0.05
    WHEN c.code = 'US' THEN 0.08 + random() * 0.10
    WHEN c.code = 'GB' THEN 0.05 + random() * 0.08
    ELSE 0.04 + random() * 0.06
  END,
  FLOOR(1000 + random() * 50000)::integer
FROM public.services s
CROSS JOIN public.countries c;

-- Generate sample phone numbers
DO $$
DECLARE
  c RECORD;
  s RECORD;
  i INTEGER;
  phone_num TEXT;
BEGIN
  FOR c IN SELECT * FROM public.countries LIMIT 5 LOOP
    FOR s IN SELECT * FROM public.services LIMIT 3 LOOP
      FOR i IN 1..10 LOOP
        phone_num := c.phone_code || ' (' || LPAD((random() * 900 + 100)::integer::text, 3, '0') || ') ' || 
                     LPAD((random() * 900 + 100)::integer::text, 3, '0') || ' ' ||
                     LPAD((random() * 90 + 10)::integer::text, 2, '0') || ' ' ||
                     LPAD((random() * 90 + 10)::integer::text, 2, '0');
        INSERT INTO public.phone_numbers (number, country_id, service_id, status, price)
        VALUES (phone_num, c.id, s.id, 'available', 
          CASE 
            WHEN c.code = 'ID' THEN 0.03 + random() * 0.05
            WHEN c.code = 'US' THEN 0.08 + random() * 0.10
            ELSE 0.04 + random() * 0.06
          END
        );
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

-- Create trigger for updated_at
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_countries_updated_at BEFORE UPDATE ON public.countries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_prices_updated_at BEFORE UPDATE ON public.service_prices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_phone_numbers_updated_at BEFORE UPDATE ON public.phone_numbers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();