import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Home, Building2, Store, Upload as UploadIcon, X } from "lucide-react";
import { LIBERIA_COUNTIES } from "@/lib/constants";
import { z } from "zod";

const uploadSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  property_type: z.enum(["house", "apartment", "land", "commercial"]),
  listing_type: z.enum(["for_sale", "for_rent"]),
  price_usd: z.number().positive("Price must be greater than 0"),
  address: z.string().min(5, "Address must be at least 5 characters").max(500),
  county: z.string().min(1, "County is required"),
  contact_phone: z.string().min(5, "Phone number is required").max(20),
  contact_phone_2: z.string().max(20).optional(),
});

const Upload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
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
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const checkVerification = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("verification_status")
        .eq("id", user.id)
        .single();

      if (data) {
        setVerificationStatus(data.verification_status);
      }
    };

    checkVerification();
  }, [user, navigate]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPhotos((prev) => [...prev, ...files].slice(0, 10));
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (verificationStatus !== "approved") {
      toast({
        title: "Verification Required",
        description: "You must be verified to upload properties.",
        variant: "destructive",
      });
      navigate("/profile");
      return;
    }

    if (photos.length === 0) {
      toast({
        title: "Photos Required",
        description: "Please upload at least one photo.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const validatedData = uploadSchema.parse({
        ...formData,
        price_usd: parseFloat(formData.price_usd),
        contact_phone_2: formData.contact_phone_2 || undefined,
      });

      // Upload photos
      const photoUrls: string[] = [];
      for (const photo of photos) {
        const fileExt = photo.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("property-photos")
          .upload(fileName, photo);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("property-photos")
          .getPublicUrl(fileName);

        photoUrls.push(publicUrl);
      }

      // Create property
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
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
      }]);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your property has been listed.",
      });
      navigate("/profile");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to upload property",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (verificationStatus !== "approved") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Verification Required</h2>
          <p className="text-muted-foreground mb-6">
            You need to be verified before you can upload properties.
          </p>
          <Button onClick={() => navigate("/profile")}>Go to Profile</Button>
        </div>
      </div>
    );
  }

  const TypeIcon = {
    house: Home,
    apartment: Building2,
    land: Home,
    commercial: Store,
  }[formData.property_type as "house" | "apartment" | "land" | "commercial"];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container py-8 max-w-2xl px-4 md:px-4">
        <Card>
          <CardHeader>
            <CardTitle>List a Property</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Property Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  maxLength={200}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Property Type *</Label>
                  <Select
                    value={formData.property_type}
                    onValueChange={(value) => setFormData({ ...formData, property_type: value })}
                  >
                    <SelectTrigger>
                      <div className="flex items-center gap-2">
                        <TypeIcon className="h-4 w-4" />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="house">
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4" />
                          House
                        </div>
                      </SelectItem>
                      <SelectItem value="apartment">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Apartment
                        </div>
                      </SelectItem>
                      <SelectItem value="land">
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4" />
                          Land
                        </div>
                      </SelectItem>
                      <SelectItem value="commercial">
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4" />
                          Commercial
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Listing Type *</Label>
                  <Select
                    value={formData.listing_type}
                    onValueChange={(value) => setFormData({ ...formData, listing_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="for_sale">For Sale</SelectItem>
                      <SelectItem value="for_rent">For Rent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (USD) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price_usd}
                  onChange={(e) => setFormData({ ...formData, price_usd: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                  maxLength={500}
                />
              </div>

              <div className="space-y-2">
                <Label>County *</Label>
                <Select
                  value={formData.county}
                  onValueChange={(value) => setFormData({ ...formData, county: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select county" />
                  </SelectTrigger>
                  <SelectContent>
                    {LIBERIA_COUNTIES.map((county) => (
                      <SelectItem key={county} value={county}>
                        {county}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact">Contact Phone 1 *</Label>
                  <Input
                    id="contact"
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    required
                    maxLength={20}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact2">Contact Phone 2 (Optional)</Label>
                  <Input
                    id="contact2"
                    type="tel"
                    value={formData.contact_phone_2}
                    onChange={(e) => setFormData({ ...formData, contact_phone_2: e.target.value })}
                    maxLength={20}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bedrooms">Bedrooms (Optional)</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    min="0"
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bathrooms">Bathrooms (Optional)</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    min="0"
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Photos * (Max 10)</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoChange}
                    className="hidden"
                    id="photo-upload"
                    disabled={photos.length >= 10}
                  />
                  <label
                    htmlFor="photo-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <UploadIcon className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Click to upload photos ({photos.length}/10)
                    </span>
                  </label>
                </div>

                {photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={() => removePhoto(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Uploading..." : "List Property"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Upload;
