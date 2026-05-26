
-- 生成随机持久号工具函数
CREATE OR REPLACE FUNCTION public.generate_random_phone(_phone_code TEXT, _digits INT DEFAULT 10)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  _num TEXT := '';
  _i INT;
BEGIN
  FOR _i IN 1.._digits LOOP
    _num := _num || floor(random() * 10)::INT::TEXT;
  END LOOP;
  RETURN _phone_code || _num;
END;
$$;

-- 为单个用户分配 US/UK 专属持久号
CREATE OR REPLACE FUNCTION public.assign_default_subscriptions(_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _country RECORD;
  _fee NUMERIC;
  _phone TEXT;
BEGIN
  FOR _country IN
    SELECT id, phone_code FROM countries
    WHERE code IN ('US','GB') AND is_active = true
  LOOP
    -- 若该用户已有该国家专属号则跳过
    IF EXISTS (
      SELECT 1 FROM user_phone_subscriptions
      WHERE user_id = _user_id AND country_id = _country.id
    ) THEN
      CONTINUE;
    END IF;

    -- 月租 = 该国家服务均价，最低 0.50
    SELECT GREATEST(ROUND(COALESCE(AVG(price), 0.50)::NUMERIC, 2), 0.50)
    INTO _fee
    FROM service_prices
    WHERE country_id = _country.id AND is_active = true;

    _fee := COALESCE(_fee, 0.50);

    -- 生成唯一随机号码
    LOOP
      _phone := generate_random_phone(_country.phone_code, 10);
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM user_phone_subscriptions WHERE phone_number = _phone
      );
    END LOOP;

    INSERT INTO user_phone_subscriptions
      (user_id, phone_number, country_id, monthly_fee, status,
       current_period_start, current_period_end, used_this_period,
       auto_renew, last_renewed_at)
    VALUES
      (_user_id, _phone, _country.id, _fee, 'active',
       now(), now() + INTERVAL '30 days', false,
       true, now());
  END LOOP;
END;
$$;

-- 更新注册触发函数：注册后自动分配美/英专属号
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  PERFORM public.assign_default_subscriptions(NEW.id);

  RETURN NEW;
END;
$$;

-- 为所有现有用户补发
DO $$
DECLARE
  _u RECORD;
BEGIN
  FOR _u IN SELECT user_id FROM profiles LOOP
    PERFORM public.assign_default_subscriptions(_u.user_id);
  END LOOP;
END $$;
