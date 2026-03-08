import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Upload, X, Image as ImageIcon,
  Video, Star, StarOff, FolderOpen, Search, FileText, Globe, BookOpen, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { RichTextEditor } from "./RichTextEditor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SocialLinksManager } from "./SocialLinksManager";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  is_published: boolean;
  is_featured: boolean;
  published_at: string | null;
  created_at: string;
  category_id: string | null;
  views_count: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  display_order: number;
}

interface BlogFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  is_published: boolean;
  is_featured: boolean;
  category_id: string;
}

const generateSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

export function AdminBlog() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("posts");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const coverInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [formData, setFormData] = useState<BlogFormData>({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    cover_image: "",
    is_published: false,
    is_featured: false,
    category_id: "",
  });

  // Category states
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    slug: "",
    display_order: 0,
  });

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ["admin-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as BlogPost[];
    },
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["admin-blog-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_categories")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as Category[];
    },
  });

  // Computed stats
  const totalPosts = posts?.length || 0;
  const publishedPosts = posts?.filter(p => p.is_published).length || 0;
  const draftPosts = posts?.filter(p => !p.is_published).length || 0;
  const totalViews = posts?.reduce((sum, p) => sum + (p.views_count || 0), 0) || 0;

  // Filtered posts
  const filteredPosts = posts?.filter(post => {
    const matchesSearch = !searchQuery ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.excerpt || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "published" && post.is_published) ||
      (statusFilter === "draft" && !post.is_published) ||
      (statusFilter === "featured" && post.is_featured);
    const matchesCategory =
      categoryFilter === "all" || post.category_id === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const uploadFile = async (file: File, type: "cover" | "media"): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${type}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("blog-media")
      .upload(filePath, file);

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("blog-media")
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    const url = await uploadFile(file, "cover");
    if (url) setFormData((prev) => ({ ...prev, cover_image: url }));
    setUploadingCover(false);
    if (coverInputRef.current) coverInputRef.current.value = "";
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMedia(true);
    const url = await uploadFile(file, "media");
    if (url) {
      const isVideo = file.type.startsWith("video/");
      if (isVideo) {
        const videoHtml = `<video controls class="rounded-lg max-w-full my-4"><source src="${url}" type="${file.type}">Your browser does not support the video tag.</video>`;
        setFormData((prev) => ({ ...prev, content: prev.content + videoHtml }));
      } else {
        const imgHtml = `<img src="${url}" alt="Blog image" class="rounded-lg max-w-full h-auto my-4" />`;
        setFormData((prev) => ({ ...prev, content: prev.content + imgHtml }));
      }
      setEditorKey((k) => k + 1);
      toast({ title: isVideo ? "Video uploaded" : "Image uploaded" });
    }
    setUploadingMedia(false);
    if (mediaInputRef.current) mediaInputRef.current.value = "";
  };

  // Post mutations
  const createMutation = useMutation({
    mutationFn: async (data: BlogFormData) => {
      const { error } = await supabase.from("blog_posts").insert({
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt || null,
        content: data.content,
        cover_image: data.cover_image || null,
        is_published: data.is_published,
        is_featured: data.is_featured,
        category_id: data.category_id || null,
        author_id: user?.id,
        published_at: data.is_published ? new Date().toISOString() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast({ title: "Post created successfully" });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: "Failed to create post", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<BlogFormData> & { is_published?: boolean } }) => {
      const updateData: Record<string, unknown> = { ...data };
      if (data.is_published && editingPost && !editingPost.published_at) {
        updateData.published_at = new Date().toISOString();
      }
      const { error } = await supabase.from("blog_posts").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast({ title: "Post updated successfully" });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: "Failed to update post", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast({ title: "Post deleted successfully" });
      setDeletePostId(null);
    },
    onError: () => {
      toast({ title: "Failed to delete post", variant: "destructive" });
    },
  });

  // Category mutations
  const createCategoryMutation = useMutation({
    mutationFn: async (data: typeof categoryFormData) => {
      const { error } = await supabase.from("blog_categories").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-categories"] });
      toast({ title: "Category created successfully" });
      handleCloseCategoryDialog();
    },
    onError: () => {
      toast({ title: "Failed to create category", variant: "destructive" });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof categoryFormData }) => {
      const { error } = await supabase.from("blog_categories").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-categories"] });
      toast({ title: "Category updated successfully" });
      handleCloseCategoryDialog();
    },
    onError: () => {
      toast({ title: "Failed to update category", variant: "destructive" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-categories"] });
      toast({ title: "Category deleted successfully" });
      setDeleteCategoryId(null);
    },
    onError: () => {
      toast({ title: "Failed to delete category", variant: "destructive" });
    },
  });

  const handleOpenCreate = () => {
    setEditingPost(null);
    setFormData({ title: "", slug: "", excerpt: "", content: "", cover_image: "", is_published: false, is_featured: false, category_id: "" });
    setEditorKey((k) => k + 1);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || "",
      content: post.content,
      cover_image: post.cover_image || "",
      is_published: post.is_published,
      is_featured: post.is_featured,
      category_id: post.category_id || "",
    });
    setEditorKey((k) => k + 1);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPost(null);
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: editingPost ? prev.slug : generateSlug(title),
    }));
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.slug || !formData.content) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    if (editingPost) {
      updateMutation.mutate({ id: editingPost.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const togglePublish = (post: BlogPost) => {
    updateMutation.mutate({ id: post.id, data: { is_published: !post.is_published } });
  };

  const toggleFeatured = (post: BlogPost) => {
    updateMutation.mutate({ id: post.id, data: { is_featured: !post.is_featured } });
  };

  const handleOpenCreateCategory = () => {
    setEditingCategory(null);
    setCategoryFormData({ name: "", slug: "", display_order: (categories?.length || 0) + 1 });
    setIsCategoryDialogOpen(true);
  };

  const handleOpenEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryFormData({ name: cat.name, slug: cat.slug, display_order: cat.display_order });
    setIsCategoryDialogOpen(true);
  };

  const handleCloseCategoryDialog = () => {
    setIsCategoryDialogOpen(false);
    setEditingCategory(null);
  };

  const handleCategoryNameChange = (name: string) => {
    setCategoryFormData((prev) => ({
      ...prev,
      name,
      slug: editingCategory ? prev.slug : generateSlug(name),
    }));
  };

  const handleCategorySubmit = () => {
    if (!categoryFormData.name || !categoryFormData.slug) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data: categoryFormData });
    } else {
      createCategoryMutation.mutate(categoryFormData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalPosts}</p>
                <p className="text-xs text-muted-foreground">Total Posts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Globe className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{publishedPosts}</p>
                <p className="text-xs text-muted-foreground">Published</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{draftPosts}</p>
                <p className="text-xs text-muted-foreground">Drafts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalViews.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Views</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-xl">Blog Management</CardTitle>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="posts">Posts</TabsTrigger>
                <TabsTrigger value="categories">Categories</TabsTrigger>
                <TabsTrigger value="social">Social Links</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* Posts Tab */}
            <TabsContent value="posts" className="mt-0 space-y-4">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search posts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-36">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="featured">Featured</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleOpenCreate} className="shrink-0">
                  <Plus className="h-4 w-4 mr-2" />
                  New Post
                </Button>
              </div>

              {/* Posts Table */}
              {postsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
              ) : filteredPosts && filteredPosts.length > 0 ? (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block rounded-lg border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="w-[60px]">Cover</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead className="w-[120px]">Category</TableHead>
                          <TableHead className="w-[100px]">Status</TableHead>
                          <TableHead className="w-[70px]">Views</TableHead>
                          <TableHead className="w-[100px]">Created</TableHead>
                          <TableHead className="text-right w-[130px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPosts.map((post) => (
                          <TableRow key={post.id} className="group">
                            <TableCell>
                              {post.cover_image ? (
                                <img
                                  src={post.cover_image}
                                  alt={post.title}
                                  className="w-10 h-10 object-cover rounded-md"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {post.is_featured && (
                                  <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 shrink-0" />
                                )}
                                <span className="font-medium line-clamp-1">{post.title}</span>
                              </div>
                              {post.excerpt && (
                                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{post.excerpt}</p>
                              )}
                            </TableCell>
                            <TableCell>
                              {categories?.find(c => c.id === post.category_id) ? (
                                <Badge variant="outline" className="text-xs font-normal">
                                  {categories.find(c => c.id === post.category_id)?.name}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={post.is_published ? "default" : "secondary"}
                                className={post.is_published ? "bg-green-500/15 text-green-500 border-green-500/20 hover:bg-green-500/20" : ""}
                              >
                                {post.is_published ? "Published" : "Draft"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {(post.views_count || 0).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {format(new Date(post.created_at), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => toggleFeatured(post)}
                                  title={post.is_featured ? "Remove from featured" : "Add to featured"}
                                  className="h-8 w-8 p-0"
                                >
                                  {post.is_featured ? (
                                    <StarOff className="h-3.5 w-3.5" />
                                  ) : (
                                    <Star className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => togglePublish(post)}
                                  title={post.is_published ? "Unpublish" : "Publish"}
                                  className="h-8 w-8 p-0"
                                >
                                  {post.is_published ? (
                                    <EyeOff className="h-3.5 w-3.5" />
                                  ) : (
                                    <Eye className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleOpenEdit(post)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  onClick={() => setDeletePostId(post.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-3">
                    {filteredPosts.map((post) => (
                      <Card key={post.id} className="overflow-hidden">
                        <CardContent className="p-0">
                          <div className="flex gap-3 p-3">
                            {post.cover_image ? (
                              <img
                                src={post.cover_image}
                                alt={post.title}
                                className="w-16 h-16 object-cover rounded-lg shrink-0"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {post.is_featured && (
                                    <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 shrink-0" />
                                  )}
                                  <p className="font-medium text-sm line-clamp-2">{post.title}</p>
                                </div>
                                <Badge
                                  variant={post.is_published ? "default" : "secondary"}
                                  className={`shrink-0 text-xs ${post.is_published ? "bg-green-500/15 text-green-500 border-green-500/20" : ""}`}
                                >
                                  {post.is_published ? "Live" : "Draft"}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 mt-1.5">
                                {categories?.find(c => c.id === post.category_id) && (
                                  <Badge variant="outline" className="text-xs font-normal">
                                    {categories.find(c => c.id === post.category_id)?.name}
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {(post.views_count || 0).toLocaleString()} views
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(post.created_at), "MMM d")}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex border-t border-border">
                            <button
                              onClick={() => toggleFeatured(post)}
                              className="flex-1 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors flex items-center justify-center gap-1"
                            >
                              {post.is_featured ? <StarOff className="h-3.5 w-3.5" /> : <Star className="h-3.5 w-3.5" />}
                              {post.is_featured ? "Unfeature" : "Feature"}
                            </button>
                            <button
                              onClick={() => togglePublish(post)}
                              className="flex-1 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors flex items-center justify-center gap-1 border-x border-border"
                            >
                              {post.is_published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              {post.is_published ? "Unpublish" : "Publish"}
                            </button>
                            <button
                              onClick={() => handleOpenEdit(post)}
                              className="flex-1 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors flex items-center justify-center gap-1 border-r border-border"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </button>
                            <button
                              onClick={() => setDeletePostId(post.id)}
                              className="flex-1 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors flex items-center justify-center gap-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground text-right">
                    Showing {filteredPosts.length} of {totalPosts} posts
                  </p>
                </>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  {searchQuery || statusFilter !== "all" || categoryFilter !== "all" ? (
                    <>
                      <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">No posts match your filters</p>
                      <p className="text-sm mt-1">Try adjusting your search or filters</p>
                    </>
                  ) : (
                    <>
                      <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">No blog posts yet</p>
                      <p className="text-sm mt-1">Create your first post to get started</p>
                    </>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Categories Tab */}
            <TabsContent value="categories" className="mt-0 space-y-4">
              <div className="flex justify-end">
                <Button onClick={handleOpenCreateCategory}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Category
                </Button>
              </div>

              {categoriesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
              ) : categories && categories.length > 0 ? (
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Name</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead className="w-[80px]">Posts</TableHead>
                        <TableHead className="w-[70px] text-center">Order</TableHead>
                        <TableHead className="text-right w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((cat) => (
                        <TableRow key={cat.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded bg-primary/10">
                                <FolderOpen className="h-3.5 w-3.5 text-primary" />
                              </div>
                              {cat.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                              {cat.slug}
                            </code>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {posts?.filter(p => p.category_id === cat.id).length || 0}
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground text-sm">
                            {cat.display_order}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenEditCategory(cat)}
                                className="h-8 w-8 p-0"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={() => setDeleteCategoryId(cat.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <FolderOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No categories yet</p>
                  <p className="text-sm mt-1">Create categories to organize your posts</p>
                </div>
              )}
            </TabsContent>

            {/* Social Links Tab */}
            <TabsContent value="social" className="mt-0">
              <SocialLinksManager />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create/Edit Post Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPost ? "Edit Post" : "Create New Post"}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="settings">Settings & Media</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Enter post title"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="Brief summary of the post"
                  rows={2}
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Content *</Label>
                  <div className="flex gap-2">
                    <input
                      ref={mediaInputRef}
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={handleMediaUpload}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => mediaInputRef.current?.click()}
                      disabled={uploadingMedia}
                    >
                      {uploadingMedia ? (
                        "Uploading..."
                      ) : (
                        <>
                          <ImageIcon className="h-4 w-4 mr-1" />
                          <Video className="h-4 w-4 mr-1" />
                          Insert Media
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <RichTextEditor
                  key={editorKey}
                  content={formData.content}
                  onChange={(content) => setFormData((prev) => ({ ...prev, content }))}
                  onInsertImage={() => mediaInputRef.current?.click()}
                />
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                  placeholder="post-url-slug"
                />
                <p className="text-xs text-muted-foreground">
                  The URL will be: /blog/{formData.slug || "your-post-slug"}
                </p>
              </div>

              <div className="grid gap-2">
                <Label>Category</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, category_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Cover Image</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.cover_image}
                    onChange={(e) => setFormData((prev) => ({ ...prev, cover_image: e.target.value }))}
                    placeholder="https://example.com/image.jpg or upload"
                  />
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={uploadingCover}
                  >
                    {uploadingCover ? "Uploading..." : <Upload className="h-4 w-4" />}
                  </Button>
                </div>
                {formData.cover_image && (
                  <div className="relative mt-2">
                    <img
                      src={formData.cover_image}
                      alt="Cover preview"
                      className="w-full max-h-48 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={() => setFormData((prev) => ({ ...prev, cover_image: "" }))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_published"
                    checked={formData.is_published}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_published: checked }))}
                  />
                  <Label htmlFor="is_published">Publish immediately</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_featured: checked }))}
                  />
                  <Label htmlFor="is_featured">Featured post</Label>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : editingPost ? "Update Post" : "Create Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Create Category"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="cat-name">Name *</Label>
              <Input
                id="cat-name"
                value={categoryFormData.name}
                onChange={(e) => handleCategoryNameChange(e.target.value)}
                placeholder="Category name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cat-slug">Slug *</Label>
              <Input
                id="cat-slug"
                value={categoryFormData.slug}
                onChange={(e) => setCategoryFormData((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder="category-slug"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cat-order">Display Order</Label>
              <Input
                id="cat-order"
                type="number"
                value={categoryFormData.display_order}
                onChange={(e) => setCategoryFormData((prev) => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={handleCloseCategoryDialog}>Cancel</Button>
            <Button
              onClick={handleCategorySubmit}
              disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
            >
              {createCategoryMutation.isPending || updateCategoryMutation.isPending
                ? "Saving..."
                : editingCategory ? "Update Category" : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Post Confirmation */}
      <AlertDialog open={!!deletePostId} onOpenChange={() => setDeletePostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePostId && deleteMutation.mutate(deletePostId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Category Confirmation */}
      <AlertDialog open={!!deleteCategoryId} onOpenChange={() => setDeleteCategoryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category? Posts in this category will no longer have a category assigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCategoryId && deleteCategoryMutation.mutate(deleteCategoryId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
