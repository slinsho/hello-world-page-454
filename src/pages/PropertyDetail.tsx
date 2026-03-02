import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useFavorites } from "@/hooks/useFavorites";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, MessageCircle, Share2, Heart, MapPin, Bed, Bath, Grid3X3, ArrowLeft, CheckCircle, GitCompare, ShieldCheck } from "lucide-react";
import { LISTING_TYPE_LABELS, formatLRD, formatWhatsAppLink } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import RecommendedProperties from "@/components/RecommendedProperties";
import { PropertyInquiryForm } from "@/components/PropertyInquiryForm";
import { MakeOfferForm } from "@/components/MakeOfferForm";
import { UserReviews } from "@/components/UserReviews";
import { SEOHead } from "@/components/SEOHead";
import { PropertyJsonLd } from "@/components/PropertyJsonLd";
import { trackPropertyView } from "@/lib/analytics";

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { addToRecentlyViewed } = useRecentlyViewed();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  useEffect(() => {
    fetchProperty();
  }, [id]);

  // Track view and add to recently viewed
  useEffect(() => {
    if (id && property) {
      trackPropertyView(id, user?.id);
      addToRecentlyViewed(id);
    }
  }, [id, property, user?.id]);

  const fetchProperty = async () => {
    const { data: propertyData } = await supabase
      .from("properties")
      .select("*")
      .eq("id", id)
      .single();

    if (propertyData) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, name, email, phone, profile_photo_url, role, verification_status")
        .eq("id", propertyData.owner_id)
        .maybeSingle();

      setProperty({
        ...propertyData,
        profiles: profileData || null
      });
    }
    setLoading(false);
  };

  const handleCall = (phoneNumber?: string) => {
    const phone = phoneNumber || property.contact_phone;
    window.location.href = `tel:${phone}`;
  };

  const handleWhatsApp = (phoneNumber?: string) => {
    const phone = phoneNumber || property.contact_phone;
    const msg = `Hi, I'm interested in your property "${property.title}" listed at $${property.price_usd.toLocaleString()} (${formatLRD(property.price_usd)}) in ${property.county}.`;
    window.open(formatWhatsAppLink(phone, msg), '_blank');
  };

  const handleShare = async () => {
    const shareData = {
      title: property.title,
      text: `Check out this property: ${property.title}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Property link copied to clipboard",
      });
    }
  };

  const formatRole = (role: string) => {
    if (role === 'property_owner') return 'Property Owner';
    if (role === 'agent') return 'Agent';
    return role;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-bold">Property Not Found</h2>
        <Button onClick={() => navigate("/")}>Go Home</Button>
      </div>
    );
  }

  const allPhotos = property.photos || [];
  const displayPhotos = allPhotos.slice(0, 5);
  const remainingCount = allPhotos.length - 5;
  const heroImage = allPhotos[0];

  return (
    <div className="min-h-screen bg-background pb-28">
      <SEOHead
        title={`${property.title} - ${property.county}`}
        description={property.description || `${property.property_type} ${property.listing_type === 'for_rent' ? 'for rent' : 'for sale'} in ${property.county} at $${property.price_usd.toLocaleString()}`}
        ogImage={property.photos?.[0]}
        ogType="article"
        canonical={`${window.location.origin}/property/${property.id}`}
      />
      <PropertyJsonLd property={property} />
      <div className="relative h-[280px] bg-card">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-4 left-4 z-10 bg-card/80 backdrop-blur-sm rounded-full"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {/* Share and Favorite Buttons */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="bg-card/80 backdrop-blur-sm rounded-full"
            onClick={handleShare}
          >
            <Share2 className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="bg-card/80 backdrop-blur-sm rounded-full"
            onClick={() => id && toggleFavorite(id)}
          >
            <Heart className={`h-5 w-5 ${id && isFavorite(id) ? "fill-red-500 text-red-500" : ""}`} />
          </Button>
        </div>

        {/* Hero Image */}
        {heroImage ? (
          <img 
            src={heroImage} 
            alt={property.title}
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => setFullscreenImage(heroImage)}
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <MapPin className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Property Info */}
      <div className="px-4 pt-4">
        {/* Location and Price Row */}
        <div className="flex items-start justify-between mb-2">
          <p className="text-muted-foreground text-sm">{property.county}</p>
          <p className="text-primary text-xl font-bold">
            ${property.price_usd.toLocaleString()}
            <span className="text-sm font-normal text-muted-foreground">
              {property.listing_type === 'for_rent' || property.listing_type === 'for_lease' ? '/month' : ''}
            </span>
          </p>
          <p className="text-xs text-muted-foreground">{formatLRD(property.price_usd)}</p>
        </div>

        {/* Title Row */}
        <div className="flex items-start justify-between mb-1">
          <h1 className="text-xl font-bold flex-1">{property.title}</h1>
          <Badge variant="secondary" className="text-xs ml-2">
            {LISTING_TYPE_LABELS[property.listing_type as keyof typeof LISTING_TYPE_LABELS]}
          </Badge>
        </div>

        {/* Date and Verification */}
        <div className="flex items-center gap-4 mb-6 text-sm text-muted-foreground">
          <span>On: {new Date(property.created_at).toLocaleDateString()}</span>
          <div className="flex items-center gap-1 text-primary">
            <CheckCircle className="h-4 w-4" />
            <span>Verified On: {new Date(property.updated_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {property.property_type && (
            <div className="bg-card border border-border rounded-xl p-4 flex flex-col items-center justify-center">
              <Grid3X3 className="h-6 w-6 mb-2 text-foreground" />
              <span className="text-sm capitalize">{property.property_type}</span>
            </div>
          )}
          {property.bedrooms && (
            <div className="bg-card border border-border rounded-xl p-4 flex flex-col items-center justify-center">
              <Bed className="h-6 w-6 mb-2 text-foreground" />
              <span className="text-sm">{property.bedrooms} Bed</span>
            </div>
          )}
          {property.bathrooms && (
            <div className="bg-card border border-border rounded-xl p-4 flex flex-col items-center justify-center">
              <Bath className="h-6 w-6 mb-2 text-foreground" />
              <span className="text-sm">{property.bathrooms} Bath</span>
            </div>
          )}
        </div>

        {/* Description */}
        {property.description && (
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">{property.description}</p>
          </div>
        )}

        {/* Photo Gallery */}
        {allPhotos.length > 1 && (
          <div className="mb-6">
            <div className="grid grid-cols-3 gap-2">
              {/* Main large images */}
              {displayPhotos.slice(1, 3).map((photo: string, index: number) => (
                <div 
                  key={index}
                  className={`${index === 0 ? 'col-span-2 row-span-2' : 'col-span-1'} aspect-square rounded-xl overflow-hidden cursor-pointer`}
                  onClick={() => setFullscreenImage(photo)}
                >
                  <img src={photo} alt={`Property ${index + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
              
              {/* Smaller thumbnails */}
              {displayPhotos.slice(3, 6).map((photo: string, index: number) => (
                <div 
                  key={index + 2}
                  className="aspect-square rounded-xl overflow-hidden cursor-pointer relative"
                  onClick={() => setFullscreenImage(photo)}
                >
                  <img src={photo} alt={`Property ${index + 3}`} className="w-full h-full object-cover" />
                  {index === 2 && remainingCount > 0 && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
                      <span className="text-sm">See all Photos</span>
                      <span className="text-lg font-bold">({allPhotos.length})</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Property Owner Section */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-3">
            {property.profiles?.role === "agent" ? "Listed by Agent" : "Property Owner"}
          </h3>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-16 h-16 rounded-full bg-card border border-border overflow-hidden">
              {property.profiles?.profile_photo_url ? (
                <img 
                  src={property.profiles.profile_photo_url} 
                  alt={property.profiles?.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-xl font-semibold">
                  {property.profiles?.name?.charAt(0) || 'U'}
                </div>
              )}
            </div>
            <div>
              <p className="font-semibold text-lg">{property.profiles?.name || 'Unknown'}</p>
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
        </div>

        {/* About the Owner Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">About the Owner</h3>
            
            <div className="space-y-3">
              <div className="flex">
                <span className="text-muted-foreground w-16">Name:</span>
                <span className="font-medium">{property.profiles?.name || 'Unknown'}</span>
              </div>
              
              <div className="flex">
                <span className="text-muted-foreground w-16">Role:</span>
                <span className="font-medium">{formatRole(property.profiles?.role || 'property_owner')}</span>
              </div>
              
              <div className="flex">
                <span className="text-muted-foreground w-16">Phone:</span>
                <span className="font-medium">{property.contact_phone}</span>
              </div>

              {property.contact_phone_2 && (
                <div className="flex">
                  <span className="text-muted-foreground w-16">Phone 2:</span>
                  <span className="font-medium">{property.contact_phone_2}</span>
                </div>
              )}
            </div>

            {property.profiles?.id && (
              <>
                <div className="flex gap-2 mt-6">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => navigate(`/profile/${property.profiles.id}`)}
                  >
                    View Full Profile
                  </Button>
                  {property.profiles?.role === "agent" && (
                    <MakeOfferForm
                      propertyId={property.id}
                      propertyTitle={property.title}
                      askingPrice={property.price_usd}
                    />
                  )}
                </div>
                {property.profiles?.role === "agent" && (
                  <div className="mt-3">
                    <PropertyInquiryForm
                      propertyId={property.id}
                      propertyTitle={property.title}
                      ownerId={property.profiles.id}
                      ownerName={property.profiles.name || "Owner"}
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Reviews Section - only for agent properties */}
        {property.profiles?.id && property.profiles?.role === "agent" && (
          <div className="mb-6">
            <UserReviews
              userId={property.profiles.id}
              userName={property.profiles.name || "Owner"}
              propertyId={property.id}
            />
          </div>
        )}

        {/* Recommended Section */}
        <RecommendedProperties 
          currentPropertyId={property.id} 
          county={property.county}
          propertyType={property.property_type}
        />
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-50">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-card border border-border overflow-hidden">
              {property.profiles?.profile_photo_url ? (
                <img 
                  src={property.profiles.profile_photo_url} 
                  alt={property.profiles?.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                  {property.profiles?.name?.charAt(0) || 'U'}
                </div>
              )}
            </div>
            <div>
              <p className="font-medium text-sm">{property.profiles?.name || 'Unknown'}</p>
              <p className="text-primary text-xs">{property.contact_phone}</p>
              {property.contact_phone_2 && (
                <p className="text-primary text-xs">{property.contact_phone_2}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full h-12 w-12 border-border"
              onClick={() => handleCall()}
            >
              <Phone className="h-5 w-5" />
            </Button>
            <Button 
              size="icon" 
              className="rounded-full h-12 w-12 bg-primary text-primary-foreground"
              onClick={() => handleWhatsApp()}
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Dialog */}
      <Dialog open={!!fullscreenImage} onOpenChange={() => setFullscreenImage(null)}>
        <DialogContent className="max-w-full h-full w-full p-0 border-0 bg-black/95">
          <div className="flex items-center justify-center h-full w-full p-4">
            {fullscreenImage && (
              <img
                src={fullscreenImage}
                alt="Fullscreen view"
                className="max-h-full max-w-full object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertyDetail;
