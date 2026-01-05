-- Create storage bucket for blog media
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-media', 'blog-media', true);

-- Allow anyone to view blog media
CREATE POLICY "Anyone can view blog media"
ON storage.objects
FOR SELECT
USING (bucket_id = 'blog-media');

-- Allow admins to upload blog media
CREATE POLICY "Admins can upload blog media"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'blog-media' AND is_admin(auth.uid()));

-- Allow admins to update blog media
CREATE POLICY "Admins can update blog media"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'blog-media' AND is_admin(auth.uid()));

-- Allow admins to delete blog media
CREATE POLICY "Admins can delete blog media"
ON storage.objects
FOR DELETE
USING (bucket_id = 'blog-media' AND is_admin(auth.uid()));