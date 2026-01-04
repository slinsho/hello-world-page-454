-- Create storage bucket for homepage banners
INSERT INTO storage.buckets (id, name, public)
VALUES ('homepage-banners', 'homepage-banners', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view banner images
CREATE POLICY "Anyone can view banner images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'homepage-banners');

-- Allow admins to upload banner images
CREATE POLICY "Admins can upload banner images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'homepage-banners' AND public.is_admin(auth.uid()));

-- Allow admins to update banner images
CREATE POLICY "Admins can update banner images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'homepage-banners' AND public.is_admin(auth.uid()));

-- Allow admins to delete banner images
CREATE POLICY "Admins can delete banner images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'homepage-banners' AND public.is_admin(auth.uid()));