-- Escrow marketplace payout model, SAR-only.
-- Customer pays Wasil, Wasil pays merchant after delivery minus commission + fees.

-- 1. Platform config: SAR-based commission and partner settings
ALTER TABLE platform_config
  ADD COLUMN IF NOT EXISTS commission_percent numeric NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS minimum_commission_sar numeric NOT NULL DEFAULT 0.5,
  ADD COLUMN IF NOT EXISTS partner_commission_percent numeric NOT NULL DEFAULT 10;

-- Keep transaction_fee_usd for backwards compatibility; it is no longer used by the app.

-- 2. Subscription plans: add SAR prices
ALTER TABLE subscription_plans
  ADD COLUMN IF NOT EXISTS price_sar numeric;

UPDATE subscription_plans SET price_sar = 0 WHERE id = 'free';
UPDATE subscription_plans SET price_sar = 12 WHERE id = 'pro';
UPDATE subscription_plans SET price_sar = 23 WHERE id = 'business';

ALTER TABLE subscription_plans
  ALTER COLUMN price_sar SET NOT NULL;

-- 3. Bank accounts (Wasil receiving accounts and payout accounts)
CREATE TABLE IF NOT EXISTS bank_accounts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  bank_name text NOT NULL,
  account_number text NOT NULL,
  account_holder text NOT NULL,
  branch text,
  is_default boolean NOT NULL DEFAULT false,
  for_payouts boolean NOT NULL DEFAULT false,
  for_receipts boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed a default receiving account (replace with real details after admin setup)
INSERT INTO bank_accounts (name, bank_name, account_number, account_holder, is_default, for_receipts, for_payouts)
VALUES (
  'Wasil Main Account',
  'Please configure in admin',
  '000000000000',
  'Wasil Yemen Connect',
  true,
  true,
  false
)
ON CONFLICT (id) DO NOTHING;

-- 4. Update orders table for escrow workflow
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS subtotal numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS customer_payment_status text NOT NULL DEFAULT 'pending'
    CHECK (customer_payment_status IN ('pending', 'verified', 'rejected')),
  ADD COLUMN IF NOT EXISTS payment_receipt_url text,
  ADD COLUMN IF NOT EXISTS payment_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_verified_by uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS subtotal_sar numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_sar numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_fee_sar numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS plan_fee_deduction_sar numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivered_photo_url text,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS auto_confirm_at timestamptz,
  ADD COLUMN IF NOT EXISTS dispute_status text CHECK (dispute_status IN ('open', 'resolved', 'refunded')),
  ADD COLUMN IF NOT EXISTS dispute_reason text,
  ADD COLUMN IF NOT EXISTS dispute_photo_url text,
  ADD COLUMN IF NOT EXISTS dispute_resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS dispute_resolution text;

-- Align order status values to escrow + delivery flow
ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('new', 'paid', 'preparing', 'ready', 'driver_assigned', 'picked_up', 'on_the_way', 'delivered', 'completed', 'cancelled', 'disputed'));

-- 5. Merchant subscription charges (monthly plan fee tracking)
CREATE TABLE IF NOT EXISTS subscription_charges (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  plan_id text NOT NULL REFERENCES subscription_plans(id),
  amount_sar numeric NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  status text NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'pending_verification', 'paid', 'overdue')),
  receipt_url text,
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscription_charges_store_id ON subscription_charges(store_id);
CREATE INDEX IF NOT EXISTS idx_subscription_charges_status ON subscription_charges(status);

-- Ensure columns exist for idempotent re-runs
ALTER TABLE subscription_charges
  ADD COLUMN IF NOT EXISTS receipt_url text,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

ALTER TABLE subscription_charges
  DROP CONSTRAINT IF EXISTS subscription_charges_status_check;

ALTER TABLE subscription_charges
  ADD CONSTRAINT subscription_charges_status_check
  CHECK (status IN ('unpaid', 'pending_verification', 'paid', 'overdue'));

