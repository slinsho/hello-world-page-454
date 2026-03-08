import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Clock, Eye, Send, TrendingUp, Newspaper } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { FeaturedPropertiesBanner } from "@/components/FeaturedPropertiesBanner";

// Social icons
const FacebookIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

const TiktokIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
);

const YoutubeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const TwitterIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
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
  const [activeTab, setActiveTab] = useState<"popular" | "recent">("popular");
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

  const bannerPost = posts?.length 
    ? [...posts].sort((a, b) => (b.views_count || 0) - (a.views_count || 0))[0] 
    : undefined;
  const regularPosts = posts?.filter(p => p.id !== bannerPost?.id) || [];
  const popularPosts = [...(regularPosts)].sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
  const recentPosts = [...regularPosts];
  const displayedPosts = activeTab === "popular" ? popularPosts : recentPosts;

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      newsletterMutation.mutate(email.trim());
    }
  };

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "facebook": return <FacebookIcon className="w-5 h-5" />;
      case "instagram": return <InstagramIcon className="w-5 h-5" />;
      case "tiktok": return <TiktokIcon className="w-5 h-5" />;
      case "youtube": return <YoutubeIcon className="w-5 h-5" />;
      case "twitter": return <TwitterIcon className="w-5 h-5" />;
      default: return null;
    }
  };

  const activeSocialLinks = socialLinks?.filter(link => link.url && link.url.trim() !== "") || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pb-20 md:pb-6">
        {/* Hero Banner — Most Viewed Post */}
        {bannerPost && bannerPost.cover_image && (
          <section className="mb-5">
            <Link to={`/blog/${bannerPost.slug}`} className="group block">
              <article className="relative overflow-hidden">
                <img
                  src={bannerPost.cover_image}
                  alt={bannerPost.title}
                  className="w-full h-72 md:h-96 lg:h-[500px] object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                
                <div className="absolute bottom-0 left-0 right-0 p-5 md:p-10">
                  {bannerPost.category && (
                    <span className="inline-block bg-destructive text-destructive-foreground px-3 py-1 text-xs font-bold rounded-md mb-3 uppercase tracking-wide">
                      {bannerPost.category.name}
                    </span>
                  )}
                  
                  <h2 className="text-xl md:text-3xl lg:text-4xl font-bold text-white mb-2.5 leading-tight max-w-3xl group-hover:text-red-200 transition-colors">
                    {bannerPost.title}
                  </h2>

                  {bannerPost.excerpt && (
                    <p className="text-white/70 text-sm line-clamp-2 max-w-2xl mb-3 hidden md:block">
                      {bannerPost.excerpt}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-white/70 text-xs">
                    {bannerPost.published_at && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {format(new Date(bannerPost.published_at), "MMM dd, yyyy")}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5" />
                      {bannerPost.views_count || 0} views
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          </section>
        )}

        {/* Category Filter Chips */}
        {categories && categories.length > 0 && (
          <section className="px-4 mb-5">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${
                    activeCategory === null
                      ? "bg-destructive text-destructive-foreground border-destructive"
                      : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${
                      activeCategory === cat.id
                        ? "bg-destructive text-destructive-foreground border-destructive"
                        : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Popular / Recent Toggle */}
        <section className="px-4 mb-5">
          <div className="max-w-4xl mx-auto">
            <div className="flex rounded-xl bg-muted p-1">
              <button
                onClick={() => setActiveTab("popular")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === "popular"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                Popular
              </button>
              <button
                onClick={() => setActiveTab("recent")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === "recent"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Newspaper className="h-4 w-4" />
                Recent
              </button>
            </div>
          </div>
        </section>

        {/* Post Feed */}
        <section className="px-4 mb-8">
          <div className="max-w-4xl mx-auto">
            {isLoading ? (
              <div className="space-y-5">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-72 w-full rounded-2xl" />
                ))}
              </div>
            ) : displayedPosts.length > 0 ? (
              <div className="space-y-5">
                {displayedPosts.map((post) => (
                  <Link key={post.id} to={`/blog/${post.slug}`} className="group block">
                    <article className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300">
                      {/* Card Image */}
                      {post.cover_image && (
                        <div className="relative h-48 md:h-56 overflow-hidden">
                          <img
                            src={post.cover_image}
                            alt={post.title}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          {post.category && (
                            <span className="absolute top-3 left-3 bg-destructive text-destructive-foreground px-2.5 py-1 text-[10px] font-bold rounded-md uppercase tracking-wide">
                              {post.category.name}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Card Body */}
                      <div className="p-4">
                        <h3 className="text-base font-bold text-foreground leading-snug line-clamp-2 group-hover:text-destructive transition-colors mb-2">
                          {post.title}
                        </h3>

                        {post.excerpt && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {post.excerpt}
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {post.published_at && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(post.published_at), "MMM dd, yyyy")}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {post.views_count || 0}
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Newspaper className="w-7 h-7 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-semibold text-foreground mb-2">No articles yet</h2>
                <p className="text-sm text-muted-foreground">Check back soon for new stories!</p>
              </div>
            )}
          </div>
        </section>

        {/* Newsletter + Social — Combined Compact Section */}
        <section className="px-4 mb-8">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Newsletter */}
            <div className="bg-destructive rounded-2xl p-5 text-destructive-foreground">
              <div className="flex items-center gap-2 mb-2">
                <Send className="h-4 w-4" />
                <h3 className="text-base font-bold">Stay Updated</h3>
              </div>
              <p className="text-sm opacity-80 mb-3">
                Get the latest news delivered to your inbox.
              </p>
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-white/15 border-white/20 text-white placeholder:text-white/50 focus:border-white focus:ring-white/30 h-10"
                  required
                />
                <Button
                  type="submit"
                  className="bg-background text-foreground hover:bg-background/90 font-semibold h-10 px-5"
                  disabled={newsletterMutation.isPending}
                >
                  {newsletterMutation.isPending ? "..." : "Subscribe"}
                </Button>
              </form>
            </div>

            {/* Social Links — Compact Horizontal */}
            {activeSocialLinks.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-4">
                <p className="text-sm font-semibold text-foreground mb-3">Follow Us</p>
                <div className="flex items-center gap-2">
                  {activeSocialLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-xl bg-muted hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center text-muted-foreground transition-all"
                    >
                      {getSocialIcon(link.platform)}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Featured Properties */}
        <div className="px-4 max-w-4xl mx-auto">
          <FeaturedPropertiesBanner />
        </div>
      </main>
    </div>
  );
}
