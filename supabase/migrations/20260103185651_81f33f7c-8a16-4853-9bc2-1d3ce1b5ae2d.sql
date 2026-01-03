-- Fix infinite recursion: Update is_admin to SECURITY DEFINER and fix user_roles policies

-- First, drop the problematic policies on user_roles that cause recursion
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "User roles viewable by owner and admins" ON public.user_roles;

-- Recreate is_admin as SECURITY DEFINER (this replaces it without dropping)
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = $1
      AND role = 'admin'::app_role
  )
$$;

-- Create non-recursive policies for user_roles
-- Users can always view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all roles (using is_admin which is now SECURITY DEFINER)
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Admins can insert roles
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

-- Admins can update roles  
CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
USING (public.is_admin(auth.uid()));

-- Admins can delete roles
CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
USING (public.is_admin(auth.uid()));