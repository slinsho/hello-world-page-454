import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useFavorites } from "@/hooks/useFavorites";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, MessageCircle, Share2, Heart, MapPin, Bed, Bath, Grid3X3, ArrowLeft, CheckCircle, GitCompare, ShieldCheck, Flag, Megaphone, ChevronRight, Calendar } from "lucide-react";
import { LISTING_TYPE_LABELS, formatWhatsAppLink } from "@/lib/constants";
import { useFormatLRD } from "@/hooks/usePlatformSettings";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import RecommendedProperties from "@/components/RecommendedProperties";
import { PropertyInquiryForm } from "@/components/PropertyInquiryForm";
import { MakeOfferForm } from "@/components/MakeOfferForm";
import { UserReviews } from "@/components/UserReviews";
import { SEOHead } from "@/components/SEOHead";
import { PropertyJsonLd } from "@/components/PropertyJsonLd";
import { trackPropertyView } from "@/lib/analytics";
import Navbar from "@/components/Navbar";
import { ReportPropertyDialog } from "@/components/ReportPropertyDialog";
import { PromotePropertyDialog } from "@/components/PromotePropertyDialog";
import useEmblaCarousel from "embla-carousel-react";

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { addToRecentlyViewed } = useRecentlyViewed();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [property, setProperty] = useState<any>(null);
  const formatLRD = useFormatLRD();
  const [loading, setLoading] = useState(true);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Embla carousel for mobile hero
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentSlide(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, onSelect]);

  useEffect(() => { fetchProperty(); }, [id]);
  useEffect(() => { if (id && property) { trackPropertyView(id, user?.id); addToRecentlyViewed(id); } }, [id, property, user?.id]);

  const fetchProperty = async () => {
    const { data: propertyData } = await supabase.from("properties").select("*").eq("id", id).single();
    if (propertyData) {
      const [{ data: profileData }, { data: agentData }] = await Promise.all([
        supabase.from("profiles").select("id, name, email, phone, profile_photo_url, role, verification_status").eq("id", propertyData.owner_id).maybeSingle(),
        supabase.from("verification_requests").select("agency_name, agency_logo, verification_type").eq("user_id", propertyData.owner_id).eq("status", "approved").eq("verification_type", "agent").maybeSingle(),
      ]);

      let agentLogoUrl: string | null = null;
      if (agentData?.agency_logo) {
        const { data: signedData } = await supabase.storage.from("verification-docs").createSignedUrl(agentData.agency_logo, 3600);
        agentLogoUrl = signedData?.signedUrl || null;
      }

      setProperty({
        ...propertyData,
        profiles: profileData || null,
        agent_info: agentData ? { agency_name: agentData.agency_name, agency_logo: agentLogoUrl } : null,
      });
    }
    setLoading(false);
  };

  const handleCall = (phoneNumber?: string) => { window.location.href = `tel:${phoneNumber || property.contact_phone}`; };
  const handleWhatsApp = (phoneNumber?: string) => {
    const phone = phoneNumber || property.contact_phone;
    const msg = `Hi, I'm interested in your property "${property.title}" listed at $${property.price_usd.toLocaleString()} (${formatLRD(property.price_usd)}) in ${property.county}.`;
    window.open(formatWhatsAppLink(phone, msg), '_blank');
  };
  const handleShare = async () => {
    const shareData = { title: property.title, text: `Check out this property: ${property.title}`, url: window.location.href };
    if (navigator.share) { try { await navigator.share(shareData); } catch {} }
    else { navigator.clipboard.writeText(window.location.href); toast({ title: "Link Copied", description: "Property link copied to clipboard" }); }
  };
  const formatRole = (role: string) => { if (role === 'property_owner') return 'Property Owner'; if (role === 'agent') return 'Agent'; return role; };
  const displayName = property?.agent_info?.agency_name || property?.profiles?.name || 'Unknown';
  const displayPhoto = property?.agent_info?.agency_logo || property?.profiles?.profile_photo_url;

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="text-muted-foreground">Loading...</div></div>;
  if (!property) return <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4"><h2 className="text-xl font-bold">Property Not Found</h2><Button onClick={() => navigate("/")}>Go Home</Button></div>;

  const allPhotos = property.photos || [];
  const isRentOrLease = property.listing_type === 'for_rent' || property.listing_type === 'for_lease';

  // Desktop contact sidebar
  const ContactSidebar = () => (
    <div className="bg-card rounded-2xl border border-border/50 p-6 space-y-5 sticky top-24">
      <div>
        <p className="text-primary text-3xl font-bold">
          ${property.price_usd.toLocaleString()}
          <span className="text-sm font-normal text-muted-foreground">{isRentOrLease ? '/month' : ''}</span>
        </p>
        <p className="text-sm text-muted-foreground">{formatLRD(property.price_usd)}</p>
      </div>

      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="w-14 h-14 rounded-full bg-card border border-border overflow-hidden">
          {displayPhoto ? (
            <img src={displayPhoto} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-xl font-semibold">{displayName?.charAt(0) || 'U'}</div>
          )}
        </div>
        <div>
          <p className="font-semibold">{displayName}</p>
          <p className="text-muted-foreground text-sm">{formatRole(property.profiles?.role || 'property_owner')}</p>
          {property.profiles?.verification_status === "approved" && (
            <div className="flex items-center gap-1 mt-0.5">
              <ShieldCheck className={`h-4 w-4 ${property.profiles?.role === "agent" ? "text-blue-500" : "text-green-500"}`} />
              <span className={`text-xs font-semibold ${property.profiles?.role === "agent" ? "text-blue-500" : "text-green-500"}`}>
                {property.profiles?.role === "agent" ? "Verified Agent" : "Verified Owner"}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <Button className="w-full gap-2 h-12 rounded-xl" onClick={() => handleCall()}>
          <Phone className="h-4 w-4" />Call Owner
        </Button>
        <Button variant="outline" className="w-full gap-2 h-12 rounded-xl" onClick={() => handleWhatsApp()}>
          <MessageCircle className="h-4 w-4" />WhatsApp
        </Button>
        {property.profiles?.id && (
          <Button variant="outline" className="w-full rounded-xl" onClick={() => navigate(`/profile/${property.profiles.id}`)}>
            View Full Profile
          </Button>
        )}
      </div>

      {property.profiles?.role === "agent" && property.profiles?.id && (
        <div className="space-y-3 pt-4 border-t border-border">
          <MakeOfferForm propertyId={property.id} propertyTitle={property.title} askingPrice={property.price_usd} />
          <PropertyInquiryForm propertyId={property.id} propertyTitle={property.title} ownerId={property.profiles.id} ownerName={property.profiles.name || "Owner"} />
        </div>
      )}

      <div className="text-sm text-muted-foreground space-y-1 pt-4 border-t border-border">
        <p>📞 {property.contact_phone}</p>
        {property.contact_phone_2 && <p>📞 {property.contact_phone_2}</p>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-28 md:pb-8">
      <SEOHead title={`${property.title} - ${property.county}`} description={property.description || `${property.property_type} ${property.listing_type === 'for_rent' ? 'for rent' : 'for sale'} in ${property.county} at $${property.price_usd.toLocaleString()}`} ogImage={property.photos?.[0]} ogType="article" canonical={`${window.location.origin}/property/${property.id}`} />
      <PropertyJsonLd property={property} />

      {/* Desktop Navbar */}
      <div className="hidden md:block"><Navbar /></div>

      {/* ===== MOBILE HERO: Swipeable Carousel ===== */}
      <div className="md:hidden relative">
        {/* Top actions overlay */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" className="bg-background/70 backdrop-blur-md rounded-full h-10 w-10 shadow-lg" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="bg-background/70 backdrop-blur-md rounded-full h-10 w-10 shadow-lg" onClick={handleShare}>
              <Share2 className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="bg-background/70 backdrop-blur-md rounded-full h-10 w-10 shadow-lg" onClick={() => id && toggleFavorite(id)}>
              <Heart className={`h-5 w-5 ${id && isFavorite(id) ? "fill-red-500 text-red-500" : ""}`} />
            </Button>
          </div>
        </div>

        {allPhotos.length > 0 ? (
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {allPhotos.map((photo: string, index: number) => (
                <div key={index} className="flex-[0_0_100%] min-w-0">
                  <div className="h-[320px] relative" onClick={() => setFullscreenImage(photo)}>
                    <img src={photo} alt={`${property.title} - Photo ${index + 1}`} className="w-full h-full object-cover" />
                  </div>
                </div>
              ))}
            </div>
            {/* Slide indicators */}
            {allPhotos.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10">
                {allPhotos.length <= 8 ? (
                  allPhotos.map((_: string, i: number) => (
                    <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentSlide ? "w-6 bg-primary" : "w-1.5 bg-white/50"}`} />
                  ))
                ) : (
                  <div className="bg-background/70 backdrop-blur-sm rounded-full px-3 py-1">
                    <span className="text-xs font-medium text-foreground">{currentSlide + 1} / {allPhotos.length}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="h-[320px] bg-muted flex items-center justify-center">
            <MapPin className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* ===== DESKTOP HERO: Static Image ===== */}
      <div className="hidden md:block relative h-[400px] lg:h-[480px] bg-card max-w-7xl mx-auto mt-6 rounded-2xl overflow-hidden">
        <Button variant="ghost" size="icon" className="absolute top-4 left-4 z-10 bg-card/80 backdrop-blur-sm rounded-full" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Button variant="ghost" size="icon" className="bg-card/80 backdrop-blur-sm rounded-full" onClick={handleShare}><Share2 className="h-5 w-5" /></Button>
          <Button variant="ghost" size="icon" className="bg-card/80 backdrop-blur-sm rounded-full" onClick={() => id && toggleFavorite(id)}>
            <Heart className={`h-5 w-5 ${id && isFavorite(id) ? "fill-red-500 text-red-500" : ""}`} />
          </Button>
        </div>
        {allPhotos[0] ? (
          <img src={allPhotos[0]} alt={property.title} className="w-full h-full object-cover cursor-pointer" onClick={() => setFullscreenImage(allPhotos[0])} />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center"><MapPin className="h-12 w-12 text-muted-foreground" /></div>
        )}
      </div>

      {/* Desktop: Two-column layout */}
      <div className="md:max-w-7xl md:mx-auto md:px-6 md:mt-6 md:grid md:grid-cols-[1fr_380px] md:gap-8">
        {/* Main Content */}
        <div className="md:px-0 md:pt-0">

          {/* ===== MOBILE: Price Hero Block ===== */}
          <div className="md:hidden px-4 pt-5 pb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <Badge variant="secondary" className="text-[10px] font-semibold uppercase tracking-wider mb-2">
                  {LISTING_TYPE_LABELS[property.listing_type as keyof typeof LISTING_TYPE_LABELS]}
                </Badge>
                <h1 className="text-xl font-bold leading-tight mb-1">{property.title}</h1>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-sm">{property.address}, {property.county}</span>
                </div>
              </div>
            </div>

            {/* Price — the hero element */}
            <div className="mt-4 bg-primary/10 border border-primary/20 rounded-2xl p-4">
              <p className="text-primary text-3xl font-extrabold tracking-tight">
                ${property.price_usd.toLocaleString()}
                {isRentOrLease && <span className="text-base font-medium opacity-70">/mo</span>}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">{formatLRD(property.price_usd)}</p>
            </div>
          </div>

          {/* ===== DESKTOP: Title & Location ===== */}
          <div className="hidden md:block">
            <div className="flex items-center gap-1 mb-1">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">{property.address}, {property.county}</p>
            </div>
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold flex-1 leading-tight">{property.title}</h1>
              <Badge variant="secondary" className="text-xs ml-2 shrink-0">{LISTING_TYPE_LABELS[property.listing_type as keyof typeof LISTING_TYPE_LABELS]}</Badge>
            </div>
          </div>

          {/* ===== Property Specs — Compact horizontal strip ===== */}
          <div className="px-4 md:px-0 mb-5">
            <div className="flex items-center gap-0 bg-card border border-border rounded-xl overflow-hidden divide-x divide-border">
              {property.property_type && (
                <div className="flex-1 flex items-center justify-center gap-2 py-3.5">
                  <Grid3X3 className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium capitalize">{property.property_type}</span>
                </div>
              )}
              {property.bedrooms != null && (
                <div className="flex-1 flex items-center justify-center gap-2 py-3.5">
                  <Bed className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{property.bedrooms} Bed{property.bedrooms !== 1 ? 's' : ''}</span>
                </div>
              )}
              {property.bathrooms != null && (
                <div className="flex-1 flex items-center justify-center gap-2 py-3.5">
                  <Bath className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{property.bathrooms} Bath{property.bathrooms !== 1 ? 's' : ''}</span>
                </div>
              )}
              {property.square_yards != null && (
                <div className="flex-1 flex items-center justify-center gap-2 py-3.5">
                  <Grid3X3 className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{property.square_yards} yd²</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Listed {new Date(property.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* ===== Description ===== */}
          {property.description && (
            <div className="px-4 md:px-0 mb-5">
              <h3 className="font-semibold mb-2 text-base">About this property</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{property.description}</p>
            </div>
          )}

          {/* ===== Photo Gallery (below description) ===== */}
          {allPhotos.length > 1 && (
            <div className="px-4 md:px-0 mb-5">
              <h3 className="font-semibold mb-3 text-base">Photos</h3>
              <div className="grid grid-cols-3 gap-1.5 rounded-xl overflow-hidden">
                {allPhotos.slice(1, 4).map((photo: string, index: number) => (
                  <div
                    key={index}
                    className={`${index === 0 ? 'col-span-2 row-span-2' : 'col-span-1'} aspect-square cursor-pointer relative group`}
                    onClick={() => setFullscreenImage(photo)}
                  >
                    <img src={photo} alt={`Property ${index + 2}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    {index === (allPhotos.length > 4 ? 2 : -1) && allPhotos.length > 4 && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
                        <span className="text-lg font-bold">+{allPhotos.length - 4}</span>
                        <span className="text-xs">more photos</span>
                      </div>
                    )}
                  </div>
                ))}
                {allPhotos.slice(4, 5).map((photo: string, index: number) => (
                  <div key={index + 3} className="aspect-square cursor-pointer relative group" onClick={() => setFullscreenImage(photo)}>
                    <img src={photo} alt={`Property ${index + 5}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    {allPhotos.length > 5 && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
                        <span className="text-lg font-bold">+{allPhotos.length - 5}</span>
                        <span className="text-xs">more photos</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== MOBILE: Single Owner/Agent Contact Card ===== */}
          <div className="md:hidden px-4 mb-5">
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="p-4 flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-muted border-2 border-primary/20 overflow-hidden shrink-0">
                  {displayPhoto ? (
                    <img src={displayPhoto} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-lg font-semibold">{displayName?.charAt(0) || 'U'}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-base truncate">{displayName}</p>
                    {property.profiles?.verification_status === "approved" && (
                      <ShieldCheck className={`h-4 w-4 shrink-0 ${property.profiles?.role === "agent" ? "text-blue-500" : "text-green-500"}`} />
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">{formatRole(property.profiles?.role || 'property_owner')}</p>
                  {property.profiles?.verification_status === "approved" && (
                    <span className={`text-xs font-semibold ${property.profiles?.role === "agent" ? "text-blue-500" : "text-green-500"}`}>
                      {property.profiles?.role === "agent" ? "Verified Agent" : "Verified Owner"}
                    </span>
                  )}
                </div>
                {property.profiles?.id && (
                  <Button variant="ghost" size="icon" className="rounded-full shrink-0" onClick={() => navigate(`/profile/${property.profiles.id}`)}>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </Button>
                )}
              </div>

              {/* Contact details */}
              <div className="px-4 pb-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span>📞 {property.contact_phone}</span>
                {property.contact_phone_2 && <span>📞 {property.contact_phone_2}</span>}
              </div>

              {/* Action buttons inside card */}
              {property.profiles?.role === "agent" && property.profiles?.id && (
                <div className="px-4 pb-4 flex flex-col gap-2">
                  <MakeOfferForm propertyId={property.id} propertyTitle={property.title} askingPrice={property.price_usd} />
                  <PropertyInquiryForm propertyId={property.id} propertyTitle={property.title} ownerId={property.profiles.id} ownerName={property.profiles.name || "Owner"} />
                </div>
              )}
            </div>
          </div>

          {/* ===== Promote & Report — subtle inline ===== */}
          {user && (
            <div className="px-4 md:px-0 mb-5 flex items-center gap-2">
              {property.owner_id === user.id && (
                <PromotePropertyDialog propertyId={property.id} propertyTitle={property.title} isOwner={true} />
              )}
              {property.owner_id !== user.id && (
                <ReportPropertyDialog propertyId={property.id} propertyTitle={property.title} />
              )}
            </div>
          )}

          {/* Reviews */}
          {property.profiles?.id && property.profiles?.role === "agent" && (
            <div className="px-4 md:px-0 mb-6"><UserReviews userId={property.profiles.id} userName={property.profiles.name || "Owner"} propertyId={property.id} /></div>
          )}

          <div className="px-4 md:px-0">
            <RecommendedProperties currentPropertyId={property.id} county={property.county} propertyType={property.property_type} />
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <ContactSidebar />
        </div>
      </div>

      {/* Bottom Action Bar - Mobile Only */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border p-3 z-50">
        <div className="flex items-center justify-between gap-3 max-w-4xl mx-auto">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-card border border-border overflow-hidden shrink-0">
              {displayPhoto ? (<img src={displayPhoto} alt={displayName} className="w-full h-full object-cover" />) : (<div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-sm font-semibold">{displayName?.charAt(0) || 'U'}</div>)}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{displayName}</p>
              <p className="text-primary text-xs font-medium">{property.contact_phone}</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="icon" className="rounded-full h-11 w-11 border-border" onClick={() => handleCall()}>
              <Phone className="h-4 w-4" />
            </Button>
            <Button size="icon" className="rounded-full h-11 w-11" onClick={() => handleWhatsApp()}>
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={!!fullscreenImage} onOpenChange={() => setFullscreenImage(null)}>
        <DialogContent className="max-w-full h-full w-full p-0 border-0 bg-black/95">
          <div className="flex items-center justify-center h-full w-full p-4">
            {fullscreenImage && <img src={fullscreenImage} alt="Fullscreen view" className="max-h-full max-w-full object-contain" />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertyDetail;
