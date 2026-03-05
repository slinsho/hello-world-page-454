import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, Home, Building2, Store, Edit, Shield, Camera, User, MapPin, Phone, Mail, ChevronRight, Trash2, Eye, Settings, ImagePlus, X, MessageSquare, Bed, Bath, Maximize } from "lucide-react";
import { UserReviews } from "@/components/UserReviews";
import { VERIFICATION_STATUS_LABELS, LISTING_TYPE_LABELS, STATUS_LABELS, LIBERIA_COUNTIES, formatLRD } from "@/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageCropper } from "@/components/profile/ImageCropper";
import { SocialLinksEditor } from "@/components/profile/SocialLinksEditor";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { id: profileId } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, taken: 0 });
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState<{ name: string; county: string; address: string }>({ name: "", county: "", address: "" });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [removingCover, setRemovingCover] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState("");
  const [cropType, setCropType] = useState<"profile" | "cover">("profile");
  const [listingFilter, setListingFilter] = useState<"all" | "for_sale" | "for_rent" | "for_lease">("all");

  const isOwnProfile = !profileId || profileId === user?.id;

  useEffect(() => {
    if (!user && !profileId) { navigate("/auth"); return; }
    fetchProfile();
    fetchProperties();
    if (user) checkAdminStatus();
  }, [user, navigate, profileId]);

  const checkAdminStatus = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.rpc("is_admin", { user_id: user.id });
      if (!error && data) setIsAdmin(true);
    } catch {}
  };

  const fetchProfile = async () => {
    const targetUserId = profileId || user?.id;
    if (!targetUserId) return;
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", targetUserId).single();
      if (error) {
        toast({ title: "Error", description: "Failed to load profile", variant: "destructive" });
      } else if (data) {
        setProfile(data);
        setEditForm({ name: data.name || "", county: data.county || "", address: data.address || "" });
      }
    } catch {} finally { setLoading(false); }
  };

  const handleProfileUpdate = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ name: editForm.name, county: editForm.county || null, address: editForm.address || null }).eq("id", user.id);
    if (error) { toast({ title: "Error", description: "Failed to update profile", variant: "destructive" }); }
    else { toast({ title: "Success", description: "Profile updated successfully" }); setIsEditingProfile(false); fetchProfile(); }
  };

  const handleSocialLinksUpdate = async (links: { social_facebook?: string | null; social_instagram?: string | null; social_twitter?: string | null; social_linkedin?: string | null; social_whatsapp?: string | null }) => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update(links).eq("id", user.id);
    if (error) { toast({ title: "Error", description: "Failed to update social links", variant: "destructive" }); throw error; }
    else { toast({ title: "Success", description: "Social links updated" }); fetchProfile(); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "profile" | "cover") => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => { setCropImageSrc(reader.result as string); setCropType(type); setCropperOpen(true); };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!user) return;
    setCropperOpen(false);
    if (cropType === "profile") setUploadingPhoto(true); else setUploadingCover(true);
    try {
      const fileName = cropType === "profile" ? "profile" : "cover";
      const filePath = `${user.id}/${fileName}_${Date.now()}.jpg`;
      if (cropType === "cover" && profile?.cover_photo_url) {
        try { const oldPath = profile.cover_photo_url.split("/property-photos/")[1]; if (oldPath && oldPath.includes("cover_")) await supabase.storage.from("property-photos").remove([oldPath]); } catch {}
      }
      const { error: uploadError } = await supabase.storage.from("property-photos").upload(filePath, croppedBlob, { upsert: false });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("property-photos").getPublicUrl(filePath);
      const updateField = cropType === "profile" ? "profile_photo_url" : "cover_photo_url";
      const { error: updateError } = await supabase.from("profiles").update({ [updateField]: publicUrl }).eq("id", user.id);
      if (updateError) throw updateError;
      toast({ title: "Success", description: `${cropType === "profile" ? "Profile photo" : "Cover photo"} updated` });
      fetchProfile();
    } catch (error) {
      toast({ title: "Error", description: `Failed to upload ${cropType} photo`, variant: "destructive" });
    } finally {
      if (cropType === "profile") setUploadingPhoto(false); else setUploadingCover(false);
    }
  };

  const handleRemoveCover = async () => {
    if (!user || !profile?.cover_photo_url) return;
    setRemovingCover(true);
    try {
      try { const oldPath = profile.cover_photo_url.split("/property-photos/")[1]; if (oldPath) await supabase.storage.from("property-photos").remove([oldPath]); } catch {}
      const { error: updateError } = await supabase.from("profiles").update({ cover_photo_url: null }).eq("id", user.id);
      if (updateError) throw updateError;
      toast({ title: "Success", description: "Cover photo removed" }); fetchProfile();
    } catch (error) { toast({ title: "Error", description: "Failed to remove cover photo", variant: "destructive" }); }
    finally { setRemovingCover(false); }
  };

  const fetchProperties = async () => {
    const targetUserId = profileId || user?.id;
    if (!targetUserId) return;
    const { data } = await supabase.from("properties").select("*").eq("owner_id", targetUserId).order("created_at", { ascending: false });
    if (data) {
      setProperties(data);
      setStats({ total: data.length, active: data.filter((p) => p.status === "active").length, taken: data.filter((p) => p.status === "sold" || p.status === "rented").length });
    }
  };

  const handleSignOut = async () => { await supabase.auth.signOut(); navigate("/"); };
  const handleVerificationRequest = () => { navigate("/verification"); };

  const updatePropertyStatus = async (propertyId: string, newStatus: "active" | "inactive" | "sold" | "rented") => {
    const { error } = await supabase.from("properties").update({ status: newStatus }).eq("id", propertyId);
    if (error) { toast({ title: "Error", description: "Failed to update property status", variant: "destructive" }); }
    else { toast({ title: "Success", description: "Property status updated" }); fetchProperties(); }
  };

  const deleteProperty = async (propertyId: string) => {
    if (!confirm("Are you sure you want to delete this property?")) return;
    const { error } = await supabase.from("properties").delete().eq("id", propertyId);
    if (error) { toast({ title: "Error", description: "Failed to delete property", variant: "destructive" }); }
    else { toast({ title: "Success", description: "Property deleted" }); fetchProperties(); }
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  const TypeIcon = { house: Home, apartment: Building2, shop: Store };

  const verificationStatusColor = {
    none: "bg-muted text-muted-foreground",
    pending: "bg-yellow-500/20 text-yellow-500",
    approved: profile.role === "agent" ? "bg-blue-500/20 text-blue-500" : "bg-green-500/20 text-green-500",
    rejected: "bg-destructive/20 text-destructive",
  }[profile.verification_status];

  const verifiedLabel = profile.verification_status === "approved"
    ? (profile.role === "agent" ? "Verified Agent 🔵" : "Verified Owner ✅")
    : VERIFICATION_STATUS_LABELS[profile.verification_status as keyof typeof VERIFICATION_STATUS_LABELS];

  const filteredProperties = listingFilter === "all"
    ? properties
    : properties.filter((p) => p.listing_type === listingFilter);

  // Edit Profile Dialog (shared between mobile + desktop)
  const EditProfileDialog = ({ triggerId }: { triggerId: string }) => (
    <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full gap-2 border-border">
          <Edit className="h-4 w-4" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-md rounded-3xl">
        <DialogHeader><DialogTitle>Edit Profile</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2"><Label htmlFor={`name-${triggerId}`}>Name</Label><Input id={`name-${triggerId}`} value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="rounded-xl" /></div>
          <div className="space-y-2"><Label>Email (non-editable)</Label><Input value={profile.email} disabled className="opacity-60 rounded-xl" /></div>
          <div className="space-y-2"><Label>Phone (non-editable)</Label><Input value={profile.phone || ""} disabled className="opacity-60 rounded-xl" /></div>
          {profile.contact_phone_2 && (<div className="space-y-2"><Label>Phone 2</Label><Input value={profile.contact_phone_2} disabled className="opacity-60 rounded-xl" /></div>)}
          <div className="space-y-2"><Label>Role</Label><Input value={profile.role === "agent" ? "Agent" : "Property Owner"} disabled className="opacity-60 rounded-xl" /></div>
          <div className="space-y-2">
            <Label>County</Label>
            <Select value={editForm.county} onValueChange={(value) => setEditForm({ ...editForm, county: value })}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select your county" /></SelectTrigger>
              <SelectContent>{LIBERIA_COUNTIES.map((county) => (<SelectItem key={county} value={county}>{county}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label htmlFor={`addr-${triggerId}`}>Address</Label><Input id={`addr-${triggerId}`} value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} placeholder="Enter your address" className="rounded-xl" /></div>
          {profile.role === "property_owner" && (profile.verification_status === "none" || profile.verification_status === "rejected") && (
            <Button variant="outline" onClick={() => { setIsEditingProfile(false); navigate("/verification?upgrade=agent"); }} className="w-full rounded-xl gap-2 border-blue-500 text-blue-500 hover:bg-blue-500/10"><Building2 className="h-4 w-4" />Upgrade to Agent</Button>
          )}
          <Button onClick={handleProfileUpdate} className="w-full rounded-xl">Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Property Card matching reference image style
  const PropertyCard = ({ property }: { property: any }) => {
    const Icon = TypeIcon[property.property_type as keyof typeof TypeIcon];
    return (
      <div className="bg-card rounded-2xl overflow-hidden border border-border/50 shadow-sm hover:shadow-md transition-shadow">
        {/* Property Image */}
        <div className="relative h-40 md:h-48 overflow-hidden">
          {property.photos[0] ? (
            <img src={property.photos[0]} alt={property.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Icon className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
          <Badge className={`absolute top-3 left-3 text-[10px] ${property.status === 'active' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {STATUS_LABELS[property.status as keyof typeof STATUS_LABELS]}
          </Badge>
          <Badge variant="outline" className="absolute top-3 right-3 text-[10px] bg-background/80 backdrop-blur-sm border-border">
            {LISTING_TYPE_LABELS[property.listing_type as keyof typeof LISTING_TYPE_LABELS]}
          </Badge>
        </div>

        {/* Property Info */}
        <div className="p-4">
          <h3 className="font-bold text-sm truncate">{property.title}</h3>
          <p className="text-primary font-bold text-base mt-1">
            ${property.price_usd.toLocaleString()}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            {property.bedrooms && <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" />{property.bedrooms} Bed</span>}
            {property.bathrooms && <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{property.bathrooms} Bath</span>}
            {property.square_yards && <span className="flex items-center gap-1"><Maximize className="h-3.5 w-3.5" />{property.square_yards} Sq Yd</span>}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{property.address}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex border-t border-border/50">
          <button onClick={() => navigate(`/property/${property.id}`)} className="flex-1 py-3 text-xs font-medium text-primary hover:bg-primary/10 transition-colors flex items-center justify-center gap-1.5">
            <Eye className="h-3.5 w-3.5" />View Details
          </button>
          {isOwnProfile && (
            <>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="flex-1 py-3 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors flex items-center justify-center gap-1.5 border-l border-border/50">
                    <Settings className="h-3.5 w-3.5" />Status
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] sm:max-w-sm rounded-3xl">
                  <DialogHeader><DialogTitle>Update Status</DialogTitle></DialogHeader>
                  <div className="space-y-2 py-4">
                    {(["active", "inactive", "sold", "rented"] as const).map((status) => (
                      <button key={status} onClick={() => updatePropertyStatus(property.id, status)} className={`w-full p-3 rounded-xl text-left text-sm font-medium transition-colors ${property.status === status ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'}`}>
                        {STATUS_LABELS[status as keyof typeof STATUS_LABELS]}
                      </button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
              <button onClick={() => deleteProperty(property.id)} className="flex-1 py-3 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors flex items-center justify-center gap-1.5 border-l border-border/50">
                <Trash2 className="h-3.5 w-3.5" />Delete
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  // Listing Filter Tabs
  const ListingTabs = () => (
    <div className="flex items-center gap-0 overflow-x-auto scrollbar-none border border-border rounded-lg w-fit">
      {([
        { key: "all", label: "All Listings" },
        { key: "for_sale", label: "For Sale" },
        { key: "for_rent", label: "For Rent" },
        { key: "for_lease", label: "For Lease" },
      ] as const).map((tab, index) => (
        <button
          key={tab.key}
          onClick={() => setListingFilter(tab.key)}
          className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
            index > 0 ? "border-l border-border" : ""
          } ${
            listingFilter === tab.key
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />

      <main className="pb-24 md:pb-8">
        {/* ============ COVER PHOTO BANNER ============ */}
        <div className="relative">
          <div className="relative h-48 md:h-64 lg:h-72 overflow-hidden">
            {profile.cover_photo_url ? (
              <img src={profile.cover_photo_url} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/30 via-primary/10 to-background" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            {isOwnProfile && (
              <div className="absolute bottom-3 right-3 flex gap-2 z-20">
                {profile.cover_photo_url && (
                  <button onClick={handleRemoveCover} disabled={removingCover} className="px-3 py-1.5 rounded-full bg-destructive/80 backdrop-blur-sm flex items-center gap-1.5 cursor-pointer shadow-lg hover:bg-destructive/90 transition-colors text-sm text-destructive-foreground">
                    <X className="h-4 w-4" /><span className="hidden sm:inline">{removingCover ? "Removing..." : "Remove"}</span>
                  </button>
                )}
                <label htmlFor="cover-upload" className="px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm flex items-center gap-1.5 cursor-pointer shadow-lg hover:bg-background/90 transition-colors text-sm">
                  <ImagePlus className="h-4 w-4" /><span className="hidden sm:inline">{uploadingCover ? "Uploading..." : "Change Cover"}</span>
                </label>
                <input id="cover-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, "cover")} disabled={uploadingCover} />
              </div>
            )}
          </div>
        </div>

        {/* ============ MOBILE LAYOUT ============ */}
        <div className="md:hidden">
          {/* Avatar + Name overlapping banner (like reference image) */}
          <div className="px-4 -mt-14 relative z-10">
            <div className="flex items-end gap-4">
              <div className="relative flex-shrink-0">
                <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
                  <AvatarImage src={profile.profile_photo_url} className="object-cover" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                    {profile.name?.charAt(0).toUpperCase() || <User className="h-10 w-10" />}
                  </AvatarFallback>
                </Avatar>
                {isOwnProfile && (
                  <>
                    <label htmlFor="photo-upload-mobile" className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center cursor-pointer shadow-lg hover:bg-primary/90 transition-colors">
                      <Camera className="h-4 w-4 text-primary-foreground" />
                    </label>
                    <input id="photo-upload-mobile" type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, "profile")} disabled={uploadingPhoto} />
                  </>
                )}
              </div>
              <div className="pb-1 min-w-0">
                <h1 className="text-xl font-bold truncate">{profile.name}</h1>
                <p className="text-sm text-muted-foreground capitalize">{profile.role === "agent" ? "Real Estate Agent" : "Property Owner"}</p>
              </div>
            </div>
          </div>

          {/* Location + Verification Badge */}
          <div className="px-4 mt-4">
            <div className="flex flex-wrap items-center gap-3">
              {profile.county && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />{profile.county}, Liberia
                </div>
              )}
              {profile.address && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />{profile.address}
                </div>
              )}
            </div>
            <div className="mt-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${verificationStatusColor}`}>
                <Shield className="h-3.5 w-3.5" />{verifiedLabel}
              </span>
            </div>
          </div>

          {/* Action Buttons Row (Call, Message, Email) */}
          <div className="px-4 mt-4 flex gap-2">
            {profile.phone && (
              <a href={`tel:${profile.phone}`} className="flex-1 h-11 rounded-full bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors">
                <Phone className="h-4 w-4" />Call
              </a>
            )}
            {!isOwnProfile && (
              <button onClick={() => navigate("/messages")} className="flex-1 h-11 rounded-full bg-secondary text-foreground font-medium text-sm flex items-center justify-center gap-2 border border-border hover:bg-secondary/80 transition-colors">
                <MessageSquare className="h-4 w-4" />Message
              </button>
            )}
            {profile.email && (
              <a href={`mailto:${profile.email}`} className="flex-1 h-11 rounded-full bg-secondary text-foreground font-medium text-sm flex items-center justify-center gap-2 border border-border hover:bg-secondary/80 transition-colors">
                <Mail className="h-4 w-4" />Email
              </a>
            )}
          </div>

          {/* Tagline */}
          <div className="px-4 mt-5 flex items-center justify-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <p className="text-sm italic text-muted-foreground">Your Trusted Real Estate Expert</p>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Social Links */}
          <div className="px-4 mt-3">
            <SocialLinksEditor
              socialLinks={{ social_facebook: profile.social_facebook, social_instagram: profile.social_instagram, social_twitter: profile.social_twitter, social_linkedin: profile.social_linkedin, social_whatsapp: profile.social_whatsapp }}
              onSave={handleSocialLinksUpdate}
              isOwnProfile={isOwnProfile}
            />
          </div>

          {/* About Section */}
          <div className="px-4 mt-6">
            <div className="border-t border-border pt-5">
              <h2 className="text-lg font-bold mb-2">About</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {profile.role === "agent"
                  ? `Experienced real estate agent helping clients buy, sell, and rent properties across Liberia. ${profile.county ? `Based in ${profile.county}.` : ""} Specialized in residential and commercial properties.`
                  : `Property owner ${profile.county ? `based in ${profile.county}, Liberia` : "in Liberia"}. Browse listings below to find the perfect property.`}
              </p>
            </div>
          </div>

          {/* Stats Section */}
          <div className="px-4 mt-6">
            <div className="border-t border-border pt-5">
              <h2 className="text-lg font-bold mb-3">Stats</h2>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Properties Listed</p>
                    <p className="text-lg font-bold">{stats.total}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Active</p>
                    <p className="text-lg font-bold text-primary">{stats.active}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Sold/Rented</p>
                    <p className="text-lg font-bold">{stats.taken}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Listing Filter Tabs */}
          <div className="px-4 mt-6">
            <ListingTabs />
          </div>

          {/* Properties - Horizontal scroll on mobile */}
          <div className="mt-4 px-4">
            {filteredProperties.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
                <Home className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="text-muted-foreground mt-3 text-sm">{isOwnProfile ? "No properties listed yet" : "No properties to show"}</p>
                {isOwnProfile && <Button onClick={() => navigate("/upload")} className="mt-4 rounded-full" size="sm">Add Property</Button>}
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none -mx-4 px-4">
                {filteredProperties.map((property) => (
                  <div key={property.id} className="min-w-[280px] max-w-[300px] snap-start flex-shrink-0">
                    <PropertyCard property={property} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Own Profile Actions */}
          {isOwnProfile && (
            <div className="px-4 mt-6 flex flex-wrap justify-center gap-3">
              <EditProfileDialog triggerId="mobile" />
              <Button variant="outline" onClick={handleSignOut} className="rounded-full gap-2 border-border"><LogOut className="h-4 w-4" />Sign Out</Button>
            </div>
          )}
          {!isOwnProfile && (
            <div className="flex justify-center mt-6 px-4">
              <Button variant="outline" onClick={() => navigate("/profile")} className="rounded-full gap-2 border-border"><User className="h-4 w-4" />View My Profile</Button>
            </div>
          )}

          {/* Verification CTA */}
          {isOwnProfile && (profile.verification_status === "none" || profile.verification_status === "rejected") && (
            <div className="mx-4 mt-6 p-4 bg-secondary/50 rounded-2xl">
              <div className="flex items-center justify-between">
                <div><p className="font-medium text-sm">Get Verified</p><p className="text-xs text-muted-foreground mt-0.5">{profile.verification_status === "rejected" ? "Re-submit your documents" : "Verify your identity to build trust"}</p></div>
                <Button size="sm" onClick={handleVerificationRequest} className="rounded-full">{profile.verification_status === "rejected" ? "Re-submit" : "Verify"}</Button>
              </div>
            </div>
          )}
          {isAdmin && (
            <div className="mx-4 mt-4 p-4 bg-primary/10 border border-primary/20 rounded-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center"><Shield className="h-5 w-5 text-primary" /></div><div><p className="font-medium text-sm">Admin Access</p><p className="text-xs text-muted-foreground">Manage the platform</p></div></div>
                <Button size="sm" onClick={() => navigate("/admin")} className="rounded-full">Open</Button>
              </div>
            </div>
          )}

          {/* Client Reviews - Mobile */}
          <div className="mt-8 px-4">
            <UserReviews userId={profile.id} userName={profile.name || "User"} showAddReview={!!profileId && profileId !== user?.id} />
          </div>
        </div>

        {/* ============ DESKTOP LAYOUT ============ */}
        <div className="hidden md:block max-w-6xl mx-auto px-6 -mt-20 relative z-10">
          <div className="grid grid-cols-[340px_1fr] lg:grid-cols-[380px_1fr] gap-8">
            {/* Left Sidebar */}
            <div className="bg-card rounded-2xl border border-border/50 shadow-lg self-start sticky top-24 overflow-hidden">
              {/* Avatar + Name */}
              <div className="p-6 pb-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-20 w-20 border-4 border-background shadow-xl">
                      <AvatarImage src={profile.profile_photo_url} className="object-cover" />
                      <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                        {profile.name?.charAt(0).toUpperCase() || <User className="h-8 w-8" />}
                      </AvatarFallback>
                    </Avatar>
                    {isOwnProfile && (
                      <>
                        <label htmlFor="photo-upload-desktop" className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary flex items-center justify-center cursor-pointer shadow-lg hover:bg-primary/90 transition-colors">
                          <Camera className="h-3.5 w-3.5 text-primary-foreground" />
                        </label>
                        <input id="photo-upload-desktop" type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, "profile")} disabled={uploadingPhoto} />
                      </>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-xl font-bold truncate">{profile.name}</h1>
                    <p className="text-sm text-muted-foreground capitalize">{profile.role === "agent" ? "Real Estate Agent" : "Property Owner"}</p>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mt-1.5 ${verificationStatusColor}`}>
                      <Shield className="h-3 w-3" />{verifiedLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Divider + Location */}
              <div className="px-6 pb-4 space-y-2">
                {profile.county && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 flex-shrink-0" />{profile.county}, Liberia
                  </div>
                )}
                {profile.address && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 flex-shrink-0" />{profile.address}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="px-6 pb-4 flex gap-2">
                {profile.phone && (
                  <a href={`tel:${profile.phone}`} className="flex-1 h-10 rounded-full bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors">
                    <Phone className="h-4 w-4" />Call
                  </a>
                )}
                {!isOwnProfile && (
                  <button onClick={() => navigate("/messages")} className="flex-1 h-10 rounded-full bg-secondary text-foreground font-medium text-sm flex items-center justify-center gap-2 border border-border hover:bg-secondary/80 transition-colors">
                    <MessageSquare className="h-4 w-4" />Message
                  </button>
                )}
                {profile.email && (
                  <a href={`mailto:${profile.email}`} className="flex-1 h-10 rounded-full bg-secondary text-foreground font-medium text-sm flex items-center justify-center gap-2 border border-border hover:bg-secondary/80 transition-colors">
                    <Mail className="h-4 w-4" />Email
                  </a>
                )}
              </div>

              {/* Tagline */}
              <div className="px-6 pb-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <p className="text-xs italic text-muted-foreground whitespace-nowrap">Your Trusted Real Estate Expert</p>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Contact Info */}
              <div className="px-6 pb-4 space-y-2">
                {profile.email && (
                  <div className="flex items-center gap-3 px-3 py-2 bg-secondary/50 rounded-xl">
                    <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-foreground truncate">{profile.email}</span>
                  </div>
                )}
                {profile.phone && (
                  <div className="flex items-center gap-3 px-3 py-2 bg-secondary/50 rounded-xl">
                    <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-foreground">{profile.phone}</span>
                  </div>
                )}
              </div>

              {/* Social Links */}
              <div className="px-6 pb-4">
                <SocialLinksEditor
                  socialLinks={{ social_facebook: profile.social_facebook, social_instagram: profile.social_instagram, social_twitter: profile.social_twitter, social_linkedin: profile.social_linkedin, social_whatsapp: profile.social_whatsapp }}
                  onSave={handleSocialLinksUpdate}
                  isOwnProfile={isOwnProfile}
                />
              </div>

              {/* Own Profile Actions */}
              {isOwnProfile && (
                <div className="px-6 pb-4 flex flex-col gap-2">
                  <EditProfileDialog triggerId="desktop" />
                  <Button variant="outline" onClick={handleSignOut} className="w-full rounded-full gap-2 border-border"><LogOut className="h-4 w-4" />Sign Out</Button>
                </div>
              )}
              {!isOwnProfile && (
                <div className="px-6 pb-4">
                  <Button variant="outline" onClick={() => navigate("/profile")} className="w-full rounded-full gap-2 border-border"><User className="h-4 w-4" />View My Profile</Button>
                </div>
              )}

              {/* Verification */}
              {isOwnProfile && (profile.verification_status === "none" || profile.verification_status === "rejected") && (
                <div className="px-6 pb-4">
                  <div className="p-4 bg-secondary/50 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <div><p className="font-medium text-sm">Get Verified</p><p className="text-xs text-muted-foreground mt-0.5">{profile.verification_status === "rejected" ? "Re-submit" : "Build trust"}</p></div>
                      <Button size="sm" onClick={handleVerificationRequest} className="rounded-full">{profile.verification_status === "rejected" ? "Re-submit" : "Verify"}</Button>
                    </div>
                  </div>
                </div>
              )}
              {isAdmin && (
                <div className="px-6 pb-6">
                  <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center"><Shield className="h-5 w-5 text-primary" /></div><div><p className="font-medium text-sm">Admin</p><p className="text-xs text-muted-foreground">Manage platform</p></div></div>
                      <Button size="sm" onClick={() => navigate("/admin")} className="rounded-full">Open</Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Main Area */}
            <div className="space-y-6 pt-24">
              {/* About */}
              <div className="bg-card rounded-2xl p-6 border border-border/50">
                <h2 className="text-lg font-bold mb-3">About</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {profile.role === "agent"
                    ? `Experienced real estate agent helping clients buy, sell, and rent properties across Liberia. ${profile.county ? `Based in ${profile.county}.` : ""} Specialized in residential and commercial properties.`
                    : `Property owner ${profile.county ? `based in ${profile.county}, Liberia` : "in Liberia"}. Browse listings below to find the perfect property.`}
                </p>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-card rounded-2xl p-5 border border-border/50 text-center">
                  <Home className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-3xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground mt-1">Properties Listed</p>
                </div>
                <div className="bg-primary/10 rounded-2xl p-5 border border-primary/20 text-center">
                  <Building2 className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-3xl font-bold text-primary">{stats.active}</p>
                  <p className="text-sm text-muted-foreground mt-1">Active</p>
                </div>
                <div className="bg-card rounded-2xl p-5 border border-border/50 text-center">
                  <Store className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-3xl font-bold">{stats.taken}</p>
                  <p className="text-sm text-muted-foreground mt-1">Sold / Rented</p>
                </div>
              </div>

              {/* Properties with filter tabs */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">{isOwnProfile ? "My Listings" : "Listings"}</h2>
                  <span className="text-sm text-muted-foreground">{filteredProperties.length} of {properties.length}</span>
                </div>
                <ListingTabs />
                <div className="mt-4">
                  {filteredProperties.length === 0 ? (
                    <div className="text-center py-16 bg-card rounded-2xl border border-border/50">
                      <Home className="h-12 w-12 mx-auto text-muted-foreground/50" />
                      <p className="text-muted-foreground mt-3">{isOwnProfile ? "No properties listed yet" : "No properties to show"}</p>
                      {isOwnProfile && <Button onClick={() => navigate("/upload")} className="mt-4 rounded-full">Add Property</Button>}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {filteredProperties.map((property) => <PropertyCard key={property.id} property={property} />)}
                    </div>
                  )}
                </div>
              </div>

              {/* Reviews */}
              <UserReviews userId={profile.id} userName={profile.name || "User"} showAddReview={!!profileId && profileId !== user?.id} />
            </div>
          </div>
        </div>
      </main>

      <ImageCropper open={cropperOpen} onClose={() => setCropperOpen(false)} imageSrc={cropImageSrc} aspectRatio={cropType === "cover" ? 16 / 9 : 1} onCropComplete={handleCropComplete} title={cropType === "cover" ? "Crop Cover Photo" : "Crop Profile Photo"} />
    </div>
  );
};

export default Profile;
