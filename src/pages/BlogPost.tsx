import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Calendar, ArrowLeft, User, Eye, Clock, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";

interface Category {
  id: string;
  name: string;
  slug: string;
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

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, content, cover_image, published_at, author_id, views_count, category_id")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();

      if (error) throw error;
      
      // Fetch author name separately
      let authorName: string | undefined;
      if (data.author_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", data.author_id)
          .single();
        authorName = profile?.name;
      }

      // Fetch category
      let category: Category | undefined;
      if (data.category_id) {
        const { data: cat } = await supabase
          .from("blog_categories")
          .select("id, name, slug")
          .eq("id", data.category_id)
          .single();
        category = cat || undefined;
      }

      return { ...data, author_name: authorName, category } as BlogPostData;
    },
    enabled: !!slug,
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

  // Increment view count
  const viewMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.rpc("increment_views" as never, { post_id: postId } as never);
      // Silently fail if the RPC doesn't exist
      if (error) console.log("View count not updated");
    },
  });

  useEffect(() => {
    if (post?.id) {
      viewMutation.mutate(post.id);
    }
  }, [post?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="container mx-auto px-4 py-8 pt-24 max-w-4xl">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-4 w-48 mb-8" />
          <Skeleton className="h-64 w-full mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="container mx-auto px-4 py-8 pt-24 max-w-4xl text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Post Not Found</h1>
          <p className="text-gray-500 mb-6">
            The blog post you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild className="bg-blog-accent hover:bg-blog-accent/90">
            <Link to="/blog">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />
      
      {/* Hero Image */}
      {post.cover_image && (
        <div className="relative h-[400px] md:h-[500px] pt-16">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10" />
          <img
            src={post.cover_image}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 z-20 text-white">
            <div className="container mx-auto max-w-4xl">
              {post.category && (
                <span className="inline-block bg-blog-accent text-white px-4 py-1.5 text-sm font-semibold mb-4">
                  {post.category.name}
                </span>
              )}
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-gray-200 text-sm">
                {post.published_at && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-blog-accent" />
                    {format(new Date(post.published_at), "dd MMMM yyyy")}
                  </span>
                )}
                {post.author_name && (
                  <span className="flex items-center gap-1.5">
                    <User className="h-4 w-4 text-blog-accent" />
                    By {post.author_name}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Eye className="h-4 w-4 text-blog-accent" />
                  {post.views_count || 0} views
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {!post.cover_image && (
          <>
            <Button variant="ghost" asChild className="mb-6 text-gray-600 hover:text-blog-accent">
              <Link to="/blog">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Blog
              </Link>
            </Button>

            {post.category && (
              <span className="inline-block bg-blog-accent text-white px-4 py-1.5 text-sm font-semibold mb-4">
                {post.category.name}
              </span>
            )}
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-gray-500 text-sm mb-8">
              {post.published_at && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-blog-accent" />
                  {format(new Date(post.published_at), "dd MMMM yyyy")}
                </span>
              )}
              {post.author_name && (
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4 text-blog-accent" />
                  By {post.author_name}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-blog-accent" />
                {post.views_count || 0} views
              </span>
            </div>
          </>
        )}

        {post.cover_image && (
          <Button variant="ghost" asChild className="mb-6 text-gray-600 hover:text-blog-accent">
            <Link to="/blog">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Link>
          </Button>
        )}

        <article>
          <div 
            className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blog-accent prose-strong:text-gray-900"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>

        {/* Related Posts */}
        {relatedPosts && relatedPosts.length > 0 && (
          <section className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-2xl font-bold mb-6">Related Articles</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((related) => (
                <Link
                  key={related.id}
                  to={`/blog/${related.slug}`}
                  className="group"
                >
                  {related.cover_image && (
                    <div className="aspect-video rounded-lg overflow-hidden mb-3">
                      <img
                        src={related.cover_image}
                        alt={related.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  )}
                  <h4 className="font-bold group-hover:text-blog-accent transition-colors line-clamp-2">
                    {related.title}
                  </h4>
                  {related.published_at && (
                    <p className="text-sm text-blog-accent mt-1">
                      {format(new Date(related.published_at), "dd MMM yyyy")}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-xl font-bold mb-4">Categories</h4>
              <div className="w-16 h-0.5 bg-blog-accent mb-4" />
              <ul className="space-y-2">
                {categories?.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      to="/blog"
                      className="text-gray-400 hover:text-blog-accent transition flex items-center gap-2"
                    >
                      <ChevronRight className="h-4 w-4" />
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">Links</h4>
              <div className="w-16 h-0.5 bg-blog-accent mb-4" />
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="text-gray-400 hover:text-blog-accent transition flex items-center gap-2">
                    <ChevronRight className="h-4 w-4" />
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className="text-gray-400 hover:text-blog-accent transition flex items-center gap-2">
                    <ChevronRight className="h-4 w-4" />
                    News
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
