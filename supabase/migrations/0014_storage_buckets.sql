-- Create public storage buckets for avatars, product images, and receipts.
-- Depends on: stores table (existing) and authenticated users.

-- Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('avatars', 'avatars', true),
  ('products', 'products', true),
  ('receipts', 'receipts', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Avatars: public read, authenticated users can manage their own folder.
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Products: public read, store owners can manage images for their store.
DROP POLICY IF EXISTS "Product images are publicly accessible" ON storage.objects;
CREATE POLICY "Product images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

DROP POLICY IF EXISTS "Store owners can upload product images" ON storage.objects;
CREATE POLICY "Store owners can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'products'
  AND EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = (storage.foldername(name))[1]::uuid
      AND stores.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Store owners can update product images" ON storage.objects;
CREATE POLICY "Store owners can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'products'
  AND EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = (storage.foldername(name))[1]::uuid
      AND stores.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Store owners can delete product images" ON storage.objects;
CREATE POLICY "Store owners can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'products'
  AND EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = (storage.foldername(name))[1]::uuid
      AND stores.owner_id = auth.uid()
  )
);

-- Receipts: public read, store owners can manage receipts for their store.
DROP POLICY IF EXISTS "Receipt images are publicly accessible" ON storage.objects;
CREATE POLICY "Receipt images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'receipts');

DROP POLICY IF EXISTS "Store owners can upload receipts" ON storage.objects;
CREATE POLICY "Store owners can upload receipts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'receipts'
  AND EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = (storage.foldername(name))[1]::uuid
      AND stores.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Store owners can update receipts" ON storage.objects;
CREATE POLICY "Store owners can update receipts"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'receipts'
  AND EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = (storage.foldername(name))[1]::uuid
      AND stores.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Store owners can delete receipts" ON storage.objects;
CREATE POLICY "Store owners can delete receipts"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'receipts'
  AND EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = (storage.foldername(name))[1]::uuid
      AND stores.owner_id = auth.uid()
  )
);
