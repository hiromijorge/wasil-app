-- Peer-to-peer "Wasil Send" parcel delivery feature.
CREATE TABLE IF NOT EXISTS public.parcel_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  pickup_location jsonb NOT NULL,
  dropoff_location jsonb NOT NULL,
  receiver_name text NOT NULL,
  receiver_phone text NOT NULL,
  item_description text NOT NULL,
  item_category text,
  weight_kg numeric(6,2) DEFAULT 1,
  fare_sar numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'picked_up', 'on_the_way', 'delivered', 'cancelled')),
  payment_status text NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'verified', 'rejected')),
  payment_receipt_url text,
  pickup_photo_url text,
  delivery_proof_url text,
  notes text,
  accepted_at timestamptz,
  picked_up_at timestamptz,
  on_the_way_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_parcel_deliveries_sender_id ON public.parcel_deliveries(sender_id);
CREATE INDEX IF NOT EXISTS idx_parcel_deliveries_driver_id ON public.parcel_deliveries(driver_id);
CREATE INDEX IF NOT EXISTS idx_parcel_deliveries_status ON public.parcel_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_parcel_deliveries_payment_status ON public.parcel_deliveries(payment_status);

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_parcel_deliveries_updated_at ON public.parcel_deliveries;
CREATE TRIGGER update_parcel_deliveries_updated_at
  BEFORE UPDATE ON public.parcel_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to set sender_id from auth.uid() if the client didn't send it
CREATE OR REPLACE FUNCTION public.set_parcel_sender_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.sender_id IS NULL THEN
    NEW.sender_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_parcel_sender_id_trigger ON public.parcel_deliveries;
CREATE TRIGGER set_parcel_sender_id_trigger
  BEFORE INSERT ON public.parcel_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.set_parcel_sender_id();

-- RLS
ALTER TABLE public.parcel_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Senders can view their own parcels" ON public.parcel_deliveries;
CREATE POLICY "Senders can view their own parcels"
  ON public.parcel_deliveries FOR SELECT TO authenticated
  USING (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Senders can create parcels" ON public.parcel_deliveries;
CREATE POLICY "Senders can create parcels"
  ON public.parcel_deliveries FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Drivers can view available parcels" ON public.parcel_deliveries;
CREATE POLICY "Drivers can view available parcels"
  ON public.parcel_deliveries FOR SELECT TO authenticated
  USING (
    driver_id IS NULL AND status = 'pending' AND payment_status = 'verified'
    OR EXISTS (
      SELECT 1 FROM public.drivers
      WHERE drivers.id = parcel_deliveries.driver_id
        AND drivers.user_id = auth.uid()
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Drivers can update assigned parcels" ON public.parcel_deliveries;
CREATE POLICY "Drivers can update assigned parcels"
  ON public.parcel_deliveries FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.drivers
      WHERE drivers.id = parcel_deliveries.driver_id
        AND drivers.user_id = auth.uid()
    )
    OR (driver_id IS NULL AND status = 'pending' AND payment_status = 'verified')
    OR public.is_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.drivers
      WHERE drivers.id = parcel_deliveries.driver_id
        AND drivers.user_id = auth.uid()
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can manage parcels" ON public.parcel_deliveries;
CREATE POLICY "Admins can manage parcels"
  ON public.parcel_deliveries FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
