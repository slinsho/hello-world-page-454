import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShieldCheck, Star, MapPin, Phone, Calendar, Wifi, Waves, Coffee, Car, Snowflake, Dumbbell, Utensils } from "lucide-react";

const AMENITY_ICONS: Record<string, any> = { wifi: Wifi, pool: Waves, breakfast: Coffee, parking: Car, ac: Snowflake, gym: Dumbbell, restaurant: Utensils };
const AMENITY_LABELS: Record<string, string> = { wifi: "Free WiFi", pool: "Pool", breakfast: "Breakfast", parking: "Parking", ac: "AC", gym: "Gym", restaurant: "Restaurant", airport_shuttle: "Airport Shuttle", front_desk: "24/7 Front Desk", laundry: "Laundry" };

const HotelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: h } = await supabase.from("hotels").select("*").eq("id", id).maybeSingle();
      if (h) {
        setHotel(h);
        const { data: r } = await supabase.from("hotel_rooms").select("*").eq("hotel_id", id).eq("is_active", true);
        setRooms(r || []);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" /></div>;
  if (!hotel) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Hotel not found.</div>;

  const gallery = [hotel.cover_photo, ...(hotel.gallery || [])].filter(Boolean);
  const amenities = hotel.amenities || {};
  const activeAmenities = Object.keys(amenities).filter((k) => amenities[k]);
  const minPrice = rooms.length ? Math.min(...rooms.map((r: any) => Number(r.price_per_night))) : null;

  return (
    <div className="min-h-screen bg-background pb-24">
      <SEOHead title={`${hotel.name} - Book Stay`} description={hotel.description || `Book ${hotel.name} in ${hotel.county}`} />

      <div className="relative">
        <div className="aspect-[16/10] md:aspect-[21/9] bg-muted overflow-hidden">
          {gallery[selectedImage] && <img src={gallery[selectedImage]} alt={hotel.name} className="w-full h-full object-cover" />}
        </div>
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="absolute top-3 left-3 bg-background/90 rounded-lg shadow"><ArrowLeft className="w-5 h-5" /></Button>
        {hotel.is_verified && (
          <Badge className="absolute top-3 right-3 bg-green-600 text-white gap-1"><ShieldCheck className="w-3 h-3" />Verified Hotel</Badge>
        )}
        <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded">{selectedImage + 1} / {gallery.length}</div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 space-y-5">
        {gallery.length > 1 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {gallery.slice(0, 6).map((img: string, i: number) => (
              <button key={i} onClick={() => setSelectedImage(i)} className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden ring-2 ${i === selectedImage ? "ring-primary" : "ring-transparent"}`}>
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
            {gallery.length > 6 && <div className="shrink-0 w-16 h-16 rounded-lg bg-secondary flex items-center justify-center text-xs font-semibold">+{gallery.length - 6}</div>}
          </div>
        )}

        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{hotel.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold">{Number(hotel.star_rating || 0).toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({hotel.rating_count || 0} reviews)</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <MapPin className="w-4 h-4 text-primary" />{hotel.address}
            </div>
          </div>
          {minPrice != null && (
            <div className="text-right">
              <p className="text-primary text-2xl font-extrabold">${minPrice}</p>
              <p className="text-xs text-muted-foreground">/ night</p>
            </div>
          )}
        </div>

        {activeAmenities.length > 0 && (
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
            {activeAmenities.slice(0, 6).map((k) => {
              const Icon = AMENITY_ICONS[k] || Star;
              return (
                <div key={k} className="flex flex-col items-center gap-1 p-3 border border-border rounded-xl bg-card">
                  <Icon className="w-5 h-5 text-primary" />
                  <span className="text-[10px] font-medium">{AMENITY_LABELS[k] || k}</span>
                </div>
              );
            })}
          </div>
        )}

        {hotel.description && (
          <div>
            <h2 className="font-semibold text-lg mb-2">About this hotel</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{hotel.description}</p>
          </div>
        )}

        <div className="flex gap-2">
          {hotel.phone && (
            <a href={`tel:${hotel.phone}`} className="flex-1">
              <Button variant="outline" className="w-full h-12"><Phone className="w-4 h-4 mr-2" />Call Hotel</Button>
            </a>
          )}
          <Link to={`/hotels/${hotel.id}/rooms`} className="flex-1">
            <Button className="w-full h-12"><Calendar className="w-4 h-4 mr-2" />Check Availability</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HotelDetail;
