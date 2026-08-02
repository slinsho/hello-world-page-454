ALTER TABLE public.feedback DROP CONSTRAINT IF EXISTS feedback_role_check;
ALTER TABLE public.feedback ADD CONSTRAINT feedback_role_check CHECK (role = ANY (ARRAY['owner','agent','property_seeker','contact_form']));
DELETE FROM public.feedback WHERE problem = 'diagnostic test - safe to delete';