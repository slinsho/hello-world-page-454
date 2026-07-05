import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Home, Building2, Store, Trees, X, ArrowLeft, Camera, MapPin, Phone, DollarSign, BedDouble, Bath, Ruler } from "lucide-react";
import { LIBERIA_COUNTIES } from "@/lib/constants";
import { z } from "zod";
import LandFields, { emptyLandFields, type LandFieldsState } from "@/components/LandFields";

const editSchema = z.object({
  title: z.string().min(3).max(200),
  property_type: z.enum(["house", "apartment", "shop", "land"]),
  listing_type: z.enum(["for_sale", "for_rent", "for_lease"]),
  price_usd: z.number().positive(),
  
  county: z.string().min(1),
  contact_phone: z.string().min(5).max(20),
  contact_phone_2: z.string().max(20).optional(),
  description: z.string().optional(),
});

const EditProperty = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [land, setLand] = useState<LandFieldsState>(emptyLandFields());
  const [landErrors, setLandErrors] = useState<Partial<Record<keyof LandFieldsState, string>>>({});
  const [formData, setFormData] = useState({
    title: "", property_type: "house", listing_type: "for_sale", price_usd: "",
    address: "", county: "", district: "", city: "", community: "", street: "", nearest_landmark: "",
    contact_phone: "", contact_phone_2: "",
    bedrooms: "", bathrooms: "", square_yards: "", description: "",
  });
  const isLand = formData.property_type === "land";

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    fetchProperty();
  }, [user, id]);

  const fetchProperty = async () => {
    if (!id) return;
    const { data, error } = await supabase.from("properties").select("*").eq("id", id).single();
    if (error || !data) { toast({ title: "Error", description: "Property not found", variant: "destructive" }); navigate("/profile"); return; }
    if (data.owner_id !== user?.id) { toast({ title: "Error", description: "You can only edit your own properties", variant: "destructive" }); navigate("/profile"); return; }
    setFormData({
      title: data.title, property_type: data.property_type, listing_type: data.listing_type,
      price_usd: String(data.price_usd), address: data.address, county: data.county,
      district: (data as any).district || "", city: (data as any).city || "", community: (data as any).community || "",
      street: (data as any).street || "", nearest_landmark: (data as any).nearest_landmark || "",
      contact_phone: data.contact_phone, contact_phone_2: data.contact_phone_2 || "",
      bedrooms: data.bedrooms ? String(data.bedrooms) : "", bathrooms: data.bathrooms ? String(data.bathrooms) : "",
      square_yards: data.square_yards ? String(data.square_yards) : "", description: data.description || "",
    });
    if (data.property_type === "land") {
      setLand({
        land_size: data.land_size != null ? String(data.land_size) : "",
        land_size_unit: data.land_size_unit || "lots",
        land_use: data.land_use || "",
        road_access: data.road_access ?? null,
        title_deed_status: data.title_deed_status || "",
        utilities_nearby: data.utilities_nearby || [],
        zoning: data.zoning || "",
        topography: data.topography || "",
        boundary_marked: data.boundary_marked ?? null,
        nearest_landmark: data.nearest_landmark || "",
      });
    }
    setExistingPhotos(data.photos || []);
    setFetching(false);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const total = existingPhotos.length + newPhotos.length + files.length;
    if (total > 10) { toast({ title: "Limit", description: "Max 10 photos", variant: "destructive" }); return; }
    setNewPhotos((prev) => [...prev, ...files]);
  };

  const removeExistingPhoto = (index: number) => setExistingPhotos((prev) => prev.filter((_, i) => i !== index));
  const removeNewPhoto = (index: number) => setNewPhotos((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;
    if (existingPhotos.length + newPhotos.length === 0) { toast({ title: "Photos Required", description: "At least one photo needed", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const validated = editSchema.parse({ ...formData, price_usd: parseFloat(formData.price_usd), contact_phone_2: formData.contact_phone_2 || undefined });
      // Upload new photos
      const newPhotoUrls = await Promise.all(newPhotos.map(async (photo) => {
        const ext = photo.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random()}.${ext}`;
        const { error } = await supabase.storage.from("property-photos").upload(fileName, photo);
        if (error) throw error;
        return supabase.storage.from("property-photos").getPublicUrl(fileName).data.publicUrl;
      }));
      const allPhotos = [...existingPhotos, ...newPhotoUrls];
      const composedAddress = [formData.street, formData.community, formData.city, formData.district, validated.county].map(s => (s || "").trim()).filter(Boolean).join(", ") || validated.county;
      const updatePayload: any = {
        title: validated.title, property_type: validated.property_type, listing_type: validated.listing_type,
        price_usd: validated.price_usd, address: composedAddress, county: validated.county,
        district: formData.district.trim() || null, city: formData.city.trim() || null,
        community: formData.community.trim() || null, street: formData.street.trim() || null,
        nearest_landmark: formData.nearest_landmark.trim() || null,
        contact_phone: validated.contact_phone, contact_phone_2: validated.contact_phone_2 || null,
        photos: allPhotos, description: validated.description || null,
        bedrooms: isLand ? null : (formData.bedrooms ? parseInt(formData.bedrooms) : null),
        bathrooms: isLand ? null : (formData.bathrooms ? parseInt(formData.bathrooms) : null),
        square_yards: formData.square_yards ? parseInt(formData.square_yards) : null,
      };
      if (isLand) {
        const errs: Partial<Record<keyof LandFieldsState, string>> = {};
        if (!land.land_size || parseFloat(land.land_size) <= 0) errs.land_size = "Land size is required";
        if (!land.land_use) errs.land_use = "Land use is required";
        if (!land.title_deed_status) errs.title_deed_status = "Title status is required";
        setLandErrors(errs);
        if (Object.keys(errs).length > 0) {
          toast({ title: "Land details incomplete", description: "Please fill the highlighted fields.", variant: "destructive" });
          setLoading(false);
          return;
        }
        Object.assign(updatePayload, {
          land_size: parseFloat(land.land_size),
          land_size_unit: land.land_size_unit,
          land_use: land.land_use,
          road_access: land.road_access,
          title_deed_status: land.title_deed_status,
          utilities_nearby: land.utilities_nearby,
          zoning: land.zoning || null,
          topography: land.topography || null,
          boundary_marked: land.boundary_marked,
          nearest_landmark: land.nearest_landmark || null,
        });
      } else {
        Object.assign(updatePayload, {
          land_size: null, land_use: null, title_deed_status: null,
          road_access: null, utilities_nearby: [], zoning: null,
          topography: null, boundary_marked: null,
        });
      }
      const { error } = await supabase.from("properties").update(updatePayload).eq("id", id);
      if (error) throw error;
      toast({ title: "Success!", description: "Property updated." }); navigate("/profile");
    } catch (error: any) {
      if (error instanceof z.ZodError) toast({ title: "Validation Error", description: error.errors[0].message, variant: "destructive" });
      else toast({ title: "Error", description: error.message || "Failed to update", variant: "destructive" });
    } finally { setLoading(false); }
  };

  if (fetching) return <div className="min-h-screen bg-background"><Navbar /><div className="flex items-center justify-center py-20"><div className="animate-pulse text-muted-foreground">Loading...</div></div></div>;

  const propertyTypes = [
    { value: "house", label: "House", icon: Home },
    { value: "apartment", label: "Apartment", icon: Building2 },
    { value: "shop", label: "Shop", icon: Store },
    { value: "land", label: "Land", icon: Trees },
  ];
  const listingTypes = [
    { value: "for_sale", label: "For Sale" },
    { value: "for_rent", label: "For Rent" },
    { value: "for_lease", label: "For Lease" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 pt-4 md:max-w-5xl md:px-6 md:pt-6">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
          <div><h1 className="text-xl md:text-2xl font-bold">Edit Property</h1><p className="text-xs text-muted-foreground">Update your property details</p></div>
        </div>

        <form onSubmit={handleSubmit} className="md:grid md:grid-cols-2 md:gap-8 space-y-5 md:space-y-0">
          <div className="space-y-5">
            <div>
              <Label className="text-sm font-semibold mb-3 block">Property Type</Label>
              <div className="grid grid-cols-4 gap-2">
                {propertyTypes.map(({ value, label, icon: Icon }) => (
                  <button key={value} type="button" onClick={() => setFormData({ ...formData, property_type: value })} className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${formData.property_type === value ? "border-primary bg-primary/10" : "border-border bg-card hover:border-muted-foreground/30"}`}>
                    <Icon className={`h-5 w-5 ${formData.property_type === value ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-xs font-medium ${formData.property_type === value ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div><Label className="text-sm font-semibold mb-3 block">Listing Type</Label><div className="flex gap-2">{listingTypes.map(({ value, label }) => (<button key={value} type="button" onClick={() => setFormData({ ...formData, listing_type: value })} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${formData.listing_type === value ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"}`}>{label}</button>))}</div></div>
            <div className="space-y-2"><Label className="text-sm font-semibold">Property Title</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required maxLength={200} className="rounded-xl h-12" /></div>
            <div className="space-y-2"><Label className="text-sm font-semibold">Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="resize-none rounded-xl" /></div>
            <div className="space-y-2"><Label className="text-sm font-semibold flex items-center gap-2"><DollarSign className="h-4 w-4 text-muted-foreground" />Price (USD)</Label><Input type="number" step="0.01" value={formData.price_usd} onChange={(e) => setFormData({ ...formData, price_usd: e.target.value })} required className="rounded-xl h-12" /></div>
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" />Location</Label>
              <Select value={formData.county} onValueChange={(value) => setFormData({ ...formData, county: value })}><SelectTrigger className="rounded-xl h-12"><SelectValue placeholder="Select county" /></SelectTrigger><SelectContent>{LIBERIA_COUNTIES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent></Select>
              <div className="grid grid-cols-2 gap-3">
                <Input value={formData.district} onChange={(e) => setFormData({ ...formData, district: e.target.value })} maxLength={100} placeholder="District" className="rounded-xl h-12" />
                <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} maxLength={100} placeholder="City" className="rounded-xl h-12" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input value={formData.community} onChange={(e) => setFormData({ ...formData, community: e.target.value })} maxLength={100} placeholder="Community" className="rounded-xl h-12" />
                <Input value={formData.street} onChange={(e) => setFormData({ ...formData, street: e.target.value })} maxLength={100} placeholder="Street (optional)" className="rounded-xl h-12" />
              </div>
              <Input value={formData.nearest_landmark} onChange={(e) => setFormData({ ...formData, nearest_landmark: e.target.value })} maxLength={150} placeholder="Nearest landmark (optional)" className="rounded-xl h-12" />
              
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />Contact</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input type="tel" value={formData.contact_phone} onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })} required maxLength={20} placeholder="Phone 1 *" className="rounded-xl h-12" />
                <Input type="tel" value={formData.contact_phone_2} onChange={(e) => setFormData({ ...formData, contact_phone_2: e.target.value })} maxLength={20} placeholder="Phone 2" className="rounded-xl h-12" />
              </div>
            </div>
            {!isLand && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Details</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="relative"><BedDouble className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input type="number" min="0" value={formData.bedrooms} onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })} placeholder="Beds" className="rounded-xl h-12 pl-10" /></div>
                  <div className="relative"><Bath className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input type="number" min="0" value={formData.bathrooms} onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })} placeholder="Baths" className="rounded-xl h-12 pl-10" /></div>
                  <div className="relative"><Ruler className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input type="number" min="0" value={formData.square_yards} onChange={(e) => setFormData({ ...formData, square_yards: e.target.value })} placeholder="Sq yd" className="rounded-xl h-12 pl-10" /></div>
                </div>
              </div>
            )}
            {isLand && <LandFields value={land} onChange={setLand} errors={landErrors} />}
          </div>

          <div className="space-y-5">
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2"><Camera className="h-4 w-4 text-muted-foreground" />Photos <span className="text-muted-foreground font-normal">({existingPhotos.length + newPhotos.length}/10)</span></Label>
              {existingPhotos.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {existingPhotos.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
                      <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                      <button type="button" className="absolute top-1 right-1 h-6 w-6 rounded-full bg-destructive flex items-center justify-center" onClick={() => removeExistingPhoto(i)}><X className="h-3 w-3 text-destructive-foreground" /></button>
                    </div>
                  ))}
                </div>
              )}
              {newPhotos.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {newPhotos.map((photo, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden border-2 border-primary/30">
                      <img src={URL.createObjectURL(photo)} alt={`New ${i + 1}`} className="w-full h-full object-cover" />
                      <button type="button" className="absolute top-1 right-1 h-6 w-6 rounded-full bg-destructive flex items-center justify-center" onClick={() => removeNewPhoto(i)}><X className="h-3 w-3 text-destructive-foreground" /></button>
                    </div>
                  ))}
                </div>
              )}
              <div className="border-2 border-dashed border-border rounded-2xl p-6 text-center bg-card">
                <input type="file" accept="image/*" multiple onChange={handlePhotoChange} className="hidden" id="photo-upload-edit" disabled={existingPhotos.length + newPhotos.length >= 10} />
                <label htmlFor="photo-upload-edit" className="cursor-pointer flex flex-col items-center gap-2">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center"><Camera className="h-6 w-6 text-primary" /></div>
                  <span className="text-sm text-muted-foreground">Tap to add photos</span>
                </label>
              </div>
            </div>
            <Button type="submit" className="w-full h-14 rounded-2xl text-base font-semibold" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default EditProperty;
