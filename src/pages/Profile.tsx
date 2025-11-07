import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, Home, Building2, Store, Edit, Shield, Camera, User } from "lucide-react";
import { VERIFICATION_STATUS_LABELS, LISTING_TYPE_LABELS, STATUS_LABELS } from "@/lib/constants";
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
  }>({
    name: "",
    phone: "",
    role: "property_owner",
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
        <div className="container py-16">Loading...</div>
      </div>
    );
  }

  const TypeIcon = {
    house: Home,
    apartment: Building2,
    shop: Store,
  };

  const verificationStatusColor = {
    none: "secondary",
    pending: "default",
    approved: "default",
    rejected: "destructive",
  }[profile.verification_status] as "default" | "secondary" | "destructive";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container py-4 md:py-8 pb-20 md:pb-8 px-4">
        <div className="grid gap-4 md:gap-6 max-w-6xl mx-auto">
          {isAdmin && (
            <Card className="border-primary">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="h-6 w-6 text-primary" />
                    <div>
                      <h3 className="font-semibold">Admin Access</h3>
                      <p className="text-sm text-muted-foreground">
                        You have administrator privileges
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => navigate("/admin")}>
                    Go to Admin Portal
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div className="flex items-start gap-4 w-full sm:w-auto">
                <div className="relative group">
                  <Avatar className="h-16 w-16 md:h-20 md:w-20">
                    <AvatarImage src={profile.profile_photo_url} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                      {profile.name?.charAt(0).toUpperCase() || <User className="h-8 w-8" />}
                    </AvatarFallback>
                  </Avatar>
                  {isOwnProfile && (
                    <>
                      <label htmlFor="photo-upload" className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Camera className="h-6 w-6 text-white" />
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
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-xl md:text-2xl truncate">{profile.name}</CardTitle>
                  <p className="text-sm text-muted-foreground truncate">{profile.email}</p>
                  <p className="text-xs md:text-sm text-muted-foreground capitalize mt-1">
                    {profile.role?.replace("_", " ") || "User"}
                  </p>
                  {profile.phone && (
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">
                      {profile.phone}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                {isOwnProfile && (
                  <>
                    <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2 flex-1 sm:flex-none">
                          <Edit className="h-4 w-4" />
                          <span className="hidden sm:inline">Edit Profile</span>
                          <span className="sm:hidden">Edit</span>
                        </Button>
                      </DialogTrigger>
                  <DialogContent className="max-w-[95vw] sm:max-w-md">
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
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email (non-editable)</Label>
                        <Input id="email" value={profile.email} disabled className="opacity-60" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          placeholder="+1234567890"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select
                          value={editForm.role}
                          onValueChange={(value) => setEditForm({ ...editForm, role: value as "agent" | "property_owner" })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="property_owner">Property Owner</SelectItem>
                            <SelectItem value="agent">Agent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleProfileUpdate} className="w-full">
                        Save Changes
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                    <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-2 flex-1 sm:flex-none">
                      <LogOut className="h-4 w-4" />
                      <span className="hidden sm:inline">Sign Out</span>
                      <span className="sm:hidden">Logout</span>
                    </Button>
                  </>
                )}
                {!isOwnProfile && (
                  <Button variant="outline" size="sm" onClick={() => navigate("/profile")} className="gap-2">
                    <User className="h-4 w-4" />
                    View My Profile
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Verification Status</Label>
                  <div className="flex flex-col gap-2 mt-2">
                    <Badge variant={verificationStatusColor} className="w-fit">
                      {VERIFICATION_STATUS_LABELS[profile.verification_status as keyof typeof VERIFICATION_STATUS_LABELS]}
                    </Badge>
                    {profile.verification_status === "rejected" && (
                      <p className="text-sm text-destructive">
                        Your verification was rejected. Please submit corrected documents.
                      </p>
                    )}
                    {isOwnProfile && (profile.verification_status === "none" || profile.verification_status === "rejected") && (
                      <Button size="sm" onClick={handleVerificationRequest} className="w-fit">
                        {profile.verification_status === "rejected" ? "Re-submit Verification" : "Request Verification"}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 md:gap-4 pt-4">
                  <div className="text-center p-3 md:p-4 bg-secondary rounded-lg">
                    <p className="text-xl md:text-2xl font-bold">{stats.total}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">Total</p>
                  </div>
                  <div className="text-center p-3 md:p-4 bg-secondary rounded-lg">
                    <p className="text-xl md:text-2xl font-bold text-green-600">{stats.active}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">Active</p>
                  </div>
                  <div className="text-center p-3 md:p-4 bg-secondary rounded-lg">
                    <p className="text-xl md:text-2xl font-bold text-gray-600">{stats.taken}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">Taken</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{isOwnProfile ? "My Properties" : "Properties"}</CardTitle>
            </CardHeader>
            <CardContent>
              {properties.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {isOwnProfile ? "You haven't listed any properties yet." : "This user hasn't listed any properties yet."}
                </div>
              ) : (
                <div className="space-y-3 md:space-y-4">
                  {properties.map((property) => {
                    const Icon = TypeIcon[property.property_type as keyof typeof TypeIcon];
                    return (
                      <div
                        key={property.id}
                        className="border rounded-lg p-3 md:p-4 flex flex-col sm:flex-row items-start gap-3 md:gap-4 hover:bg-secondary/50 transition-colors"
                      >
                        <div className="w-full sm:w-20 md:w-24 h-32 sm:h-20 md:h-24 rounded bg-muted flex items-center justify-center shrink-0">
                          {property.photos[0] ? (
                            <img
                              src={property.photos[0]}
                              alt={property.title}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <Icon className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0 w-full">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-base md:text-lg truncate">{property.title}</h3>
                              <p className="text-xs md:text-sm text-muted-foreground truncate">{property.address}</p>
                              <p className="text-sm md:text-base font-bold text-primary mt-1">
                                ${property.price_usd.toLocaleString()}
                              </p>
                            </div>
                            <Badge variant="outline" className="self-start shrink-0 text-xs">
                              {LISTING_TYPE_LABELS[property.listing_type as keyof typeof LISTING_TYPE_LABELS]}
                            </Badge>
                          </div>

                          <div className="flex gap-2 mt-3 flex-wrap">
                            {isOwnProfile && (
                              <>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="text-xs">
                                      Status
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-[95vw] sm:max-w-md">
                                    <DialogHeader>
                                      <DialogTitle>Update Property Status</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                      <p className="text-sm text-muted-foreground">
                                        Current: <strong>{STATUS_LABELS[property.status as keyof typeof STATUS_LABELS]}</strong>
                                      </p>
                                      <div className="flex flex-col gap-2">
                                        {(["active", "inactive", "sold", "rented"] as const).map((status) => (
                                          <Button
                                            key={status}
                                            variant={property.status === status ? "default" : "outline"}
                                            onClick={() => updatePropertyStatus(property.id, status)}
                                          >
                                            {STATUS_LABELS[status as keyof typeof STATUS_LABELS]}
                                          </Button>
                                        ))}
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/property/${property.id}`)}
                              className="text-xs"
                            >
                              View
                            </Button>

                            {isOwnProfile && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteProperty(property.id)}
                                className="text-xs"
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;
