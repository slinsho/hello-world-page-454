import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, MessageCircle, Share2, Home, Building2, Store, MapPin, Bed, Bath, User } from "lucide-react";
import { LISTING_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const PropertyDetail = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
      // Fetch owner profile separately
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, name, email, phone, profile_photo_url, role")
        .eq("id", propertyData.owner_id)
        .single();

      setProperty({
        ...propertyData,
        profiles: profileData
      });
    }
    setLoading(false);
  };

  const handleCall = () => {
    window.location.href = `tel:${property.contact_phone}`;
  };

  const handleMessage = () => {
    window.location.href = `sms:${property.contact_phone}`;
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
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-16">Loading...</div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Property Not Found</h2>
          <Button asChild>
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const TypeIcon = {
    house: Home,
    apartment: Building2,
    shop: Store,
  }[property.property_type];

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar />
      
      <main className="container py-0 md:py-8 max-w-4xl px-0 md:px-4">
        {/* Photos Carousel */}
        <div className="mb-4 md:mb-8 px-0 md:px-0">
          {property.photos && property.photos.length > 0 ? (
            <>
              <Carousel className="w-full" opts={{ startIndex: currentImageIndex }}>
                <CarouselContent>
                  {property.photos.map((photo: string, index: number) => (
                    <CarouselItem key={index}>
                      <div className="aspect-video bg-muted md:rounded-lg overflow-hidden">
                        <img
                          src={photo}
                          alt={`${property.title} - ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {property.photos.length > 1 && (
                  <>
                    <CarouselPrevious className="hidden md:flex" />
                    <CarouselNext className="hidden md:flex" />
                  </>
                )}
              </Carousel>
              
              {/* Thumbnail Navigation - Mobile Only */}
              {property.photos.length > 1 && (
                <div className="flex gap-2 mt-3 px-4 overflow-x-auto pb-2 md:hidden">
                  {property.photos.map((photo: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        currentImageIndex === index
                          ? "border-primary ring-1 ring-primary"
                          : "border-border opacity-60"
                      }`}
                    >
                      <img
                        src={photo}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="aspect-video bg-muted md:rounded-lg flex items-center justify-center">
              <TypeIcon className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Property Details */}
        <div className="px-4 md:px-0">
          <Card className="border-0 md:border shadow-none md:shadow-sm">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-2">
                    <h1 className="text-2xl md:text-3xl font-bold leading-tight">{property.title}</h1>
                    <TypeIcon className="h-5 w-5 md:h-6 md:w-6 text-primary shrink-0 mt-1" />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {LISTING_TYPE_LABELS[property.listing_type as keyof typeof LISTING_TYPE_LABELS]}
                    </Badge>
                    <Badge className={STATUS_COLORS[property.status as keyof typeof STATUS_COLORS] + " text-xs"}>
                      {STATUS_LABELS[property.status as keyof typeof STATUS_LABELS]}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Price - Prominent on mobile */}
              <div className="mb-6 pb-4 border-b">
                <p className="text-3xl md:text-3xl font-bold text-primary">
                  ${property.price_usd.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {property.listing_type === 'for_rent' ? 'per month' : property.listing_type === 'for_lease' ? 'lease price' : 'total price'}
                </p>
              </div>

              <div className="space-y-5">
                {/* Location */}
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-base break-words">{property.address}</p>
                    <p className="text-sm text-muted-foreground">{property.county}</p>
                  </div>
                </div>

                {/* Bedrooms & Bathrooms */}
                {(property.bedrooms || property.bathrooms) && (
                  <div className="flex gap-6">
                    {property.bedrooms && (
                      <div className="flex items-center gap-2">
                        <Bed className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm md:text-base font-medium">{property.bedrooms} Bed{property.bedrooms > 1 ? 's' : ''}</span>
                      </div>
                    )}
                    {property.bathrooms && (
                      <div className="flex items-center gap-2">
                        <Bath className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm md:text-base font-medium">{property.bathrooms} Bath{property.bathrooms > 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Description */}
                {property.description && (
                  <div className="border-t pt-5">
                    <h3 className="font-semibold text-base mb-3">Description</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {property.description}
                    </p>
                  </div>
                )}

                {/* Contact Information */}
                <div className="border-t pt-5">
                  <h3 className="font-semibold text-base mb-3">Contact Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${property.contact_phone}`} className="text-primary hover:underline font-medium">
                        {property.contact_phone}
                      </a>
                    </div>
                    {property.contact_phone_2 && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${property.contact_phone_2}`} className="text-primary hover:underline font-medium">
                          {property.contact_phone_2}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Owner Profile */}
                <div className="border-t pt-5">
                  <h3 className="font-semibold text-base mb-3">Property Owner</h3>
                  {property.profiles ? (
                    <Link
                      to={`/profile`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors -mx-1"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        {property.profiles.profile_photo_url ? (
                          <img 
                            src={property.profiles.profile_photo_url} 
                            alt={property.profiles.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-base">{property.profiles.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">{property.profiles.role || 'Property Owner'}</p>
                      </div>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3 p-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <p className="text-muted-foreground text-sm">Owner information not available</p>
                    </div>
                  )}
                </div>
              </div>
          </CardContent>
        </Card>

        {/* Owner Profile Card */}
        {property.profiles && (
          <Card className="mt-4">
            <CardContent className="p-4 md:p-6">
              <h3 className="font-semibold mb-4 text-base">About the Owner</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Name: <span className="text-foreground font-medium">{property.profiles.name}</span></p>
                <p>Role: <span className="text-foreground font-medium capitalize">{property.profiles.role || 'Property Owner'}</span></p>
                {property.profiles.phone && (
                  <p>Phone: <span className="text-foreground font-medium">{property.profiles.phone}</span></p>
                )}
              </div>
              <Button asChild variant="outline" className="w-full mt-4">
                <Link to="/profile">View Full Profile</Link>
              </Button>
            </CardContent>
          </Card>
        )}
        </div>
      </main>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/98 backdrop-blur-md border-t p-3 md:p-4 shadow-lg z-50">
        <div className="container max-w-4xl px-4">
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            <Button onClick={handleCall} className="gap-2 h-12 md:h-11" size="lg">
              <Phone className="h-5 w-5" />
              <span className="text-sm md:text-base font-semibold">Call</span>
            </Button>
            <Button onClick={handleMessage} variant="outline" className="gap-2 h-12 md:h-11" size="lg">
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm md:text-base font-semibold">Message</span>
            </Button>
            <Button onClick={handleShare} variant="outline" className="gap-2 h-12 md:h-11" size="lg">
              <Share2 className="h-5 w-5" />
              <span className="text-sm md:text-base font-semibold">Share</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;