-- 6. Merchant payouts
CREATE TABLE IF NOT EXISTS payouts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  gross_sar numeric NOT NULL,              -- product subtotal
  commission_sar numeric NOT NULL DEFAULT 0,
  delivery_fee_sar numeric NOT NULL DEFAULT 0,
  driver_fee_sar numeric NOT NULL DEFAULT 0,
  plan_fee_deduction_sar numeric NOT NULL DEFAULT 0,
  net_sar numeric NOT NULL,                -- amount merchant receives
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'released')),
  released_at timestamptz,
  released_by uuid REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payouts_store_id ON payouts(store_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_order_id ON payouts(order_id);

-- 7. Helper functions

-- Calculate commission (3% + min 0.5 SAR)
CREATE OR REPLACE FUNCTION public.calculate_commission(amount_sar numeric)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  pct numeric;
  min_fee numeric;
BEGIN
  SELECT commission_percent, minimum_commission_sar
  INTO pct, min_fee
  FROM platform_config
  WHERE id = 1;

  pct := COALESCE(pct, 3);
  min_fee := COALESCE(min_fee, 0.5);

  RETURN GREATEST(min_fee, ROUND((amount_sar * pct / 100) * 100) / 100);
END;
$$;

-- Create or get current open subscription charge for a store
CREATE OR REPLACE FUNCTION public.get_or_create_subscription_charge(store_uuid uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  charge_id uuid;
  store_record stores%ROWTYPE;
  plan_price numeric;
  start_date date;
  end_date date;
BEGIN
  SELECT * INTO store_record FROM stores WHERE id = store_uuid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Store not found';
  END IF;

  SELECT price_sar INTO plan_price FROM subscription_plans WHERE id = store_record.plan_id;
  plan_price := COALESCE(plan_price, 0);

  SELECT id INTO charge_id
  FROM subscription_charges
  WHERE store_id = store_uuid
    AND status IN ('unpaid', 'paid')
    AND CURRENT_DATE BETWEEN period_start AND period_end
  ORDER BY period_start DESC
  LIMIT 1;

  IF charge_id IS NULL THEN
    start_date := date_trunc('month', CURRENT_DATE)::date;
    end_date := (date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day')::date;

    INSERT INTO subscription_charges (store_id, plan_id, amount_sar, period_start, period_end)
    VALUES (store_uuid, store_record.plan_id, plan_price, start_date, end_date)
    RETURNING id INTO charge_id;
  END IF;

  RETURN charge_id;
END;
$$;

-- Get outstanding subscription amount for a store
CREATE OR REPLACE FUNCTION public.get_outstanding_subscription(store_uuid uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total numeric;
BEGIN
  SELECT COALESCE(SUM(amount_sar), 0)
  INTO total
  FROM subscription_charges
  WHERE store_id = store_uuid
    AND status IN ('unpaid', 'overdue');

  RETURN total;
END;
$$;

-- Recompute store restriction (overdue > 7 days)
CREATE OR REPLACE FUNCTION public.recompute_store_restriction(store_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  overdue_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM subscription_charges
    WHERE store_id = store_uuid
      AND status IN ('unpaid', 'overdue')
      AND CURRENT_DATE > period_end + interval '7 days'
  )
  INTO overdue_exists;

  IF overdue_exists THEN
    UPDATE stores
    SET restriction_active = true,
        restriction_reason = 'Monthly plan fee overdue for more than 7 days'
    WHERE id = store_uuid;
  ELSE
    UPDATE stores
    SET restriction_active = false,
        restriction_reason = null
    WHERE id = store_uuid;
  END IF;
END;
$$;

-- Create payout when order is completed
CREATE OR REPLACE FUNCTION public.create_order_payout(order_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ord orders%ROWTYPE;
  comm numeric;
  outstanding_sub numeric;
  plan_deduction numeric;
  net_payout numeric;
  driver_fee numeric := 0;
BEGIN
  SELECT * INTO ord FROM orders WHERE id = order_uuid;
  IF NOT FOUND THEN RETURN; END IF;

  comm := public.calculate_commission(ord.subtotal_sar);

  -- Auto-create subscription charge if missing, then get outstanding amount
  PERFORM public.get_or_create_subscription_charge(ord.store_id);
  outstanding_sub := public.get_outstanding_subscription(ord.store_id);

  -- Deduct up to the order's net (after commission) from outstanding subscription
  plan_deduction := LEAST(outstanding_sub, GREATEST(0, ord.subtotal_sar - comm));

  -- For now, if a system driver was used, the driver fee is the delivery fee.
  -- Merchant's own driver keeps the fee separately.
  IF ord.delivery_type = 'delivery' THEN
    driver_fee := ord.delivery_fee_sar; -- simplified; refined in driver migration
  END IF;

  net_payout := ord.subtotal_sar - comm - plan_deduction;

  INSERT INTO payouts (
    order_id,
    store_id,
    gross_sar,
    commission_sar,
    delivery_fee_sar,
    driver_fee_sar,
    plan_fee_deduction_sar,
    net_sar,
    status
  )
  VALUES (
    order_uuid,
    ord.store_id,
    ord.subtotal_sar,
    comm,
    ord.delivery_fee_sar,
    driver_fee,
    plan_deduction,
    net_payout,
    'pending'
  );

  -- Mark subscription charge as paid up to the deduction amount
  IF plan_deduction > 0 THEN
    WITH charge AS (
      SELECT id
      FROM subscription_charges
      WHERE store_id = ord.store_id
        AND status IN ('unpaid', 'overdue')
      ORDER BY period_start ASC
      LIMIT 1
      FOR UPDATE
    )
    UPDATE subscription_charges sc
    SET status = 'paid',
        paid_at = now()
    FROM charge
    WHERE sc.id = charge.id;
  END IF;

  PERFORM public.recompute_store_restriction(ord.store_id);
END;
$$;

-- Trigger: on order completed, create payout
CREATE OR REPLACE FUNCTION public.on_order_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    NEW.completed_at := now();
    PERFORM public.create_order_payout(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS order_completed_payout ON orders;
CREATE TRIGGER order_completed_payout
  BEFORE UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION public.on_order_completed();

-- Auto-confirm delivered orders after 7 days and no dispute
CREATE OR REPLACE FUNCTION public.auto_confirm_delivered_orders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer := 0;
BEGIN
  UPDATE orders
  SET status = 'completed',
      completed_at = now(),
      auto_confirm_at = now()
  WHERE status = 'delivered'
    AND dispute_status IS NULL
    AND delivered_at IS NOT NULL
    AND now() > delivered_at + interval '7 days';

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- Create monthly subscription charges for all stores (run on 1st of each month)
CREATE OR REPLACE FUNCTION public.create_monthly_subscription_charges()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_count integer := 0;
BEGIN
  INSERT INTO subscription_charges (store_id, plan_id, amount_sar, period_start, period_end)
  SELECT
    s.id,
    s.plan_id,
    COALESCE(sp.price_sar, 0),
    date_trunc('month', CURRENT_DATE)::date,
    (date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day')::date
  FROM stores s
  JOIN subscription_plans sp ON sp.id = s.plan_id
  WHERE NOT EXISTS (
    SELECT 1 FROM subscription_charges sc
    WHERE sc.store_id = s.id
      AND sc.period_start = date_trunc('month', CURRENT_DATE)::date
  );

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$;

-- RLS for new tables
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Bank accounts are viewable by authenticated users" ON bank_accounts;
CREATE POLICY "Bank accounts are viewable by authenticated users"
  ON bank_accounts FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage bank accounts" ON bank_accounts;
CREATE POLICY "Admins can manage bank accounts"
  ON bank_accounts FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Merchants can view their store subscription charges" ON subscription_charges;
CREATE POLICY "Merchants can view their store subscription charges"
  ON subscription_charges FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = subscription_charges.store_id AND stores.owner_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage subscription charges" ON subscription_charges;
CREATE POLICY "Admins can manage subscription charges"
  ON subscription_charges FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Merchants can view their payouts" ON payouts;
CREATE POLICY "Merchants can view their payouts"
  ON payouts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = payouts.store_id AND stores.owner_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage payouts" ON payouts;
CREATE POLICY "Admins can manage payouts"
  ON payouts FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
