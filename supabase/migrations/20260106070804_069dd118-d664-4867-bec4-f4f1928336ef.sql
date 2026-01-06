-- Create blog categories table
CREATE TABLE public.blog_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

-- Everyone can read categories
CREATE POLICY "Anyone can view categories"
ON public.blog_categories
FOR SELECT
USING (true);

-- Only admins can manage categories
CREATE POLICY "Admins can insert categories"
ON public.blog_categories
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update categories"
ON public.blog_categories
FOR UPDATE
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete categories"
ON public.blog_categories
FOR DELETE
USING (public.is_admin(auth.uid()));

-- Add category and is_featured to blog_posts
ALTER TABLE public.blog_posts
ADD COLUMN category_id UUID REFERENCES public.blog_categories(id),
ADD COLUMN is_featured BOOLEAN DEFAULT false,
ADD COLUMN views_count INTEGER DEFAULT 0;

-- Insert default categories
INSERT INTO public.blog_categories (name, slug, display_order) VALUES
('Property', 'property', 1),
('Market Trends', 'market-trends', 2),
('Tips & Guides', 'tips-guides', 3),
('News', 'news', 4);