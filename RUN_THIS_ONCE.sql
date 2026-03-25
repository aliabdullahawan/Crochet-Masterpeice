-- ================================================================
-- CROCHET MASTERPIECE — RUN THIS ONE FILE ONLY
-- Paste into: supabase.com/dashboard/project/ppsulgueckychgazdjbr/sql/new
-- Safe to run multiple times — won't break anything already set up
-- ================================================================

-- ── EXTENSIONS ────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── TABLES ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS admins (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL DEFAULT 'Admin',
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id         UUID PRIMARY KEY,
  email      TEXT UNIQUE NOT NULL,
  name       TEXT NOT NULL DEFAULT '',
  phone      TEXT DEFAULT '',
  address    TEXT DEFAULT '',
  avatar_id  INT DEFAULT 1,
  avatar_url TEXT DEFAULT '',
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS site_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  image_url   TEXT DEFAULT '',
  is_active   BOOLEAN DEFAULT TRUE,
  sort_order  INT DEFAULT 99,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
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
  image_url      TEXT DEFAULT '',
  images         TEXT[] DEFAULT '{}',
  average_rating NUMERIC(3,2) DEFAULT 0,
  review_count   INT DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_images (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS discounts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code           TEXT UNIQUE,
  discount_type  TEXT DEFAULT 'percent',
  discount_value INT NOT NULL DEFAULT 10,
  applies_to     TEXT DEFAULT 'all',
  target_id      UUID,
  max_uses       INT,
  uses_count     INT DEFAULT 0,
  active         BOOLEAN DEFAULT TRUE,
  start_date     TIMESTAMPTZ DEFAULT NOW(),
  end_date       TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  customer_name   TEXT NOT NULL DEFAULT '',
  customer_email  TEXT DEFAULT '',
  customer_phone  TEXT NOT NULL DEFAULT '',
  address         TEXT DEFAULT '',
  status          TEXT DEFAULT 'pending',
  source          TEXT DEFAULT 'website',
  total_amount    INT NOT NULL DEFAULT 0,
  discount_amount INT DEFAULT 0,
  note            TEXT DEFAULT '',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id   UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL DEFAULT '',
  quantity     INT NOT NULL DEFAULT 1,
  unit_price   INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name  TEXT NOT NULL DEFAULT 'Anonymous',
  rating     INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL DEFAULT 'system',
  title      TEXT NOT NULL DEFAULT '',
  message    TEXT NOT NULL DEFAULT '',
  link       TEXT DEFAULT '',
  meta       TEXT DEFAULT '',
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wishlist (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS cart (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity   INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS custom_orders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  name        TEXT NOT NULL DEFAULT '',
  email       TEXT DEFAULT '',
  phone       TEXT NOT NULL DEFAULT '',
  address     TEXT DEFAULT '',
  category    TEXT DEFAULT '',
  description TEXT DEFAULT '',
  budget_min  INT,
  budget_max  INT,
  timeframe   TEXT DEFAULT '',
  status      TEXT DEFAULT 'pending',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── VIEWS ─────────────────────────────────────────────────────

CREATE OR REPLACE VIEW product_listing AS
SELECT
  p.id, p.name, p.description, p.price, p.original_price,
  p.category_id, p.stock_quantity, p.is_featured, p.is_active,
  p.tags, p.image_url, p.images, p.average_rating, p.review_count,
  p.created_at, p.updated_at,
  c.name AS category_name,
  d.discount_value AS active_discount_percent,
  d.code AS discount_code,
  (d.id IS NOT NULL) AS discount_active
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN discounts d ON d.target_id = p.id
  AND d.active = TRUE
  AND (d.end_date IS NULL OR d.end_date > NOW())
WHERE p.is_active = TRUE
ORDER BY p.is_featured DESC, p.created_at DESC;

CREATE OR REPLACE VIEW order_summary AS
SELECT o.*, u.name AS user_name_joined, u.email AS user_email_joined
FROM orders o LEFT JOIN users u ON o.user_id = u.id
ORDER BY o.created_at DESC;

CREATE OR REPLACE VIEW analytics_daily AS
SELECT DATE(created_at) AS date,
  COUNT(*)::INT AS order_count,
  COALESCE(SUM(total_amount),0)::INT AS revenue
FROM orders WHERE status = 'delivered'
GROUP BY DATE(created_at) ORDER BY DATE(created_at) DESC;


-- Add columns to existing tables (safe if already exist)
DO $$ BEGIN
  ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';
  ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
  ALTER TABLE users    ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '';
  ALTER TABLE users    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
  ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';
EXCEPTION WHEN others THEN NULL;
END $$;

-- ── GRANTS (fixes "permission denied" errors) ─────────────────

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES    IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- ── RLS: OFF for admin tables, ON for user tables ─────────────

ALTER TABLE admins        DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories    DISABLE ROW LEVEL SECURITY;
ALTER TABLE products      DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE discounts     DISABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews       DISABLE ROW LEVEL SECURITY;
ALTER TABLE custom_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist      DISABLE ROW LEVEL SECURITY;
ALTER TABLE cart          DISABLE ROW LEVEL SECURITY;

ALTER TABLE users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop ALL old policies first (safe if they don't exist)
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- Recreate clean policies
CREATE POLICY users_own   ON users  FOR ALL TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY users_read  ON users  FOR SELECT TO anon USING (true);

CREATE POLICY orders_auth ON orders FOR ALL TO authenticated USING (true);
CREATE POLICY orders_anon ON orders FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY items_auth  ON order_items  FOR ALL TO authenticated USING (true);
CREATE POLICY notifs_own  ON notifications FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- ── STORAGE BUCKET FOR IMAGES ─────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "images_read"   ON storage.objects;
DROP POLICY IF EXISTS "images_upload" ON storage.objects;
DROP POLICY IF EXISTS "images_update" ON storage.objects;
DROP POLICY IF EXISTS "images_delete" ON storage.objects;

CREATE POLICY "images_read"   ON storage.objects FOR SELECT USING (bucket_id = 'images');
CREATE POLICY "images_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images');
CREATE POLICY "images_update" ON storage.objects FOR UPDATE USING (bucket_id = 'images');
CREATE POLICY "images_delete" ON storage.objects FOR DELETE USING (bucket_id = 'images');

-- ── TRIGGER: auto-create user row on signup ───────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, phone, address)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    ''
  ) ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      phone = EXCLUDED.phone,
      address = EXCLUDED.address;
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Recover from stale rows that reuse the same email with a different id.
    -- This prevents auth callback failure: "Database error saving new user".
    DELETE FROM public.users
    WHERE lower(email) = lower(NEW.email)
      AND id <> NEW.id;

    INSERT INTO public.users (id, email, name, phone, address)
    VALUES (
      NEW.id, NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
      COALESCE(NEW.raw_user_meta_data->>'phone', ''),
      ''
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
      address = EXCLUDED.address;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── SEED DATA ─────────────────────────────────────────────────

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
-- DONE ✓
-- Admin login: amnamubeen516@gmail.com / Amnamubeen516@
-- Go to: Auth → Providers → Email → Turn OFF "Confirm email" → Save
-- ================================================================
