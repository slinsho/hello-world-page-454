-- Promotion requests table
CREATE TABLE public.promotion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  admin_note text,
  admin_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE public.promotion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own promotion requests"
ON public.promotion_requests FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own promotion requests"
ON public.promotion_requests FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all promotion requests"
ON public.promotion_requests FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update promotion requests"
ON public.promotion_requests FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()));

-- Add is_promoted flag to properties
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS is_promoted boolean NOT NULL DEFAULT false;

-- Property reports table
CREATE TABLE public.property_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'pending',
  admin_note text,
  admin_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE public.property_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports"
ON public.property_reports FOR INSERT TO authenticated
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own reports"
ON public.property_reports FOR SELECT TO authenticated
USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports"
ON public.property_reports FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update reports"
ON public.property_reports FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()));

-- Add is_flagged to properties for visual flagging
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS is_flagged boolean NOT NULL DEFAULT false;