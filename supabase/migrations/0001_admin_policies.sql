-- Admin bypass policies for platform management
-- Run this in your Supabase SQL Editor after applying the initial schema.

-- Helper function: returns true if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Stores
CREATE POLICY "Admins can manage all stores"
  ON stores FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Products
CREATE POLICY "Admins can manage all products"
  ON products FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Orders
CREATE POLICY "Admins can manage all orders"
  ON orders FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Billing
CREATE POLICY "Admins can manage billing periods"
  ON billing_periods FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage billing transactions"
  ON billing_transactions FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage payment records"
  ON payment_records FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Referrals & commissions
CREATE POLICY "Admins can manage referrals"
  ON referrals FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage commissions"
  ON commissions FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Drivers
CREATE POLICY "Admins can manage drivers"
  ON drivers FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Deliveries
CREATE POLICY "Admins can manage deliveries"
  ON deliveries FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Platform config
CREATE POLICY "Admins can update platform config"
  ON platform_config FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Storage: admins can view all receipts and driver documents
CREATE POLICY "Admins can view all receipts"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'receipts' AND public.is_admin());

CREATE POLICY "Admins can view all driver documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'driver-documents' AND public.is_admin());
