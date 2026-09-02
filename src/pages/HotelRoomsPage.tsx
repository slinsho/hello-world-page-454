import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import HotelShellLayout from "@/components/HotelShellLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, BedDouble, Users as UsersIcon, Maximize2, Star, Building2, X, Camera, Compass, Hash } from "lucide-react";
import RoomUnitsDialog from "@/components/hotel/RoomUnitsDialog";

const HotelRoomsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [hotels, setHotels] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(params.get("hotel"));
  const [rooms, setRooms] = useState<any[]>([]);
  const [open, setOpen] = useState(params.get("add") === "1");
  const [unitCounts, setUnitCounts] = useState<Record<string, number>>({});
  const [unitsRoom, setUnitsRoom] = useState<any>(null);
  const [form, setForm] = useState<any>({ name: "Standard Room", price_per_night: "50", guests: "2", size_sqm: "20", bed_type: "1 Queen Bed", photos: [] as string[], tour_360_url: "", is_most_popular: false });

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    supabase.from("hotels").select("id, name").eq("owner_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => {
        setHotels(data || []);
        if (!selected && data?.[0]) setSelected(data[0].id);
      });
  }, [user, navigate]);

  useEffect(() => {
    if (!selected) return;
    supabase.from("hotel_rooms").select("*").eq("hotel_id", selected)
      .then(({ data }) => setRooms(data || []));
    (supabase.from("hotel_room_units" as any) as any).select("room_id").eq("hotel_id", selected)
      .then(({ data }: any) => {
        const counts: Record<string, number> = {};
        (data || []).forEach((u: any) => { counts[u.room_id] = (counts[u.room_id] || 0) + 1; });
        setUnitCounts(counts);
      }, () => {});
  }, [selected]);

  const upload = async (file: File): Promise<string> => {
    const path = `${user!.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("property-photos").upload(path, file);
    if (error) throw error;
    return supabase.storage.from("property-photos").getPublicUrl(path).data.publicUrl;
  };

  const save = async () => {
    if (!selected) return;
    const { data, error } = await supabase.from("hotel_rooms").insert({
      hotel_id: selected, name: form.name, price_per_night: Number(form.price_per_night),
      guests: Number(form.guests), size_sqm: Number(form.size_sqm), bed_type: form.bed_type,
      photos: form.photos, is_most_popular: form.is_most_popular, tour_360_url: form.tour_360_url || null,
    }).select().single();
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    setRooms([...rooms, data]);
    setOpen(false); setParams({});
    toast({ title: "Room added" });
  };

  return (
    <HotelShellLayout title="Rooms" subtitle="Inventory">
      <div className="space-y-4">
        {/* Hotel picker */}
        <div className="rounded-2xl bg-muted/60 p-1 flex items-center gap-1">
          <Select value={selected || ""} onValueChange={setSelected}>
            <SelectTrigger className="flex-1 border-0 bg-transparent shadow-none focus:ring-0 h-10 text-[14px] font-semibold">
              <div className="flex items-center gap-2 min-w-0">
                <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Select hotel" />
              </div>
            </SelectTrigger>
            <SelectContent>{hotels.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent>
          </Select>
          <button
            onClick={() => setOpen(true)}
            disabled={!selected}
            className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 shadow-md shadow-primary/25"
            aria-label="Add room"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Room count strip */}
        {selected && (
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-background border p-3 text-center">
              <p className="text-xl font-bold">{rooms.length}</p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-0.5">Rooms</p>
            </div>
            <div className="rounded-2xl bg-background border p-3 text-center">
              <p className="text-xl font-bold text-amber-600">{rooms.filter((r) => r.is_most_popular).length}</p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-0.5">Popular</p>
            </div>
            <div className="rounded-2xl bg-background border p-3 text-center">
              <p className="text-xl font-bold text-primary">
                ${rooms.length ? Math.min(...rooms.map((r) => Number(r.price_per_night || 0))) : 0}
              </p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-0.5">From/night</p>
            </div>
          </div>
        )}

        {!selected && (
          <div className="py-16 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
              <Building2 className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="font-semibold">Add a hotel first</p>
            <p className="text-sm text-muted-foreground mt-1">Create a hotel before adding rooms.</p>
          </div>
        )}

        {selected && rooms.length === 0 && (
          <div className="py-16 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
              <BedDouble className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="font-semibold">No rooms yet</p>
            <p className="text-sm text-muted-foreground mt-1">Tap + to add your first room.</p>
          </div>
        )}

        {/* Rooms — image-forward cards */}
        <div className="space-y-3">
          {rooms.map((r) => (
            <div key={r.id} className="rounded-3xl bg-background border overflow-hidden shadow-sm active:scale-[0.99] transition-transform">
              <div className="relative h-44 bg-muted">
                {r.photos?.length ? (
                  <div className="flex h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide">
                    {r.photos.map((p: string, i: number) => (
                      <img key={i} src={p} alt={`${r.name} ${i + 1}`} className="w-full h-full object-cover shrink-0 snap-center" />
                    ))}
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BedDouble className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                )}
                {r.photos?.length > 1 && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black/50 text-white text-[10px] font-semibold backdrop-blur">
                    {r.photos.length} photos
                  </div>
                )}
                {r.tour_360_url && (
                  <a href={r.tour_360_url} target="_blank" rel="noreferrer" className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/95 text-primary-foreground text-[10px] font-bold backdrop-blur">
                    <Compass className="w-3 h-3" />360°
                  </a>
                )}
                {r.is_most_popular && (
                  <div className={`absolute top-3 ${r.tour_360_url ? "left-20" : "left-3"} flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/95 text-white text-[10px] font-bold backdrop-blur`}>
                    <Star className="w-3 h-3 fill-white" />Popular
                  </div>
                )}
                <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-background/90 backdrop-blur text-[12px] font-bold text-primary">
                  ${r.price_per_night}<span className="text-[10px] text-muted-foreground font-normal">/night</span>
                </div>
              </div>
              <div className="p-4">
                <p className="font-semibold text-[15px] truncate">{r.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{r.bed_type}</p>
                <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><UsersIcon className="w-3.5 h-3.5" />{r.guests} guests</span>
                  <span className="flex items-center gap-1"><Maximize2 className="w-3.5 h-3.5" />{r.size_sqm} m²</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setParams({}); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Room</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Room name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <div className="grid grid-cols-3 gap-2">
              <Input type="number" placeholder="Price/night" value={form.price_per_night} onChange={(e) => setForm({ ...form, price_per_night: e.target.value })} />
              <Input type="number" placeholder="Guests" value={form.guests} onChange={(e) => setForm({ ...form, guests: e.target.value })} />
              <Input type="number" placeholder="Size m²" value={form.size_sqm} onChange={(e) => setForm({ ...form, size_sqm: e.target.value })} />
            </div>
            <Input placeholder="Bed type" value={form.bed_type} onChange={(e) => setForm({ ...form, bed_type: e.target.value })} />
            <div>
              <label className="text-xs font-semibold flex items-center gap-1"><Camera className="w-3.5 h-3.5" />Photos (multiple)</label>
              <Input type="file" accept="image/*" multiple className="mt-1" onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                try {
                  const urls = await Promise.all(files.map((f) => upload(f)));
                  setForm({ ...form, photos: [...form.photos, ...urls] });
                } catch { toast({ title: "Upload failed", variant: "destructive" }); }
              }} />
              {form.photos.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {form.photos.map((p: string, i: number) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden border">
                      <img src={p} className="w-full h-full object-cover" />
                      <button
                        onClick={() => setForm({ ...form, photos: form.photos.filter((_: any, idx: number) => idx !== i) })}
                        className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center"
                        aria-label="Remove"
                      ><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold flex items-center gap-1"><Compass className="w-3.5 h-3.5" />360° virtual tour URL</label>
              <Input placeholder="https://... (Matterport, Kuula, YouTube 360)" value={form.tour_360_url} onChange={(e) => setForm({ ...form, tour_360_url: e.target.value })} className="mt-1" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_most_popular} onChange={(e) => setForm({ ...form, is_most_popular: e.target.checked })} />
              Mark as Most Popular
            </label>
            <Button onClick={save} className="w-full">Add Room</Button>
          </div>
        </DialogContent>
      </Dialog>
    </HotelShellLayout>
  );
};

export default HotelRoomsPage;