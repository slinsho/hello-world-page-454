import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Loader2, Plus, Trash2, Upload, Image as ImageIcon } from "lucide-react";

interface TeamMember {
  name: string;
  role: string;
  photo: string;
  bio: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
}

interface WorkPhoto {
  url: string;
  caption: string;
}

interface AboutContent {
  company_name: string;
  tagline: string;
  description: string;
  mission: string;
  vision: string;
  banner_image: string;
  email: string;
  phone: string;
  address: string;
  whatsapp: string;
  values: { title: string; description: string }[];
  stats: { label: string; value: string }[];
  team_members: TeamMember[];
  work_photos: WorkPhoto[];
}

const DEFAULT: AboutContent = {
  company_name: "LibHub",
  tagline: "Liberia's Premier Property Platform",
  description: "",
  mission: "",
  vision: "",
  banner_image: "",
  email: "support@libhub.com",
  phone: "",
  address: "Monrovia, Liberia",
  whatsapp: "",
  values: [
    { title: "Transparency", description: "" },
    { title: "Trust", description: "" },
    { title: "Innovation", description: "" },
    { title: "Community", description: "" },
  ],
  stats: [
    { label: "Properties Listed", value: "500+" },
    { label: "Verified Users", value: "1,000+" },
    { label: "Counties Covered", value: "15" },
    { label: "Happy Clients", value: "800+" },
  ],
  team_members: [],
  work_photos: [],
};

