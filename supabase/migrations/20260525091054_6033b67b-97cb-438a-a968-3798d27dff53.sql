-- 持久号订阅表
CREATE TABLE public.user_phone_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  phone_number TEXT NOT NULL,
  country_id UUID,
  monthly_fee NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- active | grace | expired | cancelled
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  used_this_period BOOLEAN NOT NULL DEFAULT false,
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  grace_period_ends_at TIMESTAMPTZ,
  last_renewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, phone_number)
);

CREATE INDEX idx_subs_user ON public.user_phone_subscriptions(user_id);
CREATE INDEX idx_subs_period_end ON public.user_phone_subscriptions(current_period_end) WHERE status IN ('active','grace');

ALTER TABLE public.user_phone_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscriptions" ON public.user_phone_subscriptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own subscriptions" ON public.user_phone_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own subscriptions" ON public.user_phone_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own subscriptions" ON public.user_phone_subscriptions
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage all subscriptions" ON public.user_phone_subscriptions
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_subs_updated_at
  BEFORE UPDATE ON public.user_phone_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 锁定号码
CREATE OR REPLACE FUNCTION public.lock_phone_subscription(
  _phone_number TEXT,
  _country_id UUID,
  _monthly_fee NUMERIC
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _balance NUMERIC;
  _sub_id UUID;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT balance INTO _balance FROM profiles WHERE user_id = _uid FOR UPDATE;
  IF _balance < _monthly_fee THEN
    RAISE EXCEPTION 'INSUFFICIENT_BALANCE';
  END IF;

  UPDATE profiles SET balance = balance - _monthly_fee WHERE user_id = _uid;

  INSERT INTO user_phone_subscriptions (user_id, phone_number, country_id, monthly_fee, last_renewed_at)
  VALUES (_uid, _phone_number, _country_id, _monthly_fee, now())
  ON CONFLICT (user_id, phone_number) DO UPDATE
    SET status = 'active',
        current_period_start = now(),
        current_period_end = now() + INTERVAL '30 days',
        used_this_period = false,
        grace_period_ends_at = NULL,
        last_renewed_at = now()
  RETURNING id INTO _sub_id;

  INSERT INTO transactions (user_id, type, amount, balance_after, status, note, completed_at)
  VALUES (_uid, 'subscription_lock', -_monthly_fee, (SELECT balance FROM profiles WHERE user_id = _uid),
          'completed', 'Lock phone: ' || _phone_number, now());

  RETURN _sub_id;
END;
$$;

-- 持久号接码消费
CREATE OR REPLACE FUNCTION public.consume_phone_subscription(
  _subscription_id UUID,
  _service_price NUMERIC
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _balance NUMERIC;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT balance INTO _balance FROM profiles WHERE user_id = _uid FOR UPDATE;
  IF _balance < _service_price THEN
    RAISE EXCEPTION 'INSUFFICIENT_BALANCE';
  END IF;

  UPDATE profiles SET balance = balance - _service_price WHERE user_id = _uid;

  UPDATE user_phone_subscriptions
    SET used_this_period = true
    WHERE id = _subscription_id AND user_id = _uid;

  RETURN true;
END;
$$;

-- cron 调用：续费 + 进入宽限期 + 释放过期号
CREATE OR REPLACE FUNCTION public.process_subscription_renewals()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _sub RECORD;
  _bal NUMERIC;
BEGIN
  -- 到期且本月用过：免费续费
  FOR _sub IN
    SELECT * FROM user_phone_subscriptions
    WHERE status = 'active' AND current_period_end <= now() AND used_this_period = true
  LOOP
    UPDATE user_phone_subscriptions
      SET current_period_start = now(),
          current_period_end = now() + INTERVAL '30 days',
          used_this_period = false,
          last_renewed_at = now()
      WHERE id = _sub.id;
  END LOOP;

  -- 到期未使用、开启自动续费：尝试扣款
  FOR _sub IN
    SELECT * FROM user_phone_subscriptions
    WHERE status = 'active' AND current_period_end <= now() AND used_this_period = false AND auto_renew = true
  LOOP
    SELECT balance INTO _bal FROM profiles WHERE user_id = _sub.user_id;
    IF _bal >= _sub.monthly_fee THEN
      UPDATE profiles SET balance = balance - _sub.monthly_fee WHERE user_id = _sub.user_id;
      UPDATE user_phone_subscriptions
        SET current_period_start = now(),
            current_period_end = now() + INTERVAL '30 days',
            used_this_period = false,
            last_renewed_at = now()
        WHERE id = _sub.id;
      INSERT INTO transactions (user_id, type, amount, balance_after, status, note, completed_at)
      VALUES (_sub.user_id, 'subscription_renew', -_sub.monthly_fee,
              (SELECT balance FROM profiles WHERE user_id = _sub.user_id),
              'completed', 'Auto renew: ' || _sub.phone_number, now());
    ELSE
      UPDATE user_phone_subscriptions
        SET status = 'grace', grace_period_ends_at = now() + INTERVAL '7 days'
        WHERE id = _sub.id;
    END IF;
  END LOOP;

  -- 关闭自动续费且到期：直接宽限期
  UPDATE user_phone_subscriptions
    SET status = 'grace', grace_period_ends_at = now() + INTERVAL '7 days'
    WHERE status = 'active' AND current_period_end <= now() AND auto_renew = false AND used_this_period = false;

  -- 宽限期结束：释放
  UPDATE user_phone_subscriptions
    SET status = 'expired'
    WHERE status = 'grace' AND grace_period_ends_at <= now();
END;
$$;