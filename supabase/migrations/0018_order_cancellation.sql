-- Order cancellation and refund tracking

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS cancelled_by uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cancellation_reason text NULL CHECK (char_length(cancellation_reason) <= 500),
  ADD COLUMN IF NOT EXISTS refund_status text NULL CHECK (refund_status IN ('pending', 'processing', 'completed', 'failed')),
  ADD COLUMN IF NOT EXISTS refund_amount_sar numeric(12,2) NULL,
  ADD COLUMN IF NOT EXISTS refund_notes text NULL;

CREATE INDEX IF NOT EXISTS idx_orders_cancelled_by ON public.orders(cancelled_by);

-- Function to handle customer cancellation with refund status
CREATE OR REPLACE FUNCTION public.customer_cancel_order(
  p_order_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order record;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_order.customer_id IS NULL OR v_order.customer_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to cancel this order';
  END IF;

  IF v_order.status NOT IN ('new', 'paid') THEN
    RAISE EXCEPTION 'Order cannot be cancelled at this stage';
  END IF;

  UPDATE public.orders
  SET
    status = 'cancelled',
    cancelled_at = now(),
    cancelled_by = auth.uid(),
    cancellation_reason = p_reason,
    refund_status = CASE
      WHEN v_order.customer_payment_status = 'verified' THEN 'pending'
      ELSE NULL
    END,
    refund_amount_sar = CASE
      WHEN v_order.customer_payment_status = 'verified' THEN v_order.total
      ELSE NULL
    END,
    updated_at = now()
  WHERE id = p_order_id;
END;
$$;

-- Allow merchant/admin to mark refund status
CREATE OR REPLACE FUNCTION public.update_order_refund(
  p_order_id uuid,
  p_status text,
  p_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order record;
  v_role text;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  IF v_role NOT IN ('merchant', 'admin', 'partner') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_order.status != 'cancelled' THEN
    RAISE EXCEPTION 'Refund can only be updated for cancelled orders';
  END IF;

  UPDATE public.orders
  SET
    refund_status = p_status,
    refund_notes = COALESCE(p_notes, refund_notes),
    updated_at = now()
  WHERE id = p_order_id;
END;
$$;

-- Update RLS to allow customers to cancel their own orders
-- existing update policy likely allows customer updates on their orders; ensure cancelled status allowed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'orders_customer_cancel'
  ) THEN
    CREATE POLICY orders_customer_cancel ON public.orders
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = customer_id)
      WITH CHECK (auth.uid() = customer_id);
  END IF;
END $$;
