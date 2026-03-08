import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useFavorites } from "@/hooks/useFavorites";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, MessageCircle, Share2, Heart, MapPin, Bed, Bath, Grid3X3, ArrowLeft, CheckCircle, GitCompare, ShieldCheck, Flag, Megaphone } from "lucide-react";
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
  const displayPhotos = allPhotos.slice(0, 5);
  const remainingCount = allPhotos.length - 5;
  const heroImage = allPhotos[0];

  // Desktop contact sidebar
  const ContactSidebar = () => (
    <div className="bg-card rounded-2xl border border-border/50 p-6 space-y-5 sticky top-24">
      {/* Price */}
      <div>
        <p className="text-primary text-3xl font-bold">
          ${property.price_usd.toLocaleString()}
          <span className="text-sm font-normal text-muted-foreground">
            {property.listing_type === 'for_rent' || property.listing_type === 'for_lease' ? '/month' : ''}
          </span>
        </p>
        <p className="text-sm text-muted-foreground">{formatLRD(property.price_usd)}</p>
      </div>

      {/* Owner */}
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

      {/* Contact Buttons */}
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

      {/* Inquiry & Offer */}
      {property.profiles?.role === "agent" && property.profiles?.id && (
        <div className="space-y-3 pt-4 border-t border-border">
          <MakeOfferForm propertyId={property.id} propertyTitle={property.title} askingPrice={property.price_usd} />
          <PropertyInquiryForm propertyId={property.id} propertyTitle={property.title} ownerId={property.profiles.id} ownerName={property.profiles.name || "Owner"} />
        </div>
      )}

      {/* Phone info */}
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

      {/* Hero Image */}
      <div className="relative h-[280px] md:h-[400px] lg:h-[480px] bg-card md:max-w-7xl md:mx-auto md:mt-6 md:rounded-2xl md:overflow-hidden">
        <Button variant="ghost" size="icon" className="absolute top-4 left-4 z-10 bg-card/80 backdrop-blur-sm rounded-full" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Button variant="ghost" size="icon" className="bg-card/80 backdrop-blur-sm rounded-full" onClick={handleShare}><Share2 className="h-5 w-5" /></Button>
          <Button variant="ghost" size="icon" className="bg-card/80 backdrop-blur-sm rounded-full" onClick={() => id && toggleFavorite(id)}>
            <Heart className={`h-5 w-5 ${id && isFavorite(id) ? "fill-red-500 text-red-500" : ""}`} />
          </Button>
        </div>
        {heroImage ? (
          <img src={heroImage} alt={property.title} className="w-full h-full object-cover cursor-pointer" onClick={() => setFullscreenImage(heroImage)} />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center"><MapPin className="h-12 w-12 text-muted-foreground" /></div>
        )}
      </div>

      {/* Desktop: Two-column layout */}
      <div className="md:max-w-7xl md:mx-auto md:px-6 md:mt-6 md:grid md:grid-cols-[1fr_380px] md:gap-8">
        {/* Main Content */}
        <div className="px-4 pt-4 md:px-0 md:pt-0">
          <div className="flex items-center gap-1 mb-1">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">{property.county}</p>
          </div>
          <div className="flex items-baseline gap-2 mb-1 md:hidden">
            <p className="text-primary text-2xl font-bold">
              ${property.price_usd.toLocaleString()}
              <span className="text-sm font-normal text-muted-foreground">{property.listing_type === 'for_rent' || property.listing_type === 'for_lease' ? '/month' : ''}</span>
            </p>
            <p className="text-xs text-muted-foreground">{formatLRD(property.price_usd)}</p>
          </div>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg md:text-2xl font-bold flex-1 leading-tight">{property.title}</h1>
            <Badge variant="secondary" className="text-xs ml-2 shrink-0">{LISTING_TYPE_LABELS[property.listing_type as keyof typeof LISTING_TYPE_LABELS]}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-6 text-xs text-muted-foreground">
            <span>On: {new Date(property.created_at).toLocaleDateString()}</span>
            <div className="flex items-center gap-1 text-primary"><CheckCircle className="h-3.5 w-3.5" /><span>Verified On: {new Date(property.updated_at).toLocaleDateString()}</span></div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {property.property_type && (<div className="bg-card border border-border rounded-xl p-4 flex flex-col items-center justify-center"><Grid3X3 className="h-6 w-6 mb-2 text-foreground" /><span className="text-sm capitalize">{property.property_type}</span></div>)}
            {property.bedrooms && (<div className="bg-card border border-border rounded-xl p-4 flex flex-col items-center justify-center"><Bed className="h-6 w-6 mb-2 text-foreground" /><span className="text-sm">{property.bedrooms} Bed</span></div>)}
            {property.bathrooms && (<div className="bg-card border border-border rounded-xl p-4 flex flex-col items-center justify-center"><Bath className="h-6 w-6 mb-2 text-foreground" /><span className="text-sm">{property.bathrooms} Bath</span></div>)}
          </div>

          {property.description && (<div className="mb-6"><h3 className="font-semibold mb-2 hidden md:block">Description</h3><p className="text-sm text-muted-foreground">{property.description}</p></div>)}

          {/* Promote & Report Actions */}
          <div className="flex items-center gap-2 mb-6">
            {user && property.owner_id === user.id && (
              <PromotePropertyDialog propertyId={property.id} propertyTitle={property.title} isOwner={true} />
            )}
            {user && property.owner_id !== user.id && (
              <ReportPropertyDialog propertyId={property.id} propertyTitle={property.title} />
            )}
          </div>

          {/* Photo Gallery */}
          {allPhotos.length > 1 && (
            <div className="mb-6">
              <div className="grid grid-cols-3 gap-2">
                {displayPhotos.slice(1, 3).map((photo: string, index: number) => (
                  <div key={index} className={`${index === 0 ? 'col-span-2 row-span-2' : 'col-span-1'} aspect-square rounded-xl overflow-hidden cursor-pointer`} onClick={() => setFullscreenImage(photo)}>
                    <img src={photo} alt={`Property ${index + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
                {displayPhotos.slice(3, 6).map((photo: string, index: number) => (
                  <div key={index + 2} className="aspect-square rounded-xl overflow-hidden cursor-pointer relative" onClick={() => setFullscreenImage(photo)}>
                    <img src={photo} alt={`Property ${index + 3}`} className="w-full h-full object-cover" />
                    {index === 2 && remainingCount > 0 && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
                        <span className="text-sm">See all Photos</span><span className="text-lg font-bold">({allPhotos.length})</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mobile Owner Section */}
          <div className="md:hidden mb-4">
            <h3 className="text-lg font-semibold mb-3">{property.profiles?.role === "agent" ? "Listed by Agent" : "Property Owner"}</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-16 h-16 rounded-full bg-card border border-border overflow-hidden">
                {displayPhoto ? (<img src={displayPhoto} alt={displayName} className="w-full h-full object-cover" />) : (<div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-xl font-semibold">{displayName?.charAt(0) || 'U'}</div>)}
              </div>
              <div>
                <p className="font-semibold text-lg">{displayName}</p>
                <p className="text-muted-foreground text-sm">{formatRole(property.profiles?.role || 'property_owner')}</p>
                {property.profiles?.verification_status === "approved" && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <ShieldCheck className={`h-4 w-4 ${property.profiles?.role === "agent" ? "text-blue-500" : "text-green-500"}`} />
                    <span className={`text-xs font-semibold ${property.profiles?.role === "agent" ? "text-blue-500" : "text-green-500"}`}>{property.profiles?.role === "agent" ? "Verified Agent" : "Verified Owner"}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile About Owner */}
          <Card className="mb-6 md:hidden">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">About the Owner</h3>
              <div className="space-y-3">
                <div className="flex"><span className="text-muted-foreground w-16">Name:</span><span className="font-medium">{property.profiles?.name || 'Unknown'}</span></div>
                <div className="flex"><span className="text-muted-foreground w-16">Role:</span><span className="font-medium">{formatRole(property.profiles?.role || 'property_owner')}</span></div>
                <div className="flex"><span className="text-muted-foreground w-16">Phone:</span><span className="font-medium">{property.contact_phone}</span></div>
                {property.contact_phone_2 && (<div className="flex"><span className="text-muted-foreground w-16">Phone 2:</span><span className="font-medium">{property.contact_phone_2}</span></div>)}
              </div>
              {property.profiles?.id && (
                <>
                  <div className="flex gap-2 mt-6">
                    <Button variant="outline" className="flex-1" onClick={() => navigate(`/profile/${property.profiles.id}`)}>View Full Profile</Button>
                    {property.profiles?.role === "agent" && <MakeOfferForm propertyId={property.id} propertyTitle={property.title} askingPrice={property.price_usd} />}
                  </div>
                  {property.profiles?.role === "agent" && (<div className="mt-3"><PropertyInquiryForm propertyId={property.id} propertyTitle={property.title} ownerId={property.profiles.id} ownerName={property.profiles.name || "Owner"} /></div>)}
                </>
              )}
            </CardContent>
          </Card>

          {/* Reviews */}
          {property.profiles?.id && property.profiles?.role === "agent" && (
            <div className="mb-6"><UserReviews userId={property.profiles.id} userName={property.profiles.name || "Owner"} propertyId={property.id} /></div>
          )}

          <RecommendedProperties currentPropertyId={property.id} county={property.county} propertyType={property.property_type} />
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <ContactSidebar />
        </div>
      </div>

      {/* Bottom Action Bar - Mobile Only */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-50">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-card border border-border overflow-hidden">
              {displayPhoto ? (<img src={displayPhoto} alt={displayName} className="w-full h-full object-cover" />) : (<div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">{displayName?.charAt(0) || 'U'}</div>)}
            </div>
            <div>
              <p className="font-medium text-sm">{displayName}</p>
              <p className="text-primary text-xs">{property.contact_phone}</p>
              {property.contact_phone_2 && <p className="text-primary text-xs">{property.contact_phone_2}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="rounded-full h-12 w-12 border-border" onClick={() => handleCall()}><Phone className="h-5 w-5" /></Button>
            <Button size="icon" className="rounded-full h-12 w-12 bg-primary text-primary-foreground" onClick={() => handleWhatsApp()}><MessageCircle className="h-5 w-5" /></Button>
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
