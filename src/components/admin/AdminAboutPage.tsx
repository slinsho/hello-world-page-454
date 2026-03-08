import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Loader2, Plus, Trash2, Upload, Image as ImageIcon, Crop } from "lucide-react";
import { ImageCropper } from "@/components/profile/ImageCropper";

interface TeamMember { name: string; role: string; photo: string; bio: string; facebook?: string; instagram?: string; twitter?: string; linkedin?: string; }
interface WorkPhoto { url: string; caption: string; }
interface ServiceCard { title: string; description: string; }
interface FAQItem { question: string; answer: string; }

interface AboutContent {
  company_name: string; tagline: string; description: string; hero_subtitle: string;
  mission: string; vision: string; banner_image: string; mission_image: string;
  experience_title: string; experience_description: string; experience_image: string;
  dreams_title: string; dreams_description: string; dreams_image: string; dreams_checklist: string[];
  email: string; phone: string; address: string; whatsapp: string;
  values: { title: string; description: string }[]; stats: { label: string; value: string; sublabel: string }[];
  team_members: TeamMember[]; work_photos: WorkPhoto[]; services: ServiceCard[]; faqs: FAQItem[];
  newsletter_title: string; newsletter_description: string;
}

const DEFAULT: AboutContent = {
  company_name: "LibHub", tagline: "About Us", description: "", hero_subtitle: "",
  mission: "", vision: "", banner_image: "", mission_image: "",
  experience_title: "", experience_description: "", experience_image: "",
  dreams_title: "", dreams_description: "", dreams_image: "", dreams_checklist: [],
  email: "support@libhub.com", phone: "", address: "Monrovia, Liberia", whatsapp: "",
  values: [], stats: [], team_members: [], work_photos: [], services: [], faqs: [],
  newsletter_title: "", newsletter_description: "",
};

