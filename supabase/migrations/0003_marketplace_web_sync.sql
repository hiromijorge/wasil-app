-- Align schema with the web marketplace prototype (souqly-yemen-connect)
-- and add automatic billing logic when orders are completed.

-- Add web-specific fields
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS category_emoji text;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS subtotal numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS distance_km numeric;

-- Ensure order status values used by the web app are available.
-- The existing check already includes these, but we keep the migration explicit.
ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('new', 'preparing', 'ready', 'completed', 'cancelled'));

-- Helper: get or create the current open billing period for a store
CREATE OR REPLACE FUNCTION public.get_or_create_current_period(store_uuid uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  period_id uuid;
  plan_price numeric;
BEGIN
  SELECT bp.id INTO period_id
  FROM billing_periods bp
  WHERE bp.store_id = store_uuid
    AND CURRENT_DATE BETWEEN bp.start_date AND bp.end_date
  ORDER BY bp.start_date DESC
  LIMIT 1;

  IF period_id IS NULL THEN
    SELECT COALESCE(sp.price_usd, 0) INTO plan_price
    FROM stores s
    LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
    WHERE s.id = store_uuid;

    INSERT INTO billing_periods (
      store_id,
      start_date,
      end_date,
      subscription_fee_usd,
      completed_orders,
      transaction_fee_usd,
      total_due_usd,
      status
    )
    VALUES (
      store_uuid,
      date_trunc('month', CURRENT_DATE)::date,
      (date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day')::date,
      plan_price,
      0,
      0,
      plan_price,
      'unpaid'
    )
    RETURNING id INTO period_id;
  END IF;

  RETURN period_id;
END;
$$;

-- Function to recompute restriction state for a store
CREATE OR REPLACE FUNCTION public.recompute_store_restriction(store_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_period record;
  overdue_days integer;
BEGIN
  SELECT *
  INTO current_period
  FROM billing_periods
  WHERE store_id = store_uuid
  ORDER BY start_date DESC
  LIMIT 1;

  IF current_period IS NULL THEN
    UPDATE stores
    SET restriction_active = false,
        restriction_reason = null
    WHERE id = store_uuid;
    RETURN;
  END IF;

  overdue_days := GREATEST(0, CURRENT_DATE - current_period.end_date);

  -- Restrict store if there is an outstanding balance and period is overdue > 7 days
  IF current_period.status IN ('unpaid', 'overdue')
     AND (current_period.total_due_usd > 0)
     AND overdue_days > 7
  THEN
    UPDATE stores
    SET restriction_active = true,
        restriction_reason = 'Outstanding balance overdue for more than 7 days'
    WHERE id = store_uuid;
  ELSE
    UPDATE stores
    SET restriction_active = false,
        restriction_reason = null
    WHERE id = store_uuid;
  END IF;
END;
$$;

-- Trigger: when an order is marked completed, charge the platform transaction fee
CREATE OR REPLACE FUNCTION public.on_order_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fee numeric;
  period_id uuid;
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    SELECT transaction_fee_usd INTO fee
    FROM platform_config
    WHERE id = 1;

    fee := COALESCE(fee, 0.25);

    period_id := public.get_or_create_current_period(NEW.store_id);

    -- Record the transaction
    INSERT INTO billing_transactions (
      store_id,
      type,
      amount_usd,
      description,
      reference,
      status
    )
    VALUES (
      NEW.store_id,
      'transaction_fee',
      fee,
      'Platform fee for order ' || NEW.id,
      NEW.id::text,
      'unpaid'
    );

    -- Update the current billing period
    UPDATE billing_periods
    SET completed_orders = completed_orders + 1,
        transaction_fee_usd = transaction_fee_usd + fee,
        total_due_usd = total_due_usd + fee,
        status = CASE WHEN status = 'paid' THEN 'unpaid' ELSE status END
    WHERE id = period_id;

    -- Recalculate restriction
    PERFORM public.recompute_store_restriction(NEW.store_id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS order_completed_billing ON orders;
CREATE TRIGGER order_completed_billing
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION public.on_order_completed();
