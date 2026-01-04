import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, GripVertical, Image, ExternalLink } from "lucide-react";

interface Banner {
  id: string;
  image_url: string;
  title: string | null;
  link_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export function AdminMarketing() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newBanner, setNewBanner] = useState({
    title: "",
    link_url: "",
    file: null as File | null,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from("homepage_banners")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error("Error fetching banners:", error);
      toast({
        title: "Error",
        description: "Failed to load banners",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewBanner({ ...newBanner, file: e.target.files[0] });
    }
  };

  const uploadBanner = async () => {
    if (!newBanner.file) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      // Upload image to storage
      const fileExt = newBanner.file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("homepage-banners")
        .upload(filePath, newBanner.file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("homepage-banners")
        .getPublicUrl(filePath);

      // Insert banner record
      const { error: insertError } = await supabase
        .from("homepage_banners")
        .insert({
          image_url: urlData.publicUrl,
          title: newBanner.title || null,
          link_url: newBanner.link_url || null,
          display_order: banners.length,
        });

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "Banner uploaded successfully",
      });

      setNewBanner({ title: "", link_url: "", file: null });
      fetchBanners();
    } catch (error) {
      console.error("Error uploading banner:", error);
      toast({
        title: "Error",
        description: "Failed to upload banner",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const toggleBannerActive = async (banner: Banner) => {
    try {
      const { error } = await supabase
        .from("homepage_banners")
        .update({ is_active: !banner.is_active })
        .eq("id", banner.id);

      if (error) throw error;

      setBanners(
        banners.map((b) =>
          b.id === banner.id ? { ...b, is_active: !b.is_active } : b
        )
      );

      toast({
        title: "Success",
        description: `Banner ${!banner.is_active ? "activated" : "deactivated"}`,
      });
    } catch (error) {
      console.error("Error updating banner:", error);
      toast({
        title: "Error",
        description: "Failed to update banner",
        variant: "destructive",
      });
    }
  };

  const deleteBanner = async (banner: Banner) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;

    try {
      // Extract file path from URL
      const urlParts = banner.image_url.split("/homepage-banners/");
      if (urlParts[1]) {
        await supabase.storage.from("homepage-banners").remove([urlParts[1]]);
      }

      const { error } = await supabase
        .from("homepage_banners")
        .delete()
        .eq("id", banner.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Banner deleted successfully",
      });

      fetchBanners();
    } catch (error) {
      console.error("Error deleting banner:", error);
      toast({
        title: "Error",
        description: "Failed to delete banner",
        variant: "destructive",
      });
    }
  };

  const moveBanner = async (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= banners.length) return;

    const newBanners = [...banners];
    [newBanners[index], newBanners[newIndex]] = [newBanners[newIndex], newBanners[index]];

    try {
      await Promise.all(
        newBanners.map((banner, i) =>
          supabase
            .from("homepage_banners")
            .update({ display_order: i })
            .eq("id", banner.id)
        )
      );

      setBanners(newBanners.map((b, i) => ({ ...b, display_order: i })));
    } catch (error) {
      console.error("Error reordering banners:", error);
      toast({
        title: "Error",
        description: "Failed to reorder banners",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Homepage Banners
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload New Banner */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Banner
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="banner-image">Banner Image *</Label>
                <Input
                  id="banner-image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="banner-title">Title (optional)</Label>
                <Input
                  id="banner-title"
                  placeholder="Banner title"
                  value={newBanner.title}
                  onChange={(e) =>
                    setNewBanner({ ...newBanner, title: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="banner-link">Link URL (optional)</Label>
                <Input
                  id="banner-link"
                  placeholder="https://example.com"
                  value={newBanner.link_url}
                  onChange={(e) =>
                    setNewBanner({ ...newBanner, link_url: e.target.value })
                  }
                />
              </div>
            </div>
            <Button
              onClick={uploadBanner}
              disabled={uploading || !newBanner.file}
              className="mt-4"
            >
              {uploading ? "Uploading..." : "Upload Banner"}
            </Button>
          </div>

          {/* Banner List */}
          <div className="space-y-3">
            <h3 className="font-medium">Current Banners ({banners.length})</h3>
            {banners.length === 0 ? (
              <p className="text-muted-foreground text-sm">No banners uploaded yet.</p>
            ) : (
              banners.map((banner, index) => (
                <div
                  key={banner.id}
                  className="flex items-center gap-4 p-3 border rounded-lg bg-background"
                >
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveBanner(index, "up")}
                      disabled={index === 0}
                    >
                      <GripVertical className="h-4 w-4" />
                    </Button>
                  </div>
                  <img
                    src={banner.image_url}
                    alt={banner.title || "Banner"}
                    className="w-24 h-14 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {banner.title || "Untitled Banner"}
                    </p>
                    {banner.link_url && (
                      <a
                        href={banner.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground flex items-center gap-1 hover:text-primary"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span className="truncate">{banner.link_url}</span>
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={banner.is_active}
                        onCheckedChange={() => toggleBannerActive(banner)}
                      />
                      <span className="text-sm text-muted-foreground">
                        {banner.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteBanner(banner)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
