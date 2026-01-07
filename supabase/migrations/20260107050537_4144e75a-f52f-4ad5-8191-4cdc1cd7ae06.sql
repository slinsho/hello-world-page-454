-- Create function to increment blog post views
CREATE OR REPLACE FUNCTION public.increment_views(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.blog_posts
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create newsletter_subscriptions table
CREATE TABLE public.newsletter_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS on newsletter_subscriptions
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to subscribe (insert)
CREATE POLICY "Anyone can subscribe to newsletter"
  ON public.newsletter_subscriptions
  FOR INSERT
  WITH CHECK (true);

-- Only admins can view subscribers
CREATE POLICY "Admins can view newsletter subscriptions"
  ON public.newsletter_subscriptions
  FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Create blog_social_links table for admin-managed social media links
CREATE TABLE public.blog_social_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL UNIQUE,
  url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on blog_social_links
ALTER TABLE public.blog_social_links ENABLE ROW LEVEL SECURITY;

-- Anyone can read social links
CREATE POLICY "Anyone can view social links"
  ON public.blog_social_links
  FOR SELECT
  USING (true);

-- Only admins can manage social links
CREATE POLICY "Admins can manage social links"
  ON public.blog_social_links
  FOR ALL
  USING (public.is_admin(auth.uid()));

-- Insert default social platforms
INSERT INTO public.blog_social_links (platform, url, display_order) VALUES
  ('facebook', '', 1),
  ('instagram', '', 2),
  ('tiktok', '', 3),
  ('youtube', '', 4),
  ('twitter', '', 5);

-- Create trigger for updated_at on blog_social_links
CREATE TRIGGER update_blog_social_links_updated_at
  BEFORE UPDATE ON public.blog_social_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();