-- Add admin notifications + low stock tracking
-- Run once in Supabase SQL editor

ALTER TABLE IF EXISTS products
  ADD COLUMN IF NOT EXISTS low_stock_notified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS out_of_stock_notified_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL DEFAULT 'system',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  meta TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_read
  ON admin_notifications(is_read, created_at DESC);
