-- ================================================================
-- ADD ADMIN USER
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard
-- Project: ppsulgueckychgazdjbr
-- ================================================================

-- Step 1: Create the admins table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS admins (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL DEFAULT 'Admin',
  password_hash TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Disable RLS on admins table (admin login checks this table directly)
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;

-- Step 3: Insert the admin user (upsert so running twice is safe)
INSERT INTO admins (email, name, password_hash)
VALUES (
  'amnamubeen516@gmail.com',
  'Crochet Masterpiece',
  'Amnamubeen516@'
)
ON CONFLICT (email) DO UPDATE SET
  name          = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash;

-- Step 4: Verify it worked
SELECT id, email, name, created_at FROM admins;

-- ================================================================
-- NOTE: The admin login page checks:
--   supabase.from("admins")
--     .select("name, email")
--     .eq("email", email)
--     .eq("password_hash", password)
--
-- Login credentials:
--   Email:    amnamubeen516@gmail.com
--   Password: Amnamubeen516@
--   URL:      /admin/login
-- ================================================================