export function AdminAboutPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState<AboutContent>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const bannerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "about_page_content")
        .single();
      if (data?.value) setContent({ ...DEFAULT, ...(data.value as any) });
      setLoading(false);
    };
    fetchData();
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

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `about/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("blog-media").upload(path, file);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      return null;
    }
    const { data: urlData } = supabase.storage.from("blog-media").getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    const url = await uploadImage(file);
    if (url) setContent({ ...content, banner_image: url });
    setUploadingBanner(false);
  };

  const handleTeamPhotoUpload = async (index: number, file: File) => {
    const url = await uploadImage(file);
    if (url) {
      const updated = [...content.team_members];
      updated[index] = { ...updated[index], photo: url };
      setContent({ ...content, team_members: updated });
    }
  };

  const handleWorkPhotoUpload = async (index: number, file: File) => {
    const url = await uploadImage(file);
    if (url) {
      const updated = [...content.work_photos];
      updated[index] = { ...updated[index], url };
      setContent({ ...content, work_photos: updated });
    }
  };

  const addTeamMember = () => {
    setContent({
      ...content,
      team_members: [...content.team_members, { name: "", role: "", photo: "", bio: "", facebook: "", instagram: "", twitter: "", linkedin: "" }],
    });
  };

  const removeTeamMember = (i: number) => {
    setContent({ ...content, team_members: content.team_members.filter((_, idx) => idx !== i) });
  };

  const updateTeamMember = (i: number, field: string, value: string) => {
    const updated = [...content.team_members];
    updated[i] = { ...updated[i], [field]: value };
    setContent({ ...content, team_members: updated });
  };

  const addWorkPhoto = () => {
    setContent({ ...content, work_photos: [...content.work_photos, { url: "", caption: "" }] });
  };

  const removeWorkPhoto = (i: number) => {
    setContent({ ...content, work_photos: content.work_photos.filter((_, idx) => idx !== i) });
  };

  const updateValue = (i: number, field: "title" | "description", val: string) => {
    const updated = [...content.values];
    updated[i] = { ...updated[i], [field]: val };
    setContent({ ...content, values: updated });
  };

  const updateStat = (i: number, field: "label" | "value", val: string) => {
    const updated = [...content.stats];
    updated[i] = { ...updated[i], [field]: val };
    setContent({ ...content, stats: updated });
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

      {/* Banner */}
      <Card>
        <CardHeader><CardTitle className="text-base">Banner Image</CardTitle></CardHeader>
        <CardContent>
          <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
          {content.banner_image ? (
            <div className="relative rounded-xl overflow-hidden">
              <img src={content.banner_image} alt="Banner" className="w-full h-48 object-cover" />
              <div className="absolute top-2 right-2 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => bannerRef.current?.click()} disabled={uploadingBanner}>
                  {uploadingBanner ? <Loader2 className="h-3 w-3 animate-spin" /> : "Change"}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setContent({ ...content, banner_image: "" })}>Remove</Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" onClick={() => bannerRef.current?.click()} disabled={uploadingBanner} className="gap-2 w-full h-32">
              {uploadingBanner ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Upload Banner Image
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Company Info & Contact */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Company Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Company Name</Label><Input value={content.company_name} onChange={(e) => setContent({ ...content, company_name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Tagline</Label><Input value={content.tagline} onChange={(e) => setContent({ ...content, tagline: e.target.value })} /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={content.description} onChange={(e) => setContent({ ...content, description: e.target.value })} rows={3} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Contact Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={content.email} onChange={(e) => setContent({ ...content, email: e.target.value })} /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={content.phone} onChange={(e) => setContent({ ...content, phone: e.target.value })} placeholder="+231..." /></div>
            <div className="space-y-2"><Label>WhatsApp</Label><Input value={content.whatsapp} onChange={(e) => setContent({ ...content, whatsapp: e.target.value })} placeholder="+231..." /></div>
            <div className="space-y-2"><Label>Address</Label><Input value={content.address} onChange={(e) => setContent({ ...content, address: e.target.value })} /></div>
          </CardContent>
        </Card>
      </div>

      {/* Mission & Vision */}
      <Card>
        <CardHeader><CardTitle className="text-base">Mission & Vision</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Mission Statement</Label><Textarea value={content.mission} onChange={(e) => setContent({ ...content, mission: e.target.value })} rows={3} /></div>
          <div className="space-y-2"><Label>Vision Statement</Label><Textarea value={content.vision} onChange={(e) => setContent({ ...content, vision: e.target.value })} rows={3} /></div>
        </CardContent>
      </Card>

      {/* Core Values */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Core Values</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setContent({ ...content, values: [...content.values, { title: "", description: "" }] })} className="gap-1">
              <Plus className="h-3 w-3" /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {content.values.map((val, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="flex-1 grid sm:grid-cols-2 gap-3">
                <Input placeholder="Title" value={val.title} onChange={(e) => updateValue(i, "title", e.target.value)} />
                <Input placeholder="Description" value={val.description} onChange={(e) => updateValue(i, "description", e.target.value)} />
              </div>
              <Button size="icon" variant="ghost" className="text-destructive flex-shrink-0" onClick={() => setContent({ ...content, values: content.values.filter((_, idx) => idx !== i) })}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Statistics</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setContent({ ...content, stats: [...content.stats, { label: "", value: "" }] })} className="gap-1">
              <Plus className="h-3 w-3" /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {content.stats.map((stat, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="flex-1 grid sm:grid-cols-2 gap-3">
                <Input placeholder="Label (e.g. Properties Listed)" value={stat.label} onChange={(e) => updateStat(i, "label", e.target.value)} />
                <Input placeholder="Value (e.g. 500+)" value={stat.value} onChange={(e) => updateStat(i, "value", e.target.value)} />
              </div>
              <Button size="icon" variant="ghost" className="text-destructive flex-shrink-0" onClick={() => setContent({ ...content, stats: content.stats.filter((_, idx) => idx !== i) })}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Team Members / Founders</CardTitle>
            <Button size="sm" variant="outline" onClick={addTeamMember} className="gap-1"><Plus className="h-3 w-3" /> Add Member</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {content.team_members.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No team members added yet. Click "Add Member" to get started.</p>
          )}
          {content.team_members.map((member, i) => (
            <div key={i} className="border border-border rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Member {i + 1}</span>
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => removeTeamMember(i)}><Trash2 className="h-4 w-4" /></Button>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Name</Label><Input value={member.name} onChange={(e) => updateTeamMember(i, "name", e.target.value)} /></div>
                <div className="space-y-2"><Label>Role/Title</Label><Input value={member.role} onChange={(e) => updateTeamMember(i, "role", e.target.value)} placeholder="CEO, Founder, etc." /></div>
              </div>
              <div className="space-y-2"><Label>Bio</Label><Textarea value={member.bio} onChange={(e) => updateTeamMember(i, "bio", e.target.value)} rows={2} /></div>
              {/* Photo */}
              <div className="space-y-2">
                <Label>Photo</Label>
                {member.photo ? (
                  <div className="flex items-center gap-3">
                    <img src={member.photo} alt={member.name} className="w-16 h-16 rounded-xl object-cover" />
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => { const input = document.createElement("input"); input.type = "file"; input.accept = "image/*"; input.onchange = (ev: any) => handleTeamPhotoUpload(i, ev.target.files[0]); input.click(); }}>Change</Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => updateTeamMember(i, "photo", "")}>Remove</Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => { const input = document.createElement("input"); input.type = "file"; input.accept = "image/*"; input.onchange = (ev: any) => handleTeamPhotoUpload(i, ev.target.files[0]); input.click(); }}>
                    <ImageIcon className="h-3 w-3" /> Upload Photo
                  </Button>
                )}
              </div>
              {/* Social Links */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Facebook URL</Label><Input value={member.facebook || ""} onChange={(e) => updateTeamMember(i, "facebook", e.target.value)} placeholder="https://facebook.com/..." className="text-xs" /></div>
                <div className="space-y-1"><Label className="text-xs">Instagram URL</Label><Input value={member.instagram || ""} onChange={(e) => updateTeamMember(i, "instagram", e.target.value)} placeholder="https://instagram.com/..." className="text-xs" /></div>
                <div className="space-y-1"><Label className="text-xs">Twitter/X URL</Label><Input value={member.twitter || ""} onChange={(e) => updateTeamMember(i, "twitter", e.target.value)} placeholder="https://x.com/..." className="text-xs" /></div>
                <div className="space-y-1"><Label className="text-xs">LinkedIn URL</Label><Input value={member.linkedin || ""} onChange={(e) => updateTeamMember(i, "linkedin", e.target.value)} placeholder="https://linkedin.com/in/..." className="text-xs" /></div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Work Photos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Work / Office Photos</CardTitle>
            <Button size="sm" variant="outline" onClick={addWorkPhoto} className="gap-1"><Plus className="h-3 w-3" /> Add Photo</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {content.work_photos.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No work photos added yet.</p>
          )}
          {content.work_photos.map((photo, i) => (
            <div key={i} className="flex gap-3 items-start border border-border rounded-xl p-3">
              {photo.url ? (
                <img src={photo.url} alt={photo.caption} className="w-24 h-20 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <Button variant="outline" className="w-24 h-20 flex-shrink-0" onClick={() => { const input = document.createElement("input"); input.type = "file"; input.accept = "image/*"; input.onchange = (ev: any) => handleWorkPhotoUpload(i, ev.target.files[0]); input.click(); }}>
                  <Upload className="h-4 w-4" />
                </Button>
              )}
              <div className="flex-1 space-y-2">
                <Input placeholder="Caption" value={photo.caption} onChange={(e) => { const updated = [...content.work_photos]; updated[i] = { ...updated[i], caption: e.target.value }; setContent({ ...content, work_photos: updated }); }} />
                {photo.url && (
                  <Button size="sm" variant="outline" onClick={() => { const input = document.createElement("input"); input.type = "file"; input.accept = "image/*"; input.onchange = (ev: any) => handleWorkPhotoUpload(i, ev.target.files[0]); input.click(); }}>Change Photo</Button>
                )}
              </div>
              <Button size="icon" variant="ghost" className="text-destructive flex-shrink-0" onClick={() => removeWorkPhoto(i)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Bottom Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save All Changes
        </Button>
      </div>
    </div>
  );
}
