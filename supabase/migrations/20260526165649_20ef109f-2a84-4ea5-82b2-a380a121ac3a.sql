
-- Trigger: when a phone number receives its first SMS, activate any matching pending subscription
CREATE OR REPLACE FUNCTION public.activate_pending_subscription_on_sms()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.sms_code IS NOT NULL
     AND COALESCE(NEW.sms_code, '') <> COALESCE(OLD.sms_code, '')
     AND NEW.user_id IS NOT NULL THEN
    UPDATE public.user_phone_subscriptions
      SET status = 'active',
          current_period_start = now(),
          current_period_end = now() + INTERVAL '30 days',
          used_this_period = true,
          last_renewed_at = now(),
          grace_period_ends_at = NULL
      WHERE user_id = NEW.user_id
        AND phone_number = NEW.number
        AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_activate_pending_sub ON public.phone_numbers;
CREATE TRIGGER trg_activate_pending_sub
AFTER UPDATE OF sms_code ON public.phone_numbers
FOR EACH ROW
EXECUTE FUNCTION public.activate_pending_subscription_on_sms();

-- Update the renewals processor to also expire pending subs past 7 days (no charge)
CREATE OR REPLACE FUNCTION public.process_subscription_renewals()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _sub RECORD;
  _bal NUMERIC;
BEGIN
  -- Pending past 7 days → release (no charge)
  UPDATE public.user_phone_subscriptions
    SET status = 'expired'
    WHERE status = 'pending' AND current_period_end <= now();

  -- Expired-and-used → free renewal
  FOR _sub IN
    SELECT * FROM public.user_phone_subscriptions
    WHERE status = 'active' AND current_period_end <= now() AND used_this_period = true
  LOOP
    UPDATE public.user_phone_subscriptions
      SET current_period_start = now(),
          current_period_end = now() + INTERVAL '30 days',
          used_this_period = false,
          last_renewed_at = now()
      WHERE id = _sub.id;
  END LOOP;

  -- Expired, not used, auto-renew on → try to charge
  FOR _sub IN
    SELECT * FROM public.user_phone_subscriptions
    WHERE status = 'active' AND current_period_end <= now() AND used_this_period = false AND auto_renew = true
  LOOP
    SELECT balance INTO _bal FROM public.profiles WHERE user_id = _sub.user_id;
    IF _bal >= _sub.monthly_fee THEN
      UPDATE public.profiles SET balance = balance - _sub.monthly_fee WHERE user_id = _sub.user_id;
      UPDATE public.user_phone_subscriptions
        SET current_period_start = now(),
            current_period_end = now() + INTERVAL '30 days',
            used_this_period = false,
            last_renewed_at = now()
        WHERE id = _sub.id;
      INSERT INTO public.transactions (user_id, type, amount, balance_after, status, note, completed_at)
      VALUES (_sub.user_id, 'subscription_renew', -_sub.monthly_fee,
              (SELECT balance FROM public.profiles WHERE user_id = _sub.user_id),
              'completed', 'Auto renew: ' || _sub.phone_number, now());
    ELSE
      UPDATE public.user_phone_subscriptions
        SET status = 'grace', grace_period_ends_at = now() + INTERVAL '7 days'
        WHERE id = _sub.id;
    END IF;
  END LOOP;

  -- Auto-renew off and expired → grace
  UPDATE public.user_phone_subscriptions
    SET status = 'grace', grace_period_ends_at = now() + INTERVAL '7 days'
    WHERE status = 'active' AND current_period_end <= now() AND auto_renew = false AND used_this_period = false;

  -- Grace ended → expired
  UPDATE public.user_phone_subscriptions
    SET status = 'expired'
    WHERE status = 'grace' AND grace_period_ends_at <= now();
END;
$$;

-- Helper RPC the frontend calls right after the user purchases a number
CREATE OR REPLACE FUNCTION public.register_pending_subscription(
  _phone_number TEXT,
  _country_id UUID,
  _monthly_fee NUMERIC
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _sub_id UUID;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  INSERT INTO public.user_phone_subscriptions
    (user_id, phone_number, country_id, monthly_fee, status,
     current_period_start, current_period_end, used_this_period,
     auto_renew, last_renewed_at)
  VALUES
    (_uid, _phone_number, _country_id, _monthly_fee, 'pending',
     now(), now() + INTERVAL '7 days', false,
     true, NULL)
  ON CONFLICT (user_id, phone_number) DO NOTHING
  RETURNING id INTO _sub_id;

  RETURN _sub_id;
END;
$$;
