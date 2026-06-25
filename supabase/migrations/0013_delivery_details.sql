-- Add structured human details for pickup / drop-off / delivery
-- Depends on: 0011_parcel_deliveries.sql (creates parcel_deliveries)
-- and 0012_order_delivery_location.sql (creates orders.delivery_location).
-- Apply migrations in the order listed in AGENTS.md.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_details jsonb;

ALTER TABLE deliveries
  ADD COLUMN IF NOT EXISTS delivery_details jsonb;

ALTER TABLE parcel_deliveries
  ADD COLUMN IF NOT EXISTS pickup_details jsonb,
  ADD COLUMN IF NOT EXISTS dropoff_details jsonb;

-- Update create_delivery to copy coordinates and details from the order.
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
  contact_name text;
  building_floor text;
  formatted_address text;
BEGIN
  SELECT * INTO ord FROM orders WHERE id = order_uuid;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;

  SELECT * INTO store_record FROM stores WHERE id = ord.store_id;

  IF driver_uuid IS NOT NULL THEN
    initial_status := 'assigned';
  ELSE
    initial_status := 'assigned';
  END IF;

  contact_name := COALESCE(ord.delivery_details->>'contact_name', (SELECT full_name FROM profiles WHERE id = ord.customer_id));
  building_floor := ord.delivery_details->>'building_floor';
  formatted_address := ord.address || COALESCE(' · ' || building_floor, '');

  INSERT INTO deliveries (
    order_id,
    driver_id,
    store_id,
    status,
    delivery_fee_sar,
    distance_km,
    pickup_location,
    delivery_location,
    delivery_details,
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
    jsonb_build_object(
      'address', store_record.location,
      'lat', store_record.lat,
      'lng', store_record.lng
    ),
    jsonb_build_object(
      'address', ord.address,
      'lat', (ord.delivery_location->>'lat')::numeric,
      'lng', (ord.delivery_location->>'lng')::numeric
    ),
    ord.delivery_details,
    contact_name,
    ord.phone,
    formatted_address,
    ord.notes
  )
  RETURNING id INTO new_delivery_id;

  UPDATE orders SET status = 'driver_assigned' WHERE id = order_uuid;

  RETURN new_delivery_id;
END;
$$;
