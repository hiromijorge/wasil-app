-- Partner payout requests and admin approval workflow.
-- Depends on: commissions, referrals, profiles, platform_config.

begin;

-- Minimum partner payout threshold, configurable by admin.
alter table public.platform_config
  add column if not exists min_partner_payout_sar numeric default 25;

-- Partner payout requests.
create table if not exists public.partner_payout_requests (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.profiles(id) on delete cascade,
  amount_sar numeric not null check (amount_sar > 0),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'paid')),
  payment_method text,
  payment_details jsonb default '{}'::jsonb,
  notes text,
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  processed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.partner_payout_requests enable row level security;

drop policy if exists "Partners can view own payout requests" on public.partner_payout_requests;
create policy "Partners can view own payout requests"
  on public.partner_payout_requests for select to authenticated
  using (auth.uid() = partner_id);

drop policy if exists "Partners can create own payout requests" on public.partner_payout_requests;
create policy "Partners can create own payout requests"
  on public.partner_payout_requests for insert to authenticated
  with check (auth.uid() = partner_id);

drop policy if exists "Admins can manage payout requests" on public.partner_payout_requests;
create policy "Admins can manage payout requests"
  on public.partner_payout_requests for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop trigger if exists update_partner_payout_requests_updated_at on public.partner_payout_requests;
create trigger update_partner_payout_requests_updated_at
  before update on public.partner_payout_requests
  for each row execute function public.update_updated_at_column();

-- Track which commissions were paid by which payout.
alter table public.commissions
  add column if not exists partner_payout_request_id uuid references public.partner_payout_requests(id) on delete set null,
  add column if not exists paid_at timestamptz;

-- Compute available partner balance (pending commissions minus requested/paid payouts).
create or replace function public.partner_available_balance(p_partner_id uuid)
returns numeric
language sql
security definer
stable
set search_path = public
as $$
  select
    coalesce((
      select sum(c.amount_sar)
      from public.commissions c
      join public.referrals r on r.id = c.referral_id
      where r.referrer_id = p_partner_id
        and c.status = 'pending'
    ), 0)
    -
    coalesce((
      select sum(amount_sar)
      from public.partner_payout_requests
      where partner_id = p_partner_id
        and status in ('pending', 'approved', 'paid')
    ), 0);
$$;

-- Create a partner payout request if balance is sufficient.
create or replace function public.request_partner_payout(
  p_partner_id uuid,
  p_amount_sar numeric,
  p_payment_method text default null,
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
  select coalesce(min_partner_payout_sar, 25) into min_payout
  from public.platform_config where id = 1;

  if p_amount_sar < min_payout then
    raise exception 'Minimum payout amount is % SAR', min_payout;
  end if;

  available := public.partner_available_balance(p_partner_id);

  if p_amount_sar > available then
    raise exception 'Insufficient balance. Available: % SAR', available;
  end if;

  insert into public.partner_payout_requests (
    partner_id, amount_sar, status, payment_method, payment_details
  ) values (
    p_partner_id, p_amount_sar, 'pending', p_payment_method, p_payment_details
  ) returning id into request_id;

  return request_id;
end;
$$;

-- Process a payout: mark oldest pending commissions as paid up to the payout amount.
create or replace function public.process_partner_payout(
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
  r public.partner_payout_requests%rowtype;
  remaining numeric;
  c record;
begin
  select * into r from public.partner_payout_requests where id = p_request_id;
  if not found then raise exception 'Payout request not found'; end if;

  if p_status not in ('approved', 'rejected', 'paid') then
    raise exception 'Invalid status';
  end if;

  update public.partner_payout_requests
  set status = p_status,
      processed_at = now(),
      processed_by = p_processed_by,
      notes = coalesce(p_notes, notes)
  where id = p_request_id;

  if p_status = 'paid' then
    remaining := r.amount_sar;
    for c in
      select c.id, c.amount_sar
      from public.commissions c
      join public.referrals ref on ref.id = c.referral_id
      where ref.referrer_id = r.partner_id
        and c.status = 'pending'
        and c.partner_payout_request_id is null
      order by c.created_at asc
    loop
      if remaining <= 0 then exit; end if;
      update public.commissions
      set status = 'paid',
          paid_at = now(),
          partner_payout_request_id = p_request_id
      where id = c.id;
      remaining := remaining - c.amount_sar;
    end loop;
  end if;
end;
$$;

commit;
