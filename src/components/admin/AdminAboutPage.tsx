import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Loader2 } from "lucide-react";

interface AboutContent {
  company_name: string;
  tagline: string;
  description: string;
  mission: string;
  email: string;
  phone: string;
  address: string;
  whatsapp: string;
}

const DEFAULT: AboutContent = {
  company_name: "LibHub",
  tagline: "Liberia's Premier Property Platform",
  description: "",
  mission: "",
  email: "support@libhub.com",
  phone: "",
  address: "Monrovia, Liberia",
  whatsapp: "",
};

export function AdminAboutPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState<AboutContent>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "about_page_content")
        .single();
      if (data?.value) setContent({ ...DEFAULT, ...(data.value as any) });
      setLoading(false);
    };
    fetch();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("platform_settings")
      .upsert({ key: "about_page_content", value: content as any, updated_by: user?.id } as any, { onConflict: "key" });
    if (error) {
      toast({ title: "Error", description: "Failed to save", variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "About page content updated" });
    }
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">About / Contact Us Page</h2>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Company Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input value={content.company_name} onChange={(e) => setContent({ ...content, company_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Tagline</Label>
              <Input value={content.tagline} onChange={(e) => setContent({ ...content, tagline: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={content.description} onChange={(e) => setContent({ ...content, description: e.target.value })} rows={4} />
            </div>
            <div className="space-y-2">
              <Label>Mission Statement</Label>
              <Textarea value={content.mission} onChange={(e) => setContent({ ...content, mission: e.target.value })} rows={3} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Contact Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={content.email} onChange={(e) => setContent({ ...content, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={content.phone} onChange={(e) => setContent({ ...content, phone: e.target.value })} placeholder="+231..." />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp</Label>
              <Input value={content.whatsapp} onChange={(e) => setContent({ ...content, whatsapp: e.target.value })} placeholder="+231..." />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={content.address} onChange={(e) => setContent({ ...content, address: e.target.value })} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
