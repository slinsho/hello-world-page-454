import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { LIBERIA_COUNTIES } from "@/lib/countyFlags";
import { Plus, Building2, BedDouble, CalendarCheck, ShieldCheck, X, LayoutDashboard, Star, Calendar as CalIcon, Wallet, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";

const AMENITY_OPTIONS = [
  { key: "wifi", label: "Free WiFi" }, { key: "pool", label: "Pool" }, { key: "breakfast", label: "Breakfast" },
  { key: "parking", label: "Parking" }, { key: "ac", label: "AC" }, { key: "gym", label: "Gym" },
  { key: "restaurant", label: "Restaurant" }, { key: "airport_shuttle", label: "Airport Shuttle" },
  { key: "front_desk", label: "24/7 Front Desk" }, { key: "laundry", label: "Laundry" },
];

const HotelDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [hotels, setHotels] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<string | null>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [hotelDlgOpen, setHotelDlgOpen] = useState(false);
  const [roomDlgOpen, setRoomDlgOpen] = useState(false);
  const [hotelForm, setHotelForm] = useState({ name: "", description: "", county: "Montserrado", district: "", city: "", address: "", phone: "", cover_photo: "" });
  const [hotelAmenities, setHotelAmenities] = useState<Record<string, boolean>>({});
  const [roomForm, setRoomForm] = useState({ name: "Standard Room", price_per_night: "50", guests: "2", size_sqm: "20", bed_type: "1 Queen Bed", photo: "", is_most_popular: false });

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    (async () => {
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      setProfile(p);
      const { data: h } = await supabase.from("hotels").select("*").eq("owner_id", user.id).order("created_at", { ascending: false });
      setHotels(h || []);
      if (h?.[0]) setSelectedHotel(h[0].id);
      const hotelIds = (h || []).map((x: any) => x.id);
      if (hotelIds.length) {
        const { data: b } = await supabase.from("hotel_bookings").select("*").in("hotel_id", hotelIds).order("created_at", { ascending: false });
        setBookings(b || []);
      }
    })();
  }, [user, navigate]);

  useEffect(() => {
    if (!selectedHotel) return;
    supabase.from("hotel_rooms").select("*").eq("hotel_id", selectedHotel).then(({ data }) => setRooms(data || []));
  }, [selectedHotel]);

  const uploadImage = async (file: File): Promise<string> => {
    const path = `${user!.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("property-photos").upload(path, file);
    if (error) throw error;
    return supabase.storage.from("property-photos").getPublicUrl(path).data.publicUrl;
  };

  const saveHotel = async () => {
    if (!user) return;
    const { error, data } = await supabase.from("hotels").insert({
      owner_id: user.id,
      name: hotelForm.name,
      description: hotelForm.description,
      county: hotelForm.county,
      district: hotelForm.district || null,
      city: hotelForm.city || null,
      address: hotelForm.address,
      phone: hotelForm.phone || null,
      cover_photo: hotelForm.cover_photo || null,
      amenities: hotelAmenities,
      status: 'pending',
    }).select().single();
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Hotel created", description: "Pending admin activation." });
    setHotels([data, ...hotels]);
    setHotelDlgOpen(false);
    setHotelForm({ name: "", description: "", county: "Montserrado", district: "", city: "", address: "", phone: "", cover_photo: "" });
  };

  const saveRoom = async () => {
    if (!selectedHotel) return;
    const { error, data } = await supabase.from("hotel_rooms").insert({
      hotel_id: selectedHotel,
      name: roomForm.name,
      price_per_night: Number(roomForm.price_per_night),
      guests: Number(roomForm.guests),
      size_sqm: Number(roomForm.size_sqm),
      bed_type: roomForm.bed_type,
      photos: roomForm.photo ? [roomForm.photo] : [],
      is_most_popular: roomForm.is_most_popular,
    }).select().single();
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    setRooms([...rooms, data]);
    setRoomDlgOpen(false);
    toast({ title: "Room added" });
  };

  const updateBookingStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("hotel_bookings").update({ status }).eq("id", id);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    setBookings(bookings.map((b) => b.id === id ? { ...b, status } : b));
    toast({ title: `Booking ${status}` });
  };

  const notVerified = profile && profile.role === "hotel" && profile.verification_status !== "approved";

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Hotel Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage your hotels, rooms and bookings.</p>
        </div>

        {notVerified && (
          <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">Verification required</p>
                <p className="text-sm text-muted-foreground">Complete verification before you can activate your hotel.</p>
              </div>
              <Button onClick={() => navigate("/verification")}><ShieldCheck className="w-4 h-4 mr-2" />Verify Now</Button>
            </CardContent>
          </Card>
        )}

        {/* Stat overview */}
        {(() => {
          const totalHotels = hotels.length;
          const totalBookings = bookings.length;
          const pendingBookings = bookings.filter((b) => b.status === "pending").length;
          const confirmedBookings = bookings.filter((b) => b.status === "confirmed").length;
          const monthlyRevenue = bookings
            .filter((b) => b.status === "confirmed" && new Date(b.created_at).getMonth() === new Date().getMonth())
            .reduce((sum, b) => sum + Number(b.total || 0), 0);
          const stats = [
            { label: "Hotels", value: totalHotels, icon: Building2 },
            { label: "Rooms", value: rooms.length, icon: BedDouble },
            { label: "Total Bookings", value: totalBookings, icon: CalendarCheck },
            { label: "Pending", value: pendingBookings, icon: Bell },
            { label: "Confirmed", value: confirmedBookings, icon: ShieldCheck },
            { label: "This Month", value: `$${monthlyRevenue.toFixed(0)}`, icon: Wallet },
          ];
          return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {stats.map((s) => {
                const Icon = s.icon;
                return (
                  <Card key={s.label}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <p className="text-xl font-bold mt-1">{s.value}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          );
        })()}

        <Tabs defaultValue="overview">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="overview"><LayoutDashboard className="w-4 h-4 mr-1.5" />Dashboard</TabsTrigger>
            <TabsTrigger value="hotels"><Building2 className="w-4 h-4 mr-1.5" />My Hotels</TabsTrigger>
            <TabsTrigger value="rooms"><BedDouble className="w-4 h-4 mr-1.5" />Rooms</TabsTrigger>
            <TabsTrigger value="bookings"><CalendarCheck className="w-4 h-4 mr-1.5" />Bookings ({bookings.length})</TabsTrigger>
            <TabsTrigger value="calendar"><CalIcon className="w-4 h-4 mr-1.5" />Calendar</TabsTrigger>
            <TabsTrigger value="payments"><Wallet className="w-4 h-4 mr-1.5" />Payments</TabsTrigger>
            <TabsTrigger value="reviews"><Star className="w-4 h-4 mr-1.5" />Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-3 mt-4">
            <Card><CardContent className="p-4">
              <p className="font-semibold mb-2">Recent Bookings</p>
              {bookings.slice(0, 5).length === 0 && <p className="text-sm text-muted-foreground">No bookings yet.</p>}
              {bookings.slice(0, 5).map((b) => (
                <div key={b.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{b.guest_name}</p>
                    <p className="text-xs text-muted-foreground">{b.check_in} → {b.check_out}</p>
                  </div>
                  <Badge variant={b.status === "confirmed" ? "default" : b.status === "cancelled" ? "destructive" : "secondary"}>{b.status}</Badge>
                </div>
              ))}
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="hotels" className="space-y-3 mt-4">
            <Button onClick={() => setHotelDlgOpen(true)} disabled={notVerified}><Plus className="w-4 h-4 mr-2" />Add Hotel</Button>
            {hotels.length === 0 && <p className="text-muted-foreground text-sm">No hotels yet.</p>}
            {hotels.map((h) => (
              <Card key={h.id} className={selectedHotel === h.id ? "border-primary" : ""}>
                <CardContent className="p-4 flex items-center gap-3 cursor-pointer" onClick={() => setSelectedHotel(h.id)}>
                  <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden shrink-0">
                    {h.cover_photo && <img src={h.cover_photo} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{h.name}</p>
                    <p className="text-xs text-muted-foreground">{h.address}</p>
                    <div className="flex gap-1 mt-1">
                      <Badge variant={h.status === "active" ? "default" : "secondary"} className="text-[10px]">{h.status}</Badge>
                      {h.is_verified && <Badge className="bg-green-600 text-[10px]">Verified</Badge>}
                    </div>
                  </div>
                  <Link to={`/hotels/${h.id}`} className="text-xs text-primary hover:underline" onClick={(e) => e.stopPropagation()}>View</Link>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="rooms" className="space-y-3 mt-4">
            {!selectedHotel ? <p className="text-muted-foreground">Select a hotel first.</p> : (
              <>
                <Button onClick={() => setRoomDlgOpen(true)}><Plus className="w-4 h-4 mr-2" />Add Room</Button>
                {rooms.map((r) => (
                  <Card key={r.id}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden shrink-0">
                        {r.photos?.[0] && <img src={r.photos[0]} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{r.name}{r.is_most_popular && <Badge className="ml-2 text-[10px]">Popular</Badge>}</p>
                        <p className="text-xs text-muted-foreground">${r.price_per_night}/night · {r.guests} guests · {r.size_sqm}m²</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </TabsContent>

          <TabsContent value="bookings" className="space-y-3 mt-4">
            {bookings.length === 0 && <p className="text-muted-foreground">No bookings yet.</p>}
            {bookings.map((b) => (
              <Card key={b.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{b.guest_name}</p>
                    <Badge variant={b.status === "confirmed" ? "default" : b.status === "cancelled" ? "destructive" : "secondary"}>{b.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{b.guest_phone} · {b.check_in} → {b.check_out} · {b.guests} guests</p>
                  <p className="text-sm font-bold text-primary">${Number(b.total).toFixed(2)}</p>
                  {b.status === "pending" && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => updateBookingStatus(b.id, "confirmed")}>Confirm</Button>
                      <Button size="sm" variant="outline" onClick={() => updateBookingStatus(b.id, "cancelled")}>Cancel</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="calendar" className="mt-4">
            <Card><CardContent className="p-4">
              <p className="font-semibold mb-3">Upcoming Check-ins</p>
              {bookings.filter((b) => b.status === "confirmed" && new Date(b.check_in) >= new Date()).length === 0 && (
                <p className="text-sm text-muted-foreground">No upcoming check-ins.</p>
              )}
              {bookings
                .filter((b) => b.status === "confirmed" && new Date(b.check_in) >= new Date())
                .sort((a, b) => new Date(a.check_in).getTime() - new Date(b.check_in).getTime())
                .map((b) => (
                  <div key={b.id} className="flex justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{b.guest_name}</p>
                      <p className="text-xs text-muted-foreground">{b.guests} guests</p>
                    </div>
                    <div className="text-right text-xs">
                      <p className="font-semibold">{b.check_in}</p>
                      <p className="text-muted-foreground">→ {b.check_out}</p>
                    </div>
                  </div>
                ))}
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="payments" className="mt-4">
            <Card><CardContent className="p-4 space-y-2">
              <p className="font-semibold">Payment Records</p>
              <p className="text-xs text-muted-foreground">Only confirmed bookings count toward revenue.</p>
              <div className="mt-3 space-y-1">
                {bookings.filter((b) => b.status === "confirmed").map((b) => (
                  <div key={b.id} className="flex justify-between text-sm border-b py-2 last:border-0">
                    <span>{b.guest_name} · {b.payment_method || "—"}</span>
                    <span className="font-semibold text-primary">${Number(b.total).toFixed(2)}</span>
                  </div>
                ))}
                {bookings.filter((b) => b.status === "confirmed").length === 0 && (
                  <p className="text-sm text-muted-foreground">No confirmed payments yet.</p>
                )}
              </div>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-4">
            <Card><CardContent className="p-4">
              <p className="font-semibold mb-1">Guest Reviews</p>
              <p className="text-sm text-muted-foreground">Reviews will appear here once guests leave feedback after their stay.</p>
            </CardContent></Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Add Hotel Dialog */}
      <Dialog open={hotelDlgOpen} onOpenChange={setHotelDlgOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Hotel</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Hotel Name *" value={hotelForm.name} onChange={(e) => setHotelForm({ ...hotelForm, name: e.target.value })} />
            <Textarea placeholder="Description" value={hotelForm.description} onChange={(e) => setHotelForm({ ...hotelForm, description: e.target.value })} />
            <Select value={hotelForm.county} onValueChange={(v) => setHotelForm({ ...hotelForm, county: v })}>
              <SelectTrigger><SelectValue placeholder="County" /></SelectTrigger>
              <SelectContent>{LIBERIA_COUNTIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="District" value={hotelForm.district} onChange={(e) => setHotelForm({ ...hotelForm, district: e.target.value })} />
            <Input placeholder="City" value={hotelForm.city} onChange={(e) => setHotelForm({ ...hotelForm, city: e.target.value })} />
            <Input placeholder="Address *" value={hotelForm.address} onChange={(e) => setHotelForm({ ...hotelForm, address: e.target.value })} />
            <Input placeholder="Phone" value={hotelForm.phone} onChange={(e) => setHotelForm({ ...hotelForm, phone: e.target.value })} />
            <div>
              <Label className="text-xs">Cover Photo</Label>
              <Input type="file" accept="image/*" onChange={async (e) => {
                const f = e.target.files?.[0]; if (!f) return;
                try { const url = await uploadImage(f); setHotelForm({ ...hotelForm, cover_photo: url }); } catch { toast({ title: "Upload failed", variant: "destructive" }); }
              }} />
              {hotelForm.cover_photo && <img src={hotelForm.cover_photo} className="mt-2 h-20 rounded" />}
            </div>
            <div>
              <Label className="text-xs">Amenities</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {AMENITY_OPTIONS.map((a) => (
                  <label key={a.key} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={!!hotelAmenities[a.key]} onChange={(e) => setHotelAmenities({ ...hotelAmenities, [a.key]: e.target.checked })} />
                    {a.label}
                  </label>
                ))}
              </div>
            </div>
            <Button onClick={saveHotel} className="w-full">Create Hotel</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Room Dialog */}
      <Dialog open={roomDlgOpen} onOpenChange={setRoomDlgOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Room</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Room name" value={roomForm.name} onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })} />
            <div className="grid grid-cols-3 gap-2">
              <Input type="number" placeholder="Price/night" value={roomForm.price_per_night} onChange={(e) => setRoomForm({ ...roomForm, price_per_night: e.target.value })} />
              <Input type="number" placeholder="Guests" value={roomForm.guests} onChange={(e) => setRoomForm({ ...roomForm, guests: e.target.value })} />
              <Input type="number" placeholder="Size m²" value={roomForm.size_sqm} onChange={(e) => setRoomForm({ ...roomForm, size_sqm: e.target.value })} />
            </div>
            <Input placeholder="Bed type" value={roomForm.bed_type} onChange={(e) => setRoomForm({ ...roomForm, bed_type: e.target.value })} />
            <Input type="file" accept="image/*" onChange={async (e) => {
              const f = e.target.files?.[0]; if (!f) return;
              try { const url = await uploadImage(f); setRoomForm({ ...roomForm, photo: url }); } catch { toast({ title: "Upload failed", variant: "destructive" }); }
            }} />
            {roomForm.photo && <img src={roomForm.photo} className="h-20 rounded" />}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={roomForm.is_most_popular} onChange={(e) => setRoomForm({ ...roomForm, is_most_popular: e.target.checked })} />
              Mark as Most Popular
            </label>
            <Button onClick={saveRoom} className="w-full">Add Room</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HotelDashboard;
