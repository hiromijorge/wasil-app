-- Add structured delivery location (address + coordinates) to orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_location jsonb;
