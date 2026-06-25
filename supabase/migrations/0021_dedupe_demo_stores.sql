-- Deduplicate demo stores created by repeated or overlapping seed runs.
-- Keeps the newest row per seeded store name and removes orphaned products.

-- 1. Keep only the newest demo store per seeded name.
WITH ranked_stores AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY name
      ORDER BY created_at DESC, id DESC
    ) AS rn
  FROM public.stores
  WHERE name IN (
    'Al-Shifa Pharmacy',
    'Moda Fashion',
    'Al-Nour Grocery',
    'Glow Cosmetics'
  )
)
DELETE FROM public.stores
WHERE id IN (
  SELECT id FROM ranked_stores WHERE rn > 1
);

-- 2. Ensure all surviving seeded stores are flagged as demo.
UPDATE public.stores
SET is_demo = true
WHERE name IN (
  'Al-Shifa Pharmacy',
  'Moda Fashion',
  'Al-Nour Grocery',
  'Glow Cosmetics'
);

-- 3. Delete products whose store no longer exists.
DELETE FROM public.products
WHERE store_id NOT IN (SELECT id FROM public.stores);

-- 4. Ensure demo products are flagged as demo.
UPDATE public.products
SET is_demo = true
WHERE store_id IN (
  SELECT id FROM public.stores WHERE is_demo = true
);
