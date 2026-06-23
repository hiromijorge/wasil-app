-- In-app chat persistence between customers and merchants.
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_role text NOT NULL CHECK (sender_role IN ('customer', 'merchant')),
  content text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_store_customer ON messages(store_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view their messages" ON messages;
CREATE POLICY "Customers can view their messages"
  ON messages FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "Customers can send messages" ON messages;
CREATE POLICY "Customers can send messages"
  ON messages FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid() AND sender_id = auth.uid() AND sender_role = 'customer');

DROP POLICY IF EXISTS "Merchants can view their store messages" ON messages;
CREATE POLICY "Merchants can view their store messages"
  ON messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM stores WHERE stores.id = messages.store_id AND stores.owner_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Merchants can send store messages" ON messages;
CREATE POLICY "Merchants can send store messages"
  ON messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND sender_role = 'merchant'
    AND EXISTS (
      SELECT 1 FROM stores WHERE stores.id = messages.store_id AND stores.owner_id = auth.uid()
    )
  );

-- Realtime publication for messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END
$$;
