-- ================================================================
-- CROCHET MASTERPIECE — ONE-TIME SUPABASE SETUP
-- Run this ENTIRE file in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ppsulgueckychgazdjbr/sql/new
-- ================================================================

-- STEP 1: Create tables (safe to run multiple times)
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL DEFAULT 'Admin',
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id         UUID PRIMARY KEY,
  email      TEXT UNIQUE NOT NULL,
  name       TEXT NOT NULL,
  phone      TEXT,
  address    TEXT,
  avatar_url TEXT,
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site settings
CREATE TABLE IF NOT EXISTS site_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  sort_order  INT DEFAULT 99,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  description    TEXT,
  price          INT NOT NULL DEFAULT 0,
  original_price INT,
  category_id    UUID REFERENCES categories(id) ON DELETE SET NULL,
  stock_quantity INT DEFAULT 0,
  is_featured    BOOLEAN DEFAULT FALSE,
  is_active      BOOLEAN DEFAULT TRUE,
  tags           TEXT[] DEFAULT '{}',
  average_rating NUMERIC(3,2) DEFAULT 0,
  review_count   INT DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  customer_name   TEXT NOT NULL,
  customer_email  TEXT,
  customer_phone  TEXT NOT NULL,
  address         TEXT,
  status          TEXT DEFAULT 'pending',
  source          TEXT DEFAULT 'website',
  total_amount    INT NOT NULL DEFAULT 0,
  discount_amount INT DEFAULT 0,
  note            TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id   UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity     INT NOT NULL DEFAULT 1,
  unit_price   INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name   TEXT NOT NULL,
  rating      INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Discounts
CREATE TABLE IF NOT EXISTS discounts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     UUID REFERENCES products(id) ON DELETE CASCADE,
  code           TEXT UNIQUE,
  discount_type  TEXT DEFAULT 'percent',
  discount_value INT NOT NULL DEFAULT 10,
  max_uses       INT,
  uses_count     INT DEFAULT 0,
  active         BOOLEAN DEFAULT TRUE,
  start_date     TIMESTAMPTZ DEFAULT NOW(),
  end_date       TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL DEFAULT 'system',
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  link       TEXT,
  meta       TEXT,
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics view
CREATE OR REPLACE VIEW analytics_daily AS
SELECT
  DATE(created_at)  AS date,
  COUNT(*)          AS order_count,
  SUM(total_amount) AS revenue,
  AVG(total_amount) AS avg_order_value
FROM orders
WHERE status = 'delivered'
GROUP BY DATE(created_at)
ORDER BY DATE(created_at) DESC;

-- Product listing view
CREATE OR REPLACE VIEW product_listing AS
SELECT
  p.*,
  c.name AS category_name,
  d.discount_value AS active_discount_percent,
  d.code AS discount_code,
  (d.id IS NOT NULL) AS discount_active
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN discounts d ON d.product_id = p.id
  AND d.active = TRUE
  AND (d.end_date IS NULL OR d.end_date > NOW())
WHERE p.is_active = TRUE
ORDER BY p.is_featured DESC, p.created_at DESC;

-- Order summary view
CREATE OR REPLACE VIEW order_summary AS
SELECT
  o.*,
  u.name  AS user_name_joined,
  u.email AS user_email_joined,
  (
    SELECT json_agg(json_build_object(
      'name', oi.product_name,
      'qty',  oi.quantity,
      'price',oi.unit_price
    ))
    FROM order_items oi WHERE oi.order_id = o.id
  ) AS items_json
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
ORDER BY o.created_at DESC;

-- STEP 2: Seed data
-- ================================================================

-- Admin account
INSERT INTO admins (email, name, password_hash)
VALUES ('amnamubeen516@gmail.com', 'Crochet Masterpiece', 'Amnamubeen516@')
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- Site settings (social counts)
INSERT INTO site_settings (key, value) VALUES
  ('instagram_count_manual', '5800'),
  ('facebook_count_manual',  '3100'),
  ('tiktok_count_manual',    '9200'),
  ('whatsapp_count_manual',  '2400')
ON CONFLICT (key) DO NOTHING;

-- STEP 3: Row Level Security
-- ================================================================

ALTER TABLE users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE products      ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews       ENABLE ROW LEVEL SECURITY;

-- Users can read/write their own data
DROP POLICY IF EXISTS "users_own"    ON users;
DROP POLICY IF EXISTS "orders_own"   ON orders;
DROP POLICY IF EXISTS "notifs_own"   ON notifications;
DROP POLICY IF EXISTS "products_pub" ON products;
DROP POLICY IF EXISTS "cats_pub"     ON categories;
DROP POLICY IF EXISTS "reviews_pub"  ON reviews;

CREATE POLICY "users_own"    ON users         FOR ALL   USING (auth.uid() = id);
CREATE POLICY "orders_own"   ON orders        FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifs_own"   ON notifications FOR ALL   USING (auth.uid() = user_id);
CREATE POLICY "products_pub" ON products      FOR SELECT USING (is_active = TRUE);
CREATE POLICY "cats_pub"     ON categories    FOR SELECT USING (is_active = TRUE);
CREATE POLICY "reviews_pub"  ON reviews       FOR SELECT USING (TRUE);
CREATE POLICY "reviews_ins"  ON reviews       FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ================================================================
-- DONE! Your database is ready.
-- 
-- Admin login: amnamubeen516@gmail.com / Amnamubeen516@
-- URL: /admin/login
--
-- IMPORTANT: Disable email confirmation so users can sign up immediately:
-- Supabase Dashboard → Auth → Providers → Email → Turn OFF "Confirm email" → Save
-- ================================================================
