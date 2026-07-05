import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Clock, Eye, ArrowUpRight, Newspaper, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { FeaturedPropertiesBanner } from "@/components/FeaturedPropertiesBanner";

const FacebookIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
);
const InstagramIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12s.014 3.668.072 4.948c.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24s3.668-.014 4.948-.072c4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
);
const TiktokIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
);
const YoutubeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
);
const TwitterIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
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
  category?: { id: string; name: string; slug: string };
}

interface Category { id: string; name: string; slug: string; }
interface SocialLink { id: string; platform: string; url: string | null; is_active: boolean; }

export default function Blog() {
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
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

      if (activeCategory) query = query.eq("category_id", activeCategory);

      const { data, error } = await query;
      if (error) throw error;

      const categoryIds = [...new Set(data?.filter(p => p.category_id).map(p => p.category_id))];
      let categoriesMap: Record<string, Category> = {};
      if (categoryIds.length > 0) {
        const { data: cats } = await supabase
          .from("blog_categories")
          .select("id, name, slug")
          .in("id", categoryIds);
        if (cats) categoriesMap = cats.reduce((acc, cat) => ({ ...acc, [cat.id]: cat }), {});
      }
      return data?.map(post => ({
        ...post,
        category: post.category_id ? categoriesMap[post.category_id] : undefined
      })) as BlogPost[];
    },
  });

  const newsletterMutation = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.from("newsletter_subscriptions").insert({ email });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Subscribed", description: "You'll receive our latest updates." });
      setEmail("");
    },
    onError: (error: Error) => {
      if (error.message.includes("duplicate")) {
        toast({ title: "Already subscribed", description: "This email is already on the list.", variant: "destructive" });
      } else {
        toast({ title: "Failed to subscribe", variant: "destructive" });
      }
    },
  });

  const filtered = (posts || []).filter(p =>
    !search.trim() ? true : p.title.toLowerCase().includes(search.toLowerCase()) || p.excerpt?.toLowerCase().includes(search.toLowerCase())
  );
  const featured = filtered.length ? [...filtered].sort((a, b) => (b.views_count || 0) - (a.views_count || 0))[0] : undefined;
  const rest = filtered.filter(p => p.id !== featured?.id);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) newsletterMutation.mutate(email.trim());
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
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pb-24 md:pb-12">
        {/* ===== HERO ===== */}
        <section className="relative border-b border-border/60">
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <div className="relative max-w-6xl mx-auto px-5 md:px-8 pt-6 pb-6 md:pt-10 md:pb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/40 backdrop-blur px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Newsroom
            </div>
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-foreground leading-[1.05] max-w-3xl">
              Insights on Liberia's<br className="hidden md:block" />
              <span className="text-muted-foreground">property market.</span>
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-5 max-w-xl leading-relaxed">
              Long-form analysis, neighborhood guides, and product updates from the L-Prop team.
            </p>

            {/* Search + filters */}
            <div className="mt-5 flex flex-col gap-3">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search articles…"
                  className="pl-9 h-10 bg-card/40 border-border/70 rounded-lg text-sm focus-visible:ring-1 focus-visible:ring-primary/40"
                />
              </div>
              {categories && categories.length > 0 && (
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
                  <FilterChip active={activeCategory === null} onClick={() => setActiveCategory(null)} label="All" />
                  {categories.map(cat => (
                    <FilterChip
                      key={cat.id}
                      active={activeCategory === cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      label={cat.name}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ===== FEATURED ===== */}
        {featured && (
          <section className="border-b border-border/60">
            <div className="max-w-6xl mx-auto px-5 md:px-8 py-6 md:py-8">

              <div className="flex items-center gap-3 mb-5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Featured</span>
                <div className="flex-1 h-px bg-border/60" />
              </div>
              <Link to={`/blog/${featured.slug}`} className="group grid md:grid-cols-2 gap-6 md:gap-10 items-center">
                {featured.cover_image && (
                  <div className="relative aspect-[16/10] md:aspect-[4/3] rounded-xl overflow-hidden border border-border/60 bg-card">
                    <img
                      src={featured.cover_image}
                      alt={featured.title}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                    />
                  </div>
                )}
                <div>
                  {featured.category && (
                    <span className="inline-block text-[10px] font-mono uppercase tracking-widest text-primary mb-3">
                      {featured.category.name}
                    </span>
                  )}
                  <h2 className="text-2xl md:text-4xl font-semibold tracking-tight text-foreground leading-tight group-hover:text-primary transition-colors">
                    {featured.title}
                  </h2>
                  {featured.excerpt && (
                    <p className="text-sm md:text-base text-muted-foreground mt-4 leading-relaxed line-clamp-3">
                      {featured.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-6 text-xs text-muted-foreground font-mono">
                    {featured.published_at && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        {format(new Date(featured.published_at), "MMM dd, yyyy")}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Eye className="h-3 w-3" />
                      {featured.views_count || 0}
                    </span>
                    <span className="ml-auto inline-flex items-center gap-1 text-foreground group-hover:text-primary transition-colors">
                      Read <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          </section>
        )}

        {/* ===== ARTICLES GRID ===== */}
        <section className="border-b border-border/60">
          <div className="max-w-6xl mx-auto px-5 md:px-8 py-6 md:py-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                All articles · {rest.length}
              </span>
              <div className="flex-1 h-px bg-border/60" />
            </div>

            {isLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Skeleton key={i} className="h-64 w-full rounded-xl" />
                ))}
              </div>
            ) : rest.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {rest.map(post => (
                  <Link key={post.id} to={`/blog/${post.slug}`} className="group block">
                    <article className="h-full flex flex-col rounded-xl border border-border/60 bg-card/40 hover:bg-card hover:border-border transition-all overflow-hidden">
                      {post.cover_image && (
                        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                          <img
                            src={post.cover_image}
                            alt={post.title}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                          />
                        </div>
                      )}
                      <div className="flex-1 flex flex-col p-4">
                        {post.category && (
                          <span className="text-[10px] font-mono uppercase tracking-widest text-primary mb-2">
                            {post.category.name}
                          </span>
                        )}
                        <h3 className="text-base font-semibold tracking-tight text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-2 leading-relaxed">
                            {post.excerpt}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border/50 text-[11px] text-muted-foreground font-mono">
                          {post.published_at && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(post.published_at), "MMM dd")}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {post.views_count || 0}
                          </span>
                          <ArrowUpRight className="h-3.5 w-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-12 h-12 rounded-xl border border-border/60 bg-card/40 flex items-center justify-center mx-auto mb-4">
                  <Newspaper className="w-5 h-5 text-muted-foreground" />
                </div>
                <h2 className="text-base font-semibold text-foreground mb-1">No articles found</h2>
                <p className="text-sm text-muted-foreground">Try a different search or category.</p>
              </div>
            )}
          </div>
        </section>

        {/* ===== NEWSLETTER + SOCIAL ===== */}
        <section className="border-b border-border/60">
          <div className="max-w-6xl mx-auto px-5 md:px-8 py-12 md:py-16 grid md:grid-cols-2 gap-10 items-start">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Newsletter</span>
              <h3 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mt-3">
                Get articles in your inbox.
              </h3>
              <p className="text-sm text-muted-foreground mt-3 max-w-md">
                One email per week. Market trends, new listings worth your attention, and product updates.
              </p>
              <form onSubmit={handleSubscribe} className="flex gap-2 mt-6 max-w-md">
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="flex-1 h-10 bg-card/40 border-border/70 rounded-lg text-sm"
                  required
                />
                <Button type="submit" disabled={newsletterMutation.isPending} className="h-10 rounded-lg px-4">
                  {newsletterMutation.isPending ? "…" : "Subscribe"}
                </Button>
              </form>
            </div>

            {activeSocialLinks.length > 0 && (
              <div className="md:border-l md:border-border/60 md:pl-10">
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Follow</span>
                <h3 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mt-3">
                  On social.
                </h3>
                <p className="text-sm text-muted-foreground mt-3">Daily snippets and behind-the-scenes.</p>
                <div className="flex items-center gap-2 mt-6">
                  {activeSocialLinks.map(link => (
                    <a
                      key={link.id}
                      href={link.url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-lg border border-border/70 bg-card/40 hover:bg-card hover:border-primary/40 hover:text-primary text-muted-foreground flex items-center justify-center transition-all"
                      aria-label={link.platform}
                    >
                      {getSocialIcon(link.platform)}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <div className="px-5 md:px-8 max-w-6xl mx-auto py-10">
          <FeaturedPropertiesBanner />
        </div>
      </main>
    </div>
  );
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors border ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card/40 text-muted-foreground border-border/70 hover:text-foreground hover:border-border"
      }`}
    >
      {label}
    </button>
  );
}
