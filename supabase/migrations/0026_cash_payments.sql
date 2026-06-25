-- Cash payment support for marketplace orders and parcel deliveries.
-- Depends on: orders, parcel_deliveries, deliveries, platform_config.

begin;

-- Payment method on orders and parcels.
alter table public.orders
  add column if not exists payment_method text not null default 'bank_transfer'
    check (payment_method in ('bank_transfer', 'cash'));

alter table public.parcel_deliveries
  add column if not exists payment_method text not null default 'bank_transfer'
    check (payment_method in ('bank_transfer', 'cash'));

-- For parcels, who pays cash: sender or receiver.
alter table public.parcel_deliveries
  add column if not exists cash_payer text default 'receiver'
    check (cash_payer in ('sender', 'receiver'));

-- Cash collection tracking on orders.
alter table public.orders
  add column if not exists cash_collected_sar numeric,
  add column if not exists cash_collected_at timestamptz,
  add column if not exists cash_collected_by uuid references public.profiles(id) on delete set null,
  add column if not exists cash_receipt_photo_url text;

-- Cash collection tracking on parcels.
alter table public.parcel_deliveries
  add column if not exists cash_collected_sar numeric,
  add column if not exists cash_collected_at timestamptz,
  add column if not exists cash_collected_by uuid references public.profiles(id) on delete set null,
  add column if not exists cash_receipt_photo_url text;

-- Driver fee for parcel deliveries (used for COD settlement).
alter table public.parcel_deliveries
  add column if not exists driver_fee_sar numeric default 0;

-- COD platform configuration.
alter table public.platform_config
  add column if not exists cod_weekly_settlement_days integer default 7,
  add column if not exists cod_max_unsettled_cash_sar numeric default 300,
  add column if not exists cod_high_value_threshold_sar numeric default 300,
  add column if not exists parcel_driver_fee_percent numeric default 70;

-- Driver cash settlements (weekly settlement records).
create table if not exists public.driver_cash_settlements (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.profiles(id) on delete cascade,
  period_start timestamptz not null,
  period_end timestamptz not null,
  cash_collected_sar numeric not null default 0,
  driver_fee_sar numeric not null default 0,
  remitted_sar numeric not null default 0,
  status text not null default 'pending' check (status in ('pending', 'settled')),
  settled_at timestamptz,
  settled_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.driver_cash_settlements enable row level security;

drop policy if exists "Drivers can view own settlements" on public.driver_cash_settlements;
create policy "Drivers can view own settlements"
  on public.driver_cash_settlements for select to authenticated
  using (auth.uid() = driver_id);

drop policy if exists "Admins can manage settlements" on public.driver_cash_settlements;
create policy "Admins can manage settlements"
  on public.driver_cash_settlements for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop trigger if exists update_driver_cash_settlements_updated_at on public.driver_cash_settlements;
create trigger update_driver_cash_settlements_updated_at
  before update on public.driver_cash_settlements
  for each row execute function public.update_updated_at_column();

-- Drivers can see cash parcels (payment status may be pending until collected).
drop policy if exists "Drivers can view available parcels" on public.parcel_deliveries;
create policy "Drivers can view available parcels"
  on public.parcel_deliveries for select to authenticated
  using (
    (
      driver_id is null
      and status = 'pending'
      and (
        payment_status = 'verified'
        or payment_method = 'cash'
      )
    )
    or exists (
      select 1 from public.drivers
      where drivers.id = parcel_deliveries.driver_id
        and drivers.user_id = auth.uid()
    )
    or public.is_admin()
  );

drop policy if exists "Drivers can update assigned parcels" on public.parcel_deliveries;
create policy "Drivers can update assigned parcels"
  on public.parcel_deliveries for update to authenticated
  using (
    exists (
      select 1 from public.drivers
      where drivers.id = parcel_deliveries.driver_id
        and drivers.user_id = auth.uid()
    )
    or (
      driver_id is null
      and status = 'pending'
      and (
        payment_status = 'verified'
        or payment_method = 'cash'
      )
    )
    or public.is_admin()
  )
  with check (
    exists (
      select 1 from public.drivers
      where drivers.id = parcel_deliveries.driver_id
        and drivers.user_id = auth.uid()
    )
    or public.is_admin()
  );

-- Function: driver's current unsettled COD balance.
create or replace function public.driver_unsettled_cod_balance(p_driver_id uuid)
returns numeric
language sql
security definer
stable
set search_path = public
as $$
  with collected as (
    -- marketplace COD cash collected by driver
    select
      coalesce(sum(o.cash_collected_sar - o.delivery_fee_sar), 0) as amount
    from public.orders o
    join public.deliveries d on d.order_id = o.id
    where d.driver_id = p_driver_id
      and o.payment_method = 'cash'
      and o.cash_collected_sar is not null
      and o.status = 'completed'
    union all
    -- parcel COD cash collected by driver
    select
      coalesce(sum(p.cash_collected_sar - p.driver_fee_sar), 0) as amount
    from public.parcel_deliveries p
    where p.driver_id = p_driver_id
      and p.payment_method = 'cash'
      and p.cash_collected_sar is not null
      and p.status = 'delivered'
  ),
  settled as (
    select coalesce(sum(remitted_sar), 0) as amount
    from public.driver_cash_settlements
    where driver_id = p_driver_id
      and status = 'settled'
  )
  select (select coalesce(sum(amount), 0) from collected) - (select amount from settled);
$$;

-- Function: total COD cash collected by driver (gross).
create or replace function public.driver_cod_collected_sar(p_driver_id uuid)
returns numeric
language sql
security definer
stable
set search_path = public
as $$
  select
    coalesce((
      select sum(o.cash_collected_sar)
      from public.orders o
      join public.deliveries d on d.order_id = o.id
      where d.driver_id = p_driver_id
        and o.payment_method = 'cash'
        and o.cash_collected_sar is not null
        and o.status = 'completed'
    ), 0)
    +
    coalesce((
      select sum(p.cash_collected_sar)
      from public.parcel_deliveries p
      where p.driver_id = p_driver_id
        and p.payment_method = 'cash'
        and p.cash_collected_sar is not null
        and p.status = 'delivered'
    ), 0);
$$;

-- Function: total driver fee earned from COD.
create or replace function public.driver_cod_fee_sar(p_driver_id uuid)
returns numeric
language sql
security definer
stable
set search_path = public
as $$
  select
    coalesce((
      select sum(o.delivery_fee_sar)
      from public.orders o
      join public.deliveries d on d.order_id = o.id
      where d.driver_id = p_driver_id
        and o.payment_method = 'cash'
        and o.cash_collected_sar is not null
        and o.status = 'completed'
    ), 0)
    +
    coalesce((
      select sum(p.driver_fee_sar)
      from public.parcel_deliveries p
      where p.driver_id = p_driver_id
        and p.payment_method = 'cash'
        and p.cash_collected_sar is not null
        and p.status = 'delivered'
    ), 0);
$$;

commit;
