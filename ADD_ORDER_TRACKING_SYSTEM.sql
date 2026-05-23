-- Add richer order tracking support
-- Run once in Supabase SQL editor

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'order_status' AND e.enumlabel = 'processing'
  ) THEN
    ALTER TYPE order_status ADD VALUE 'processing' AFTER 'confirmed';
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    -- order_status enum doesn't exist in this environment
    NULL;
END $$;

ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS email_subscribed BOOLEAN DEFAULT TRUE;

ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS cancelled_by TEXT;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS processing_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS return_status TEXT DEFAULT 'none';
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS return_reason TEXT;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS return_requested_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS return_confirmed_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by TEXT NOT NULL DEFAULT 'system',
  notes TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id_changed_at
  ON order_status_history(order_id, changed_at DESC);

