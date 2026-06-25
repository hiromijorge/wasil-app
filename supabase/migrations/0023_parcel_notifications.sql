-- Parcel push notifications
-- Depends on: profiles.push_token, parcel_deliveries table.

begin;

-- Store user language preference for localized push notifications.
alter table public.profiles
  add column if not exists language text default 'en';

-- Notify customer when a parcel delivery status changes.
create or replace function public.notify_parcel_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  customer_token text;
  customer_lang text;
  driver_token text;
  driver_lang text;
begin
  -- Notify customer on status change.
  if tg_op = 'UPDATE' and old.status is distinct from new.status then
    select push_token, coalesce(language, 'en')
    into customer_token, customer_lang
    from public.profiles
    where id = new.customer_id;

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
            'lang', customer_lang,
            'title', jsonb_build_object(
              'en', 'Parcel update',
              'ar', 'تحديث الشحنة'
            ),
            'body', jsonb_build_object(
              'en', 'Your parcel is now: ' || new.status,
              'ar', 'شحنتك الآن: ' || new.status
            ),
            'data', jsonb_build_object(
              'type', 'parcel',
              'parcelId', new.id,
              'status', new.status
            )
          )
        );
      exception when others then
        raise log 'Failed to send parcel customer notification: %', sqlerrm;
      end;
    end if;
  end if;

  -- Notify driver when assigned to a parcel.
  if tg_op = 'INSERT' or old.driver_id is distinct from new.driver_id then
    if new.driver_id is not null then
      select push_token, coalesce(language, 'en')
      into driver_token, driver_lang
      from public.profiles
      where id = new.driver_id;

      if driver_token is not null then
        begin
          perform net.http_post(
            url := 'https://njdndrpylsvxoyvflkcq.supabase.co/functions/v1/send-push-notification',
            headers := jsonb_build_object(
              'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
              'Content-Type', 'application/json'
            ),
            body := jsonb_build_object(
              'token', driver_token,
              'lang', driver_lang,
              'title', jsonb_build_object(
                'en', 'New parcel delivery',
                'ar', 'توصيلة شحن جديدة'
              ),
              'body', jsonb_build_object(
                'en', 'You have been assigned a new parcel delivery.',
                'ar', 'لديك توصيلة شحن جديدة مخصصة لك.'
              ),
              'data', jsonb_build_object(
                'type', 'parcel',
                'parcelId', new.id,
                'status', new.status
              )
            )
          );
        exception when others then
          raise log 'Failed to send parcel driver notification: %', sqlerrm;
        end;
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists parcel_status_notify on public.parcel_deliveries;
create trigger parcel_status_notify
after insert or update on public.parcel_deliveries
for each row
execute function public.notify_parcel_status_change();

commit;
