import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Clock, Eye, ChevronRight, Send, TrendingUp, Bookmark, Mail } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

// Social icons
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

const TiktokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
);

const YoutubeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  published_at: string | null;
  is_featured: boolean;
  views_count: number;
  category_id: string | null;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface SocialLink {
  id: string;
  platform: string;
  url: string | null;
  is_active: boolean;
}

export default function Blog() {
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  const { data: socialLinks } = useQuery({
    queryKey: ["blog-social-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_social_links")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as SocialLink[];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["blog-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_categories")
        .select("id, name, slug")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as Category[];
    },
  });

  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts", activeCategory],
    queryFn: async () => {
      let query = supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, cover_image, published_at, is_featured, views_count, category_id")
        .eq("is_published", true)
        .order("published_at", { ascending: false });

      if (activeCategory) {
        query = query.eq("category_id", activeCategory);
      }

      const { data, error } = await query;
      if (error) throw error;

      const categoryIds = [...new Set(data?.filter(p => p.category_id).map(p => p.category_id))];
      let categoriesMap: Record<string, Category> = {};
      
      if (categoryIds.length > 0) {
        const { data: cats } = await supabase
          .from("blog_categories")
          .select("id, name, slug")
          .in("id", categoryIds);
        if (cats) {
          categoriesMap = cats.reduce((acc, cat) => ({ ...acc, [cat.id]: cat }), {});
        }
      }

      return data?.map(post => ({
        ...post,
        category: post.category_id ? categoriesMap[post.category_id] : undefined
      })) as BlogPost[];
    },
  });

  const newsletterMutation = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase
        .from("newsletter_subscriptions")
        .insert({ email });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Subscribed!", description: "You'll receive our latest updates." });
      setEmail("");
    },
    onError: (error: Error) => {
      if (error.message.includes("duplicate")) {
        toast({ title: "Already subscribed", description: "This email is already subscribed.", variant: "destructive" });
      } else {
        toast({ title: "Failed to subscribe", variant: "destructive" });
      }
    },
  });

  const featuredPosts = posts?.filter(p => p.is_featured && p.cover_image) || [];
  const regularPosts = posts?.filter(p => !p.is_featured) || [];
  const popularPosts = [...(posts || [])].sort((a, b) => (b.views_count || 0) - (a.views_count || 0)).slice(0, 4);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      newsletterMutation.mutate(email.trim());
    }
  };

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "facebook": return <FacebookIcon />;
      case "instagram": return <InstagramIcon />;
      case "tiktok": return <TiktokIcon />;
      case "youtube": return <YoutubeIcon />;
      case "twitter": return <TwitterIcon />;
      default: return null;
    }
  };

  const activeSocialLinks = socialLinks?.filter(link => link.url && link.url.trim() !== "") || [];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-red-600 via-red-500 to-red-600 text-white py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-3xl md:text-5xl font-bold mb-4">Our Blog</h1>
              <p className="text-red-100 text-lg md:text-xl">
                Discover the latest insights, tips, and stories from our community
              </p>
            </div>
          </div>
        </section>

        {/* Category Filter */}
        {categories && categories.length > 0 && (
          <section className="bg-gray-50 border-b border-gray-200 sticky top-16 z-40">
            <div className="container mx-auto px-4">
              <div className="flex gap-1 overflow-x-auto py-4 scrollbar-hide">
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                    activeCategory === null
                      ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                      : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  All Posts
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                      activeCategory === cat.id
                        ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        <div className="container mx-auto px-4 py-10">
          <div className="grid lg:grid-cols-3 gap-10">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Featured Post */}
              {featuredPosts.length > 0 && (
                <section className="mb-10">
                  <Link to={`/blog/${featuredPosts[0].slug}`} className="group block">
                    <article className="relative rounded-2xl overflow-hidden shadow-xl">
                      <div className="aspect-[16/9] overflow-hidden">
                        <img
                          src={featuredPosts[0].cover_image!}
                          alt={featuredPosts[0].title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="bg-red-600 text-white px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wide">
                            Featured
                          </span>
                          {featuredPosts[0].category && (
                            <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 text-xs font-medium rounded-full">
                              {featuredPosts[0].category.name}
                            </span>
                          )}
                        </div>
                        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-3 group-hover:text-red-300 transition-colors">
                          {featuredPosts[0].title}
                        </h2>
                        {featuredPosts[0].excerpt && (
                          <p className="text-gray-200 text-sm md:text-base line-clamp-2 mb-4">
                            {featuredPosts[0].excerpt}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-gray-300 text-sm">
                          {featuredPosts[0].published_at && (
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-4 w-4" />
                              {format(new Date(featuredPosts[0].published_at), "MMMM dd, yyyy")}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5">
                            <Eye className="h-4 w-4" />
                            {featuredPosts[0].views_count || 0} views
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                </section>
              )}

              {/* Latest Articles */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <Bookmark className="h-6 w-6 text-red-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Latest Articles</h2>
                </div>

                {isLoading ? (
                  <div className="space-y-6">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex gap-5 p-4 bg-white rounded-xl border border-gray-100">
                        <Skeleton className="w-32 h-28 rounded-lg flex-shrink-0" />
                        <div className="flex-1 space-y-3">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-5 w-full" />
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : regularPosts && regularPosts.length > 0 ? (
                  <div className="space-y-5">
                    {regularPosts.map((post) => (
                      <Link key={post.id} to={`/blog/${post.slug}`} className="group block">
                        <article className="flex gap-5 p-4 bg-white rounded-xl border border-gray-100 hover:border-red-200 hover:shadow-lg transition-all duration-300">
                          {post.cover_image && (
                            <div className="w-32 md:w-40 h-28 flex-shrink-0 rounded-lg overflow-hidden">
                              <img
                                src={post.cover_image}
                                alt={post.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              {post.category && (
                                <span className="inline-block text-red-600 text-xs font-bold uppercase tracking-wide mb-2">
                                  {post.category.name}
                                </span>
                              )}
                              <h3 className="text-base md:text-lg font-bold text-gray-900 leading-tight line-clamp-2 group-hover:text-red-600 transition-colors">
                                {post.title}
                              </h3>
                              {post.excerpt && (
                                <p className="text-gray-500 text-sm line-clamp-1 mt-1 hidden md:block">
                                  {post.excerpt}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
                              {post.published_at && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  {format(new Date(post.published_at), "MMM dd, yyyy")}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Eye className="h-3.5 w-3.5" />
                                {post.views_count || 0}
                              </span>
                            </div>
                          </div>
                          <div className="hidden md:flex items-center">
                            <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-red-600 group-hover:translate-x-1 transition-all" />
                          </div>
                        </article>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-gray-50 rounded-xl">
                    <Bookmark className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No articles found</p>
                    <p className="text-gray-400 text-sm mt-1">Check back soon for new content!</p>
                  </div>
                )}
              </section>
            </div>

            {/* Sidebar */}
            <aside className="space-y-8">
              {/* Popular Posts */}
              {popularPosts.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-5">
                    <TrendingUp className="h-5 w-5 text-red-600" />
                    <h3 className="text-lg font-bold text-gray-900">Trending Now</h3>
                  </div>
                  <div className="space-y-4">
                    {popularPosts.map((post, index) => (
                      <Link
                        key={post.id}
                        to={`/blog/${post.slug}`}
                        className="group flex gap-4 items-start"
                      >
                        <span className="text-2xl font-black text-red-600/20 group-hover:text-red-600/40 transition-colors">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-red-600 transition-colors leading-snug">
                            {post.title}
                          </h4>
                          <span className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                            <Eye className="h-3 w-3" />
                            {post.views_count || 0} views
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Follow Us */}
              {activeSocialLinks.length > 0 && (
                <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-6 text-white">
                  <h3 className="text-lg font-bold mb-4">Follow Us</h3>
                  <p className="text-red-100 text-sm mb-5">
                    Stay connected with us on social media
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {activeSocialLinks.map((link) => (
                      <a
                        key={link.id}
                        href={link.url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-11 h-11 bg-white/20 hover:bg-white hover:text-red-600 rounded-xl flex items-center justify-center transition-all duration-300"
                      >
                        {getSocialIcon(link.platform)}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Newsletter */}
              <div className="bg-gray-900 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-2 mb-4">
                  <Mail className="h-5 w-5 text-red-500" />
                  <h3 className="text-lg font-bold">Newsletter</h3>
                </div>
                <p className="text-gray-400 text-sm mb-5">
                  Subscribe to get the latest updates delivered to your inbox.
                </p>
                <form onSubmit={handleSubscribe} className="space-y-3">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-red-500 focus:ring-red-500"
                    required
                  />
                  <Button
                    type="submit"
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
                    disabled={newsletterMutation.isPending}
                  >
                    {newsletterMutation.isPending ? (
                      "Subscribing..."
                    ) : (
                      <>
                        Subscribe <Send className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </aside>
          </div>
        </div>

        {/* Footer Newsletter Banner */}
        <section className="bg-red-600 py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center text-white">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">Never Miss an Update</h2>
              <p className="text-red-100 mb-6">
                Join our newsletter and get the latest articles delivered straight to your inbox.
              </p>
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <Input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-white border-0 text-gray-900 placeholder:text-gray-500"
                  required
                />
                <Button
                  type="submit"
                  className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-6"
                  disabled={newsletterMutation.isPending}
                >
                  Subscribe
                </Button>
              </form>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
