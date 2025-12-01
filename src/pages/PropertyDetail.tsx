import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, MessageCircle, Share2, Heart, MapPin, Bed, Bath, Grid3X3, ArrowLeft, CheckCircle } from "lucide-react";
import { LISTING_TYPE_LABELS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  useEffect(() => {
    fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    const { data: propertyData } = await supabase
      .from("properties")
      .select("*")
      .eq("id", id)
      .single();

    if (propertyData) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, name, email, phone, profile_photo_url, role")
        .eq("id", propertyData.owner_id)
        .maybeSingle();

      setProperty({
        ...propertyData,
        profiles: profileData || null
      });
    }
    setLoading(false);
  };

  const handleCall = () => {
    window.location.href = `tel:${property.contact_phone}`;
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/${property.contact_phone.replace(/\D/g, '')}`, '_blank');
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

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Map Header Section */}
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
          <Button variant="ghost" size="icon" className="bg-card/80 backdrop-blur-sm rounded-full">
            <Heart className="h-5 w-5" />
          </Button>
        </div>

        {/* Map Placeholder */}
        <div className="w-full h-full bg-card flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <div className="w-full h-full" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath opacity='.5' d='M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9zm-1 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>
          
          {/* Location Pin */}
          <div className="bg-muted/80 rounded-full p-3">
            <MapPin className="h-6 w-6 text-foreground" />
          </div>

          {/* Street View Button */}
          <Button 
            variant="secondary" 
            size="sm" 
            className="absolute bottom-4 left-4 gap-2 rounded-full bg-card/80 backdrop-blur-sm"
          >
            <MapPin className="h-4 w-4" />
            Street View
          </Button>
        </div>
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
              <span className="text-sm">{property.bedrooms} Bhk</span>
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
        {allPhotos.length > 0 && (
          <div className="mb-6">
            <div className="grid grid-cols-3 gap-2">
              {/* Main large images */}
              {displayPhotos.slice(0, 2).map((photo: string, index: number) => (
                <div 
                  key={index}
                  className={`${index === 0 ? 'col-span-2 row-span-2' : 'col-span-1'} aspect-square rounded-xl overflow-hidden cursor-pointer`}
                  onClick={() => setFullscreenImage(photo)}
                >
                  <img src={photo} alt={`Property ${index + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
              
              {/* Smaller thumbnails */}
              {displayPhotos.slice(2, 5).map((photo: string, index: number) => (
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

        {/* Builder Information */}
        <div className="mb-4">
          <h3 className="text-sm text-muted-foreground mb-3">Builder information</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-card border border-border overflow-hidden">
                {property.profiles?.profile_photo_url ? (
                  <img 
                    src={property.profiles.profile_photo_url} 
                    alt={property.profiles?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-lg font-semibold">
                    {property.profiles?.name?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              <div>
                <p className="font-semibold">{property.profiles?.name || 'Unknown'}</p>
                <p className="text-primary text-sm">{property.contact_phone}</p>
              </div>
            </div>
          </div>
        </div>
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
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full h-12 w-12 border-border"
              onClick={handleCall}
            >
              <Phone className="h-5 w-5" />
            </Button>
            <Button 
              size="icon" 
              className="rounded-full h-12 w-12 bg-primary text-primary-foreground"
              onClick={handleWhatsApp}
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
