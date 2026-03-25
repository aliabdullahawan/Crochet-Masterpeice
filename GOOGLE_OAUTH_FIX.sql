-- ================================================================
-- GOOGLE OAUTH PROFILE INSERT FIX
-- Run this in Supabase SQL editor for existing deployments.
-- ================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, phone, address)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    ''
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address;

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Recover from stale rows that reuse the same email with a different id.
    -- Avoids auth callback failure: "Database error saving new user".
    DELETE FROM public.users
    WHERE lower(email) = lower(NEW.email)
      AND id <> NEW.id;

    INSERT INTO public.users (id, email, name, phone, address)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'phone', ''),
      ''
    )
    ON CONFLICT (id) DO UPDATE SET
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
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Optional one-time cleanup helper for a specific failing email:
-- DELETE FROM public.users WHERE lower(email) = lower('replace-with-email@example.com');
