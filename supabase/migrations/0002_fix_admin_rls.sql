-- Fix infinite recursion in admin RLS policies.
-- The previous admin policy on profiles queried profiles inside a profiles policy.
-- This migration replaces it with a SECURITY DEFINER helper that bypasses RLS.

-- Drop the recursive admin policy on profiles from the initial schema
DROP POLICY IF EXISTS "Admins can manage everything" ON profiles;

-- Recreate is_admin() as a SECURITY DEFINER function so it can read profiles
-- without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- Add a clean admin policy on profiles using the helper
CREATE POLICY "Admins can manage all profiles"
  ON profiles FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
