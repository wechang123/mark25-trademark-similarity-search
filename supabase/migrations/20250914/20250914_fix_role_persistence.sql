-- =====================================================
-- Migration: Fix Role Persistence Issue
-- Date: 2025-09-14
-- Description: Consolidate profiles tables and fix role persistence
-- =====================================================

-- Phase 1: Drop the public.profiles view (it was just pointing to user_management.profiles)
DROP VIEW IF EXISTS public.profiles CASCADE;

-- Phase 2: Update handle_new_user trigger to preserve existing roles
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  existing_role text;
BEGIN
  -- Check existing role
  SELECT role INTO existing_role
  FROM user_management.profiles
  WHERE id = new.id;

  -- If user exists with a role, preserve it
  IF existing_role IS NOT NULL THEN
    -- Update only non-role fields
    UPDATE user_management.profiles
    SET
      email = new.email,
      name = COALESCE(new.raw_user_meta_data->>'name', name),
      phone = COALESCE(new.raw_user_meta_data->>'phone', phone),
      updated_at = NOW()
    WHERE id = new.id;
  ELSE
    -- New user - insert with default role
    INSERT INTO user_management.profiles (
      id, email, name, phone, marketing_agreed, role, provider
    )
    VALUES (
      new.id,
      new.email,
      COALESCE(new.raw_user_meta_data->>'name', ''),
      COALESCE(new.raw_user_meta_data->>'phone', ''),
      COALESCE((new.raw_user_meta_data->>'marketing_agreed')::boolean, false),
      COALESCE(new.raw_app_meta_data->>'role', 'user'),
      COALESCE(new.raw_app_meta_data->>'provider', 'email')
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = COALESCE(EXCLUDED.name, user_management.profiles.name),
      phone = COALESCE(EXCLUDED.phone, user_management.profiles.phone),
      updated_at = NOW();
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Phase 3: Ensure trigger only runs on INSERT
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Phase 4: Create JWT metadata sync trigger
CREATE OR REPLACE FUNCTION sync_user_role_to_jwt()
RETURNS trigger AS $$
BEGIN
  -- Sync role changes to auth.users JWT metadata
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    UPDATE auth.users
    SET raw_app_meta_data = jsonb_set(
      COALESCE(raw_app_meta_data, '{}'::jsonb),
      '{role}',
      to_jsonb(NEW.role)
    )
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the sync trigger
DROP TRIGGER IF EXISTS sync_role_to_auth ON user_management.profiles;

CREATE TRIGGER sync_role_to_auth
AFTER UPDATE OF role ON user_management.profiles
FOR EACH ROW
EXECUTE FUNCTION sync_user_role_to_jwt();

-- Phase 5: Set initial admin user
-- This ensures tmdals128551@gmail.com has admin role
DO $$
BEGIN
  -- Update profile role
  UPDATE user_management.profiles
  SET role = 'admin', updated_at = NOW()
  WHERE email = 'tmdals128551@gmail.com';

  -- Update JWT metadata
  UPDATE auth.users
  SET raw_app_meta_data = jsonb_set(
    COALESCE(raw_app_meta_data, '{}'::jsonb),
    '{role}',
    '"admin"'
  )
  WHERE email = 'tmdals128551@gmail.com';
END $$;

-- Phase 6: Verify the setup
-- This should show admin role in both places
SELECT
  'Migration completed successfully' as status,
  p.email,
  p.role as profile_role,
  u.raw_app_meta_data->>'role' as jwt_role
FROM user_management.profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.email = 'tmdals128551@gmail.com';