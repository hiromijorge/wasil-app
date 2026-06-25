-- Merchant and driver payout request workflows.
-- Depends on: payouts, driver_payouts, profiles, platform_config.

begin;

-- Default bank/payout details per user.
alter table public.profiles
  add column if not exists payout_details jsonb default '{}'::jsonb;

-- Minimum payout thresholds for merchant and driver.
alter table public.platform_config
  add column if not exists min_merchant_payout_sar numeric default 25;

alter table public.platform_config
  add column if not exists min_driver_payout_sar numeric default 25;

-- Merchant payout requests.
create table if not exists public.merchant_payout_requests (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.profiles(id) on delete cascade,
  store_id uuid references public.stores(id) on delete set null,
  amount_sar numeric not null check (amount_sar > 0),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'paid')),
  payment_method text not null default 'bank_transfer',
  payment_details jsonb default '{}'::jsonb,
  notes text,
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  processed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.merchant_payout_requests enable row level security;

drop policy if exists "Merchants can view own payout requests" on public.merchant_payout_requests;
create policy "Merchants can view own payout requests"
  on public.merchant_payout_requests for select to authenticated
  using (auth.uid() = merchant_id);

drop policy if exists "Merchants can create own payout requests" on public.merchant_payout_requests;
create policy "Merchants can create own payout requests"
  on public.merchant_payout_requests for insert to authenticated
  with check (auth.uid() = merchant_id);

drop policy if exists "Admins can manage merchant payout requests" on public.merchant_payout_requests;
create policy "Admins can manage merchant payout requests"
  on public.merchant_payout_requests for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop trigger if exists update_merchant_payout_requests_updated_at on public.merchant_payout_requests;
create trigger update_merchant_payout_requests_updated_at
  before update on public.merchant_payout_requests
  for each row execute function public.update_updated_at_column();

-- Driver payout requests.
create table if not exists public.driver_payout_requests (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.profiles(id) on delete cascade,
  amount_sar numeric not null check (amount_sar > 0),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'paid')),
  payment_method text not null default 'bank_transfer',
  payment_details jsonb default '{}'::jsonb,
  notes text,
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  processed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.driver_payout_requests enable row level security;

drop policy if exists "Drivers can view own payout requests" on public.driver_payout_requests;
create policy "Drivers can view own payout requests"
  on public.driver_payout_requests for select to authenticated
  using (auth.uid() = driver_id);

drop policy if exists "Drivers can create own payout requests" on public.driver_payout_requests;
create policy "Drivers can create own payout requests"
  on public.driver_payout_requests for insert to authenticated
  with check (auth.uid() = driver_id);

drop policy if exists "Admins can manage driver payout requests" on public.driver_payout_requests;
create policy "Admins can manage driver payout requests"
  on public.driver_payout_requests for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop trigger if exists update_driver_payout_requests_updated_at on public.driver_payout_requests;
create trigger update_driver_payout_requests_updated_at
  before update on public.driver_payout_requests
  for each row execute function public.update_updated_at_column();

-- Available merchant balance: pending payouts minus requested/paid withdrawals.
create or replace function public.merchant_available_balance(p_merchant_id uuid)
returns numeric
language sql
security definer
stable
set search_path = public
as $$
  select
    coalesce((
      select sum(net_sar)
      from public.payouts
      where store_id in (select id from public.stores where owner_id = p_merchant_id)
        and status = 'pending'
    ), 0)
    -
    coalesce((
      select sum(amount_sar)
      from public.merchant_payout_requests
      where merchant_id = p_merchant_id
        and status in ('pending', 'approved', 'paid')
    ), 0);
$$;

-- Available driver balance: pending driver_payouts minus requested/paid withdrawals.
create or replace function public.driver_available_balance(p_driver_id uuid)
returns numeric
language sql
security definer
stable
set search_path = public
as $$
  select
    coalesce((
      select sum(amount_sar)
      from public.driver_payouts
      where driver_id = p_driver_id
        and status = 'pending'
    ), 0)
    -
    coalesce((
      select sum(amount_sar)
      from public.driver_payout_requests
      where driver_id = p_driver_id
        and status in ('pending', 'approved', 'paid')
    ), 0);
$$;

