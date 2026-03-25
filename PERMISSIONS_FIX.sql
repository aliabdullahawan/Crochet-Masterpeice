-- ================================================================
-- RUN THIS IN SUPABASE SQL EDITOR TO FIX "permission denied" ERROR
-- URL: https://supabase.com/dashboard/project/ppsulgueckychgazdjbr/sql/new
-- ================================================================

-- Step 1: Grant full access to anon and authenticated roles
GRANT USAGE  ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES    IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- Also grant for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- Step 2: Disable RLS on admin-managed tables
ALTER TABLE IF EXISTS admins        DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categories    DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products      DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS discounts     DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS site_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS custom_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reviews       DISABLE ROW LEVEL SECURITY;

-- Step 3: For user tables - keep RLS but allow all operations
ALTER TABLE IF EXISTS users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS order_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;

-- Drop old policies and recreate
DO $$ BEGIN
  DROP POLICY IF EXISTS users_own    ON users;
  DROP POLICY IF EXISTS orders_own   ON orders;
  DROP POLICY IF EXISTS items_own    ON order_items;
  DROP POLICY IF EXISTS notifs_own   ON notifications;
EXCEPTION WHEN others THEN NULL;
END $$;

CREATE POLICY users_own  ON users  FOR ALL TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Allow admin (anon) to also read all users
CREATE POLICY users_anon_read ON users FOR SELECT TO anon USING (true);

CREATE POLICY orders_own ON orders FOR ALL TO authenticated
  USING (auth.uid() = user_id OR true);

CREATE POLICY items_own ON order_items FOR ALL TO authenticated USING (true);
CREATE POLICY notifs_own ON notifications FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- Step 4: Ensure admin account exists
CREATE TABLE IF NOT EXISTS admins (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL DEFAULT 'Admin',
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO admins (email, name, password_hash)
VALUES ('amnamubeen516@gmail.com', 'Crochet Masterpiece', 'Amnamubeen516@')
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- ================================================================
-- DONE. All permission errors should be fixed now.
-- ================================================================

-- ================================================================
-- STORAGE BUCKET FOR IMAGES (categories, products)
-- ================================================================

-- Create the images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow anyone to view images (public bucket)
DROP POLICY IF EXISTS "images_public_read" ON storage.objects;
CREATE POLICY "images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

-- Allow authenticated and anon to upload images
DROP POLICY IF EXISTS "images_upload" ON storage.objects;
CREATE POLICY "images_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'images');

-- Allow update/delete of images
DROP POLICY IF EXISTS "images_update" ON storage.objects;
CREATE POLICY "images_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'images');

DROP POLICY IF EXISTS "images_delete" ON storage.objects;
CREATE POLICY "images_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'images');

-- ================================================================
-- DONE. Images will now be stored in Supabase Storage.
-- ================================================================
