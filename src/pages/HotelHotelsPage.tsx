import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import HotelShellLayout from "@/components/HotelShellLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { LIBERIA_COUNTIES } from "@/lib/countyFlags";
import { Plus, Building2, ShieldCheck, MapPin, Search, X, ImagePlus, Trash2, Pencil } from "lucide-react";

const AMENITY_OPTIONS = [
  { key: "wifi", label: "Free WiFi" }, { key: "ac", label: "Air Conditioning" }, { key: "tv", label: "TV" },
  { key: "pool", label: "Pool" }, { key: "breakfast", label: "Breakfast" }, { key: "parking", label: "Parking" },
  { key: "gym", label: "Gym" }, { key: "restaurant", label: "Restaurant" },
  { key: "airport_shuttle", label: "Airport Shuttle" }, { key: "front_desk", label: "24/7 Front Desk" },
  { key: "laundry", label: "Laundry" },
];

type FormShape = {
  name: string; description: string; about: string;
  county: string; district: string; city: string; address: string; phone: string;
  cover_photo: string; gallery: string[];
  total_rooms: string; check_in_time: string; check_out_time: string;
  why_guests_love: string[]; top_amenities: string[]; nearby_places: { name: string; distance: string }[];
};

const emptyForm = (): FormShape => ({
  name: "", description: "", about: "",
  county: "Montserrado", district: "", city: "", address: "", phone: "",
  cover_photo: "", gallery: [],
  total_rooms: "", check_in_time: "14:00", check_out_time: "11:00",
  why_guests_love: [], top_amenities: [], nearby_places: [],
});

const HotelHotelsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [hotels, setHotels] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [open, setOpen] = useState(params.get("add") === "1");
  const [form, setForm] = useState<FormShape>(emptyForm());
  const [amenities, setAmenities] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");
  const [whyInput, setWhyInput] = useState("");
  const [nearbyInput, setNearbyInput] = useState({ name: "", distance: "" });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const openEdit = (h: any) => {
    setEditingId(h.id);
    setForm({
      name: h.name || "",
      description: h.description || "",
      about: h.about || "",
      county: h.county || "Montserrado",
      district: h.district || "",
      city: h.city || "",
      address: h.address || "",
      phone: h.phone || "",
      cover_photo: h.cover_photo || "",
      gallery: Array.isArray(h.gallery) ? h.gallery : [],
      total_rooms: h.total_rooms ? String(h.total_rooms) : "",
      check_in_time: h.check_in_time || "14:00",
      check_out_time: h.check_out_time || "11:00",
      why_guests_love: Array.isArray(h.why_guests_love) ? h.why_guests_love : [],
      top_amenities: Array.isArray(h.top_amenities) ? h.top_amenities : [],
      nearby_places: Array.isArray(h.nearby_places) ? h.nearby_places : [],
    });
    setAmenities(h.amenities && typeof h.amenities === "object" ? h.amenities : {});
    setOpen(true);
  };

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => setProfile(data));
    supabase.from("hotels").select("*").eq("owner_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setHotels(data || []));
  }, [user, navigate]);

  const notVerified = profile && profile.verification_status !== "approved";

  const uploadOne = async (file: File): Promise<string> => {
    const path = `${user!.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name}`;
    const { error } = await supabase.storage.from("property-photos").upload(path, file);
    if (error) throw error;
    return supabase.storage.from("property-photos").getPublicUrl(path).data.publicUrl;
  };

  const onGalleryUpload = async (files: FileList) => {
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) urls.push(await uploadOne(f));
      const combined = [...form.gallery, ...urls];
      // If no cover yet, use the first uploaded image as cover automatically.
      setForm({ ...form, gallery: combined, cover_photo: form.cover_photo || urls[0] || "" });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    }
  };

  const removeGalleryImage = (i: number) => {
    const next = form.gallery.filter((_, idx) => idx !== i);
    setForm({
      ...form,
      gallery: next,
      cover_photo: form.cover_photo === form.gallery[i] ? (next[0] || "") : form.cover_photo,
    });
  };

  const addWhy = () => {
    const v = whyInput.trim();
    if (!v) return;
    setForm({ ...form, why_guests_love: [...form.why_guests_love, v] });
    setWhyInput("");
  };
  const removeWhy = (i: number) => setForm({ ...form, why_guests_love: form.why_guests_love.filter((_, idx) => idx !== i) });

  const addNearby = () => {
    const n = nearbyInput.name.trim();
    if (!n) return;
    setForm({ ...form, nearby_places: [...form.nearby_places, { name: n, distance: nearbyInput.distance.trim() }] });
    setNearbyInput({ name: "", distance: "" });
  };
  const removeNearby = (i: number) => setForm({ ...form, nearby_places: form.nearby_places.filter((_, idx) => idx !== i) });

  const toggleTopAmenity = (k: string) => {
    setForm({
      ...form,
      top_amenities: form.top_amenities.includes(k)
        ? form.top_amenities.filter((x) => x !== k)
        : [...form.top_amenities, k],
    });
  };

  const resetForm = () => { setForm(emptyForm()); setAmenities({}); setWhyInput(""); setNearbyInput({ name: "", distance: "" }); setEditingId(null); };

  const save = async () => {
    if (!user) return;
    if (!form.name || !form.address) { toast({ title: "Name and address required", variant: "destructive" }); return; }
    setSaving(true);
    const isVerified = profile?.verification_status === "approved";
    const payload: any = {
      name: form.name,
      description: form.description || null,
      about: form.about || null,
      county: form.county,
      district: form.district || null,
      city: form.city || null,
      address: form.address,
      phone: form.phone || null,
      cover_photo: form.cover_photo || null,
      gallery: form.gallery,
      amenities,
      top_amenities: form.top_amenities,
      why_guests_love: form.why_guests_love,
      nearby_places: form.nearby_places,
      total_rooms: form.total_rooms ? parseInt(form.total_rooms) : 0,
      check_in_time: form.check_in_time || "14:00",
      check_out_time: form.check_out_time || "11:00",
    };

    if (editingId) {
      const { data, error } = await supabase.from("hotels").update(payload).eq("id", editingId).eq("owner_id", user.id).select().single();
      setSaving(false);
      if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
      setHotels(hotels.map((h) => (h.id === editingId ? data : h)));
      setOpen(false); setParams({}); resetForm();
      toast({ title: "Hotel updated" });
      return;
    }

    const { data, error } = await supabase.from("hotels").insert({
      ...payload,
      owner_id: user.id,
      ...(isVerified ? { status: "active", is_verified: true } : { status: "pending" }),
    } as any).select().single();
    setSaving(false);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    setHotels([data, ...hotels]);
    setOpen(false); setParams({}); resetForm();
    toast({
      title: "Hotel created",
      description: isVerified ? "Your hotel is live." : "Pending admin activation.",
    });
  };

  const filtered = hotels.filter((h) =>
    !query || `${h.name} ${h.city || ""} ${h.county || ""}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <HotelShellLayout title="My Hotels" subtitle="Properties">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search hotels"
              className="w-full h-11 pl-9 pr-3 rounded-2xl bg-muted/60 border-0 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            onClick={() => setOpen(true)}
            disabled={notVerified}
            className="w-11 h-11 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 shadow-lg shadow-primary/25"
            aria-label="Add hotel"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Total", value: hotels.length, tone: "text-foreground" },
            { label: "Active", value: hotels.filter((h) => h.status === "active").length, tone: "text-emerald-600" },
            { label: "Pending", value: hotels.filter((h) => h.status !== "active").length, tone: "text-amber-600" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-background border p-3 text-center">
              <p className={`text-xl font-bold ${s.tone}`}>{s.value}</p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {notVerified && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-sm min-w-0">
                <p className="font-semibold truncate">Verification required</p>
                <p className="text-xs text-muted-foreground truncate">Verify to activate hotels</p>
              </div>
            </div>
            <Button size="sm" className="rounded-full" onClick={() => navigate("/verification")}>Verify</Button>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
              <Building2 className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="font-semibold">{hotels.length === 0 ? "No hotels yet" : "No matches"}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {hotels.length === 0 ? "Tap + to add your first hotel." : "Try a different search."}
            </p>
          </div>
        )}

        <div className="space-y-3">
          {filtered.map((h) => (
            <div key={h.id} className="rounded-3xl bg-background border overflow-hidden shadow-sm active:scale-[0.99] transition-transform">
              <div className="relative h-40 bg-muted">
                {h.cover_photo ? (
                  <img src={h.cover_photo} alt={h.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold backdrop-blur ${h.status === "active" ? "bg-emerald-500/90 text-white" : "bg-amber-500/90 text-white"}`}>
                    {h.status}
                  </span>
                  {h.is_verified && (
                    <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-white/90 text-emerald-700 flex items-center gap-1 backdrop-blur">
                      <ShieldCheck className="w-3 h-3" />Verified
                    </span>
                  )}
                </div>
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <p className="font-bold text-[17px] truncate drop-shadow">{h.name}</p>
                  <p className="text-xs flex items-center gap-1 opacity-90"><MapPin className="w-3 h-3" />{h.city || h.county}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3">
                <Link to={`/hotels/${h.id}`} className="flex-1 h-9 rounded-full bg-muted/60 flex items-center justify-center text-xs font-semibold">View</Link>
                <button onClick={() => openEdit(h)} className="flex-1 h-9 rounded-full bg-muted/60 flex items-center justify-center text-xs font-semibold gap-1">
                  <Pencil className="w-3 h-3" /> Edit
                </button>
                <Link to={`/hotel-dashboard/rooms?hotel=${h.id}`} className="flex-1 h-9 rounded-full bg-muted/60 flex items-center justify-center text-xs font-semibold">Rooms</Link>
                <Link to={`/hotel-dashboard/bookings`} className="flex-1 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">Book</Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setParams({}); resetForm(); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit Hotel" : "Add Hotel"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {/* ----- Basics ----- */}
            <SectionLabel>Basics</SectionLabel>
            <Input placeholder="Hotel Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Textarea placeholder="Short description (shown in listings)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            <Textarea placeholder="About this hotel (long-form, shown on detail page)" value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} rows={4} />

            {/* ----- Location ----- */}
            <SectionLabel>Location</SectionLabel>
            <Select value={form.county} onValueChange={(v) => setForm({ ...form, county: v })}>
              <SelectTrigger><SelectValue placeholder="County" /></SelectTrigger>
              <SelectContent>{LIBERIA_COUNTIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="District" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
              <Input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <Input placeholder="Address *" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />

            {/* ----- Hotel details ----- */}
            <SectionLabel>Hotel details</SectionLabel>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-[11px] text-muted-foreground">Total rooms</Label>
                <Input type="number" min={0} placeholder="e.g. 52" value={form.total_rooms} onChange={(e) => setForm({ ...form, total_rooms: e.target.value })} />
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">Check-in</Label>
                <Input type="time" value={form.check_in_time} onChange={(e) => setForm({ ...form, check_in_time: e.target.value })} />
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">Check-out</Label>
                <Input type="time" value={form.check_out_time} onChange={(e) => setForm({ ...form, check_out_time: e.target.value })} />
              </div>
            </div>

            {/* ----- Images ----- */}
            <SectionLabel>Photos</SectionLabel>
            <div className="rounded-xl border border-dashed p-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <ImagePlus className="w-4 h-4 text-primary" />
                <span className="font-medium">Add photos (multiple allowed)</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && onGalleryUpload(e.target.files)}
                />
              </label>
              <p className="text-[11px] text-muted-foreground mt-1">First image becomes the cover — tap any thumbnail to make it the cover.</p>
              {form.gallery.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {form.gallery.map((url, i) => (
                    <div key={i} className={`relative rounded-lg overflow-hidden aspect-square border-2 ${form.cover_photo === url ? "border-primary" : "border-transparent"}`}>
                      <button type="button" onClick={() => setForm({ ...form, cover_photo: url })} className="block w-full h-full">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </button>
                      {form.cover_photo === url && (
                        <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full">Cover</span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(i)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white grid place-items-center"
                        aria-label="Remove"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ----- Amenities ----- */}
            <SectionLabel>All amenities</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              {AMENITY_OPTIONS.map((a) => (
                <label key={a.key} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!amenities[a.key]} onChange={(e) => setAmenities({ ...amenities, [a.key]: e.target.checked })} />
                  {a.label}
                </label>
              ))}
            </div>

            {/* ----- Top amenities (highlighted on card + top of detail) ----- */}
            <SectionLabel>Top amenities (shown on hotel card)</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {AMENITY_OPTIONS.map((a) => {
                const sel = form.top_amenities.includes(a.key);
                return (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => toggleTopAmenity(a.key)}
                    className={`h-8 px-3 rounded-full text-[11px] font-semibold transition ${sel ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                  >
                    {a.label}
                  </button>
                );
              })}
            </div>

            {/* ----- Why guests love this hotel ----- */}
            <SectionLabel>Why guests love this hotel</SectionLabel>
            <div className="flex gap-2">
              <Input placeholder="e.g. Ocean-view rooms, spotless" value={whyInput} onChange={(e) => setWhyInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addWhy())} />
              <Button type="button" onClick={addWhy} variant="secondary">Add</Button>
            </div>
            {form.why_guests_love.length > 0 && (
              <div className="space-y-1.5">
                {form.why_guests_love.map((w, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 text-sm">
                    <span className="flex-1 truncate">{w}</span>
                    <button type="button" onClick={() => removeWhy(i)} className="text-muted-foreground"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}

            {/* ----- Nearby places ----- */}
            <SectionLabel>Nearby places</SectionLabel>
            <div className="grid grid-cols-[1fr_120px_auto] gap-2">
              <Input placeholder="Name (e.g. Roberts Airport)" value={nearbyInput.name} onChange={(e) => setNearbyInput({ ...nearbyInput, name: e.target.value })} />
              <Input placeholder="Distance" value={nearbyInput.distance} onChange={(e) => setNearbyInput({ ...nearbyInput, distance: e.target.value })} />
              <Button type="button" onClick={addNearby} variant="secondary">Add</Button>
            </div>
            {form.nearby_places.length > 0 && (
              <div className="space-y-1.5">
                {form.nearby_places.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 text-sm">
                    <span className="flex-1 truncate">{p.name}</span>
                    {p.distance && <span className="text-xs text-muted-foreground">{p.distance}</span>}
                    <button type="button" onClick={() => removeNearby(i)} className="text-muted-foreground"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}

            <Button onClick={save} disabled={saving} className="w-full mt-3">{saving ? "Saving…" : editingId ? "Save changes" : "Create Hotel"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </HotelShellLayout>
  );
};

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground pt-1">{children}</p>
);

export default HotelHotelsPage;
