-- Tighten notifications INSERT policy: require authentication
-- Triggers use SECURITY DEFINER and bypass RLS, so this won't break trigger-based inserts
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "Authenticated users can create notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Tighten admin_activity_logs INSERT policy: require authentication
DROP POLICY IF EXISTS "System can insert activity logs" ON public.admin_activity_logs;
CREATE POLICY "Authenticated users can insert activity logs"
  ON public.admin_activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);