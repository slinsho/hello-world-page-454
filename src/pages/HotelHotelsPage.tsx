import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import HotelShellLayout from "@/components/HotelShellLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { LIBERIA_COUNTIES } from "@/lib/countyFlags";
import { Plus, Building2, ShieldCheck, MapPin, Search, Star, MoreHorizontal } from "lucide-react";

const AMENITY_OPTIONS = [
  { key: "wifi", label: "Free WiFi" }, { key: "pool", label: "Pool" }, { key: "breakfast", label: "Breakfast" },
  { key: "parking", label: "Parking" }, { key: "ac", label: "AC" }, { key: "gym", label: "Gym" },
  { key: "restaurant", label: "Restaurant" }, { key: "airport_shuttle", label: "Airport Shuttle" },
  { key: "front_desk", label: "24/7 Front Desk" }, { key: "laundry", label: "Laundry" },
];

const HotelHotelsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [hotels, setHotels] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [open, setOpen] = useState(params.get("add") === "1");
  const [form, setForm] = useState({ name: "", description: "", county: "Montserrado", district: "", city: "", address: "", phone: "", cover_photo: "" });
  const [amenities, setAmenities] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => setProfile(data));
    supabase.from("hotels").select("*").eq("owner_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setHotels(data || []));
  }, [user, navigate]);

  const notVerified = profile && profile.verification_status !== "approved";

  const upload = async (file: File): Promise<string> => {
    const path = `${user!.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("property-photos").upload(path, file);
    if (error) throw error;
    return supabase.storage.from("property-photos").getPublicUrl(path).data.publicUrl;
  };

  const save = async () => {
    if (!user) return;
    const isVerified = profile?.verification_status === "approved";
    const { data, error } = await supabase.from("hotels").insert({
      owner_id: user.id, name: form.name, description: form.description, county: form.county,
      district: form.district || null, city: form.city || null, address: form.address,
      phone: form.phone || null, cover_photo: form.cover_photo || null, amenities, status: "pending",
      ...(isVerified ? { status: "active", is_verified: true } : { status: "pending" }),
    } as any).select().single();
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    setHotels([data, ...hotels]);
    setOpen(false); setParams({});
    setForm({ name: "", description: "", county: "Montserrado", district: "", city: "", address: "", phone: "", cover_photo: "" });
    setAmenities({});
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
        {/* Search + Add */}
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

        {/* Stats strip */}
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

        {/* Hotel cards — native style */}
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
                <Link to={`/hotel-dashboard/rooms?hotel=${h.id}`} className="flex-1 h-9 rounded-full bg-muted/60 flex items-center justify-center text-xs font-semibold">Rooms</Link>
                <Link to={`/hotel-dashboard/bookings`} className="flex-1 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">Bookings</Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setParams({}); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Hotel</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Hotel Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Select value={form.county} onValueChange={(v) => setForm({ ...form, county: v })}>
              <SelectTrigger><SelectValue placeholder="County" /></SelectTrigger>
              <SelectContent>{LIBERIA_COUNTIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="District" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
            <Input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <Input placeholder="Address *" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <div>
              <Label className="text-xs">Cover Photo</Label>
              <Input type="file" accept="image/*" onChange={async (e) => {
                const f = e.target.files?.[0]; if (!f) return;
                try { const url = await upload(f); setForm({ ...form, cover_photo: url }); }
                catch { toast({ title: "Upload failed", variant: "destructive" }); }
              }} />
              {form.cover_photo && <img src={form.cover_photo} className="mt-2 h-20 rounded" />}
            </div>
            <div>
              <Label className="text-xs">Amenities</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {AMENITY_OPTIONS.map((a) => (
                  <label key={a.key} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={!!amenities[a.key]} onChange={(e) => setAmenities({ ...amenities, [a.key]: e.target.checked })} />
                    {a.label}
                  </label>
                ))}
              </div>
            </div>
            <Button onClick={save} className="w-full">Create Hotel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </HotelShellLayout>
  );
};

export default HotelHotelsPage;