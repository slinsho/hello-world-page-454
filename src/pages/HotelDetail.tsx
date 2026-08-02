import { useEffect, useState } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, ShieldCheck, Star, MapPin, Phone, Calendar, Wifi, Waves, Coffee, Car,
  Snowflake, Dumbbell, Utensils, Tv, BedDouble, Users, LogIn, LogOut, DoorClosed,
  Heart, MessageCircle, ChevronRight, Sparkles,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const AMENITY_ICONS: Record<string, any> = {
  wifi: Wifi, pool: Waves, breakfast: Coffee, parking: Car, ac: Snowflake,
  gym: Dumbbell, restaurant: Utensils, tv: Tv,
  airport_shuttle: Car, front_desk: Users, laundry: Sparkles,
};
const AMENITY_LABELS: Record<string, string> = {
  wifi: "Free WiFi", pool: "Pool", breakfast: "Breakfast", parking: "Parking",
  ac: "Air Conditioning", gym: "Gym", restaurant: "Restaurant", tv: "TV",
  airport_shuttle: "Airport Shuttle", front_desk: "24/7 Front Desk", laundry: "Laundry",
};

const HotelDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { toast } = useToast();
  const [hotel, setHotel] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [nearbyHotels, setNearbyHotels] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAllRooms, setShowAllRooms] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [eligibleBooking, setEligibleBooking] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data: h } = await supabase.from("hotels").select("*").eq("id", id).maybeSingle();
      if (h) {
        setHotel(h);
        const [{ data: r }, { data: rv }, { data: nb }] = await Promise.all([
          supabase.from("hotel_rooms").select("*").eq("hotel_id", id).eq("is_active", true).order("price_per_night"),
          supabase.from("hotel_reviews").select("*").eq("hotel_id", id).order("created_at", { ascending: false }).limit(50),
          supabase.from("hotels").select("id,name,cover_photo,city,county,star_rating,is_verified").eq("county", h.county).eq("status", "active").neq("id", h.id).limit(6),
        ]);
        setRooms(r || []);
        setReviews(rv || []);
        setNearbyHotels(nb || []);
        // Prompt for a review if the guest has a checked-out booking without a review yet.
        if (user) {
          const { data: bookings } = await supabase.from("hotel_bookings")
            .select("id, checked_out_at")
            .eq("hotel_id", id)
            .eq("guest_id", user.id)
            .not("checked_out_at", "is", null)
            .order("checked_out_at", { ascending: false })
            .limit(1);
          if (bookings && bookings.length) {
            const alreadyReviewed = (rv || []).some((x: any) => x.guest_id === user.id && x.booking_id === bookings[0].id);
            if (!alreadyReviewed) {
              setEligibleBooking(bookings[0]);
              if (searchParams.get("review") === "1") setReviewOpen(true);
            } else if (searchParams.get("review") === "1") {
              toast({ title: "Already reviewed", description: "You've already left a review for this stay." });
            }
          }
        }

      }
      setLoading(false);
    })();
  }, [id, user]);

  const submitReview = async () => {
    if (!user || !eligibleBooking) return;
    const { data: prof } = await supabase.from("profiles").select("name").eq("id", user.id).maybeSingle();
    const { error } = await supabase.from("hotel_reviews").insert({
      hotel_id: id, booking_id: eligibleBooking.id, guest_id: user.id,
      guest_name: prof?.name || "Guest", rating: reviewRating, comment: reviewText || null,
    } as any);
    if (error) { toast({ title: "Review failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Thanks for your review!" });
    setReviewOpen(false); setEligibleBooking(null); setReviewText(""); setReviewRating(5);
    const { data: rv } = await supabase.from("hotel_reviews").select("*").eq("hotel_id", id).order("created_at", { ascending: false });
    setReviews(rv || []);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" /></div>;
  if (!hotel) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Hotel not found.</div>;

  const gallery = [hotel.cover_photo, ...(hotel.gallery || [])].filter(Boolean);
  const amenities = hotel.amenities || {};
  const activeAmenities = Object.keys(amenities).filter((k) => amenities[k]);
  const topAmen: string[] = Array.isArray(hotel.top_amenities) && hotel.top_amenities.length
    ? hotel.top_amenities as string[]
    : activeAmenities;
  const whyList: string[] = Array.isArray(hotel.why_guests_love) ? hotel.why_guests_love as string[] : [];
  const nearbyList: any[] = Array.isArray(hotel.nearby_places) ? hotel.nearby_places as any[] : [];
  const minPrice = rooms.length ? Math.min(...rooms.map((r: any) => Number(r.price_per_night))) : null;
  const visibleRooms = showAllRooms ? rooms : rooms.slice(0, 3);
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + Number(r.rating), 0) / reviews.length).toFixed(1) : Number(hotel.star_rating || 0).toFixed(1);

  return (
    <div className="min-h-screen bg-background pb-28">
      <SEOHead title={`${hotel.name} - Book Stay`} description={hotel.description || hotel.about || `Book ${hotel.name} in ${hotel.county}`} />

      {/* Hero gallery */}
      <div className="relative">
        <div className="aspect-[16/10] md:aspect-[21/9] bg-muted overflow-hidden">
          {gallery[selectedImage] && <img src={gallery[selectedImage]} alt={hotel.name} className="w-full h-full object-cover" />}
        </div>
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="absolute top-3 left-3 bg-background/90 rounded-full shadow"><ArrowLeft className="w-5 h-5" /></Button>
        {hotel.is_verified && (
          <Badge className="absolute top-3 right-3 bg-green-600 text-white gap-1"><ShieldCheck className="w-3 h-3" />Verified Hotel</Badge>
        )}
        {gallery.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full">{selectedImage + 1} / {gallery.length}</div>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 space-y-6">
        {gallery.length > 1 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
            {gallery.slice(0, 8).map((img: string, i: number) => (
              <button key={i} onClick={() => setSelectedImage(i)} className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden ring-2 ${i === selectedImage ? "ring-primary" : "ring-transparent"}`}>
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Title + rating + price */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-tight">{hotel.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-sm">{avgRating}</span>
              <span className="text-xs text-muted-foreground">({reviews.length} reviews)</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <MapPin className="w-4 h-4 text-primary shrink-0" /><span className="truncate">{hotel.address}</span>
            </div>
          </div>
          {minPrice != null && (
            <div className="text-right shrink-0">
              <p className="text-primary text-2xl font-extrabold leading-none">${minPrice}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">/ night</p>
            </div>
          )}
        </div>

        {/* Horizontal fact strip: star_rating · total_rooms · check-in · check-out */}
        <div className="grid grid-cols-4 gap-2 rounded-2xl border bg-card p-2">
          <FactCell icon={Star} label="Rating" value={`${Number(hotel.star_rating || 0).toFixed(0)}★`} />
          <FactCell icon={DoorClosed} label="Rooms" value={hotel.total_rooms > 0 ? String(hotel.total_rooms) : String(rooms.length || "—")} />
          <FactCell icon={LogIn} label="Check-in" value={hotel.check_in_time || "14:00"} />
          <FactCell icon={LogOut} label="Check-out" value={hotel.check_out_time || "11:00"} />
        </div>

        {/* Why guests love this hotel */}
        {whyList.length > 0 && (
          <section>
            <h2 className="font-bold text-lg mb-2 flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> Why guests love this hotel
            </h2>
            <div className="grid gap-2">
              {whyList.map((w, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20">
                  <Sparkles className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                  <p className="text-sm">{w}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Top amenities */}
        {topAmen.length > 0 && (
          <section>
            <h2 className="font-bold text-lg mb-2">Top amenities</h2>
            <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
              {topAmen.slice(0, 12).map((k) => {
                const Icon = AMENITY_ICONS[k] || Star;
                return (
                  <div key={k} className="flex flex-col items-center gap-1 p-3 border border-border rounded-xl bg-card">
                    <Icon className="w-5 h-5 text-primary" />
                    <span className="text-[10px] font-medium text-center">{AMENITY_LABELS[k] || k}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Available rooms — 3 shown, see all toggles */}
        {rooms.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-lg">Available rooms</h2>
              <span className="text-xs text-muted-foreground">{rooms.length} total</span>
            </div>
            <div className="space-y-2.5">
              {visibleRooms.map((r: any) => {
                const rAm = (r.amenities || {}) as Record<string, any>;
                const rActive = Object.keys(rAm).filter((k) => rAm[k]);
                return (
                  <Link key={r.id} to={`/hotels/${hotel.id}/rooms`} className="flex gap-3 p-2.5 rounded-2xl bg-card border border-border active:scale-[0.99] transition">
                    <div className="w-20 h-20 rounded-xl bg-muted overflow-hidden shrink-0">
                      {r.photos?.[0] && <img src={r.photos[0]} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0 py-0.5">
                      <h3 className="font-bold text-sm leading-tight truncate">{r.name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                        {r.guests && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{r.guests}</span>}
                        {r.bed_type && <span className="flex items-center gap-1 capitalize"><BedDouble className="w-3 h-3" />{String(r.bed_type).split("_").join(" ")}</span>}
                      </div>
                      {rActive.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {rActive.slice(0, 4).map((k) => {
                            const Ic = AMENITY_ICONS[k] || Sparkles;
                            return (
                              <span key={k} className="inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                                <Ic className="w-2.5 h-2.5" />{AMENITY_LABELS[k] || k}
                              </span>
                            );
                          })}
                          {rActive.length > 4 && <span className="text-[9px] text-muted-foreground px-1">+{rActive.length - 4}</span>}
                        </div>
                      )}
                      <p className="text-primary font-bold text-sm mt-1 tabular-nums">${Number(r.price_per_night)}<span className="text-[10px] font-normal text-muted-foreground">/night</span></p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground self-center shrink-0" />
                  </Link>
                );
              })}
            </div>
            {rooms.length > 3 && (
              <button
                onClick={() => setShowAllRooms((v) => !v)}
                className="w-full mt-3 h-10 rounded-full border text-sm font-semibold active:scale-95 transition"
              >
                {showAllRooms ? "Show less" : `See all ${rooms.length} rooms`}
              </button>
            )}
          </section>
        )}

        {/* About this hotel */}
        {(hotel.about || hotel.description) && (
          <section>
            <h2 className="font-bold text-lg mb-2">About this hotel</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
              {hotel.about || hotel.description}
            </p>
          </section>
        )}

        {/* Nearby places */}
        {nearbyList.length > 0 && (
          <section>
            <h2 className="font-bold text-lg mb-2">Nearby places</h2>
            <div className="space-y-2">
              {nearbyList.map((p: any, i: number) => {
                const name = typeof p === "string" ? p : p.name;
                const distance = typeof p === "string" ? "" : p.distance;
                return (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-card border">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{name}</p>
                      {distance && <p className="text-[11px] text-muted-foreground">{distance}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Nearby hotels — same county */}
        {nearbyHotels.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-lg">Nearby hotels</h2>
              <Link to="/hotels" className="text-xs font-semibold text-primary">See all</Link>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
              {nearbyHotels.map((nh) => (
                <Link
                  key={nh.id}
                  to={`/hotels/${nh.id}`}
                  className="shrink-0 w-44 rounded-2xl bg-card border border-border overflow-hidden active:scale-[0.98] transition"
                >
                  <div className="h-24 bg-muted relative">
                    {nh.cover_photo && <img src={nh.cover_photo} alt={nh.name} className="w-full h-full object-cover" loading="lazy" />}
                    {nh.is_verified && (
                      <span className="absolute top-1.5 left-1.5 bg-green-600 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <ShieldCheck className="w-2.5 h-2.5" />Verified
                      </span>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-bold truncate">{nh.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[10px] text-muted-foreground truncate">{nh.city || nh.county}</p>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-[10px] font-bold">{Number(nh.star_rating || 0).toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Guest reviews */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-lg">Guest reviews</h2>
            {eligibleBooking && (
              <button onClick={() => setReviewOpen(true)} className="text-xs font-semibold text-primary">
                Write a review
              </button>
            )}
          </div>
          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center rounded-xl border border-dashed">
              No reviews yet.
            </p>
          ) : (
            <div className="space-y-2.5">
              {reviews.slice(0, 8).map((rv: any) => (
                <div key={rv.id} className="p-3 rounded-2xl bg-card border">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold truncate">{rv.guest_name}</p>
                    <div className="flex items-center gap-0.5 shrink-0">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < rv.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                      ))}
                    </div>
                  </div>
                  {rv.comment && <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{rv.comment}</p>}
                  {rv.owner_reply && (
                    <div className="mt-2 pl-3 border-l-2 border-primary/40 text-xs">
                      <p className="font-semibold text-primary">Owner reply</p>
                      <p className="text-muted-foreground mt-0.5">{rv.owner_reply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {reviewOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4" onClick={() => setReviewOpen(false)}>
            <div className="w-full max-w-md bg-background rounded-3xl p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-bold text-lg">Rate your stay</h3>
              <div className="flex items-center justify-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setReviewRating(n)}>
                    <Star className={`w-8 h-8 ${n <= reviewRating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                  </button>
                ))}
              </div>
              <Textarea placeholder="Tell others about your stay…" value={reviewText} onChange={(e) => setReviewText(e.target.value)} rows={4} />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setReviewOpen(false)} className="flex-1">Cancel</Button>
                <Button onClick={submitReview} className="flex-1">Submit</Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 pb-[env(safe-area-inset-bottom)] bg-background/95 backdrop-blur-xl border-t border-border">
        <div className="max-w-4xl mx-auto flex items-center gap-2 p-3">
          {hotel.phone && (
            <a href={`tel:${hotel.phone}`} className="w-12 h-12 grid place-items-center rounded-2xl border bg-background active:scale-95">
              <Phone className="w-5 h-5" />
            </a>
          )}
          <Link to={`/hotels/${hotel.id}/rooms`} className="flex-1">
            <Button className="w-full h-12 rounded-2xl font-semibold shadow-lg">
              <Calendar className="w-4 h-4 mr-2" />Check availability
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

const FactCell = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex flex-col items-center gap-1 py-1.5">
    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary grid place-items-center">
      <Icon className="w-3.5 h-3.5" />
    </div>
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold leading-none">{label}</p>
    <p className="text-xs font-bold leading-none">{value}</p>
  </div>
);

export default HotelDetail;
