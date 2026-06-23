-- Allow authenticated users to submit a driver application for themselves.
DROP POLICY IF EXISTS "Users can apply as drivers" ON drivers;
CREATE POLICY "Users can apply as drivers"
  ON drivers FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending_review'
  );
