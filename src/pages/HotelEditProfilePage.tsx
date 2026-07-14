import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HotelShellLayout from "@/components/HotelShellLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User as UserIcon, Camera, ArrowLeft } from "lucide-react";

const HotelEditProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    company_name: "",
    phone: "",
    email: "",
    bio: "",
    avatar_url: "",
  });

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setForm({
            full_name: (data as any).full_name || (data as any).name || "",
            company_name: (data as any).company_name || "",
            phone: (data as any).phone || "",
            email: (data as any).email || user.email || "",
            bio: (data as any).bio || "",
            avatar_url: (data as any).avatar_url || (data as any).profile_photo_url || "",
          });
        }
        setLoading(false);
      });
  }, [user, navigate]);

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("property-photos").upload(path, file);
    if (error) { toast({ title: "Upload failed", variant: "destructive" }); return; }
    const url = supabase.storage.from("property-photos").getPublicUrl(path).data.publicUrl;
    setForm((f) => ({ ...f, avatar_url: url }));
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const payload: Record<string, any> = {
      full_name: form.full_name,
      company_name: form.company_name,
      phone: form.phone,
      bio: form.bio,
      avatar_url: form.avatar_url,
    };
    const { error } = await supabase.from("profiles").update(payload as any).eq("id", user.id);
    setSaving(false);
    if (error) { toast({ title: "Failed to save", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Profile updated" });
    navigate("/hotel-dashboard/account");
  };

  return (
    <HotelShellLayout title="Edit Profile" subtitle="Hotel owner account">
      <div className="max-w-md mx-auto space-y-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <Card className="rounded-2xl">
          <CardContent className="p-4 flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center">
                {form.avatar_url ? (
                  <img src={form.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-10 h-10 text-primary" />
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer shadow-md">
                <Camera className="w-4 h-4" />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0]; if (f) uploadAvatar(f);
                }} />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">Tap camera to change photo</p>
          </CardContent>
        </Card>

        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
        ) : (
          <Card className="rounded-2xl">
            <CardContent className="p-4 space-y-4">
              <div>
                <Label className="text-xs">Full Name</Label>
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="mt-1 h-11 rounded-xl" />
              </div>
              <div>
                <Label className="text-xs">Company / Hotel Group Name</Label>
                <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} className="mt-1 h-11 rounded-xl" />
              </div>
              <div>
                <Label className="text-xs">Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1 h-11 rounded-xl" />
              </div>
              <div>
                <Label className="text-xs">Email</Label>
                <Input value={form.email} disabled className="mt-1 h-11 rounded-xl bg-muted" />
              </div>
              <div>
                <Label className="text-xs">About</Label>
                <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="mt-1 rounded-xl" rows={3} />
              </div>
              <Button onClick={save} disabled={saving} className="w-full h-11 rounded-xl">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </HotelShellLayout>
  );
};

export default HotelEditProfilePage;