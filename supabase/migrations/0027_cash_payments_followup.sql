-- Cash payment follow-up: driver RLS on orders and COD payment verification triggers.
-- Depends on: 0026_cash_payments.sql, deliveries, drivers.

begin;

-- Drivers need to read orders linked to their assigned deliveries for COD collection.
drop policy if exists "Drivers can view orders for assigned deliveries" on public.orders;
create policy "Drivers can view orders for assigned deliveries"
  on public.orders for select to authenticated
  using (
    exists (
      select 1
      from public.deliveries
      join public.drivers on drivers.id = deliveries.driver_id
      where deliveries.order_id = orders.id
        and drivers.user_id = auth.uid()
    )
    or public.is_admin()
  );

-- Drivers need to update cash-collection fields on orders they delivered.
drop policy if exists "Drivers can update cash collection on assigned orders" on public.orders;
create policy "Drivers can update cash collection on assigned orders"
  on public.orders for update to authenticated
  using (
    exists (
      select 1
      from public.deliveries
      join public.drivers on drivers.id = deliveries.driver_id
      where deliveries.order_id = orders.id
        and drivers.user_id = auth.uid()
    )
    or public.is_admin()
  )
  with check (
    exists (
      select 1
      from public.deliveries
      join public.drivers on drivers.id = deliveries.driver_id
      where deliveries.order_id = orders.id
        and drivers.user_id = auth.uid()
    )
    or public.is_admin()
  );

-- Trigger: verify COD marketplace order payment once cash is collected.
create or replace function public.verify_cod_order_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.payment_method = 'cash'
     and OLD.cash_collected_sar is null
     and NEW.cash_collected_sar is not null
  then
    NEW.customer_payment_status := 'verified';
  end if;
  return NEW;
end;
$$;

drop trigger if exists verify_cod_order_payment on public.orders;
create trigger verify_cod_order_payment
  before update on public.orders
  for each row execute function public.verify_cod_order_payment();

-- Trigger: verify COD parcel payment once cash is collected.
create or replace function public.verify_cod_parcel_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.payment_method = 'cash'
     and OLD.cash_collected_sar is null
     and NEW.cash_collected_sar is not null
  then
    NEW.payment_status := 'verified';
  end if;
  return NEW;
end;
$$;

drop trigger if exists verify_cod_parcel_payment on public.parcel_deliveries;
create trigger verify_cod_parcel_payment
  before update on public.parcel_deliveries
  for each row execute function public.verify_cod_parcel_payment();

commit;
