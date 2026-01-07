import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";

interface SocialLink {
  id: string;
  platform: string;
  url: string | null;
  is_active: boolean;
  display_order: number;
}

const PLATFORM_ICONS: Record<string, string> = {
  facebook: "📘",
  instagram: "📸",
  tiktok: "🎵",
  youtube: "▶️",
  twitter: "𝕏",
};

export function SocialLinksManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localLinks, setLocalLinks] = useState<SocialLink[]>([]);

  const { data: socialLinks, isLoading } = useQuery({
    queryKey: ["admin-social-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_social_links")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as SocialLink[];
    },
  });

  useEffect(() => {
    if (socialLinks) {
      setLocalLinks(socialLinks);
    }
  }, [socialLinks]);

  const updateMutation = useMutation({
    mutationFn: async (link: SocialLink) => {
      const { error } = await supabase
        .from("blog_social_links")
        .update({ url: link.url, is_active: link.is_active })
        .eq("id", link.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-social-links"] });
      queryClient.invalidateQueries({ queryKey: ["blog-social-links"] });
      toast({ title: "Social link updated" });
    },
    onError: () => {
      toast({ title: "Failed to update", variant: "destructive" });
    },
  });

  const handleUrlChange = (id: string, url: string) => {
    setLocalLinks(prev => prev.map(link => 
      link.id === id ? { ...link, url } : link
    ));
  };

  const handleActiveChange = (id: string, is_active: boolean) => {
    setLocalLinks(prev => prev.map(link => 
      link.id === id ? { ...link, is_active } : link
    ));
  };

  const handleSave = (link: SocialLink) => {
    updateMutation.mutate(link);
  };

  if (isLoading) {
    return <p className="text-muted-foreground">Loading social links...</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        Manage your social media links. These will appear in the blog's "Follow Us" section.
      </p>
      
      {localLinks.map((link) => (
        <div key={link.id} className="flex items-center gap-4 p-4 border rounded-lg">
          <span className="text-2xl">{PLATFORM_ICONS[link.platform] || "🔗"}</span>
          <div className="flex-1">
            <Label className="text-sm font-medium capitalize">{link.platform}</Label>
            <Input
              value={link.url || ""}
              onChange={(e) => handleUrlChange(link.id, e.target.value)}
              placeholder={`https://${link.platform}.com/yourprofile`}
              className="mt-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={link.is_active}
              onCheckedChange={(checked) => handleActiveChange(link.id, checked)}
            />
            <span className="text-xs text-muted-foreground w-12">
              {link.is_active ? "Active" : "Hidden"}
            </span>
          </div>
          <Button
            size="sm"
            onClick={() => handleSave(link)}
            disabled={updateMutation.isPending}
          >
            <Save className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
