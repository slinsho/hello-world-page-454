import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, Home, Building2, Store, Edit, Shield, Camera, User, MapPin, Phone, Mail, ChevronRight, Trash2, Eye, Settings } from "lucide-react";
import { VERIFICATION_STATUS_LABELS, LISTING_TYPE_LABELS, STATUS_LABELS, LIBERIA_COUNTIES } from "@/lib/constants";
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
  const [editForm, setEditForm] = useState<{
    name: string;
    phone: string;
    role: "agent" | "property_owner";
    county: string;
    address: string;
  }>({
    name: "",
    phone: "",
    role: "property_owner",
    county: "",
    address: "",
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const isOwnProfile = !profileId || profileId === user?.id;

  useEffect(() => {
    if (!user && !profileId) {
      navigate("/auth");
      return;
    }
    fetchProfile();
    fetchProperties();
    if (user) checkAdminStatus();
  }, [user, navigate, profileId]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.rpc("is_admin", {
        user_id: user.id,
      });

      if (!error && data) {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
  };

  const fetchProfile = async () => {
    const targetUserId = profileId || user?.id;
    if (!targetUserId) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", targetUserId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive",
        });
      } else if (data) {
        setProfile(data);
        setEditForm({
          name: data.name || "",
          phone: data.phone || "",
          role: data.role || "property_owner",
          county: data.county || "",
          address: data.address || "",
        });
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        name: editForm.name,
        phone: editForm.phone,
        role: editForm.role,
        county: editForm.county || null,
        address: editForm.address || null,
      })
      .eq("id", user.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setIsEditingProfile(false);
      fetchProfile();
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setUploadingPhoto(true);

    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/profile.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("property-photos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("property-photos")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ profile_photo_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Profile photo updated",
      });
      fetchProfile();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload photo",
        variant: "destructive",
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const fetchProperties = async () => {
    const targetUserId = profileId || user?.id;
    if (!targetUserId) return;

    const { data } = await supabase
      .from("properties")
      .select("*")
      .eq("owner_id", targetUserId)
      .order("created_at", { ascending: false });

    if (data) {
      setProperties(data);
      setStats({
        total: data.length,
        active: data.filter((p) => p.status === "active").length,
        taken: data.filter((p) => p.status === "sold" || p.status === "rented").length,
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleVerificationRequest = () => {
    navigate("/verification");
  };

  const updatePropertyStatus = async (propertyId: string, newStatus: "active" | "inactive" | "sold" | "rented") => {
    const { error } = await supabase
      .from("properties")
      .update({ status: newStatus })
      .eq("id", propertyId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update property status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Property status updated",
      });
      fetchProperties();
    }
  };

  const deleteProperty = async (propertyId: string) => {
    if (!confirm("Are you sure you want to delete this property?")) return;

    const { error } = await supabase
      .from("properties")
      .delete()
      .eq("id", propertyId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete property",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Property deleted",
      });
      fetchProperties();
    }
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

  const TypeIcon = {
    house: Home,
    apartment: Building2,
    shop: Store,
  };

  const verificationStatusColor = {
    none: "bg-muted text-muted-foreground",
    pending: "bg-yellow-500/20 text-yellow-500",
    approved: "bg-primary/20 text-primary",
    rejected: "bg-destructive/20 text-destructive",
  }[profile.verification_status];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pb-24 md:pb-8">
        {/* Profile Header Section */}
        <div className="relative">
          {/* Background gradient */}
          <div className="h-32 bg-gradient-to-b from-primary/20 to-background" />
          
          {/* Profile Avatar - overlapping the gradient */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-16">
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                <AvatarImage src={profile.profile_photo_url} className="object-cover" />
                <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
                  {profile.name?.charAt(0).toUpperCase() || <User className="h-12 w-12" />}
                </AvatarFallback>
              </Avatar>
              {isOwnProfile && (
                <>
                  <label 
                    htmlFor="photo-upload" 
                    className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-primary flex items-center justify-center cursor-pointer shadow-lg hover:bg-primary/90 transition-colors"
                  >
                    <Camera className="h-5 w-5 text-primary-foreground" />
                  </label>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="pt-20 px-4 text-center">
          <h1 className="text-2xl font-bold">{profile.name}</h1>
          <p className="text-muted-foreground capitalize mt-1">
            {profile.role?.replace("_", " ") || "User"}
          </p>
          
          {/* Verification Badge */}
          <div className="flex justify-center mt-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${verificationStatusColor}`}>
              <Shield className="h-3 w-3" />
              {VERIFICATION_STATUS_LABELS[profile.verification_status as keyof typeof VERIFICATION_STATUS_LABELS]}
            </span>
          </div>
        </div>

        {/* Contact Info Pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-4 px-4">
          {profile.email && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary rounded-full text-xs">
              <Mail className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground truncate max-w-[150px]">{profile.email}</span>
            </div>
          )}
          {profile.phone && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary rounded-full text-xs">
              <Phone className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">{profile.phone}</span>
            </div>
          )}
          {profile.county && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary rounded-full text-xs">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">{profile.county}</span>
            </div>
          )}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-3 gap-3 mt-6 px-4 max-w-md mx-auto">
          <div className="bg-secondary/50 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground mt-1">Total</p>
          </div>
          <div className="bg-primary/10 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-primary">{stats.active}</p>
            <p className="text-xs text-muted-foreground mt-1">Active</p>
          </div>
          <div className="bg-secondary/50 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold">{stats.taken}</p>
            <p className="text-xs text-muted-foreground mt-1">Taken</p>
          </div>
        </div>

        {/* Action Buttons */}
        {isOwnProfile && (
          <div className="flex justify-center gap-3 mt-6 px-4">
            <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-full gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-md rounded-3xl">
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email (non-editable)</Label>
                    <Input id="email" value={profile.email} disabled className="opacity-60 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="+1234567890"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={editForm.role}
                      onValueChange={(value) => setEditForm({ ...editForm, role: value as "agent" | "property_owner" })}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="property_owner">Property Owner</SelectItem>
                        <SelectItem value="agent">Agent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="county">County</Label>
                    <Select
                      value={editForm.county}
                      onValueChange={(value) => setEditForm({ ...editForm, county: value })}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Select your county" />
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
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      placeholder="Enter your address"
                      className="rounded-xl"
                    />
                  </div>
                  <Button onClick={handleProfileUpdate} className="w-full rounded-xl">
                    Save Changes
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" onClick={handleSignOut} className="rounded-full gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        )}

        {!isOwnProfile && (
          <div className="flex justify-center mt-6 px-4">
            <Button variant="outline" onClick={() => navigate("/profile")} className="rounded-full gap-2">
              <User className="h-4 w-4" />
              View My Profile
            </Button>
          </div>
        )}

        {/* Verification Request Section */}
        {isOwnProfile && (profile.verification_status === "none" || profile.verification_status === "rejected") && (
          <div className="mx-4 mt-6 p-4 bg-secondary/50 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Get Verified</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {profile.verification_status === "rejected" 
                    ? "Re-submit your documents" 
                    : "Verify your identity to build trust"}
                </p>
              </div>
              <Button size="sm" onClick={handleVerificationRequest} className="rounded-full">
                {profile.verification_status === "rejected" ? "Re-submit" : "Verify"}
              </Button>
            </div>
          </div>
        )}

        {/* Admin Access Card */}
        {isAdmin && (
          <div className="mx-4 mt-4 p-4 bg-primary/10 border border-primary/20 rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Admin Access</p>
                  <p className="text-xs text-muted-foreground">Manage the platform</p>
                </div>
              </div>
              <Button size="sm" onClick={() => navigate("/admin")} className="rounded-full">
                Open
              </Button>
            </div>
          </div>
        )}

        {/* Properties Section */}
        <div className="mt-8 px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {isOwnProfile ? "My Properties" : "Properties"}
            </h2>
            <span className="text-xs text-muted-foreground">{properties.length} listings</span>
          </div>

          {properties.length === 0 ? (
            <div className="text-center py-12 bg-secondary/30 rounded-2xl">
              <Home className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="text-muted-foreground mt-3 text-sm">
                {isOwnProfile ? "No properties listed yet" : "No properties to show"}
              </p>
              {isOwnProfile && (
                <Button 
                  onClick={() => navigate("/upload")} 
                  className="mt-4 rounded-full"
                  size="sm"
                >
                  Add Property
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {properties.map((property) => {
                const Icon = TypeIcon[property.property_type as keyof typeof TypeIcon];
                return (
                  <div
                    key={property.id}
                    className="bg-secondary/30 rounded-2xl overflow-hidden"
                  >
                    <div className="flex gap-3 p-3">
                      {/* Property Image */}
                      <div className="w-20 h-20 rounded-xl bg-muted flex-shrink-0 overflow-hidden">
                        {property.photos[0] ? (
                          <img
                            src={property.photos[0]}
                            alt={property.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Icon className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Property Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm truncate">{property.title}</h3>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{property.address}</p>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] shrink-0 ${
                              property.status === 'active' ? 'border-primary text-primary' :
                              property.status === 'sold' || property.status === 'rented' ? 'border-muted-foreground' : ''
                            }`}
                          >
                            {STATUS_LABELS[property.status as keyof typeof STATUS_LABELS]}
                          </Badge>
                        </div>
                        <p className="text-primary font-bold text-sm mt-1">
                          ${property.price_usd.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {LISTING_TYPE_LABELS[property.listing_type as keyof typeof LISTING_TYPE_LABELS]}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex border-t border-border/50">
                      <button
                        onClick={() => navigate(`/property/${property.id}`)}
                        className="flex-1 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                      
                      {isOwnProfile && (
                        <>
                          <Dialog>
                            <DialogTrigger asChild>
                              <button className="flex-1 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors flex items-center justify-center gap-1.5 border-l border-border/50">
                                <Settings className="h-3.5 w-3.5" />
                                Status
                              </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-[95vw] sm:max-w-sm rounded-3xl">
                              <DialogHeader>
                                <DialogTitle>Update Status</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-2 py-4">
                                {(["active", "inactive", "sold", "rented"] as const).map((status) => (
                                  <button
                                    key={status}
                                    onClick={() => updatePropertyStatus(property.id, status)}
                                    className={`w-full p-3 rounded-xl text-left text-sm font-medium transition-colors ${
                                      property.status === status 
                                        ? 'bg-primary text-primary-foreground' 
                                        : 'bg-secondary hover:bg-secondary/80'
                                    }`}
                                  >
                                    {STATUS_LABELS[status as keyof typeof STATUS_LABELS]}
                                  </button>
                                ))}
                              </div>
                            </DialogContent>
                          </Dialog>

                          <button
                            onClick={() => deleteProperty(property.id)}
                            className="flex-1 py-2.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors flex items-center justify-center gap-1.5 border-l border-border/50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Profile;
