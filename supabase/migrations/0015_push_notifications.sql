-- Push notification support
-- Depends on: profiles table and existing orders/messages tables.

-- Enable pg_net extension for HTTP calls from triggers.
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Store Expo push tokens on user profiles.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS push_token text;

-- Users can only update their own push token.
DROP POLICY IF EXISTS "Users can update own push token" ON public.profiles;
CREATE POLICY "Users can update own push token"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Notify merchant when a new order is created for their store.
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
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
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

DROP TRIGGER IF EXISTS order_created_notify ON public.orders;
CREATE TRIGGER order_created_notify
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_order();

-- Notify customer when order status changes.
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
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
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

DROP TRIGGER IF EXISTS order_status_notify ON public.orders;
CREATE TRIGGER order_status_notify
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_order_status_change();

-- Notify message recipient.
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
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
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

DROP TRIGGER IF EXISTS message_notify ON public.messages;
CREATE TRIGGER message_notify
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_message();