export function AdminAboutPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState<AboutContent>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const bannerRef = useRef<HTMLInputElement>(null);

  // Cropper state
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperSrc, setCropperSrc] = useState("");
  const [cropperAspect, setCropperAspect] = useState(16 / 9);
  const [cropperTitle, setCropperTitle] = useState("Crop Image");
  const [cropperCallback, setCropperCallback] = useState<{ fn: (blob: Blob) => void } | null>(null);

  const ASPECT_RATIOS: Record<string, { ratio: number; title: string }> = {
    banner_image: { ratio: 16 / 5, title: "Crop Banner Image" },
    mission_image: { ratio: 4 / 3, title: "Crop Mission Image" },
    experience_image: { ratio: 4 / 3, title: "Crop Experience Image" },
    dreams_image: { ratio: 4 / 3, title: "Crop Dreams Image" },
    team_photo: { ratio: 1, title: "Crop Team Photo" },
    work_photo: { ratio: 16 / 9, title: "Crop Work Photo" },
  };

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("platform_settings").select("value").eq("key", "about_page_content").single();
      if (data?.value) setContent({ ...DEFAULT, ...(data.value as any) });
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("platform_settings")
      .upsert({ key: "about_page_content", value: content as any, updated_by: user?.id } as any, { onConflict: "key" });
    toast(error ? { title: "Error", description: "Failed to save", variant: "destructive" as const } : { title: "Saved", description: "About page updated" });
    setSaving(false);
  };

  const uploadImage = async (file: File | Blob): Promise<string | null> => {
    const ext = file instanceof File ? file.name.split(".").pop() : "jpg";
    const path = `about/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("blog-media").upload(path, file);
    if (error) { toast({ title: "Upload failed", description: error.message, variant: "destructive" }); return null; }
    return supabase.storage.from("blog-media").getPublicUrl(path).data.publicUrl;
  };

  const openCropperForFile = (file: File, aspectKey: string, onComplete: (blob: Blob) => void) => {
    const src = URL.createObjectURL(file);
    const config = ASPECT_RATIOS[aspectKey] || { ratio: 16 / 9, title: "Crop Image" };
    setCropperSrc(src);
    setCropperAspect(config.ratio);
    setCropperTitle(config.title);
    setCropperCallback({ fn: onComplete });
    setCropperOpen(true);
  };

  const handleCropComplete = async (blob: Blob) => {
    setCropperOpen(false);
    if (cropperSrc) URL.revokeObjectURL(cropperSrc);
    cropperCallback?.fn(blob);
  };

  const handleImageUpload = (field: keyof AboutContent) => {
    const input = document.createElement("input"); input.type = "file"; input.accept = "image/*";
    input.onchange = (ev: any) => {
      const file = ev.target.files[0];
      if (!file) return;
      openCropperForFile(file, field as string, async (blob) => {
        const url = await uploadImage(blob);
        if (url) setContent(prev => ({ ...prev, [field]: url }));
      });
    };
    input.click();
  };

  const triggerUpload = (field: keyof AboutContent) => handleImageUpload(field);

  const handleTeamPhotoUpload = (index: number) => {
    const input = document.createElement("input"); input.type = "file"; input.accept = "image/*";
    input.onchange = (ev: any) => {
      const file = ev.target.files[0];
      if (!file) return;
      openCropperForFile(file, "team_photo", async (blob) => {
        const url = await uploadImage(blob);
        if (url) setContent(prev => { const u = [...prev.team_members]; u[index] = { ...u[index], photo: url }; return { ...prev, team_members: u }; });
      });
    };
    input.click();
  };

  const handleWorkPhotoUpload = (index: number) => {
    const input = document.createElement("input"); input.type = "file"; input.accept = "image/*";
    input.onchange = (ev: any) => {
      const file = ev.target.files[0];
      if (!file) return;
      openCropperForFile(file, "work_photo", async (blob) => {
        const url = await uploadImage(blob);
        if (url) setContent(prev => { const u = [...prev.work_photos]; u[index] = { ...u[index], url }; return { ...prev, work_photos: u }; });
      });
    };
    input.click();
  };

  const ImageField = ({ label, field }: { label: string; field: keyof AboutContent }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      {content[field] ? (
        <div className="relative rounded-xl overflow-hidden">
          <img src={content[field] as string} alt={label} className="w-full h-36 object-cover" />
          <div className="absolute top-2 right-2 flex gap-1">
            <Button size="sm" variant="secondary" onClick={() => triggerUpload(field)}>Change</Button>
            <Button size="sm" variant="destructive" onClick={() => setContent({ ...content, [field]: "" })}>Remove</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" className="w-full h-24 gap-2" onClick={() => triggerUpload(field)}>
          <Upload className="h-4 w-4" /> Upload {label}
        </Button>
      )}
    </div>
  );

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">About Us Page Editor</h2>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Changes
        </Button>
      </div>

      {/* Hero */}
      <Card><CardHeader><CardTitle className="text-base">Hero Banner</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <ImageField label="Banner Image" field="banner_image" />
          <div className="space-y-2"><Label>Page Title</Label><Input value={content.tagline} onChange={e => setContent({ ...content, tagline: e.target.value })} /></div>
        </CardContent>
      </Card>

      {/* Tagline + Subtitle */}
      <Card><CardHeader><CardTitle className="text-base">Tagline & Intro</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Main Tagline (italic heading)</Label><Textarea value={content.description} onChange={e => setContent({ ...content, description: e.target.value })} rows={2} /></div>
          <div className="space-y-2"><Label>Subtitle Paragraph</Label><Textarea value={content.hero_subtitle} onChange={e => setContent({ ...content, hero_subtitle: e.target.value })} rows={3} /></div>
        </CardContent>
      </Card>

      {/* Mission & Vision */}
      <Card><CardHeader><CardTitle className="text-base">Mission & Vision</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Mission</Label><Textarea value={content.mission} onChange={e => setContent({ ...content, mission: e.target.value })} rows={3} /></div>
          <div className="space-y-2"><Label>Vision</Label><Textarea value={content.vision} onChange={e => setContent({ ...content, vision: e.target.value })} rows={3} /></div>
          <ImageField label="Mission/Vision Section Image" field="mission_image" />
        </CardContent>
      </Card>

      {/* Experience Section */}
      <Card><CardHeader><CardTitle className="text-base">Experience Section</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Title</Label><Input value={content.experience_title} onChange={e => setContent({ ...content, experience_title: e.target.value })} /></div>
          <div className="space-y-2"><Label>Description</Label><Textarea value={content.experience_description} onChange={e => setContent({ ...content, experience_description: e.target.value })} rows={3} /></div>
          <ImageField label="Experience Image" field="experience_image" />
        </CardContent>
      </Card>

      {/* Stats */}
      <Card><CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Statistics</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setContent({ ...content, stats: [...content.stats, { label: "", value: "", sublabel: "" }] })} className="gap-1"><Plus className="h-3 w-3" /> Add</Button>
        </div>
      </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">Note: Real-time data will override these values on the public page, but sublabels will show.</p>
          {content.stats.map((s, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="flex-1 grid grid-cols-3 gap-2">
                <Input placeholder="Value (e.g. 10K+)" value={s.value} onChange={e => { const u = [...content.stats]; u[i] = { ...u[i], value: e.target.value }; setContent({ ...content, stats: u }); }} />
                <Input placeholder="Label" value={s.label} onChange={e => { const u = [...content.stats]; u[i] = { ...u[i], label: e.target.value }; setContent({ ...content, stats: u }); }} />
                <Input placeholder="Sublabel" value={s.sublabel} onChange={e => { const u = [...content.stats]; u[i] = { ...u[i], sublabel: e.target.value }; setContent({ ...content, stats: u }); }} />
              </div>
              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setContent({ ...content, stats: content.stats.filter((_, idx) => idx !== i) })}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Dreams Section */}
      <Card><CardHeader><CardTitle className="text-base">Dreams Section</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Title</Label><Input value={content.dreams_title} onChange={e => setContent({ ...content, dreams_title: e.target.value })} /></div>
          <div className="space-y-2"><Label>Description</Label><Textarea value={content.dreams_description} onChange={e => setContent({ ...content, dreams_description: e.target.value })} rows={2} /></div>
          <ImageField label="Dreams Image" field="dreams_image" />
          <div className="space-y-2">
            <div className="flex items-center justify-between"><Label>Checklist Items</Label>
              <Button size="sm" variant="outline" onClick={() => setContent({ ...content, dreams_checklist: [...(content.dreams_checklist || []), ""] })} className="gap-1"><Plus className="h-3 w-3" /> Add</Button>
            </div>
            {content.dreams_checklist?.map((item, i) => (
              <div key={i} className="flex gap-2">
                <Input value={item} onChange={e => { const u = [...content.dreams_checklist]; u[i] = e.target.value; setContent({ ...content, dreams_checklist: u }); }} />
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setContent({ ...content, dreams_checklist: content.dreams_checklist.filter((_, idx) => idx !== i) })}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Services */}
      <Card><CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Services / Partner Cards</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setContent({ ...content, services: [...content.services, { title: "", description: "" }] })} className="gap-1"><Plus className="h-3 w-3" /> Add</Button>
        </div>
      </CardHeader>
        <CardContent className="space-y-4">
          {content.services.map((s, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="flex-1 grid sm:grid-cols-2 gap-2">
                <Input placeholder="Title" value={s.title} onChange={e => { const u = [...content.services]; u[i] = { ...u[i], title: e.target.value }; setContent({ ...content, services: u }); }} />
                <Input placeholder="Description" value={s.description} onChange={e => { const u = [...content.services]; u[i] = { ...u[i], description: e.target.value }; setContent({ ...content, services: u }); }} />
              </div>
              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setContent({ ...content, services: content.services.filter((_, idx) => idx !== i) })}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Core Values */}
      <Card><CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Core Values</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setContent({ ...content, values: [...content.values, { title: "", description: "" }] })} className="gap-1"><Plus className="h-3 w-3" /> Add</Button>
        </div>
      </CardHeader>
        <CardContent className="space-y-4">
          {content.values.map((v, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="flex-1 grid sm:grid-cols-2 gap-2">
                <Input placeholder="Title" value={v.title} onChange={e => { const u = [...content.values]; u[i] = { ...u[i], title: e.target.value }; setContent({ ...content, values: u }); }} />
                <Input placeholder="Description" value={v.description} onChange={e => { const u = [...content.values]; u[i] = { ...u[i], description: e.target.value }; setContent({ ...content, values: u }); }} />
              </div>
              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setContent({ ...content, values: content.values.filter((_, idx) => idx !== i) })}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card><CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Team Members / Agents</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setContent({ ...content, team_members: [...content.team_members, { name: "", role: "", photo: "", bio: "", facebook: "", instagram: "", twitter: "", linkedin: "" }] })} className="gap-1"><Plus className="h-3 w-3" /> Add</Button>
        </div>
      </CardHeader>
        <CardContent className="space-y-6">
          {content.team_members.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No team members yet.</p>}
          {content.team_members.map((m, i) => (
            <div key={i} className="border border-border rounded-xl p-4 space-y-3">
              <div className="flex justify-between"><span className="text-sm font-medium">Member {i + 1}</span>
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setContent({ ...content, team_members: content.team_members.filter((_, idx) => idx !== i) })}><Trash2 className="h-4 w-4" /></Button>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Name</Label><Input value={m.name} onChange={e => { const u = [...content.team_members]; u[i] = { ...u[i], name: e.target.value }; setContent({ ...content, team_members: u }); }} /></div>
                <div className="space-y-1"><Label className="text-xs">Role</Label><Input value={m.role} onChange={e => { const u = [...content.team_members]; u[i] = { ...u[i], role: e.target.value }; setContent({ ...content, team_members: u }); }} /></div>
              </div>
              <div className="space-y-1"><Label className="text-xs">Bio</Label><Textarea value={m.bio} onChange={e => { const u = [...content.team_members]; u[i] = { ...u[i], bio: e.target.value }; setContent({ ...content, team_members: u }); }} rows={2} /></div>
              <div className="space-y-1"><Label className="text-xs">Photo</Label>
                {m.photo ? (
                  <div className="flex items-center gap-3">
                    <img src={m.photo} alt={m.name} className="w-14 h-14 rounded-xl object-cover" />
                    <Button size="sm" variant="outline" onClick={() => handleTeamPhotoUpload(i)}>Change</Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { const u = [...content.team_members]; u[i] = { ...u[i], photo: "" }; setContent({ ...content, team_members: u }); }}>Remove</Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => handleTeamPhotoUpload(i)}><ImageIcon className="h-3 w-3" /> Upload</Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(["facebook", "instagram", "twitter", "linkedin"] as const).map(p => (
                  <div key={p} className="space-y-1"><Label className="text-xs capitalize">{p}</Label>
                    <Input value={(m as any)[p] || ""} onChange={e => { const u = [...content.team_members]; u[i] = { ...u[i], [p]: e.target.value }; setContent({ ...content, team_members: u }); }} placeholder={`https://${p}.com/...`} className="text-xs" /></div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Work Photos */}
      <Card><CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Work / Office Photos</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setContent({ ...content, work_photos: [...content.work_photos, { url: "", caption: "" }] })} className="gap-1"><Plus className="h-3 w-3" /> Add</Button>
        </div>
      </CardHeader>
        <CardContent className="space-y-4">
          {content.work_photos.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No photos yet.</p>}
          {content.work_photos.map((p, i) => (
            <div key={i} className="flex gap-3 items-start border border-border rounded-xl p-3">
              {p.url ? (
                <img src={p.url} alt={p.caption} className="w-20 h-16 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <Button variant="outline" className="w-20 h-16 flex-shrink-0" onClick={() => handleWorkPhotoUpload(i)}><Upload className="h-4 w-4" /></Button>
              )}
              <div className="flex-1 space-y-2">
                <Input placeholder="Caption" value={p.caption} onChange={e => { const u = [...content.work_photos]; u[i] = { ...u[i], caption: e.target.value }; setContent({ ...content, work_photos: u }); }} />
                {p.url && <Button size="sm" variant="outline" onClick={() => handleWorkPhotoUpload(i)}>Change</Button>}
              </div>
              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setContent({ ...content, work_photos: content.work_photos.filter((_, idx) => idx !== i) })}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Contact */}
      <Card><CardHeader><CardTitle className="text-base">Contact Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Email</Label><Input value={content.email} onChange={e => setContent({ ...content, email: e.target.value })} /></div>
            <div className="space-y-1"><Label>Phone</Label><Input value={content.phone} onChange={e => setContent({ ...content, phone: e.target.value })} /></div>
            <div className="space-y-1"><Label>WhatsApp</Label><Input value={content.whatsapp} onChange={e => setContent({ ...content, whatsapp: e.target.value })} /></div>
            <div className="space-y-1"><Label>Address</Label><Input value={content.address} onChange={e => setContent({ ...content, address: e.target.value })} /></div>
          </div>
        </CardContent>
      </Card>

      {/* FAQs */}
      <Card><CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">FAQ Section</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setContent({ ...content, faqs: [...content.faqs, { question: "", answer: "" }] })} className="gap-1"><Plus className="h-3 w-3" /> Add</Button>
        </div>
      </CardHeader>
        <CardContent className="space-y-4">
          {content.faqs.map((f, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="flex-1 space-y-2">
                <Input placeholder="Question" value={f.question} onChange={e => { const u = [...content.faqs]; u[i] = { ...u[i], question: e.target.value }; setContent({ ...content, faqs: u }); }} />
                <Textarea placeholder="Answer" value={f.answer} onChange={e => { const u = [...content.faqs]; u[i] = { ...u[i], answer: e.target.value }; setContent({ ...content, faqs: u }); }} rows={2} />
              </div>
              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setContent({ ...content, faqs: content.faqs.filter((_, idx) => idx !== i) })}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Newsletter */}
      <Card><CardHeader><CardTitle className="text-base">Newsletter Section</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Title</Label><Input value={content.newsletter_title} onChange={e => setContent({ ...content, newsletter_title: e.target.value })} /></div>
          <div className="space-y-2"><Label>Description</Label><Input value={content.newsletter_description} onChange={e => setContent({ ...content, newsletter_description: e.target.value })} /></div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save All Changes
        </Button>
      </div>
    </div>
  );
}
