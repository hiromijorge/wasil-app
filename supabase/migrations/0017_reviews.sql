-- Reviews and ratings

-- Ensure stores has rating/reviews columns
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS rating numeric(2,1) NOT NULL DEFAULT 5.0,
  ADD COLUMN IF NOT EXISTS reviews integer NOT NULL DEFAULT 0;

-- Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id uuid NULL REFERENCES public.products(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NULL CHECK (char_length(comment) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(order_id, product_id)
);

COMMENT ON TABLE public.reviews IS 'Customer reviews for completed orders and optionally specific products.';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_store_id ON public.reviews(store_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_id ON public.reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON public.reviews(order_id);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'reviews' AND policyname = 'reviews_select_public'
  ) THEN
    CREATE POLICY reviews_select_public ON public.reviews
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'reviews' AND policyname = 'reviews_insert_own'
  ) THEN
    CREATE POLICY reviews_insert_own ON public.reviews
      FOR INSERT WITH CHECK (auth.uid() = customer_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'reviews' AND policyname = 'reviews_update_own'
  ) THEN
    CREATE POLICY reviews_update_own ON public.reviews
      FOR UPDATE USING (auth.uid() = customer_id) WITH CHECK (auth.uid() = customer_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'reviews' AND policyname = 'reviews_delete_own'
  ) THEN
    CREATE POLICY reviews_delete_own ON public.reviews
      FOR DELETE USING (auth.uid() = customer_id);
  END IF;
END $$;

-- Trigger to update store aggregates on review change
CREATE OR REPLACE FUNCTION public.update_store_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.stores
    SET
      reviews = GREATEST(0, (SELECT count(*) FROM public.reviews WHERE store_id = OLD.store_id)),
      rating = COALESCE((SELECT round(avg(rating)::numeric, 1) FROM public.reviews WHERE store_id = OLD.store_id), 5.0)
    WHERE id = OLD.store_id;
    RETURN OLD;
  ELSE
    UPDATE public.stores
    SET
      reviews = (SELECT count(*) FROM public.reviews WHERE store_id = NEW.store_id),
      rating = COALESCE((SELECT round(avg(rating)::numeric, 1) FROM public.reviews WHERE store_id = NEW.store_id), 5.0)
    WHERE id = NEW.store_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_store_rating_trigger ON public.reviews;
CREATE TRIGGER update_store_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_store_rating();
