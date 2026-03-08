import { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ArrowLeft, User, Eye, Clock, Share2, Copy, Check, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

// Social icons
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

const TiktokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
);

const YoutubeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

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

interface BlogPostData {
  id: string;
  title: string;
  content: string;
  cover_image: string | null;
  published_at: string | null;
  author_id: string;
  author_name?: string;
  views_count: number;
  category_id: string | null;
  category?: Category;
}

function estimateReadingTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, "");
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: post, isLoading, error } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, content, cover_image, published_at, author_id, views_count, category_id")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      
      let authorName: string | undefined;
      if (data.author_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", data.author_id)
          .maybeSingle();
        authorName = profile?.name;
      }

      let category: Category | undefined;
      if (data.category_id) {
        const { data: cat } = await supabase
          .from("blog_categories")
          .select("id, name, slug")
          .eq("id", data.category_id)
          .maybeSingle();
        category = cat || undefined;
      }

      return { ...data, author_name: authorName, category } as BlogPostData;
    },
    enabled: !!slug,
  });

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

  const { data: relatedPosts } = useQuery({
    queryKey: ["related-posts", post?.category_id, post?.id],
    queryFn: async () => {
      if (!post?.category_id) return [];
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, slug, cover_image, published_at")
        .eq("is_published", true)
        .eq("category_id", post.category_id)
        .neq("id", post.id)
        .limit(3);
      if (error) throw error;
      return data;
    },
    enabled: !!post?.category_id,
  });

  const viewMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.rpc("increment_views", { post_id: postId });
      if (error) console.error("View count error:", error);
    },
  });

  useEffect(() => {
    if (post?.id) viewMutation.mutate(post.id);
  }, [post?.id]);

  const readingTime = useMemo(() => post ? estimateReadingTime(post.content) : 0, [post]);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareTitle = post?.title || "Check out this article";

  const handleShare = async (platform: string) => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(shareTitle);

    let shareLink = "";
    switch (platform) {
      case "facebook":
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case "twitter":
        shareLink = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      case "whatsapp":
        shareLink = `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
        break;
      case "linkedin":
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case "copy":
        try {
          await navigator.clipboard.writeText(shareUrl);
          setCopied(true);
          toast({ title: "Link copied!", description: "Article link copied to clipboard" });
          setTimeout(() => setCopied(false), 2000);
        } catch {
          toast({ title: "Failed to copy", variant: "destructive" });
        }
        return;
    }

    if (shareLink) {
      window.open(shareLink, "_blank", "width=600,height=400");
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-16">
          <Skeleton className="w-full h-52 md:h-72" />
          <div className="px-4 py-5 max-w-3xl mx-auto space-y-3">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-3/4" />
            <div className="flex gap-3 pt-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="pt-6 space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="px-4 pt-24 text-center">
          <div className="py-16 max-w-md mx-auto">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-5">
              <BookOpen className="h-7 w-7 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Post Not Found</h1>
            <p className="text-muted-foreground text-sm mb-6">
              This article doesn't exist or has been removed.
            </p>
            <Button asChild size="sm" className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              <Link to="/blog">
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Back to Blog
              </Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Process content to make images full width and preserve inline styles
  const processedContent = post.content
    .replace(/<img([^>]*)class="[^"]*"([^>]*)>/g, '<img$1class="blog-full-image"$2>')
    .replace(/<img(?![^>]*class=)([^>]*)>/g, '<img class="blog-full-image"$1>')
    .replace(/style="([^"]*)color:\s*([^;"]+)([^"]*)"/g, 'style="$1color: $2 !important$3"')
    .replace(/style="([^"]*)font-size:\s*([^;"]+)([^"]*)"/g, 'style="$1font-size: $2 !important$3"')
    .replace(/style="([^"]*)font-family:\s*([^;"]+)([^"]*)"/g, 'style="$1font-family: $2 !important$3"')
    .replace(/style="([^"]*)text-align:\s*([^;"]+)([^"]*)"/g, 'style="$1text-align: $2 !important$3"');

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pb-24 md:pb-8">
        {/* Cover Image */}
        {post.cover_image && (
          <div className="w-full relative">
            <img
              src={post.cover_image}
              alt={post.title}
              className="w-full h-52 md:h-80 lg:h-96 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
            {/* Back button overlay */}
            <div className="absolute top-16 left-3 md:left-6">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="bg-background/60 backdrop-blur-sm hover:bg-background/80 text-foreground rounded-full h-9 px-3"
              >
                <Link to="/blog">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Blog
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Article Header */}
        <div className="px-4 md:px-6 max-w-3xl mx-auto">
          <div className={post.cover_image ? "-mt-10 relative z-10" : "pt-20"}>
            {!post.cover_image && (
              <Button variant="ghost" asChild size="sm" className="mb-4 -ml-2 text-muted-foreground hover:text-destructive">
                <Link to="/blog">
                  <ArrowLeft className="h-4 w-4 mr-1.5" />
                  Back to Blog
                </Link>
              </Button>
            )}

            {post.category && (
              <span className="inline-block bg-destructive text-destructive-foreground px-2.5 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider mb-3">
                {post.category.name}
              </span>
            )}

            <h1 className="text-xl md:text-3xl lg:text-4xl font-extrabold text-foreground leading-tight mb-3">
              {post.title}
            </h1>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground pb-4 border-b border-border">
              {post.author_name && (
                <span className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-destructive/15 flex items-center justify-center">
                    <User className="h-3 w-3 text-destructive" />
                  </div>
                  <span className="font-medium text-foreground">{post.author_name}</span>
                </span>
              )}
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
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {readingTime} min read
              </span>
            </div>
          </div>
        </div>

        {/* Article Content */}
        <article className="px-4 md:px-6 py-6 max-w-3xl mx-auto">
          <div 
            className="prose prose-lg max-w-none blog-content
              prose-headings:font-bold prose-headings:mb-3 prose-headings:mt-6
              prose-p:leading-[1.8] prose-p:text-[15px] prose-p:mb-5
              prose-a:text-destructive prose-a:no-underline hover:prose-a:underline
              prose-strong:font-semibold
              prose-ul:leading-[1.8] prose-ol:leading-[1.8]
              prose-li:marker:text-destructive prose-li:mb-1.5
              prose-blockquote:border-l-destructive prose-blockquote:bg-muted prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:rounded-r-lg prose-blockquote:italic prose-blockquote:text-sm
              [&_.blog-full-image]:w-screen [&_.blog-full-image]:relative [&_.blog-full-image]:left-1/2 [&_.blog-full-image]:right-1/2 [&_.blog-full-image]:-mx-[50vw] [&_.blog-full-image]:max-w-none [&_.blog-full-image]:my-6 [&_.blog-full-image]:h-auto
              [&_table]:border-collapse [&_table]:w-full [&_table]:my-4 [&_table]:border [&_table]:border-border
              [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:p-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-sm
              [&_td]:border [&_td]:border-border [&_td]:p-2 [&_td]:text-sm
              [&_pre]:bg-muted [&_pre]:text-foreground [&_pre]:rounded-xl [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:my-4
              [&_code]:font-mono [&_code]:text-sm
              [&_pre_code]:bg-transparent [&_pre_code]:p-0"
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />
        </article>

        {/* Inline Share Bar */}
        <div className="px-4 md:px-6 max-w-3xl mx-auto">
          <div className="flex items-center justify-between bg-muted/60 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Share2 className="h-4 w-4" />
              <span className="text-xs font-medium">Share</span>
            </div>
            <div className="flex items-center gap-1.5">
              {[
                { key: "facebook", icon: <FacebookIcon />, bg: "bg-[#1877f2]" },
                { key: "twitter", icon: <TwitterIcon />, bg: "bg-foreground text-background" },
                { key: "whatsapp", icon: <WhatsAppIcon />, bg: "bg-[#25d366]" },
                { key: "linkedin", icon: <LinkedInIcon />, bg: "bg-[#0a66c2]" },
              ].map(({ key, icon, bg }) => (
                <button
                  key={key}
                  onClick={() => handleShare(key)}
                  className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center text-white transition-transform active:scale-95`}
                >
                  {icon}
                </button>
              ))}
              <button
                onClick={() => handleShare("copy")}
                className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center text-foreground transition-transform active:scale-95"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Follow Us */}
        {activeSocialLinks.length > 0 && (
          <div className="px-4 md:px-6 max-w-3xl mx-auto mt-4">
            <div className="bg-destructive rounded-xl p-4 text-destructive-foreground">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold">Follow Us</h3>
                  <p className="text-[11px] opacity-75">Stay connected for updates</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {activeSocialLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 bg-destructive-foreground/20 hover:bg-destructive-foreground hover:text-destructive rounded-lg flex items-center justify-center transition-all active:scale-95"
                    >
                      {getSocialIcon(link.platform)}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Related Posts */}
        {relatedPosts && relatedPosts.length > 0 && (
          <section className="px-4 md:px-6 py-8 max-w-3xl mx-auto">
            <h2 className="text-base font-bold text-foreground mb-4">Related Articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.id}
                  to={`/blog/${relatedPost.slug}`}
                  className="group"
                >
                  <article className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all duration-200">
                    {relatedPost.cover_image && (
                      <div className="aspect-[16/10] overflow-hidden">
                        <img
                          src={relatedPost.cover_image}
                          alt={relatedPost.title}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-3">
                      <h3 className="font-semibold text-foreground text-sm line-clamp-2 group-hover:text-destructive transition-colors leading-snug">
                        {relatedPost.title}
                      </h3>
                      {relatedPost.published_at && (
                        <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(relatedPost.published_at), "MMM dd, yyyy")}
                        </p>
                      )}
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Footer CTA */}
        <section className="bg-muted/50 py-8 mt-4">
          <div className="px-4 text-center max-w-md mx-auto">
            <h2 className="text-lg font-bold text-foreground mb-2">
              Want to read more?
            </h2>
            <p className="text-muted-foreground text-xs mb-4">
              Explore our blog for more insightful articles.
            </p>
            <Button asChild size="sm" className="bg-destructive hover:bg-destructive/90 text-destructive-foreground px-6">
              <Link to="/blog">View All Articles</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
