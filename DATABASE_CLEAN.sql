-- ================================================================
-- CROCHET MASTERPIECE — CLEAN DATABASE SETUP
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ppsulgueckychgazdjbr/sql/new
-- ================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- DROP OLD TABLES (clean slate)
-- ================================================================
DROP TABLE IF EXISTS order_items    CASCADE;
DROP TABLE IF EXISTS notifications  CASCADE;
DROP TABLE IF EXISTS wishlist       CASCADE;
DROP TABLE IF EXISTS cart           CASCADE;
DROP TABLE IF EXISTS reviews        CASCADE;
DROP TABLE IF EXISTS discounts      CASCADE;
DROP TABLE IF EXISTS orders         CASCADE;
DROP TABLE IF EXISTS products       CASCADE;
DROP TABLE IF EXISTS categories     CASCADE;
DROP TABLE IF EXISTS site_settings  CASCADE;
DROP TABLE IF EXISTS users          CASCADE;
DROP TABLE IF EXISTS admins         CASCADE;
DROP VIEW  IF EXISTS product_listing;
DROP VIEW  IF EXISTS order_summary;
DROP VIEW  IF EXISTS analytics_daily;

-- ================================================================
-- ADMINS
-- ================================================================
CREATE TABLE admins (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL DEFAULT 'Admin',
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
-- No RLS on admins (server-side only)

-- ================================================================
-- USERS (mirrors Supabase auth.users)
-- ================================================================
CREATE TABLE users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT UNIQUE NOT NULL,
  name       TEXT NOT NULL DEFAULT '',
  phone      TEXT DEFAULT '',
  address    TEXT DEFAULT '',
  avatar_id  INT  DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- SITE SETTINGS
-- ================================================================
CREATE TABLE site_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- CATEGORIES
-- ================================================================
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  image_url   TEXT DEFAULT '',
  is_active   BOOLEAN DEFAULT TRUE,
  sort_order  INT DEFAULT 99,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- PRODUCTS
-- ================================================================
CREATE TABLE products (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  description    TEXT DEFAULT '',
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

-- ================================================================
-- PRODUCT IMAGES
-- ================================================================
CREATE TABLE product_images (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- DISCOUNTS
-- ================================================================
CREATE TABLE discounts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code           TEXT UNIQUE,
  discount_type  TEXT DEFAULT 'percent' CHECK (discount_type IN ('percent','flat')),
  discount_value INT NOT NULL DEFAULT 10,
  applies_to     TEXT DEFAULT 'all' CHECK (applies_to IN ('all','product','category','cart')),
  target_id      UUID,
  max_uses       INT,
  uses_count     INT DEFAULT 0,
  active         BOOLEAN DEFAULT TRUE,
  start_date     TIMESTAMPTZ DEFAULT NOW(),
  end_date       TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- ORDERS
-- ================================================================
CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  customer_name   TEXT NOT NULL DEFAULT '',
  customer_email  TEXT DEFAULT '',
  customer_phone  TEXT NOT NULL DEFAULT '',
  address         TEXT DEFAULT '',
  status          TEXT DEFAULT 'pending'
                  CHECK (status IN ('pending','confirmed','in_progress','shipped','delivered','cancelled')),
  source          TEXT DEFAULT 'website'
                  CHECK (source IN ('website','whatsapp','custom')),
  total_amount    INT NOT NULL DEFAULT 0,
  discount_amount INT DEFAULT 0,
  note            TEXT DEFAULT '',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- ORDER ITEMS
-- ================================================================
CREATE TABLE order_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id   UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL DEFAULT '',
  quantity     INT NOT NULL DEFAULT 1,
  unit_price   INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- REVIEWS
-- ================================================================
CREATE TABLE reviews (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name  TEXT NOT NULL DEFAULT 'Anonymous',
  rating     INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- NOTIFICATIONS
-- ================================================================
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL DEFAULT 'system'
             CHECK (type IN ('order_update','review_reply','admin_message','discount','promo')),
  title      TEXT NOT NULL DEFAULT '',
  message    TEXT NOT NULL DEFAULT '',
  link       TEXT DEFAULT '',
  meta       TEXT DEFAULT '',
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- WISHLIST
-- ================================================================
CREATE TABLE wishlist (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ================================================================
-- CART
-- ================================================================
CREATE TABLE cart (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity   INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ================================================================
-- CUSTOM ORDERS (WhatsApp-style requests)
-- ================================================================
CREATE TABLE custom_orders (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  name         TEXT NOT NULL DEFAULT '',
  email        TEXT DEFAULT '',
  phone        TEXT NOT NULL DEFAULT '',
  address      TEXT DEFAULT '',
  category     TEXT DEFAULT '',
  description  TEXT DEFAULT '',
  budget_min   INT,
  budget_max   INT,
  timeframe    TEXT DEFAULT '',
  status       TEXT DEFAULT 'pending',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- VIEWS
-- ================================================================

CREATE VIEW product_listing AS
SELECT
  p.*,
  c.name AS category_name,
  d.discount_value AS active_discount_percent,
  d.code AS discount_code,
  (d.id IS NOT NULL) AS discount_active
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN discounts d ON d.target_id = p.id
  AND d.active = TRUE
  AND d.applies_to = 'product'
  AND (d.end_date IS NULL OR d.end_date > NOW())
WHERE p.is_active = TRUE
ORDER BY p.is_featured DESC, p.created_at DESC;

CREATE VIEW order_summary AS
SELECT
  o.*,
  u.name  AS user_name_joined,
  u.email AS user_email_joined
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
ORDER BY o.created_at DESC;

CREATE VIEW analytics_daily AS
SELECT
  DATE(created_at)  AS date,
  COUNT(*)::INT     AS order_count,
  COALESCE(SUM(total_amount), 0)::INT AS revenue
FROM orders
WHERE status = 'delivered'
GROUP BY DATE(created_at)
ORDER BY DATE(created_at) DESC;

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================

ALTER TABLE users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist      ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart          ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews       ENABLE ROW LEVEL SECURITY;
-- Admin-managed tables: RLS DISABLED so admin dashboard can write
-- (Admin auth is local, not Supabase auth, so RLS would block all admin writes)
ALTER TABLE products      DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories    DISABLE ROW LEVEL SECURITY;
ALTER TABLE discounts     DISABLE ROW LEVEL SECURITY;
ALTER TABLE custom_orders ENABLE ROW LEVEL SECURITY;

-- Users: full access to own row
CREATE POLICY users_own ON users FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Orders: users see own orders
CREATE POLICY orders_own ON orders FOR SELECT USING (auth.uid() = user_id);

-- Order items: users see items from own orders
CREATE POLICY items_own ON order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

-- Notifications: users see own
CREATE POLICY notifs_own ON notifications FOR ALL USING (auth.uid() = user_id);

-- Wishlist: users manage own
CREATE POLICY wishlist_own ON wishlist FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Cart: users manage own
CREATE POLICY cart_own ON cart FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Products, categories, discounts: RLS disabled (admin manages these)
-- All users can read product data since RLS is off

-- Reviews: everyone reads, authenticated users insert
CREATE POLICY reviews_read   ON reviews FOR SELECT USING (TRUE);
CREATE POLICY reviews_insert ON reviews FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Custom orders: authenticated insert
CREATE POLICY custom_insert ON custom_orders FOR INSERT WITH CHECK (TRUE);
CREATE POLICY custom_own    ON custom_orders FOR SELECT USING (auth.uid() = user_id);

-- ================================================================
-- TRIGGER: auto-create user profile on signup
-- ================================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, phone, address, avatar_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    '',
    1
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    avatar_id = EXCLUDED.avatar_id;
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Recover from stale rows that reuse the same email with a different id.
    -- This prevents auth callback failure: "Database error saving new user".
    DELETE FROM public.users
    WHERE lower(email) = lower(NEW.email)
      AND id <> NEW.id;

    INSERT INTO public.users (id, email, name, phone, address, avatar_id)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'phone', ''),
      '',
      1
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      phone = EXCLUDED.phone,
      address = EXCLUDED.address,
      avatar_id = EXCLUDED.avatar_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ================================================================
-- GRANT anon and authenticated roles full access
-- ================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- ================================================================
-- SEED: Admin account only
-- ================================================================
INSERT INTO admins (email, name, password_hash)
VALUES ('amnamubeen516@gmail.com', 'Crochet Masterpiece', 'Amnamubeen516@')
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO site_settings (key, value) VALUES
  ('instagram_count_manual', '0'),
  ('facebook_count_manual',  '0'),
  ('tiktok_count_manual',    '0'),
  ('whatsapp_count_manual',  '0')
ON CONFLICT (key) DO NOTHING;

-- ================================================================
-- DONE.
-- Admin: amnamubeen516@gmail.com / Amnamubeen516@
--
-- IMPORTANT: Disable email confirmation:
-- Supabase → Auth → Providers → Email → Turn OFF "Confirm email" → Save
-- ================================================================
