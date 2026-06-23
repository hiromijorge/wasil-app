-- Unique constraints required by scripts/seed-demo.js for upsert-on-conflict.
-- Also enforces that a merchant cannot have two stores with the same name,
-- and a store cannot have two products with the same name.

ALTER TABLE stores
  DROP CONSTRAINT IF EXISTS stores_owner_name_unique;
ALTER TABLE stores
  ADD CONSTRAINT stores_owner_name_unique UNIQUE (owner_id, name);

ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_store_name_unique;
ALTER TABLE products
  ADD CONSTRAINT products_store_name_unique UNIQUE (store_id, name);
