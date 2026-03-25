-- ================================================================
-- CROCHET MASTERPIECE — SUPABASE DATABASE SCHEMA v2.0
-- Run this entire file in Supabase SQL Editor
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ENUMS
CREATE TYPE order_status AS ENUM ('pending','confirmed','shipped','delivered','cancelled');
CREATE TYPE order_source AS ENUM ('website','whatsapp','custom');
CREATE TYPE notification_type AS ENUM ('order_update','review_reply','admin_message','discount','promo');

-- ADMINS
CREATE TABLE admins (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL DEFAULT 'Admin',
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO admins (email, name, password_hash)
VALUES ('amnamubeen516@gmail.com', 'Crochet Masterpiece', 'Amnamubeen516@')
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- USERS
CREATE TABLE users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT UNIQUE NOT NULL,
  name       TEXT NOT NULL,
  phone      TEXT,
  address    TEXT,
  avatar_url TEXT,
  google_id  TEXT UNIQUE,
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SITE SETTINGS
CREATE TABLE site_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TIMESTAMPTZ DEFAULT NOW());
INSERT INTO site_settings (key,value) VALUES
  ('whatsapp_number','923001234567'),
  ('whatsapp_channel_url','https://whatsapp.com/channel/0029VbBXbGv9WtC90s3UER04'),
  ('instagram_url','https://www.instagram.com/croch_etmasterpiece'),
  ('facebook_url','https://www.facebook.com/profile.php?id=61579353555271'),
  ('tiktok_url','https://www.tiktok.com/@croch_et.masterpiece'),
  ('instagram_count_manual','5800'),
  ('facebook_count_manual','3100'),
  ('tiktok_count_manual','9200'),
  ('whatsapp_count_manual','2400');

-- CATEGORIES (image_data = BYTEA for admin-uploaded photos)
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT UNIQUE NOT NULL,
  description TEXT,
  image_data  BYTEA,
  image_mime  TEXT DEFAULT 'image/jpeg',
  is_active   BOOLEAN DEFAULT TRUE,
  sort_order  INT DEFAULT 99,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO categories (name,description,is_active,sort_order) VALUES
  ('Cardigans & Tops','Handcrafted wearables.',TRUE,1),
  ('Bags & Totes','Sturdy beautiful bags.',TRUE,2),
  ('Accessories','Headbands, clips, jewellery.',TRUE,3),
  ('Home Décor','Coasters, runners, wall hangings.',TRUE,4),
  ('Plushies & Gifts','Cloud bears, plushies, gifts.',TRUE,5);

-- PRODUCTS
CREATE TABLE products (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           TEXT NOT NULL,
  description    TEXT,
  price          INT NOT NULL CHECK (price >= 0),
  original_price INT CHECK (original_price IS NULL OR (original_price >= 0 AND original_price > price)),
  category_id    UUID REFERENCES categories(id) ON DELETE SET NULL,
  stock_quantity INT DEFAULT 0 CHECK (stock_quantity >= 0),
  is_featured    BOOLEAN DEFAULT FALSE,
  is_active      BOOLEAN DEFAULT TRUE,
  tags           TEXT[] DEFAULT '{}',
  average_rating NUMERIC(3,2) DEFAULT 0,
  review_count   INT DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);

