-- Allow active drivers to see and claim unassigned broadcast deliveries.
DROP POLICY IF EXISTS "Drivers can view assigned deliveries" ON deliveries;
CREATE POLICY "Drivers can view assigned deliveries"
  ON deliveries FOR SELECT TO authenticated
  USING (
    (driver_id IS NULL AND status = 'assigned')
    OR auth.uid() = driver_id
    OR EXISTS (
      SELECT 1 FROM drivers
      WHERE drivers.id = deliveries.driver_id
        AND drivers.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Drivers can update assigned deliveries" ON deliveries;
CREATE POLICY "Drivers can update assigned deliveries"
  ON deliveries FOR UPDATE TO authenticated
  USING (
    (driver_id IS NULL AND status = 'assigned')
    OR auth.uid() = driver_id
    OR EXISTS (
      SELECT 1 FROM drivers
      WHERE drivers.id = deliveries.driver_id
        AND drivers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = driver_id
    OR EXISTS (
      SELECT 1 FROM drivers
      WHERE drivers.id = deliveries.driver_id
        AND drivers.user_id = auth.uid()
    )
  );
