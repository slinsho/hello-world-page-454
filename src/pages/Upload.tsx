import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Home, Building2, Store, Upload as UploadIcon, X, ArrowLeft, Camera, Video, FileText, MapPin, Phone, DollarSign, BedDouble, Bath, Ruler, ChevronRight } from "lucide-react";
import { LIBERIA_COUNTIES } from "@/lib/constants";
import { z } from "zod";

const uploadSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  property_type: z.enum(["house", "apartment", "shop"]),
  listing_type: z.enum(["for_sale", "for_rent", "for_lease"]),
  price_usd: z.number().positive("Price must be greater than 0"),
  address: z.string().min(5, "Address must be at least 5 characters").max(500),
  county: z.string().min(1, "County is required"),
  contact_phone: z.string().min(5, "Phone number is required").max(20),
  contact_phone_2: z.string().max(20).optional(),
  description: z.string().optional(),
});

const Upload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [propertyCount, setPropertyCount] = useState(0);
  const [photos, setPhotos] = useState<File[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    property_type: "house",
    listing_type: "for_sale",
    price_usd: "",
    address: "",
    county: "",
    contact_phone: "",
    contact_phone_2: "",
    bedrooms: "",
    bathrooms: "",
    square_yards: "",
    description: "",
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const checkVerificationAndRole = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("verification_status, role, phone, contact_phone_2")
        .eq("id", user.id)
        .single();

      if (data) {
        setVerificationStatus(data.verification_status);
        setUserRole(data.role);
        // Auto-fill phone numbers from profile (non-editable for owners)
        if (data.phone) {
          setFormData(prev => ({ ...prev, contact_phone: data.phone || "" }));
        }
        if (data.contact_phone_2) {
          setFormData(prev => ({ ...prev, contact_phone_2: data.contact_phone_2 || "" }));
        }
      }

      // Count user's existing properties
      const { count } = await supabase
        .from("properties")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", user.id);
      
      setPropertyCount(count || 0);
    };

    checkVerificationAndRole();
  }, [user, navigate]);

  const isOwner = userRole === "property_owner";
  const ownerAtLimit = isOwner && propertyCount >= 2;

  // Show upgrade immediately for owners at limit - before verification check
  if (ownerAtLimit && verificationStatus !== null) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="px-4 pt-16 text-center max-w-sm mx-auto">
          <div className="h-20 w-20 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-6">
            <Building2 className="h-10 w-10 text-blue-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">Property Limit Reached</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Owner accounts can list up to 2 properties. To upload more, upgrade to an Agent account.
          </p>
          <p className="text-xs text-muted-foreground mb-6">
            You can also delete an existing property to make room for a new one.
          </p>
          <div className="space-y-3">
            <Button 
              onClick={() => navigate("/verification?upgrade=agent")} 
              className="w-full rounded-full"
            >
              Upgrade to Agent
            </Button>
            <Button variant="outline" onClick={() => navigate("/profile")} className="w-full rounded-full">
              Manage My Properties
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPhotos((prev) => [...prev, ...files].slice(0, 10));
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const file = files[0];
    
    const validFormats = ['video/mp4', 'video/quicktime'];
    if (!validFormats.includes(file.type)) {
      toast({ title: "Invalid Format", description: "Only MP4 and MOV video formats are allowed.", variant: "destructive" });
      e.target.value = '';
      return;
    }
    
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ title: "File Too Large", description: "Video size must be 10MB or less.", variant: "destructive" });
      e.target.value = '';
      return;
    }
    
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = function() {
      window.URL.revokeObjectURL(video.src);
      if (video.duration > 20) {
        toast({ title: "Video Too Long", description: "Video must be 20 seconds or less.", variant: "destructive" });
        e.target.value = '';
        return;
      }
      setVideos([file]);
    };
    video.onerror = function() {
      toast({ title: "Error", description: "Failed to load video file.", variant: "destructive" });
      e.target.value = '';
    };
    video.src = URL.createObjectURL(file);
  };

  const removeVideo = (index: number) => {
    setVideos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!agreed) {
      toast({ title: "Agreement Required", description: "Please agree to the terms before listing.", variant: "destructive" });
      return;
    }

    if (verificationStatus !== "approved") {
      toast({ title: "Verification Required", description: "You must be verified to upload properties.", variant: "destructive" });
      navigate("/profile");
      return;
    }

    if (photos.length === 0) {
      toast({ title: "Photos Required", description: "Please upload at least one photo.", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const validatedData = uploadSchema.parse({
        ...formData,
        price_usd: parseFloat(formData.price_usd),
        contact_phone_2: formData.contact_phone_2 || undefined,
      });

      const photoUrls = await Promise.all(
        photos.map(async (photo) => {
          const fileExt = photo.name.split(".").pop();
          const fileName = `${user.id}/${Date.now()}-${Math.random()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from("property-photos").upload(fileName, photo);
          if (uploadError) throw uploadError;
          const { data: { publicUrl } } = supabase.storage.from("property-photos").getPublicUrl(fileName);
          return publicUrl;
        })
      );

      const videoUrls = await Promise.all(
        videos.map(async (video) => {
          const fileExt = video.name.split(".").pop();
          const fileName = `${user.id}/videos/${Date.now()}-${Math.random()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from("property-photos").upload(fileName, video);
          if (uploadError) throw uploadError;
          const { data: { publicUrl } } = supabase.storage.from("property-photos").getPublicUrl(fileName);
          return publicUrl;
        })
      );

      const { error } = await supabase.from("properties").insert([{
        owner_id: user.id,
        title: validatedData.title,
        property_type: validatedData.property_type,
        listing_type: validatedData.listing_type,
        price_usd: validatedData.price_usd,
        address: validatedData.address,
        county: validatedData.county,
        contact_phone: validatedData.contact_phone,
        contact_phone_2: validatedData.contact_phone_2 || null,
        photos: photoUrls,
        videos: videoUrls,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
        square_yards: formData.square_yards ? parseInt(formData.square_yards) : null,
        description: validatedData.description || null,
      }]);

      if (error) throw error;

      toast({ title: "Success!", description: "Your property has been listed." });
      navigate("/profile");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({ title: "Validation Error", description: error.errors[0].message, variant: "destructive" });
      } else {
        toast({ title: "Error", description: error.message || "Failed to upload property", variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  if (verificationStatus !== "approved") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="px-4 pt-16 text-center max-w-sm mx-auto">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <FileText className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2">Verification Required</h2>
          <p className="text-sm text-muted-foreground mb-6">
            You need to be verified before you can upload properties.
          </p>
          <Button onClick={() => navigate("/profile")} className="rounded-full px-8">
            Go to Profile
          </Button>
        </div>
      </div>
    );
  }

  // ownerAtLimit already handled above before verification check

  const propertyTypes = [
    { value: "house", label: "House", icon: Home },
    { value: "apartment", label: "Apartment", icon: Building2 },
    { value: "shop", label: "Shop", icon: Store },
  ];

  const listingTypes = [
    { value: "for_sale", label: "For Sale" },
    { value: "for_rent", label: "For Rent" },
    { value: "for_lease", label: "For Lease" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Navbar />
      
      <main className="max-w-lg mx-auto px-4 pt-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">List Property</h1>
            <p className="text-xs text-muted-foreground">Add your property details</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Property Type Selection */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Property Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {propertyTypes.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData({ ...formData, property_type: value })}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                    formData.property_type === value
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-muted-foreground/30"
                  }`}
                >
                  <Icon className={`h-6 w-6 ${formData.property_type === value ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-xs font-medium ${formData.property_type === value ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Listing Type Pills */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Listing Type</Label>
            <div className="flex gap-2">
              {listingTypes.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData({ ...formData, listing_type: value })}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    formData.listing_type === value
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-muted-foreground hover:border-muted-foreground/30"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Property Title</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              maxLength={200}
              placeholder="e.g., Modern 3-Bedroom House"
              className="rounded-xl h-12"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Description <span className="text-muted-foreground font-normal">(Optional)</span></Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the property features..."
              rows={3}
              className="resize-none rounded-xl"
            />
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              Price (USD)
            </Label>
            <Input
              type="number"
              step="0.01"
              value={formData.price_usd}
              onChange={(e) => setFormData({ ...formData, price_usd: e.target.value })}
              required
              placeholder="0.00"
              className="rounded-xl h-12"
            />
          </div>

          {/* Location */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Location
            </Label>
            <Select
              value={formData.county}
              onValueChange={(value) => setFormData({ ...formData, county: value })}
            >
              <SelectTrigger className="rounded-xl h-12">
                <SelectValue placeholder="Select county" />
              </SelectTrigger>
              <SelectContent>
                {LIBERIA_COUNTIES.map((county) => (
                  <SelectItem key={county} value={county}>{county}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
              maxLength={500}
              placeholder="Full address"
              className="rounded-xl h-12"
            />
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              Contact
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="tel"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                required
                maxLength={20}
                placeholder="Phone 1 *"
                className="rounded-xl h-12"
              />
              <Input
                type="tel"
                value={formData.contact_phone_2}
                onChange={(e) => setFormData({ ...formData, contact_phone_2: e.target.value })}
                maxLength={20}
                placeholder="Phone 2"
                className="rounded-xl h-12"
              />
            </div>
          </div>

          {/* Details Row */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Property Details</Label>
            <div className="grid grid-cols-3 gap-3">
              <div className="relative">
                <BedDouble className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  min="0"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                  placeholder="Beds"
                  className="rounded-xl h-12 pl-10"
                />
              </div>
              <div className="relative">
                <Bath className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  min="0"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                  placeholder="Baths"
                  className="rounded-xl h-12 pl-10"
                />
              </div>
              <div className="relative">
                <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  min="0"
                  value={formData.square_yards}
                  onChange={(e) => setFormData({ ...formData, square_yards: e.target.value })}
                  placeholder="Sq yd"
                  className="rounded-xl h-12 pl-10"
                />
              </div>
            </div>
          </div>

          {/* Photos */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Camera className="h-4 w-4 text-muted-foreground" />
              Photos <span className="text-muted-foreground font-normal">({photos.length}/10)</span>
            </Label>
            <div className="border-2 border-dashed border-border rounded-2xl p-6 text-center bg-card">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoChange}
                className="hidden"
                id="photo-upload"
                disabled={photos.length >= 10}
              />
              <label htmlFor="photo-upload" className="cursor-pointer flex flex-col items-center gap-2">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Camera className="h-6 w-6 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">Tap to add photos</span>
              </label>
            </div>

            {photos.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {photos.map((photo, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden">
                    <img src={URL.createObjectURL(photo)} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      className="absolute top-1 right-1 h-6 w-6 rounded-full bg-destructive flex items-center justify-center"
                      onClick={() => removePhoto(index)}
                    >
                      <X className="h-3 w-3 text-destructive-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Video */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Video className="h-4 w-4 text-muted-foreground" />
              Video <span className="text-muted-foreground font-normal">(Optional, Max 1)</span>
            </Label>
            <p className="text-xs text-muted-foreground">Max 20 seconds · MP4 or MOV · 10MB max</p>
            <div className="border-2 border-dashed border-border rounded-2xl p-6 text-center bg-card">
              <input
                type="file"
                accept="video/mp4,video/quicktime"
                onChange={handleVideoChange}
                className="hidden"
                id="video-upload"
                disabled={videos.length >= 1}
              />
              <label htmlFor="video-upload" className="cursor-pointer flex flex-col items-center gap-2">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Video className="h-6 w-6 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">Tap to add video</span>
              </label>
            </div>

            {videos.length > 0 && (
              <div className="relative rounded-2xl overflow-hidden">
                <video src={URL.createObjectURL(videos[0])} className="w-full h-48 object-cover rounded-2xl" controls />
                <button
                  type="button"
                  className="absolute top-2 right-2 h-7 w-7 rounded-full bg-destructive flex items-center justify-center"
                  onClick={() => removeVideo(0)}
                >
                  <X className="h-4 w-4 text-destructive-foreground" />
                </button>
              </div>
            )}
          </div>

          {/* Agreement Checkbox */}
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="flex items-start gap-3">
              <Checkbox
                id="agreement"
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked === true)}
                className="mt-0.5"
              />
              <label htmlFor="agreement" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                I confirm that I am the rightful owner or authorized agent of this property. The information provided is accurate and I agree to the{" "}
                <span className="text-primary cursor-pointer" onClick={() => navigate("/terms")}>
                  Terms & Conditions
                </span>.
              </label>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full h-14 rounded-2xl text-base font-semibold"
            disabled={loading || !agreed}
          >
            {loading ? "Uploading..." : "List Property"}
          </Button>
        </form>
      </main>
    </div>
  );
};

export default Upload;
