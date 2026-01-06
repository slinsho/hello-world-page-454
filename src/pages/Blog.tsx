import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Calendar, Clock, Eye, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";

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

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeTab, setActiveTab] = useState<"popular" | "recent">("popular");

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

      // Fetch categories for posts
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

  const featuredPosts = posts?.filter(p => p.is_featured && p.cover_image) || [];
  const regularPosts = posts?.filter(p => !p.is_featured) || [];
  const popularPosts = [...(posts || [])].sort((a, b) => (b.views_count || 0) - (a.views_count || 0)).slice(0, 5);
  const recentPosts = [...(posts || [])].slice(0, 5);

  const nextSlide = () => {
    if (featuredPosts.length > 0) {
      setCurrentSlide((prev) => (prev + 1) % featuredPosts.length);
    }
  };

  const prevSlide = () => {
    if (featuredPosts.length > 0) {
      setCurrentSlide((prev) => (prev - 1 + featuredPosts.length) % featuredPosts.length);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />
      
      <main className="pt-16">
        {/* Featured Hero Slider */}
        {featuredPosts.length > 0 && (
          <section className="relative h-[500px] md:h-[600px] overflow-hidden">
            {featuredPosts.map((post, index) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className={`absolute inset-0 transition-opacity duration-500 ${
                  index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />
                <img
                  src={post.cover_image!}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 z-20 text-white">
                  {post.category && (
                    <span className="inline-block bg-blog-accent text-blog-accent-foreground px-4 py-1.5 text-sm font-semibold mb-4">
                      {post.category.name}
                    </span>
                  )}
                  <h2 className="text-2xl md:text-4xl font-bold mb-4 max-w-2xl leading-tight">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-gray-200 mb-4 max-w-xl line-clamp-2 text-sm md:text-base">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-gray-300 text-sm">
                    {post.published_at && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-blog-accent" />
                        {format(new Date(post.published_at), "dd MMMM yyyy")}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
            
            {/* Slider Controls */}
            {featuredPosts.length > 1 && (
              <div className="absolute bottom-6 left-6 md:left-12 z-30 flex gap-2">
                <button
                  onClick={(e) => { e.preventDefault(); prevSlide(); }}
                  className="w-12 h-12 bg-blog-accent text-white flex items-center justify-center hover:bg-blog-accent/90 transition"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={(e) => { e.preventDefault(); nextSlide(); }}
                  className="w-12 h-12 bg-blog-accent text-white flex items-center justify-center hover:bg-blog-accent/90 transition"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </section>
        )}

        {/* Latest News Section */}
        <section className="container mx-auto px-4 py-12">
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-bold italic mb-2">Latest Property News</h2>
            <p className="text-gray-500">Don't miss daily news</p>
            <div className="w-24 h-1 bg-blog-accent mt-4" />
          </div>

          {/* Category Tabs */}
          {categories && categories.length > 0 && (
            <div className="flex flex-wrap gap-0 mb-8 bg-gray-100 rounded-lg overflow-hidden w-fit">
              <button
                onClick={() => setActiveCategory(null)}
                className={`px-6 py-3 font-semibold text-sm transition ${
                  activeCategory === null
                    ? "bg-blog-accent text-white"
                    : "text-gray-700 hover:bg-gray-200"
                }`}
              >
                ALL
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-6 py-3 font-semibold text-sm transition ${
                    activeCategory === cat.id
                      ? "bg-blog-accent text-white"
                      : "text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {cat.name.toUpperCase()}
                </button>
              ))}
            </div>
          )}

          {/* Blog Posts Grid */}
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : regularPosts && regularPosts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularPosts.map((post) => (
                <Link key={post.id} to={`/blog/${post.slug}`} className="group">
                  <article className="bg-white border border-gray-100 rounded-lg overflow-hidden hover:shadow-xl transition-shadow">
                    {post.cover_image && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={post.cover_image}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-5">
                      {post.category && (
                        <span className="inline-block bg-blog-accent text-blog-accent-foreground px-3 py-1 text-xs font-semibold mb-3">
                          {post.category.name}
                        </span>
                      )}
                      <h3 className="text-xl font-bold mb-2 group-hover:text-blog-accent transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      {post.published_at && (
                        <div className="flex items-center gap-1.5 text-blog-accent text-sm mb-3">
                          <Clock className="h-4 w-4" />
                          {format(new Date(post.published_at), "dd MMM yyyy").toUpperCase()}
                        </div>
                      )}
                      {post.excerpt && (
                        <p className="text-gray-600 text-sm line-clamp-2">{post.excerpt}</p>
                      )}
                      <div className="flex items-center justify-end gap-4 mt-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4 text-blog-accent" />
                          {post.views_count || 0}
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No articles found. Check back soon!
            </div>
          )}
        </section>

        {/* Popular / Recent News Section */}
        <section className="bg-gray-50 py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Link to="/blog" className="block bg-gray-900 text-white text-center py-4 font-semibold mb-8 hover:bg-gray-800 transition">
                Read all News
              </Link>

              {/* Tabs */}
              <div className="flex mb-8">
                <button
                  onClick={() => setActiveTab("popular")}
                  className={`flex-1 py-4 font-semibold text-sm transition ${
                    activeTab === "popular"
                      ? "bg-blog-accent text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  POPULAR NEWS
                </button>
                <button
                  onClick={() => setActiveTab("recent")}
                  className={`flex-1 py-4 font-semibold text-sm transition ${
                    activeTab === "recent"
                      ? "bg-blog-accent text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  RECENT NEWS
                </button>
              </div>

              {/* Posts List */}
              <div className="space-y-4">
                {(activeTab === "popular" ? popularPosts : recentPosts).map((post) => (
                  <Link
                    key={post.id}
                    to={`/blog/${post.slug}`}
                    className="flex gap-4 p-4 bg-white rounded-lg hover:shadow-lg transition group"
                  >
                    {post.cover_image && (
                      <div className="w-28 h-20 flex-shrink-0 rounded overflow-hidden">
                        <img
                          src={post.cover_image}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 group-hover:text-blog-accent transition-colors line-clamp-2">
                        {post.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                        {post.published_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-blog-accent" />
                            {format(new Date(post.published_at), "dd MMM yyyy").toUpperCase()}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5 text-blog-accent" />
                          {post.views_count || 0}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Popular Tags Section */}
        <section className="container mx-auto px-4 py-12">
          <h3 className="text-2xl font-bold mb-4">Popular Tags</h3>
          <div className="w-24 h-1 bg-blog-accent mb-6" />
          
          {categories && categories.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    window.scrollTo({ top: 400, behavior: 'smooth' });
                  }}
                  className="bg-gray-900 text-white px-5 py-2.5 font-semibold text-sm hover:bg-blog-accent transition"
                >
                  {cat.name.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h4 className="text-xl font-bold mb-4">About</h4>
                <div className="w-16 h-0.5 bg-blog-accent mb-4" />
                <p className="text-gray-400 text-sm">
                  Stay updated with the latest property news, market trends, and expert insights.
                </p>
              </div>
              <div>
                <h4 className="text-xl font-bold mb-4">Categories</h4>
                <div className="w-16 h-0.5 bg-blog-accent mb-4" />
                <ul className="space-y-2">
                  {categories?.map((cat) => (
                    <li key={cat.id}>
                      <button
                        onClick={() => {
                          setActiveCategory(cat.id);
                          window.scrollTo({ top: 400, behavior: 'smooth' });
                        }}
                        className="text-gray-400 hover:text-blog-accent transition flex items-center gap-2"
                      >
                        <ChevronRight className="h-4 w-4" />
                        {cat.name}
                      </button>
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
                    <Link to="/explore" className="text-gray-400 hover:text-blog-accent transition flex items-center gap-2">
                      <ChevronRight className="h-4 w-4" />
                      Explore
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
      </main>
    </div>
  );
}
