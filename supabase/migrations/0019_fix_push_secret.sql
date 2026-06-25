-- Fix push notification secret storage.
-- Supabase does not allow ALTER DATABASE SET or ALTER ROLE SET for custom
-- GUC parameters, so we store the Edge Function auth secret in a locked-down
-- table and read it from SECURITY DEFINER trigger functions.

CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Only service_role can manage this table directly.
-- SECURITY DEFINER functions (table owner) can still read it.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'app_settings' AND policyname = 'service_role_manage_app_settings'
  ) THEN
    CREATE POLICY service_role_manage_app_settings ON public.app_settings
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Placeholder value. Run the UPDATE below with your real service_role key after applying this migration.
INSERT INTO public.app_settings (key, value)
VALUES ('service_role_key', 'REPLACE_ME')
ON CONFLICT (key) DO NOTHING;

-- Helper used by triggers to obtain the secret.
CREATE OR REPLACE FUNCTION public.get_service_role_key()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT value FROM public.app_settings WHERE key = 'service_role_key';
$$;

-- Update trigger functions to use the helper instead of current_setting.
CREATE OR REPLACE FUNCTION public.notify_new_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  merchant_token text;
BEGIN
  SELECT push_token INTO merchant_token
  FROM public.profiles
  WHERE id = (SELECT owner_id FROM public.stores WHERE id = NEW.store_id);

  IF merchant_token IS NOT NULL THEN
    BEGIN
      PERFORM net.http_post(
        url := 'https://njdndrpylsvxoyvflkcq.supabase.co/functions/v1/send-push-notification',
        headers := jsonb_build_object(
          'Authorization', 'Bearer ' || public.get_service_role_key(),
          'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
          'token', merchant_token,
          'title', jsonb_build_object('en', 'New order', 'ar', 'طلب جديد'),
          'body', jsonb_build_object('en', 'You have a new order to review.', 'ar', 'لديك طلب جديد للمراجعة.'),
          'data', jsonb_build_object('type', 'order', 'orderId', NEW.id)
        )
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'Failed to send push notification: %', SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  customer_token text;
  status_text text;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;

  SELECT push_token INTO customer_token
  FROM public.profiles
  WHERE id = NEW.customer_id;

  IF customer_token IS NOT NULL THEN
    status_text := NEW.status;
    BEGIN
      PERFORM net.http_post(
        url := 'https://njdndrpylsvxoyvflkcq.supabase.co/functions/v1/send-push-notification',
        headers := jsonb_build_object(
          'Authorization', 'Bearer ' || public.get_service_role_key(),
          'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
          'token', customer_token,
          'title', jsonb_build_object('en', 'Order updated', 'ar', 'تحديث الطلب'),
          'body', jsonb_build_object(
            'en', 'Your order is now: ' || status_text,
            'ar', 'طلبك الآن: ' || status_text
          ),
          'data', jsonb_build_object('type', 'order', 'orderId', NEW.id)
        )
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'Failed to send push notification: %', SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipient_token text;
  sender_name text;
BEGIN
  SELECT full_name INTO sender_name
  FROM public.profiles
  WHERE id = NEW.sender_id;

  SELECT push_token INTO recipient_token
  FROM public.profiles
  WHERE id = NEW.recipient_id;

  IF recipient_token IS NOT NULL THEN
    BEGIN
      PERFORM net.http_post(
        url := 'https://njdndrpylsvxoyvflkcq.supabase.co/functions/v1/send-push-notification',
        headers := jsonb_build_object(
          'Authorization', 'Bearer ' || public.get_service_role_key(),
          'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
          'token', recipient_token,
          'title', jsonb_build_object('en', 'New message', 'ar', 'رسالة جديدة'),
          'body', jsonb_build_object(
            'en', (sender_name || ' sent you a message'),
            'ar', ('رسالة جديدة من ' || sender_name)
          ),
          'data', jsonb_build_object(
            'type', 'message',
            'storeId', NEW.store_id,
            'customerId', NEW.customer_id
          )
        )
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'Failed to send push notification: %', SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$$;