-- PRODUCT IMAGES
CREATE TABLE product_images (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_data BYTEA NOT NULL,
  image_mime TEXT DEFAULT 'image/jpeg',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DISCOUNTS
CREATE TABLE discounts (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id     UUID REFERENCES products(id) ON DELETE CASCADE,
  code           TEXT UNIQUE,
  discount_type  TEXT DEFAULT 'percent' CHECK (discount_type IN ('percent','flat')),
  discount_value INT NOT NULL CHECK (discount_value > 0 AND discount_value <= 100),
  max_uses       INT,
  uses_count     INT DEFAULT 0,
  active         BOOLEAN DEFAULT TRUE,
  start_date     TIMESTAMPTZ DEFAULT NOW(),
  end_date       TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ORDERS
CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  customer_name   TEXT NOT NULL,
  customer_email  TEXT,
  customer_phone  TEXT NOT NULL,
  address         TEXT,
  status          order_status DEFAULT 'pending',
  source          order_source DEFAULT 'website',
  total_amount    INT NOT NULL CHECK (total_amount >= 0),
  coupon_code     TEXT,
  discount_amount INT DEFAULT 0,
  note            TEXT,
  admin_note      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- ORDER ITEMS
CREATE TABLE order_items (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id   UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity     INT NOT NULL CHECK (quantity > 0),
  unit_price   INT NOT NULL CHECK (unit_price >= 0),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- CUSTOM ORDERS
CREATE TABLE custom_orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  customer_name   TEXT NOT NULL,
  customer_email  TEXT,
  customer_phone  TEXT NOT NULL,
  category        TEXT NOT NULL,
  custom_category TEXT,
  description     TEXT NOT NULL,
  price_min       INT CHECK (price_min IS NULL OR price_min >= 0),
  price_max       INT CHECK (price_max IS NULL OR price_max >= 0),
  timeframe       TEXT,
  status          TEXT DEFAULT 'pending',
  admin_note      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- REVIEWS
CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name   TEXT NOT NULL,
  rating      INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment     TEXT,
  admin_reply TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_reviews_product ON reviews(product_id);

-- WISHLIST
CREATE TABLE wishlist (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- CART (logged-in users; guests use localStorage)
CREATE TABLE cart (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity   INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       notification_type NOT NULL,
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  link       TEXT,
  meta       TEXT,
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- TRIGGERS: updated_at
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated          BEFORE UPDATE ON users          FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_products_updated       BEFORE UPDATE ON products       FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_orders_updated         BEFORE UPDATE ON orders         FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_custom_orders_updated  BEFORE UPDATE ON custom_orders  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_reviews_updated        BEFORE UPDATE ON reviews        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_cart_updated           BEFORE UPDATE ON cart           FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_categories_updated     BEFORE UPDATE ON categories     FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- TRIGGER: auto-recalculate product rating
CREATE OR REPLACE FUNCTION refresh_product_rating() RETURNS TRIGGER AS $$
BEGIN
  UPDATE products SET
    average_rating = COALESCE((SELECT AVG(rating) FROM reviews WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)), 0),
    review_count   = (SELECT COUNT(*) FROM reviews WHERE product_id = COALESCE(NEW.product_id, OLD.product_id))
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_refresh_rating AFTER INSERT OR UPDATE OR DELETE ON reviews FOR EACH ROW EXECUTE FUNCTION refresh_product_rating();

-- TRIGGER: auto-expire discounts
CREATE OR REPLACE FUNCTION check_discount_expiry() RETURNS TRIGGER AS $$
BEGIN IF NEW.end_date IS NOT NULL AND NEW.end_date < NOW() THEN NEW.active = FALSE; END IF; RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_discount_expiry BEFORE INSERT OR UPDATE ON discounts FOR EACH ROW EXECUTE FUNCTION check_discount_expiry();

-- STORED PROCEDURE: apply coupon
CREATE OR REPLACE FUNCTION apply_coupon_code(p_code TEXT, p_product_id UUID DEFAULT NULL)
RETURNS TABLE(valid BOOLEAN, discount_type TEXT, discount_value INT, message TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT TRUE, d.discount_type, d.discount_value,
    'Coupon applied! ' || d.discount_value || CASE WHEN d.discount_type='percent' THEN '% off' ELSE ' PKR off' END
  FROM discounts d
  WHERE d.code = UPPER(TRIM(p_code)) AND d.active = TRUE
    AND (d.end_date IS NULL OR d.end_date > NOW())
    AND (d.max_uses IS NULL OR d.uses_count < d.max_uses)
    AND (d.product_id IS NULL OR d.product_id = p_product_id)
  LIMIT 1;
  IF NOT FOUND THEN RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::INT, 'Invalid or expired coupon code'; END IF;
END; $$ LANGUAGE plpgsql;

-- VIEWS
CREATE VIEW product_listing AS
SELECT p.*, c.name AS category_name,
  d.discount_value AS active_discount_percent, d.code AS discount_code,
  CASE WHEN d.id IS NOT NULL THEN TRUE ELSE FALSE END AS discount_active
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN discounts d ON d.product_id = p.id AND d.active = TRUE AND (d.end_date IS NULL OR d.end_date > NOW())
WHERE p.is_active = TRUE ORDER BY p.is_featured DESC, p.created_at DESC;

CREATE VIEW order_summary AS
SELECT o.*, u.name AS user_name_joined, u.email AS user_email_joined,
  (SELECT json_agg(json_build_object('name',oi.product_name,'qty',oi.quantity,'price',oi.unit_price))
   FROM order_items oi WHERE oi.order_id = o.id) AS items_json
FROM orders o LEFT JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC;

CREATE VIEW analytics_daily AS
SELECT DATE(created_at) AS date, COUNT(*) AS order_count,
  SUM(total_amount) AS revenue, AVG(total_amount) AS avg_order_value
FROM orders WHERE status = 'delivered'
GROUP BY DATE(created_at) ORDER BY DATE(created_at) DESC;

-- ROW LEVEL SECURITY
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own"      ON users         FOR ALL USING (auth.uid() = id);
CREATE POLICY "orders_own"     ON orders        FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "items_own"      ON order_items   FOR SELECT USING (EXISTS(SELECT 1 FROM orders o WHERE o.id=order_id AND o.user_id=auth.uid()));
CREATE POLICY "custom_own"     ON custom_orders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "reviews_select" ON reviews       FOR SELECT USING (TRUE);
CREATE POLICY "reviews_insert" ON reviews       FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_update" ON reviews       FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "wishlist_own"   ON wishlist      FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "cart_own"       ON cart          FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "notifs_own"     ON notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "products_pub"   ON products      FOR SELECT USING (is_active = TRUE);
CREATE POLICY "categories_pub" ON categories    FOR SELECT USING (is_active = TRUE);

-- ================================================================
-- SETUP CHECKLIST
-- ================================================================
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Go to Authentication > Providers > Google → add Client ID + Secret
-- 3. Set Redirect URL in Google Console: https://YOUR_PROJECT.supabase.co/auth/v1/callback
-- 4. Add to .env.local:
--    NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
--    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
--    SUPABASE_SERVICE_ROLE_KEY=eyJ...
--    NEXT_PUBLIC_WHATSAPP_NUMBER=923001234567
--    NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
--    INSTAGRAM_ACCESS_TOKEN=...
--    INSTAGRAM_USER_ID=...
--    FACEBOOK_ACCESS_TOKEN=...
--    FACEBOOK_PAGE_ID=...
--    TIKTOK_ACCESS_TOKEN=...
-- ================================================================
