-- Driver management & delivery workflow, SAR-only.

-- 1. Driver document/photo fields and status values
ALTER TABLE drivers
  ADD COLUMN IF NOT EXISTS profile_photo_url text,
  ADD COLUMN IF NOT EXISTS driver_photo_url text,
  ADD COLUMN IF NOT EXISTS vehicle_photo_url text,
  ADD COLUMN IF NOT EXISTS earnings_total_sar numeric NOT NULL DEFAULT 0;

ALTER TABLE drivers
  DROP CONSTRAINT IF EXISTS drivers_status_check;

ALTER TABLE drivers
  ADD CONSTRAINT drivers_status_check
  CHECK (status IN ('pending_review', 'active', 'suspended', 'inactive'));

-- 2. Delivery status workflow
ALTER TABLE deliveries
  ADD COLUMN IF NOT EXISTS delivery_fee_sar numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS proof_photo_url text,
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS customer_address text,
  ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE deliveries
  DROP CONSTRAINT IF EXISTS deliveries_status_check;

ALTER TABLE deliveries
  ADD CONSTRAINT deliveries_status_check
  CHECK (status IN ('assigned', 'accepted', 'picked_up', 'on_the_way', 'delivered'));

-- 3. Driver payouts
CREATE TABLE IF NOT EXISTS driver_payouts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id uuid NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  delivery_id uuid REFERENCES deliveries(id) ON DELETE SET NULL,
  amount_sar numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'released')),
  released_at timestamptz,
  released_by uuid REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_driver_payouts_driver_id ON driver_payouts(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_payouts_status ON driver_payouts(status);

-- Unique constraints needed for upserts and data integrity
ALTER TABLE drivers
  DROP CONSTRAINT IF EXISTS drivers_user_id_unique;
ALTER TABLE drivers
  ADD CONSTRAINT drivers_user_id_unique UNIQUE (user_id);

ALTER TABLE referrals
  DROP CONSTRAINT IF EXISTS referrals_referrer_merchant_unique;
ALTER TABLE referrals
  ADD CONSTRAINT referrals_referrer_merchant_unique UNIQUE (referrer_id, referred_merchant_id);

-- 4. Driver earnings update helper
CREATE OR REPLACE FUNCTION public.increment_driver_earnings(driver_uuid uuid, amount_sar numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE drivers
  SET earnings_total_sar = earnings_total_sar + amount_sar,
      deliveries_completed = deliveries_completed + 1,
      last_active_at = now()
  WHERE id = driver_uuid;
END;
$$;

-- 5. Override create_order_payout to handle system driver vs merchant driver
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
  system_driver_id uuid;
  del_record deliveries%ROWTYPE;
BEGIN
  SELECT * INTO ord FROM orders WHERE id = order_uuid;
  IF NOT FOUND THEN RETURN; END IF;

  comm := public.calculate_commission(ord.subtotal_sar);

  PERFORM public.get_or_create_subscription_charge(ord.store_id);
  outstanding_sub := public.get_outstanding_subscription(ord.store_id);

  plan_deduction := LEAST(outstanding_sub, GREATEST(0, ord.subtotal_sar - comm));

  -- Check if a system driver delivered this order
  SELECT * INTO del_record
  FROM deliveries
  WHERE order_id = order_uuid
    AND driver_id IS NOT NULL
  LIMIT 1;

  IF del_record.id IS NOT NULL THEN
    -- Wasil-assigned driver: driver gets delivery fee, merchant does not
    driver_fee := ord.delivery_fee_sar;
  ELSE
    -- Merchant's own driver or pickup: merchant keeps delivery fee
    driver_fee := 0;
  END IF;

  net_payout := ord.subtotal_sar + (ord.delivery_fee_sar - driver_fee) - comm - plan_deduction;

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

  -- Create driver payout if system driver
  IF del_record.id IS NOT NULL AND driver_fee > 0 THEN
    INSERT INTO driver_payouts (driver_id, delivery_id, amount_sar, status)
    VALUES (del_record.driver_id, del_record.id, driver_fee, 'pending');

    PERFORM public.increment_driver_earnings(del_record.driver_id, driver_fee);
  END IF;

  -- Mark subscription charges as paid up to deduction amount
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

-- 6. Trigger: when delivery is marked delivered, update order and photo
CREATE OR REPLACE FUNCTION public.on_delivery_updated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'delivered' AND OLD.status IS DISTINCT FROM 'delivered' THEN
    NEW.delivered_at := now();

    UPDATE orders
    SET status = 'delivered',
        delivered_at = now(),
        delivered_photo_url = NEW.proof_photo_url,
        auto_confirm_at = now() + interval '7 days'
    WHERE id = NEW.order_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS delivery_status_sync ON deliveries;
CREATE TRIGGER delivery_status_sync
  BEFORE UPDATE OF status ON deliveries
  FOR EACH ROW
  EXECUTE FUNCTION public.on_delivery_updated();

-- 7. Helper to create a delivery record (merchant assigns or broadcast)
CREATE OR REPLACE FUNCTION public.create_delivery(
  order_uuid uuid,
  driver_uuid uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ord orders%ROWTYPE;
  store_record stores%ROWTYPE;
  new_delivery_id uuid;
  initial_status text;
BEGIN
  SELECT * INTO ord FROM orders WHERE id = order_uuid;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;

  SELECT * INTO store_record FROM stores WHERE id = ord.store_id;

  IF driver_uuid IS NOT NULL THEN
    initial_status := 'assigned';
  ELSE
    initial_status := 'assigned'; -- will be picked up by available driver
  END IF;

  INSERT INTO deliveries (
    order_id,
    driver_id,
    store_id,
    status,
    delivery_fee_sar,
    distance_km,
    pickup_location,
    delivery_location,
    customer_name,
    customer_phone,
    customer_address,
    notes
  )
  VALUES (
    order_uuid,
    driver_uuid,
    ord.store_id,
    initial_status,
    ord.delivery_fee_sar,
    ord.distance_km,
    jsonb_build_object('address', store_record.location),
    jsonb_build_object('address', ord.address),
    (SELECT full_name FROM profiles WHERE id = ord.customer_id),
    ord.phone,
    ord.address,
    ord.notes
  )
  RETURNING id INTO new_delivery_id;

  UPDATE orders SET status = 'driver_assigned' WHERE id = order_uuid;

  RETURN new_delivery_id;
END;
$$;

-- 8. RLS
ALTER TABLE driver_payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Drivers can view their own payouts" ON driver_payouts;
CREATE POLICY "Drivers can view their own payouts"
  ON driver_payouts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM drivers WHERE drivers.id = driver_payouts.driver_id AND drivers.user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage driver payouts" ON driver_payouts;
CREATE POLICY "Admins can manage driver payouts"
  ON driver_payouts FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Drivers can view assigned deliveries" ON deliveries;
CREATE POLICY "Drivers can view assigned deliveries"
  ON deliveries FOR SELECT TO authenticated
  USING (auth.uid() = driver_id OR EXISTS (
    SELECT 1 FROM drivers WHERE drivers.id = deliveries.driver_id AND drivers.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Merchants can view their store deliveries" ON deliveries;
CREATE POLICY "Merchants can view their store deliveries"
  ON deliveries FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = deliveries.store_id AND stores.owner_id = auth.uid()));

DROP POLICY IF EXISTS "Drivers can update assigned deliveries" ON deliveries;
CREATE POLICY "Drivers can update assigned deliveries"
  ON deliveries FOR UPDATE TO authenticated
  USING (auth.uid() = driver_id OR EXISTS (
    SELECT 1 FROM drivers WHERE drivers.id = deliveries.driver_id AND drivers.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Merchants can create deliveries for their orders" ON deliveries;
CREATE POLICY "Merchants can create deliveries for their orders"
  ON deliveries FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM orders
    JOIN stores ON stores.id = orders.store_id
    WHERE orders.id = deliveries.order_id AND stores.owner_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Admins can manage drivers" ON drivers;
CREATE POLICY "Admins can manage drivers"
  ON drivers FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Drivers can view their own record" ON drivers;
CREATE POLICY "Drivers can view their own record"
  ON drivers FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
