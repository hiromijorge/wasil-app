-- Run this in your Supabase SQL Editor to create the initial schema.
-- This schema supports customers, merchants, drivers, admins, partners,
-- billing & subscriptions, referrals, and the delivery module.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Roles handled as text check constraints for simplicity and portability
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text UNIQUE,
  email text,
  full_name text,
  avatar_url text,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'merchant', 'driver', 'admin', 'partner')),
  referral_code text UNIQUE,
  referred_by uuid REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Stores (merchant storefronts)
CREATE TABLE IF NOT EXISTS stores (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  location text NOT NULL DEFAULT 'Sanaa, Yemen',
  whatsapp text NOT NULL,
  hours text NOT NULL DEFAULT '8AM - 10PM',
  open boolean NOT NULL DEFAULT true,
  image text,
  accent text,
  rating numeric NOT NULL DEFAULT 0,
  reviews integer NOT NULL DEFAULT 0,
  lat numeric NOT NULL DEFAULT 15.3694,
  lng numeric NOT NULL DEFAULT 44.191,
  delivery_radius_km numeric NOT NULL DEFAULT 10,
  delivery_fee numeric NOT NULL DEFAULT 0,
  delivery_available boolean NOT NULL DEFAULT false,
  pickup_available boolean NOT NULL DEFAULT true,
  plan_id text NOT NULL DEFAULT 'free' CHECK (plan_id IN ('free', 'pro', 'business')),
  restriction_active boolean NOT NULL DEFAULT false,
  restriction_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE stores
  DROP CONSTRAINT IF EXISTS stores_owner_name_unique;
ALTER TABLE stores
  ADD CONSTRAINT stores_owner_name_unique UNIQUE (owner_id, name);

-- Subscription plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id text PRIMARY KEY CHECK (id IN ('free', 'pro', 'business')),
  name text NOT NULL,
  price_usd numeric NOT NULL DEFAULT 0,
  max_products integer NOT NULL,
  max_photos_per_product integer NOT NULL,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  badge text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed subscription plans
INSERT INTO subscription_plans (id, name, price_usd, max_products, max_photos_per_product, features, badge)
VALUES
  ('free', 'Free', 0, 30, 1, '["30 products maximum","1 photo per product","Basic storefront","WhatsApp ordering","Basic analytics"]', NULL),
  ('pro', 'Pro', 2.99, 200, 3, '["200 products maximum","3 photos per product","Verified Merchant badge","Priority search placement","Advanced analytics"]', 'Verified'),
  ('business', 'Business', 5.99, 1000, 5, '["1000 products maximum","5 photos per product","Homepage featured placement","Delivery management access","Team accounts","Premium analytics"]', 'Featured')
ON CONFLICT (id) DO NOTHING;

-- Products
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric NOT NULL,
  description text,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_store_name_unique;
ALTER TABLE products
  ADD CONSTRAINT products_store_name_unique UNIQUE (store_id, name);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'preparing', 'ready_for_delivery', 'driver_assigned', 'picked_up', 'on_the_way', 'delivered', 'completed', 'cancelled')),
  delivery_type text NOT NULL DEFAULT 'pickup' CHECK (delivery_type IN ('delivery', 'pickup')),
  delivery_fee numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  address text,
  phone text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Billing periods
CREATE TABLE IF NOT EXISTS billing_periods (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  subscription_fee_usd numeric NOT NULL DEFAULT 0,
  completed_orders integer NOT NULL DEFAULT 0,
  transaction_fee_usd numeric NOT NULL DEFAULT 0,
  total_due_usd numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'pending_verification', 'unpaid', 'overdue')),
  paid_at timestamptz,
  payment_record_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Billing transactions ledger
