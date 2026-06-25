-- COD guardrails: prevent drivers from accepting new COD jobs when their unsettled cash exceeds the configured limit.
-- Depends on: 0028_cod_notifications.sql, driver_unsettled_cod_balance function.

begin;

-- Helper: check whether a driver is below the max unsettled cash threshold.
create or replace function public.check_driver_cod_limit(p_driver_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  max_cash numeric;
  balance numeric;
begin
  select coalesce(cod_max_unsettled_cash_sar, 300)
    into max_cash
  from public.platform_config
  limit 1;

  select public.driver_unsettled_cod_balance(p_driver_id) into balance;

  return coalesce(balance, 0) < coalesce(max_cash, 300);
end;
$$;

-- Enforce on marketplace deliveries.
create or replace function public.enforce_delivery_cod_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_cod boolean := false;
begin
  if NEW.driver_id is null then
    return NEW;
  end if;

  if public.is_admin() then
    return NEW;
  end if;

  if TG_OP = 'INSERT' or OLD.driver_id is distinct from NEW.driver_id then
    select (payment_method = 'cash') into is_cod
    from public.orders
    where id = NEW.order_id;

    if is_cod and not public.check_driver_cod_limit(NEW.driver_id) then
      raise exception 'Driver has exceeded the maximum unsettled cash limit and cannot accept COD deliveries.';
    end if;
  end if;

  return NEW;
end;
$$;

drop trigger if exists enforce_delivery_cod_limit_insert on public.deliveries;
create trigger enforce_delivery_cod_limit_insert
  before insert on public.deliveries
  for each row execute function public.enforce_delivery_cod_limit();

drop trigger if exists enforce_delivery_cod_limit_update on public.deliveries;
create trigger enforce_delivery_cod_limit_update
  before update on public.deliveries
  for each row execute function public.enforce_delivery_cod_limit();

-- Enforce on parcel deliveries.
create or replace function public.enforce_parcel_cod_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.driver_id is null then
    return NEW;
  end if;

  if public.is_admin() then
    return NEW;
  end if;

  if (TG_OP = 'INSERT' or OLD.driver_id is distinct from NEW.driver_id)
     and NEW.payment_method = 'cash'
     and not public.check_driver_cod_limit(NEW.driver_id)
  then
    raise exception 'Driver has exceeded the maximum unsettled cash limit and cannot accept COD parcels.';
  end if;

  return NEW;
end;
$$;

drop trigger if exists enforce_parcel_cod_limit_insert on public.parcel_deliveries;
create trigger enforce_parcel_cod_limit_insert
  before insert on public.parcel_deliveries
  for each row execute function public.enforce_parcel_cod_limit();

drop trigger if exists enforce_parcel_cod_limit_update on public.parcel_deliveries;
create trigger enforce_parcel_cod_limit_update
  before update on public.parcel_deliveries
  for each row execute function public.enforce_parcel_cod_limit();

commit;
