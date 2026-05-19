-- Custom order pricing queue + return tracking helpers
-- Run once in Supabase SQL editor (after ADD_ORDER_TRACKING_SYSTEM.sql)

ALTER TABLE IF EXISTS custom_orders
  ADD COLUMN IF NOT EXISTS linked_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS quoted_price INT,
  ADD COLUMN IF NOT EXISTS pricing_status TEXT DEFAULT 'awaiting_quote';

CREATE INDEX IF NOT EXISTS idx_custom_orders_pricing_status
  ON custom_orders(pricing_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_custom_orders_linked_order
  ON custom_orders(linked_order_id);

-- return_status on orders: none | pending | confirmed (from ADD_ORDER_TRACKING_SYSTEM.sql)