-- Request a merchant payout.
create or replace function public.request_merchant_payout(
  p_merchant_id uuid,
  p_amount_sar numeric,
  p_payment_method text default 'bank_transfer',
  p_payment_details jsonb default '{}'::jsonb,
  p_store_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  min_payout numeric;
  available numeric;
  request_id uuid;
begin
  select coalesce(min_merchant_payout_sar, 25) into min_payout
  from public.platform_config where id = 1;

  if p_amount_sar < min_payout then
    raise exception 'Minimum merchant payout amount is % SAR', min_payout;
  end if;

  available := public.merchant_available_balance(p_merchant_id);

  if p_amount_sar > available then
    raise exception 'Insufficient merchant balance. Available: % SAR', available;
  end if;

  insert into public.merchant_payout_requests (
    merchant_id, store_id, amount_sar, status, payment_method, payment_details
  ) values (
    p_merchant_id, p_store_id, p_amount_sar, 'pending', p_payment_method, p_payment_details
  ) returning id into request_id;

  return request_id;
end;
$$;

-- Request a driver payout.
create or replace function public.request_driver_payout(
  p_driver_id uuid,
  p_amount_sar numeric,
  p_payment_method text default 'bank_transfer',
  p_payment_details jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  min_payout numeric;
  available numeric;
  request_id uuid;
begin
  select coalesce(min_driver_payout_sar, 25) into min_payout
  from public.platform_config where id = 1;

  if p_amount_sar < min_payout then
    raise exception 'Minimum driver payout amount is % SAR', min_payout;
  end if;

  available := public.driver_available_balance(p_driver_id);

  if p_amount_sar > available then
    raise exception 'Insufficient driver balance. Available: % SAR', available;
  end if;

  insert into public.driver_payout_requests (
    driver_id, amount_sar, status, payment_method, payment_details
  ) values (
    p_driver_id, p_amount_sar, 'pending', p_payment_method, p_payment_details
  ) returning id into request_id;

  return request_id;
end;
$$;

-- Process a merchant payout request.
create or replace function public.process_merchant_payout(
  p_request_id uuid,
  p_status text,
  p_processed_by uuid,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.merchant_payout_requests%rowtype;
  remaining numeric;
  p record;
begin
  select * into r from public.merchant_payout_requests where id = p_request_id;
  if not found then raise exception 'Merchant payout request not found'; end if;

  if p_status not in ('approved', 'rejected', 'paid') then
    raise exception 'Invalid status';
  end if;

  update public.merchant_payout_requests
  set status = p_status,
      processed_at = now(),
      processed_by = p_processed_by,
      notes = coalesce(p_notes, notes)
  where id = p_request_id;

  if p_status = 'paid' then
    remaining := r.amount_sar;
    for p in
      select id, net_sar
      from public.payouts
      where store_id in (select id from public.stores where owner_id = r.merchant_id)
        and status = 'pending'
      order by created_at asc
    loop
      if remaining <= 0 then exit; end if;
      update public.payouts
      set status = 'released',
          released_at = now(),
          released_by = p_processed_by
      where id = p.id;
      remaining := remaining - p.net_sar;
    end loop;
  end if;
end;
$$;

-- Process a driver payout request.
create or replace function public.process_driver_payout(
  p_request_id uuid,
  p_status text,
  p_processed_by uuid,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.driver_payout_requests%rowtype;
  remaining numeric;
  dp record;
begin
  select * into r from public.driver_payout_requests where id = p_request_id;
  if not found then raise exception 'Driver payout request not found'; end if;

  if p_status not in ('approved', 'rejected', 'paid') then
    raise exception 'Invalid status';
  end if;

  update public.driver_payout_requests
  set status = p_status,
      processed_at = now(),
      processed_by = p_processed_by,
      notes = coalesce(p_notes, notes)
  where id = p_request_id;

  if p_status = 'paid' then
    remaining := r.amount_sar;
    for dp in
      select id, amount_sar
      from public.driver_payouts
      where driver_id = r.driver_id
        and status = 'pending'
      order by created_at asc
    loop
      if remaining <= 0 then exit; end if;
      update public.driver_payouts
      set status = 'released',
          released_at = now(),
          released_by = p_processed_by
      where id = dp.id;
      remaining := remaining - dp.amount_sar;
    end loop;
  end if;
end;
$$;

commit;
