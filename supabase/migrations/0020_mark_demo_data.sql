-- Mark demo/sample data and update plan pricing for the Yemeni market.

-- Add demo flag to stores and products.
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

-- Update subscription plan names/pricing for launch.
-- Free for everyone at launch; Pro/Business available for merchants who want more.
DO $$
BEGIN
  UPDATE public.subscription_plans
  SET
    name = CASE id
      WHEN 'free' THEN 'Free'
      WHEN 'pro' THEN 'Pro'
      WHEN 'business' THEN 'Business'
    END,
    price_sar = CASE id
      WHEN 'free' THEN 0
      WHEN 'pro' THEN 15
      WHEN 'business' THEN 35
    END,
    price_usd = CASE id
      WHEN 'free' THEN 0
      WHEN 'pro' THEN 4
      WHEN 'business' THEN 9
    END,
    max_products = CASE id
      WHEN 'free' THEN 20
      WHEN 'pro' THEN 999999
      WHEN 'business' THEN 999999
    END,
    max_photos_per_product = CASE id
      WHEN 'free' THEN 1
      WHEN 'pro' THEN 5
      WHEN 'business' THEN 999999
    END,
    features = CASE id
      WHEN 'free' THEN '["Up to 20 products", "1 photo per product", "Basic storefront", "In-app orders"]'::jsonb
      WHEN 'pro' THEN '["Unlimited products", "5 photos per product", "Featured search placement", "Sales analytics", "Escrow payouts"]'::jsonb
      WHEN 'business' THEN '["Unlimited products", "Unlimited photos", "Top home-page placement", "Priority support", "Multiple staff accounts", "Marketing tools"]'::jsonb
    END
  WHERE id IN ('free', 'pro', 'business');
END $$;
