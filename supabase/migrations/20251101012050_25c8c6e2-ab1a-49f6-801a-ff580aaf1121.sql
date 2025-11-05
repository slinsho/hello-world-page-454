-- Fix 1: Restrict profile visibility to protect user PII
-- Remove overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Add restricted policies
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (is_admin(auth.uid()));

-- Fix 2: Make verification-docs bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'verification-docs';

-- Fix 3: Add admin-only write policies for user_roles
CREATE POLICY "Admins can manage user roles"
ON public.user_roles FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));