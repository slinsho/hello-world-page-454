import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Home, Building2, Store, Shield, Camera, User, MapPin, Phone, Mail, Trash2, Eye, ImagePlus, X, MessageSquare, Bed, Bath, Pencil, MoreVertical, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Textarea } from "@/components/ui/textarea";
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
  const [editForm, setEditForm] = useState<{ name: string; county: string; address: string; bio: string }>({ name: "", county: "", address: "", bio: "" });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [removingCover, setRemovingCover] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState("");
  const [cropType, setCropType] = useState<"profile" | "cover">("profile");
  const [listingFilter, setListingFilter] = useState<"all" | "for_sale" | "for_rent" | "for_lease">("all");

  const isOwnProfile = !profileId || profileId === user?.id;
  const isAgent = profile?.role === "agent";

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
        setEditForm({ name: data.name || "", county: data.county || "", address: data.address || "", bio: (data as any).bio || "" });
      }
    } catch {} finally { setLoading(false); }
  };

  const handleProfileUpdate = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ name: editForm.name, county: editForm.county || null, address: editForm.address || null, bio: editForm.bio || null } as any).eq("id", user.id);
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

  const handleVerificationRequest = () => { navigate("/verification"); };

  // Three-dot menu component
  const SettingsMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-secondary/50 transition-colors">
          <MoreVertical className="h-5 w-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-xl">
        <DropdownMenuItem onClick={() => navigate("/settings")} className="gap-2">
          <Settings className="h-4 w-4" />Settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

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
    approved: isAgent ? "bg-blue-500/20 text-blue-500" : "bg-green-500/20 text-green-500",
    rejected: "bg-destructive/20 text-destructive",
  }[profile.verification_status];

  const verifiedLabel = profile.verification_status === "approved"
    ? (isAgent ? "Verified Agent 🔵" : "Verified Owner ✅")
    : VERIFICATION_STATUS_LABELS[profile.verification_status as keyof typeof VERIFICATION_STATUS_LABELS];

  const filteredProperties = listingFilter === "all"
    ? properties
    : properties.filter((p) => p.listing_type === listingFilter);

  const aboutText = (profile as any).bio
    ? (profile as any).bio
    : isAgent
      ? `Experienced real estate agent helping clients buy, sell, and rent properties across Liberia. ${profile.county ? `Based in ${profile.county}.` : ""} Specialized in residential and commercial properties.`
      : `Property owner ${profile.county ? `based in ${profile.county}, Liberia` : "in Liberia"}. Browse listings below to find the perfect property.`;

  // Edit Profile Dialog
  const EditProfileDialog = ({ triggerId }: { triggerId: string }) => (
    <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full gap-2 border-border">
          <Pencil className="h-3.5 w-3.5" />Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-md rounded-3xl">
        <DialogHeader><DialogTitle>Edit Profile</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-2"><Label htmlFor={`name-${triggerId}`}>Name</Label><Input id={`name-${triggerId}`} value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="rounded-xl" /></div>
          <div className="space-y-2"><Label>Email (non-editable)</Label><Input value={profile.email} disabled className="opacity-60 rounded-xl" /></div>
          <div className="space-y-2"><Label>Phone (non-editable)</Label><Input value={profile.phone || ""} disabled className="opacity-60 rounded-xl" /></div>
          {profile.contact_phone_2 && (<div className="space-y-2"><Label>Phone 2</Label><Input value={profile.contact_phone_2} disabled className="opacity-60 rounded-xl" /></div>)}
          <div className="space-y-2"><Label>Role</Label><Input value={isAgent ? "Agent" : "Property Owner"} disabled className="opacity-60 rounded-xl" /></div>
          <div className="space-y-2">
            <Label>County</Label>
            <Select value={editForm.county} onValueChange={(value) => setEditForm({ ...editForm, county: value })}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select your county" /></SelectTrigger>
              <SelectContent>{LIBERIA_COUNTIES.map((county) => (<SelectItem key={county} value={county}>{county}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label htmlFor={`addr-${triggerId}`}>Address</Label><Input id={`addr-${triggerId}`} value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} placeholder="Enter your address" className="rounded-xl" /></div>
          <div className="space-y-2">
            <Label htmlFor={`bio-${triggerId}`}>Bio / About</Label>
            <Textarea id={`bio-${triggerId}`} value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} placeholder="Write about yourself..." rows={3} className="rounded-xl resize-none" />
          </div>
          {profile.role === "property_owner" && (profile.verification_status === "none" || profile.verification_status === "rejected") && (
            <Button variant="outline" onClick={() => { setIsEditingProfile(false); navigate("/verification?upgrade=agent"); }} className="w-full rounded-xl gap-2 border-blue-500 text-blue-500 hover:bg-blue-500/10"><Building2 className="h-4 w-4" />Upgrade to Agent</Button>
          )}
          <Button onClick={handleProfileUpdate} className="w-full rounded-xl">Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Compact Property Card for profile
  const MiniPropertyCard = ({ property }: { property: any }) => {
    const Icon = TypeIcon[property.property_type as keyof typeof TypeIcon];
    return (
      <div className="bg-card rounded-xl overflow-hidden border border-border/50 shadow-sm">
        <div className="relative h-28 overflow-hidden">
          {property.photos[0] ? (
            <img src={property.photos[0]} alt={property.title} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center"><Icon className="h-8 w-8 text-muted-foreground" /></div>
          )}
          <Badge className={`absolute top-2 left-2 text-[9px] px-1.5 py-0.5 ${property.status === 'active' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {STATUS_LABELS[property.status as keyof typeof STATUS_LABELS]}
          </Badge>
        </div>
        <div className="p-2.5">
          <h3 className="font-semibold text-xs truncate">{property.title}</h3>
          <p className="text-primary font-bold text-sm mt-0.5">${property.price_usd.toLocaleString()}</p>
          <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
            {property.bedrooms && <span className="flex items-center gap-0.5"><Bed className="h-3 w-3" />{property.bedrooms}</span>}
            {property.bathrooms && <span className="flex items-center gap-0.5"><Bath className="h-3 w-3" />{property.bathrooms}</span>}
          </div>
        </div>
        {/* Compact actions */}
        <div className="flex border-t border-border/50 text-[10px]">
          <button onClick={() => navigate(`/property/${property.id}`)} className="flex-1 py-2 font-medium text-primary hover:bg-primary/10 transition-colors flex items-center justify-center gap-1">
            <Eye className="h-3 w-3" />View
          </button>
          {isOwnProfile && (
            <>
              <button onClick={() => navigate(`/edit-property/${property.id}`)} className="flex-1 py-2 font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors flex items-center justify-center gap-1 border-l border-border/50">
                <Pencil className="h-3 w-3" />Edit
              </button>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="flex-1 py-2 font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors flex items-center justify-center gap-1 border-l border-border/50">
                    <Settings className="h-3 w-3" />Status
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] sm:max-w-xs rounded-3xl">
                  <DialogHeader><DialogTitle>Update Status</DialogTitle></DialogHeader>
                  <div className="space-y-2 py-3">
                    {(["active", "inactive", "sold", "rented"] as const).map((status) => (
                      <button key={status} onClick={() => updatePropertyStatus(property.id, status)} className={`w-full p-2.5 rounded-xl text-left text-sm font-medium transition-colors ${property.status === status ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'}`}>
                        {STATUS_LABELS[status as keyof typeof STATUS_LABELS]}
                      </button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
              <button onClick={() => deleteProperty(property.id)} className="flex-1 py-2 font-medium text-destructive hover:bg-destructive/10 transition-colors flex items-center justify-center gap-1 border-l border-border/50">
                <Trash2 className="h-3 w-3" />
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
        { key: "all", label: "All" },
        { key: "for_sale", label: "Sale" },
        { key: "for_rent", label: "Rent" },
        { key: "for_lease", label: "Lease" },
      ] as const).map((tab, index) => (
        <button
          key={tab.key}
          onClick={() => setListingFilter(tab.key)}
          className={`px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
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

  // ========== OWNER PROFILE LAYOUT (simpler, personal) ==========
  const OwnerLayout = () => (
    <>
      {/* Mobile */}
      <div className="md:hidden">
        <div className="px-4 -mt-12 relative z-10">
          <div className="bg-card rounded-2xl border border-border/50 shadow-lg p-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <Avatar className="h-16 w-16 border-2 border-background shadow-lg">
                  <AvatarImage src={profile.profile_photo_url} className="object-cover" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">{profile.name?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                {isOwnProfile && (
                  <><label htmlFor="photo-upload-mobile" className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary flex items-center justify-center cursor-pointer shadow"><Camera className="h-3 w-3 text-primary-foreground" /></label><input id="photo-upload-mobile" type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, "profile")} disabled={uploadingPhoto} /></>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-bold truncate">{profile.name}</h1>
                <p className="text-xs text-muted-foreground">Property Owner</p>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium mt-1 ${verificationStatusColor}`}>
                  <Shield className="h-3 w-3" />{verifiedLabel}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {isOwnProfile && <EditProfileDialog triggerId="owner-mobile" />}
                {isOwnProfile && <SettingsMenu />}
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="px-4 mt-4 grid grid-cols-3 gap-2">
          <div className="bg-card rounded-xl p-3 border border-border/50 text-center">
            <p className="text-xl font-bold">{stats.total}</p>
            <p className="text-[10px] text-muted-foreground">Listed</p>
          </div>
          <div className="bg-primary/10 rounded-xl p-3 border border-primary/20 text-center">
            <p className="text-xl font-bold text-primary">{stats.active}</p>
            <p className="text-[10px] text-muted-foreground">Active</p>
          </div>
          <div className="bg-card rounded-xl p-3 border border-border/50 text-center">
            <p className="text-xl font-bold">{stats.taken}</p>
            <p className="text-[10px] text-muted-foreground">Sold/Rented</p>
          </div>
        </div>

        {/* Listings */}
        <div className="px-4 mt-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold">My Properties</h2>
            <ListingTabs />
          </div>
          {filteredProperties.length === 0 ? (
            <div className="text-center py-10 bg-card rounded-xl border border-border/50">
              <Home className="h-10 w-10 mx-auto text-muted-foreground/50" />
              <p className="text-muted-foreground mt-2 text-sm">No properties yet</p>
              {isOwnProfile && <Button onClick={() => navigate("/upload")} className="mt-3 rounded-full" size="sm">Add Property</Button>}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredProperties.map((p) => <MiniPropertyCard key={p.id} property={p} />)}
            </div>
          )}
        </div>

        {/* Bottom actions */}
        {isOwnProfile && (
          <div className="px-4 mt-5 space-y-2">
            {(profile.verification_status === "none" || profile.verification_status === "rejected") && (
              <div className="p-3 bg-secondary/50 rounded-xl flex items-center justify-between">
                <div><p className="font-medium text-xs">Get Verified</p><p className="text-[10px] text-muted-foreground">{profile.verification_status === "rejected" ? "Re-submit" : "Build trust"}</p></div>
                <Button size="sm" onClick={handleVerificationRequest} className="rounded-full h-8 text-xs">{profile.verification_status === "rejected" ? "Re-submit" : "Verify"}</Button>
              </div>
            )}
            {isAdmin && (
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /><p className="font-medium text-xs">Admin</p></div>
                <Button size="sm" onClick={() => navigate("/admin")} className="rounded-full h-8 text-xs">Open</Button>
              </div>
            )}
          </div>
        )}

        {/* Reviews */}
        <div className="mt-6 px-4">
          <UserReviews userId={profile.id} userName={profile.name || "User"} showAddReview={!!profileId && profileId !== user?.id} />
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden md:block max-w-5xl mx-auto px-6 -mt-16 relative z-10">
        <div className="bg-card rounded-2xl border border-border/50 shadow-lg p-6">
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <Avatar className="h-20 w-20 border-4 border-background shadow-xl">
                <AvatarImage src={profile.profile_photo_url} className="object-cover" />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">{profile.name?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              {isOwnProfile && (
                <><label htmlFor="photo-upload-desktop" className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary flex items-center justify-center cursor-pointer shadow"><Camera className="h-3.5 w-3.5 text-primary-foreground" /></label><input id="photo-upload-desktop" type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, "profile")} disabled={uploadingPhoto} /></>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold truncate">{profile.name}</h1>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${verificationStatusColor}`}><Shield className="h-3 w-3" />{verifiedLabel}</span>
              </div>
              <p className="text-sm text-muted-foreground">Property Owner</p>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                {profile.county && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{profile.county}, Liberia</span>}
                {profile.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{profile.phone}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {profile.phone && <a href={`tel:${profile.phone}`} className="h-9 px-4 rounded-full bg-primary text-primary-foreground font-medium text-sm flex items-center gap-2"><Phone className="h-3.5 w-3.5" />Call</a>}
              {profile.email && <a href={`mailto:${profile.email}`} className="h-9 px-4 rounded-full bg-secondary text-foreground font-medium text-sm flex items-center gap-2 border border-border"><Mail className="h-3.5 w-3.5" />Email</a>}
              {isOwnProfile && <EditProfileDialog triggerId="owner-desktop" />}
              {isOwnProfile && <SettingsMenu />}
            </div>
          </div>

          {/* Stats inline */}
          <div className="mt-5 grid grid-cols-3 gap-4">
            <div className="bg-secondary/50 rounded-xl p-4 text-center"><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Listed</p></div>
            <div className="bg-primary/10 rounded-xl p-4 text-center"><p className="text-2xl font-bold text-primary">{stats.active}</p><p className="text-xs text-muted-foreground">Active</p></div>
            <div className="bg-secondary/50 rounded-xl p-4 text-center"><p className="text-2xl font-bold">{stats.taken}</p><p className="text-xs text-muted-foreground">Sold/Rented</p></div>
          </div>
        </div>

        {/* Listings */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Properties</h2>
            <ListingTabs />
          </div>
          {filteredProperties.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-border/50">
              <Home className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="text-muted-foreground mt-3">No properties yet</p>
              {isOwnProfile && <Button onClick={() => navigate("/upload")} className="mt-4 rounded-full">Add Property</Button>}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProperties.map((p) => <MiniPropertyCard key={p.id} property={p} />)}
            </div>
          )}
        </div>

        {/* Actions + Reviews */}
        <div className="mt-6 grid grid-cols-[1fr_340px] gap-6">
          <UserReviews userId={profile.id} userName={profile.name || "User"} showAddReview={!!profileId && profileId !== user?.id} />
          {isOwnProfile && (
            <div className="space-y-3 self-start">
              {(profile.verification_status === "none" || profile.verification_status === "rejected") && (
                <div className="p-4 bg-secondary/50 rounded-xl flex items-center justify-between">
                  <div><p className="font-medium text-sm">Get Verified</p></div>
                  <Button size="sm" onClick={handleVerificationRequest} className="rounded-full">Verify</Button>
                </div>
              )}
              {isAdmin && (
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /><span className="font-medium text-sm">Admin</span></div>
                  <Button size="sm" onClick={() => navigate("/admin")} className="rounded-full">Open</Button>
                </div>
              )}
              
            </div>
          )}
        </div>
      </div>
    </>
  );

  // ========== AGENT PROFILE LAYOUT (professional, detailed) ==========
  const AgentLayout = () => (
    <>
      {/* Mobile */}
      <div className="md:hidden">
        <div className="px-4 -mt-14 relative z-10">
          <div className="flex items-end gap-4">
            <div className="relative flex-shrink-0">
              <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
                <AvatarImage src={profile.profile_photo_url} className="object-cover" />
                <AvatarFallback className="bg-primary text-primary-foreground text-3xl">{profile.name?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              {isOwnProfile && (
                <><label htmlFor="photo-upload-mobile-agent" className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center cursor-pointer shadow-lg"><Camera className="h-4 w-4 text-primary-foreground" /></label><input id="photo-upload-mobile-agent" type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, "profile")} disabled={uploadingPhoto} /></>
              )}
            </div>
            <div className="pb-1 min-w-0">
              <h1 className="text-xl font-bold truncate">{profile.name}</h1>
              <p className="text-sm text-muted-foreground">Real Estate Agent</p>
            </div>
          </div>
        </div>

        {/* Badge + Location */}
        <div className="px-4 mt-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${verificationStatusColor}`}><Shield className="h-3.5 w-3.5" />{verifiedLabel}</span>
            {profile.county && <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{profile.county}, Liberia</span>}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-4 mt-3 flex gap-2">
          {profile.phone && <a href={`tel:${profile.phone}`} className="flex-1 h-10 rounded-full bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2"><Phone className="h-4 w-4" />Call</a>}
          {!isOwnProfile && <button onClick={() => navigate("/messages")} className="flex-1 h-10 rounded-full bg-secondary text-foreground font-medium text-sm flex items-center justify-center gap-2 border border-border"><MessageSquare className="h-4 w-4" />Message</button>}
          {profile.email && <a href={`mailto:${profile.email}`} className="flex-1 h-10 rounded-full bg-secondary text-foreground font-medium text-sm flex items-center justify-center gap-2 border border-border"><Mail className="h-4 w-4" />Email</a>}
        </div>

        {/* Tagline */}
        <div className="px-4 mt-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <p className="text-xs italic text-muted-foreground">Your Trusted Real Estate Expert</p>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Social Links */}
        <div className="px-4 mt-3">
          <SocialLinksEditor socialLinks={{ social_facebook: profile.social_facebook, social_instagram: profile.social_instagram, social_twitter: profile.social_twitter, social_linkedin: profile.social_linkedin, social_whatsapp: profile.social_whatsapp }} onSave={handleSocialLinksUpdate} isOwnProfile={isOwnProfile} />
        </div>

        {/* About */}
        <div className="px-4 mt-5">
          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold">About</h2>
              {isOwnProfile && <EditProfileDialog triggerId="agent-mobile" />}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{aboutText}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 mt-4 grid grid-cols-3 gap-2">
          <div className="bg-card rounded-xl p-3 border border-border/50 text-center">
            <p className="text-xl font-bold">{stats.total}</p>
            <p className="text-[10px] text-muted-foreground">Listed</p>
          </div>
          <div className="bg-primary/10 rounded-xl p-3 border border-primary/20 text-center">
            <p className="text-xl font-bold text-primary">{stats.active}</p>
            <p className="text-[10px] text-muted-foreground">Active</p>
          </div>
          <div className="bg-card rounded-xl p-3 border border-border/50 text-center">
            <p className="text-xl font-bold">{stats.taken}</p>
            <p className="text-[10px] text-muted-foreground">Sold/Rented</p>
          </div>
        </div>

        {/* Listings */}
        <div className="px-4 mt-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold">Listings</h2>
            <ListingTabs />
          </div>
          {filteredProperties.length === 0 ? (
            <div className="text-center py-10 bg-card rounded-xl border border-border/50">
              <Home className="h-10 w-10 mx-auto text-muted-foreground/50" />
              <p className="text-muted-foreground mt-2 text-sm">No properties yet</p>
              {isOwnProfile && <Button onClick={() => navigate("/upload")} className="mt-3 rounded-full" size="sm">Add Property</Button>}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredProperties.map((p) => <MiniPropertyCard key={p.id} property={p} />)}
            </div>
          )}
        </div>

        {/* Actions */}
        {isOwnProfile && (
          <div className="px-4 mt-5 space-y-2">
            {(profile.verification_status === "none" || profile.verification_status === "rejected") && (
              <div className="p-3 bg-secondary/50 rounded-xl flex items-center justify-between">
                <div><p className="font-medium text-xs">Get Verified</p></div>
                <Button size="sm" onClick={handleVerificationRequest} className="rounded-full h-8 text-xs">Verify</Button>
              </div>
            )}
            {isAdmin && (
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /><p className="font-medium text-xs">Admin</p></div>
                <Button size="sm" onClick={() => navigate("/admin")} className="rounded-full h-8 text-xs">Open</Button>
              </div>
            )}
            
          </div>
        )}

        {/* Reviews */}
        <div className="mt-6 px-4">
          <UserReviews userId={profile.id} userName={profile.name || "User"} showAddReview={!!profileId && profileId !== user?.id} />
        </div>
      </div>

      {/* Desktop - Two column agent layout */}
      <div className="hidden md:block max-w-6xl mx-auto px-6 -mt-20 relative z-10">
        <div className="grid grid-cols-[320px_1fr] lg:grid-cols-[360px_1fr] gap-6">
          {/* Left Sidebar */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-lg self-start sticky top-24 overflow-hidden">
            <div className="p-5 pb-3">
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <Avatar className="h-16 w-16 border-2 border-background shadow-lg">
                    <AvatarImage src={profile.profile_photo_url} className="object-cover" />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl">{profile.name?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  {isOwnProfile && (
                    <><label htmlFor="photo-upload-desktop-agent" className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-primary flex items-center justify-center cursor-pointer shadow"><Camera className="h-3 w-3 text-primary-foreground" /></label><input id="photo-upload-desktop-agent" type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, "profile")} disabled={uploadingPhoto} /></>
                  )}
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg font-bold truncate">{profile.name}</h1>
                  <p className="text-xs text-muted-foreground">Real Estate Agent</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium mt-1 ${verificationStatusColor}`}><Shield className="h-3 w-3" />{verifiedLabel}</span>
                </div>
              </div>
            </div>

            <div className="px-5 pb-3 space-y-1.5 text-sm text-muted-foreground">
              {profile.county && <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 flex-shrink-0" />{profile.county}, Liberia</div>}
              {profile.email && <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 flex-shrink-0" /><span className="truncate">{profile.email}</span></div>}
              {profile.phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 flex-shrink-0" />{profile.phone}</div>}
            </div>

            <div className="px-5 pb-3 flex gap-2">
              {profile.phone && <a href={`tel:${profile.phone}`} className="flex-1 h-9 rounded-full bg-primary text-primary-foreground font-medium text-xs flex items-center justify-center gap-1.5"><Phone className="h-3.5 w-3.5" />Call</a>}
              {profile.email && <a href={`mailto:${profile.email}`} className="flex-1 h-9 rounded-full bg-secondary text-foreground font-medium text-xs flex items-center justify-center gap-1.5 border border-border"><Mail className="h-3.5 w-3.5" />Email</a>}
            </div>

            <div className="px-5 pb-3">
              <SocialLinksEditor socialLinks={{ social_facebook: profile.social_facebook, social_instagram: profile.social_instagram, social_twitter: profile.social_twitter, social_linkedin: profile.social_linkedin, social_whatsapp: profile.social_whatsapp }} onSave={handleSocialLinksUpdate} isOwnProfile={isOwnProfile} />
            </div>

            {isOwnProfile && (
              <div className="px-5 pb-4 flex items-center gap-2">
                <EditProfileDialog triggerId="agent-desktop" />
                <SettingsMenu />
              </div>
            )}

            {isOwnProfile && (profile.verification_status === "none" || profile.verification_status === "rejected") && (
              <div className="px-5 pb-4">
                <div className="p-3 bg-secondary/50 rounded-xl flex items-center justify-between">
                  <p className="font-medium text-xs">Get Verified</p>
                  <Button size="sm" onClick={handleVerificationRequest} className="rounded-full h-7 text-xs">Verify</Button>
                </div>
              </div>
            )}
            {isAdmin && (
              <div className="px-5 pb-4">
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /><span className="font-medium text-xs">Admin</span></div>
                  <Button size="sm" onClick={() => navigate("/admin")} className="rounded-full h-7 text-xs">Open</Button>
                </div>
              </div>
            )}
          </div>

          {/* Right Main */}
          <div className="space-y-5 pt-20">
            {/* About */}
            <div className="bg-card rounded-xl p-5 border border-border/50">
              <h2 className="text-base font-bold mb-2">About</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{aboutText}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-card rounded-xl p-4 border border-border/50 text-center">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Listed</p>
              </div>
              <div className="bg-primary/10 rounded-xl p-4 border border-primary/20 text-center">
                <p className="text-2xl font-bold text-primary">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border/50 text-center">
                <p className="text-2xl font-bold">{stats.taken}</p>
                <p className="text-xs text-muted-foreground">Sold/Rented</p>
              </div>
            </div>

            {/* Listings */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Listings</h2>
                <ListingTabs />
              </div>
              {filteredProperties.length === 0 ? (
                <div className="text-center py-14 bg-card rounded-xl border border-border/50">
                  <Home className="h-10 w-10 mx-auto text-muted-foreground/50" />
                  <p className="text-muted-foreground mt-2">No properties yet</p>
                  {isOwnProfile && <Button onClick={() => navigate("/upload")} className="mt-3 rounded-full">Add Property</Button>}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredProperties.map((p) => <MiniPropertyCard key={p.id} property={p} />)}
                </div>
              )}
            </div>

            {/* Reviews */}
            <UserReviews userId={profile.id} userName={profile.name || "User"} showAddReview={!!profileId && profileId !== user?.id} />
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background overflow-x-hidden pb-24 md:pb-8">
      <Navbar />

      <main>
        {/* Cover Photo Banner */}
        <div className="relative">
          <div className={`relative ${isAgent ? 'h-44 md:h-56 lg:h-64' : 'h-36 md:h-44'} overflow-hidden`}>
            {profile.cover_photo_url ? (
              <img src={profile.cover_photo_url} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/30 via-primary/10 to-background" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            {isOwnProfile && (
              <div className="absolute bottom-3 right-3 flex gap-2 z-20">
                {profile.cover_photo_url && (
                  <button onClick={handleRemoveCover} disabled={removingCover} className="px-2.5 py-1 rounded-full bg-destructive/80 backdrop-blur-sm flex items-center gap-1 cursor-pointer shadow text-xs text-destructive-foreground">
                    <X className="h-3.5 w-3.5" /><span className="hidden sm:inline">{removingCover ? "..." : "Remove"}</span>
                  </button>
                )}
                <label htmlFor="cover-upload" className="px-2.5 py-1 rounded-full bg-background/80 backdrop-blur-sm flex items-center gap-1 cursor-pointer shadow text-xs">
                  <ImagePlus className="h-3.5 w-3.5" /><span className="hidden sm:inline">{uploadingCover ? "..." : "Cover"}</span>
                </label>
                <input id="cover-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, "cover")} disabled={uploadingCover} />
              </div>
            )}
          </div>
        </div>

        {isAgent ? <AgentLayout /> : <OwnerLayout />}
      </main>

      <ImageCropper open={cropperOpen} onClose={() => setCropperOpen(false)} imageSrc={cropImageSrc} aspectRatio={cropType === "cover" ? 16 / 9 : 1} onCropComplete={handleCropComplete} title={cropType === "cover" ? "Crop Cover Photo" : "Crop Profile Photo"} />
    </div>
  );
};

export default Profile;
