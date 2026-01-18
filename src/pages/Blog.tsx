import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Clock, Eye, Send, MessageCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

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

  // Get the post with the highest level (views_count) for banner
  const bannerPost = posts?.length 
    ? [...posts].sort((a, b) => (b.views_count || 0) - (a.views_count || 0))[0] 
    : undefined;
  const regularPosts = posts?.filter(p => p.id !== bannerPost?.id) || [];
  const popularPosts = [...(posts || [])].sort((a, b) => (b.views_count || 0) - (a.views_count || 0)).slice(0, 5);
  const recentPosts = [...(posts || [])].slice(0, 5);
  const displayedPosts = activeTab === "popular" ? popularPosts : recentPosts;

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      newsletterMutation.mutate(email.trim());
    }
  };

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "facebook": return <FacebookIcon className="w-6 h-6 text-[#1877f2]" />;
      case "instagram": return <InstagramIcon className="w-6 h-6 text-[#E4405F]" />;
      case "tiktok": return <TiktokIcon className="w-6 h-6 text-black" />;
      case "youtube": return <YoutubeIcon className="w-6 h-6 text-[#FF0000]" />;
      case "twitter": return <TwitterIcon className="w-6 h-6 text-[#1DA1F2]" />;
      default: return null;
    }
  };

  const getSocialLabel = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "facebook": return "Likes";
      case "instagram": 
      case "twitter":
      case "tiktok":
      case "youtube": return "Followers";
      default: return "Followers";
    }
  };

  const activeSocialLinks = socialLinks?.filter(link => link.url && link.url.trim() !== "") || [];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main className="pb-6">
        {/* Banner Article - Highest Level Post */}
        {bannerPost && bannerPost.cover_image && (
          <section className="mb-4">
            <Link to={`/blog/${bannerPost.slug}`} className="group block">
              <article className="relative overflow-hidden">
                <img
                  src={bannerPost.cover_image}
                  alt={bannerPost.title}
                  className="w-full h-72 md:h-96 lg:h-[500px] object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                
                {/* Content overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                  {bannerPost.category && (
                    <span className="inline-block bg-red-600 text-white px-4 py-1.5 text-sm font-semibold rounded-md mb-3">
                      {bannerPost.category.name}
                    </span>
                  )}
                  
                  <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-3 group-hover:text-red-200 transition-colors leading-tight max-w-4xl">
                    {bannerPost.title}
                  </h2>
                  
                  {bannerPost.published_at && (
                    <div className="flex items-center gap-1.5 text-red-400 text-sm font-medium mb-3">
                      <Clock className="h-4 w-4" />
                      {format(new Date(bannerPost.published_at), "dd MMM yyyy").toUpperCase()}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between max-w-4xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <span className="text-white text-sm font-medium">A</span>
                      </div>
                      <span className="text-white/90 font-semibold text-sm">BY ADMIN</span>
                    </div>
                    <div className="flex items-center gap-4 text-white/80 text-sm">
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4 text-red-400" />
                        0
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4 text-red-400" />
                        {bannerPost.views_count || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          </section>
        )}

        {/* Category Tabs */}
        {categories && categories.length > 0 && (
          <section className="px-4 mb-4">
            <div className="max-w-3xl mx-auto">
              <div className="flex bg-gray-100 rounded-lg p-1 overflow-x-auto">
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`px-5 py-3 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                    activeCategory === null
                      ? "bg-red-600 text-white"
                      : "text-gray-700 hover:text-gray-900"
                  }`}
                >
                  ALL
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-5 py-3 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                      activeCategory === cat.id
                        ? "bg-red-600 text-white"
                        : "text-gray-700 hover:text-gray-900"
                    }`}
                  >
                    {cat.name.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}


        {/* Read All News Button */}
        <section className="px-4 mb-4">
          <div className="max-w-3xl mx-auto">
            <Link
              to="/blog"
              className="block w-full bg-gray-900 text-white text-center py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
            >
              Read all News
            </Link>
          </div>
        </section>

        {/* Popular / Recent News Tabs */}
        <section className="px-4 mb-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex mb-6">
              <button
                onClick={() => setActiveTab("popular")}
                className={`flex-1 py-4 text-sm font-bold transition-all ${
                  activeTab === "popular"
                    ? "bg-red-600 text-white"
                    : "bg-gray-800 text-white"
                }`}
              >
                POPULAR NEWS
              </button>
              <button
                onClick={() => setActiveTab("recent")}
                className={`flex-1 py-4 text-sm font-bold transition-all ${
                  activeTab === "recent"
                    ? "bg-red-600 text-white"
                    : "bg-gray-800 text-white"
                }`}
              >
                RECENT NEWS
              </button>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex gap-4 py-4 border-b border-gray-100">
                    <Skeleton className="w-24 h-20 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : displayedPosts.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {displayedPosts.map((post) => (
                  <Link key={post.id} to={`/blog/${post.slug}`} className="group flex gap-4 py-4">
                    {post.cover_image && (
                      <div className="w-24 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                        <img
                          src={post.cover_image}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-gray-900 leading-tight line-clamp-2 group-hover:text-red-600 transition-colors mb-2">
                        {post.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                        {post.published_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-red-600" />
                            {format(new Date(post.published_at), "dd MMM yyyy").toUpperCase()}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3.5 w-3.5 text-red-600" />
                          0
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5 text-red-600" />
                          {post.views_count || 0}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No articles found. Check back soon!
              </div>
            )}
          </div>
        </section>

        {/* Follow Us Section */}
        {activeSocialLinks.length > 0 && (
          <section className="px-4 mb-8">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Follow Us</h2>
              <div className="w-24 h-1 bg-red-600 mb-6" />
              
              <div className="space-y-3">
                {activeSocialLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      {getSocialIcon(link.platform)}
                    </div>
                    <div>
                      <span className="text-gray-500 text-sm">{getSocialLabel(link.platform)}</span>
                      <span className="text-gray-900 font-bold text-lg ml-2">Follow</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Newsletter & Tags Section - Professional Layout */}
        <section className="px-4 py-6">
          <div className="max-w-3xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Newsletter Card */}
              <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-6 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <Send className="h-5 w-5" />
                  <h3 className="text-lg font-bold">Newsletter</h3>
                </div>
                <p className="text-red-100 text-sm mb-4">
                  Stay updated with our latest news and articles
                </p>
                <form onSubmit={handleSubscribe} className="space-y-3">
                  <Input
                    type="email"
                    placeholder="Your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white focus:ring-white/30"
                    required
                  />
                  <Button
                    type="submit"
                    className="w-full bg-white text-red-600 hover:bg-red-50 font-semibold"
                    disabled={newsletterMutation.isPending}
                  >
                    {newsletterMutation.isPending ? "Subscribing..." : "Subscribe Now"}
                  </Button>
                </form>
              </div>

              {/* Popular Tags Card */}
              {categories && categories.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Popular Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-full hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-sm"
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