CREATE TABLE IF NOT EXISTS billing_transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('subscription_charge', 'transaction_fee', 'payment', 'adjustment')),
  amount_usd numeric NOT NULL,
  description text NOT NULL,
  reference text,
  status text CHECK (status IN ('paid', 'pending_verification', 'unpaid', 'overdue')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Payment records (bank transfer receipts)
CREATE TABLE IF NOT EXISTS payment_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  amount_usd numeric NOT NULL,
  reference_number text NOT NULL,
  notes text,
  receipt_image text,
  status text NOT NULL DEFAULT 'pending_verification' CHECK (status IN ('paid', 'pending_verification', 'unpaid', 'overdue')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES profiles(id),
  rejection_reason text
);

-- Platform configuration
CREATE TABLE IF NOT EXISTS platform_config (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  transaction_fee_usd numeric NOT NULL DEFAULT 0.25,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO platform_config (id, transaction_fee_usd)
VALUES (1, 0.25)
ON CONFLICT (id) DO NOTHING;

-- Referrals
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_merchant_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  code_used text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Referral commissions
CREATE TABLE IF NOT EXISTS commissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_id uuid NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  amount_usd numeric NOT NULL,
  source_type text NOT NULL DEFAULT 'transaction_fee',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Drivers
CREATE TABLE IF NOT EXISTS drivers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text NOT NULL,
  national_id text NOT NULL,
  vehicle_type text NOT NULL,
  vehicle_plate_number text NOT NULL,
  photo_url text,
  documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
  earnings_total numeric NOT NULL DEFAULT 0,
  deliveries_completed integer NOT NULL DEFAULT 0,
  last_active_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Deliveries
CREATE TABLE IF NOT EXISTS deliveries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES drivers(id) ON DELETE SET NULL,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'ready_for_delivery' CHECK (status IN ('ready_for_delivery', 'driver_assigned', 'picked_up', 'on_the_way', 'delivered')),
  fee numeric NOT NULL DEFAULT 0,
  distance_km numeric,
  pickup_location jsonb,
  delivery_location jsonb,
  accepted_at timestamptz,
  picked_up_at timestamptz,
  on_the_way_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_stores_owner_id ON stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_stores_plan_id ON stores(plan_id);
CREATE INDEX IF NOT EXISTS idx_stores_restriction_active ON stores(restriction_active);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_billing_periods_store_id ON billing_periods(store_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_store_id ON payment_records(store_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_commissions_referral_id ON commissions(referral_id);
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_driver_id ON deliveries(driver_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_store_id ON deliveries(store_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_order_id ON deliveries(order_id);

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Stores policies
CREATE POLICY "Stores are viewable by everyone"
  ON stores FOR SELECT USING (true);

CREATE POLICY "Merchants can manage their own store"
  ON stores FOR ALL USING (auth.uid() = owner_id);

-- Products policies
CREATE POLICY "Products are viewable by everyone"
  ON products FOR SELECT USING (true);

CREATE POLICY "Merchants can manage their store products"
  ON products FOR ALL USING (EXISTS (
    SELECT 1 FROM stores WHERE stores.id = products.store_id AND stores.owner_id = auth.uid()
  ));

-- Orders policies
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT USING (
    auth.uid() = customer_id OR
    EXISTS (SELECT 1 FROM stores WHERE stores.id = orders.store_id AND stores.owner_id = auth.uid())
  );

CREATE POLICY "Customers can create orders"
  ON orders FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Merchants can update their store orders"
  ON orders FOR UPDATE USING (
    EXISTS (SELECT 1 FROM stores WHERE stores.id = orders.store_id AND stores.owner_id = auth.uid())
  );

-- Billing policies
CREATE POLICY "Merchants can view their store billing"
  ON billing_periods FOR SELECT USING (
    EXISTS (SELECT 1 FROM stores WHERE stores.id = billing_periods.store_id AND stores.owner_id = auth.uid())
  );

CREATE POLICY "Merchants can view their transactions"
  ON billing_transactions FOR SELECT USING (
    EXISTS (SELECT 1 FROM stores WHERE stores.id = billing_transactions.store_id AND stores.owner_id = auth.uid())
  );

CREATE POLICY "Merchants can create payment records for their store"
  ON payment_records FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM stores WHERE stores.id = payment_records.store_id AND stores.owner_id = auth.uid())
  );

CREATE POLICY "Merchants can view their payment records"
  ON payment_records FOR SELECT USING (
    EXISTS (SELECT 1 FROM stores WHERE stores.id = payment_records.store_id AND stores.owner_id = auth.uid())
  );

-- Admin bypass policy (role = 'admin')
CREATE POLICY "Admins can manage everything"
  ON profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Referral & commission policies
CREATE POLICY "Referrers can view their referrals"
  ON referrals FOR SELECT USING (auth.uid() = referrer_id);

CREATE POLICY "Referrers can view their commissions"
  ON commissions FOR SELECT USING (
    EXISTS (SELECT 1 FROM referrals WHERE referrals.id = commissions.referral_id AND referrals.referrer_id = auth.uid())
  );

-- Driver policies
CREATE POLICY "Drivers can view their own driver record"
  ON drivers FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Drivers can update their own record"
  ON drivers FOR UPDATE USING (auth.uid() = user_id);

-- Delivery policies
CREATE POLICY "Drivers can view assigned deliveries"
  ON deliveries FOR SELECT USING (auth.uid() = driver_id OR EXISTS (
    SELECT 1 FROM drivers WHERE drivers.id = deliveries.driver_id AND drivers.user_id = auth.uid()
  ));

CREATE POLICY "Merchants can view their store deliveries"
  ON deliveries FOR SELECT USING (
    EXISTS (SELECT 1 FROM stores WHERE stores.id = deliveries.store_id AND stores.owner_id = auth.uid())
  );

CREATE POLICY "Drivers can update assigned deliveries"
  ON deliveries FOR UPDATE USING (auth.uid() = driver_id OR EXISTS (
    SELECT 1 FROM drivers WHERE drivers.id = deliveries.driver_id AND drivers.user_id = auth.uid()
  ));

-- Trigger to auto-update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON deliveries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Storage bucket for payment receipts and driver documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('driver-documents', 'driver-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Merchants can upload their own receipts"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'receipts' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Merchants can view their own receipts"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'receipts' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Drivers can upload their own documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'driver-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Drivers can view their own documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'driver-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
