-- COD collection push notifications.
-- Depends on: 0027_cash_payments_followup.sql, profiles.push_token.

begin;

-- Notify customer when cash is collected for their COD marketplace order.
create or replace function public.notify_cod_order_collected()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  customer_token text;
begin
  if NEW.payment_method != 'cash' then
    return NEW;
  end if;
  if OLD.cash_collected_sar is not null or NEW.cash_collected_sar is null then
    return NEW;
  end if;

  select push_token into customer_token
  from public.profiles
  where id = NEW.customer_id;

  if customer_token is not null then
    begin
      perform net.http_post(
        url := 'https://njdndrpylsvxoyvflkcq.supabase.co/functions/v1/send-push-notification',
        headers := jsonb_build_object(
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
          'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
          'token', customer_token,
          'title', jsonb_build_object('en', 'Payment collected', 'ar', 'تم تحصيل الدفع'),
          'body', jsonb_build_object(
            'en', 'Cash for your order has been collected by the driver.',
            'ar', 'تم تحصيل نقدية طلبك من السائق.'
          ),
          'data', jsonb_build_object('type', 'order', 'orderId', NEW.id)
        )
      );
    exception when others then
      raise log 'Failed to send COD order push notification: %', SQLERRM;
    end;
  end if;

  return NEW;
end;
$$;

drop trigger if exists cod_order_collected_notify on public.orders;
create trigger cod_order_collected_notify
  after update on public.orders
  for each row execute function public.notify_cod_order_collected();

-- Notify parcel sender when cash is collected for their COD parcel.
create or replace function public.notify_cod_parcel_collected()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sender_token text;
begin
  if NEW.payment_method != 'cash' then
    return NEW;
  end if;
  if OLD.cash_collected_sar is not null or NEW.cash_collected_sar is null then
    return NEW;
  end if;

  select push_token into sender_token
  from public.profiles
  where id = NEW.sender_id;

  if sender_token is not null then
    begin
      perform net.http_post(
        url := 'https://njdndrpylsvxoyvflkcq.supabase.co/functions/v1/send-push-notification',
        headers := jsonb_build_object(
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
          'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
          'token', sender_token,
          'title', jsonb_build_object('en', 'Parcel payment collected', 'ar', 'تم تحصيل أجرة الطرد'),
          'body', jsonb_build_object(
            'en', 'Cash for your parcel delivery has been collected by the driver.',
            'ar', 'تم تحصيل نقدية توصيل طردك من السائق.'
          ),
          'data', jsonb_build_object('type', 'parcel', 'parcelId', NEW.id)
        )
      );
    exception when others then
      raise log 'Failed to send COD parcel push notification: %', SQLERRM;
    end;
  end if;

  return NEW;
end;
$$;

drop trigger if exists cod_parcel_collected_notify on public.parcel_deliveries;
create trigger cod_parcel_collected_notify
  after update on public.parcel_deliveries
  for each row execute function public.notify_cod_parcel_collected();

commit;
