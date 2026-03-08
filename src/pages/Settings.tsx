import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  ChevronLeft, ChevronRight, User, Bell, Shield, SlidersHorizontal, 
  LayoutList, HelpCircle, FileText, LogOut, Mail, Phone, MapPin,
  Lock, Eye, EyeOff, Trash2, MessageSquare, Home as HomeIcon, Building2
} from "lucide-react";
import { LIBERIA_COUNTIES } from "@/lib/constants";

type SettingsSection = "main" | "account" | "notifications" | "privacy" | "preferences" | "listings" | "support";

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [section, setSection] = useState<SettingsSection>("main");
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editForm, setEditForm] = useState({ name: "", county: "", address: "", bio: "" });
  const [agencyForm, setAgencyForm] = useState({ agency_name: "", office_location: "" });
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Notification preferences (persisted to Supabase)
  const [notifPrefs, setNotifPrefs] = useState({
    inquiries: true,
    messages: true,
    offers: true,
    statusUpdates: true,
    marketing: false,
  });
  const [notifLoading, setNotifLoading] = useState(false);

  // Load notification preferences from DB
  useEffect(() => {
    if (!user) return;
    const loadPrefs = async () => {
      const { data } = await supabase
        .from("notification_preferences" as any)
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (data) {
        const d = data as any;
        setNotifPrefs({
          inquiries: d.inquiries ?? true,
          messages: d.messages ?? true,
          offers: d.offers ?? true,
          statusUpdates: d.status_updates ?? true,
          marketing: d.marketing ?? false,
        });
      }
    };
    loadPrefs();
  }, [user]);

  const updateNotifPref = async (key: string, dbKey: string, value: boolean) => {
    const updated = { ...notifPrefs, [key]: value };
    setNotifPrefs(updated);
    if (!user) return;
    setNotifLoading(true);
    const { data: existing } = await supabase
      .from("notification_preferences" as any)
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (existing) {
      await supabase
        .from("notification_preferences" as any)
        .update({ [dbKey]: value, updated_at: new Date().toISOString() } as any)
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("notification_preferences" as any)
        .insert({ user_id: user.id, [dbKey]: value } as any);
    }
    setNotifLoading(false);
    toast({ title: "Preference Updated", description: `${key.charAt(0).toUpperCase() + key.slice(1)} notifications ${value ? "enabled" : "disabled"}.` });
  };

  const { preferences: userPrefs, updatePreference } = useUserPreferences();

  // Load profile
  useState(() => {
    if (!user) { navigate("/auth"); return; }
    supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => {
      if (data) {
        setProfile(data);
        setEditForm({ name: data.name || "", county: data.county || "", address: data.address || "", bio: (data as any).bio || "" });
        // Fetch agency info for agents
        if (data.role === "agent") {
          supabase.from("verification_requests")
            .select("agency_name, office_location")
            .eq("user_id", user.id)
            .eq("verification_type", "agent")
            .eq("status", "approved")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle()
            .then(({ data: agencyData }) => {
              if (agencyData) {
                setAgencyForm({ agency_name: agencyData.agency_name || "", office_location: agencyData.office_location || "" });
              }
            });
        }
      }
      setLoading(false);
    });
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleSaveAccount = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({
      name: editForm.name,
      county: editForm.county || null,
      address: editForm.address || null,
      bio: editForm.bio || null,
    } as any).eq("id", user.id);
    if (error) {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
      return;
    }

    // Save agency info for agents
    if (profile?.role === "agent" && (agencyForm.agency_name || agencyForm.office_location)) {
      const { error: agencyError } = await supabase
        .from("verification_requests")
        .update({
          agency_name: agencyForm.agency_name || null,
          office_location: agencyForm.office_location || null,
        })
        .eq("user_id", user.id)
        .eq("verification_type", "agent")
        .eq("status", "approved");
      if (agencyError) {
        toast({ title: "Warning", description: "Profile saved but agency info update failed", variant: "destructive" });
        return;
      }
    }

    toast({ title: "Success", description: "Account settings saved" });
    setProfile({ ...profile, ...editForm });
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Password updated successfully" });
      setNewPassword("");
    }
    setChangingPassword(false);
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure? This action cannot be undone. All your data will be permanently deleted.")) return;
    toast({ title: "Account Deletion", description: "Please contact support@libhub.com to delete your account." });
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

  const isAgent = profile.role === "agent";

  const MenuItem = ({ icon: Icon, label, onClick, destructive = false }: { icon: any; label: string; onClick: () => void; destructive?: boolean }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${
        destructive ? "text-destructive hover:bg-destructive/10" : "hover:bg-secondary/50"
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`h-5 w-5 ${destructive ? "text-destructive" : "text-muted-foreground"}`} />
        <span className="text-sm font-medium">{label}</span>
      </div>
      {!destructive && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
    </button>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <div className="flex items-center gap-3 p-4 border-b border-border">
      <button onClick={() => setSection("main")} className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-secondary/50 transition-colors">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <h2 className="text-lg font-bold">{title}</h2>
    </div>
  );

  const ToggleRow = ({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between p-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );

  // Main menu
  if (section === "main") {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-8">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold mb-6">Settings</h1>
          
          <div className="bg-card rounded-2xl border border-border/50 overflow-hidden divide-y divide-border/50">
            <MenuItem icon={User} label="Account Setting" onClick={() => setSection("account")} />
            <MenuItem icon={Bell} label="Notification Setting" onClick={() => setSection("notifications")} />
            <MenuItem icon={Shield} label="Privacy & Security" onClick={() => setSection("privacy")} />
            <MenuItem icon={SlidersHorizontal} label="Preferences" onClick={() => setSection("preferences")} />
            {isAgent && <MenuItem icon={LayoutList} label="Listing Management" onClick={() => setSection("listings")} />}
            <MenuItem icon={HelpCircle} label="Support & Help" onClick={() => setSection("support")} />
          </div>

          <div className="mt-4 bg-card rounded-2xl border border-border/50 overflow-hidden divide-y divide-border/50">
            <MenuItem icon={FileText} label="LibHub Terms & Conditions" onClick={() => navigate("/terms")} />
          </div>

          <div className="mt-4 bg-card rounded-2xl border border-border/50 overflow-hidden">
            <MenuItem icon={LogOut} label="Logout" onClick={handleSignOut} destructive />
          </div>
        </div>
      </div>
    );
  }

  // Account Setting
  if (section === "account") {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-8">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-6">
          <SectionHeader title="Account Setting" />
          <div className="mt-4 space-y-4">
            <div className="bg-card rounded-2xl border border-border/50 p-4 space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Email (non-editable)</Label>
                <Input value={profile.email} disabled className="opacity-60 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Phone (non-editable)</Label>
                <Input value={profile.phone || ""} disabled className="opacity-60 rounded-xl" />
              </div>
              {profile.contact_phone_2 && (
                <div className="space-y-2">
                  <Label>Phone 2</Label>
                  <Input value={profile.contact_phone_2} disabled className="opacity-60 rounded-xl" />
                </div>
              )}
              <div className="space-y-2">
                <Label>Role</Label>
                <Input value={isAgent ? "Agent" : "Property Owner"} disabled className="opacity-60 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>County</Label>
                <Select value={editForm.county} onValueChange={(v) => setEditForm({ ...editForm, county: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select county" /></SelectTrigger>
                  <SelectContent>{LIBERIA_COUNTIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} placeholder="Enter your address" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Bio / About</Label>
                <Textarea value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} placeholder="Write about yourself..." rows={3} className="rounded-xl resize-none" />
              </div>
              {isAgent && (
                <div className="border-t border-border/50 pt-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <Label className="text-sm font-semibold">Agency Information</Label>
                  </div>
                  <div className="space-y-2">
                    <Label>Agency Name</Label>
                    <Input value={agencyForm.agency_name} onChange={(e) => setAgencyForm({ ...agencyForm, agency_name: e.target.value })} placeholder="Your agency or company name" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Office Location</Label>
                    <Input value={agencyForm.office_location} onChange={(e) => setAgencyForm({ ...agencyForm, office_location: e.target.value })} placeholder="e.g., Congo Town, Monrovia" className="rounded-xl" />
                  </div>
                </div>
              )}
              <Button onClick={handleSaveAccount} className="w-full rounded-xl">Save Changes</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Notification Setting
  if (section === "notifications") {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-8">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-6">
          <SectionHeader title="Notification Setting" />
          <div className="mt-4 bg-card rounded-2xl border border-border/50 overflow-hidden divide-y divide-border/50">
            <ToggleRow label="Property Inquiries" description="Get notified when someone inquires about your property" checked={notifPrefs.inquiries} onChange={(v) => updateNotifPref("inquiries", "inquiries", v)} />
            <ToggleRow label="Messages" description="Notifications for new messages" checked={notifPrefs.messages} onChange={(v) => updateNotifPref("messages", "messages", v)} />
            <ToggleRow label="Offers" description="Get notified about property offers" checked={notifPrefs.offers} onChange={(v) => updateNotifPref("offers", "offers", v)} />
            <ToggleRow label="Status Updates" description="Property status change alerts" checked={notifPrefs.statusUpdates} onChange={(v) => updateNotifPref("statusUpdates", "status_updates", v)} />
            <ToggleRow label="Marketing & Tips" description="Receive tips and promotional content" checked={notifPrefs.marketing} onChange={(v) => updateNotifPref("marketing", "marketing", v)} />
          </div>
          <p className="text-xs text-muted-foreground mt-3 px-2">Your notification preferences are saved automatically and applied server-side.</p>
        </div>
      </div>
    );
  }

  // Privacy & Security
  if (section === "privacy") {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-8">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-6">
          <SectionHeader title="Privacy & Security" />
          
          <div className="mt-4 space-y-4">
            <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
              <div className="p-4 border-b border-border/50">
                <h3 className="text-sm font-semibold">Profile Visibility</h3>
              </div>
              <div className="divide-y divide-border/50">
                <ToggleRow label="Show Phone Number" description="Allow others to see your phone" checked={userPrefs.show_phone} onChange={(v) => { updatePreference("show_phone", v); toast({ title: "Updated", description: `Phone visibility ${v ? "enabled" : "disabled"}` }); }} />
                <ToggleRow label="Show Email" description="Allow others to see your email" checked={userPrefs.show_email} onChange={(v) => { updatePreference("show_email", v); toast({ title: "Updated", description: `Email visibility ${v ? "enabled" : "disabled"}` }); }} />
                <ToggleRow label="Show Location" description="Display your county on profile" checked={userPrefs.show_location} onChange={(v) => { updatePreference("show_location", v); toast({ title: "Updated", description: `Location visibility ${v ? "enabled" : "disabled"}` }); }} />
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border/50 p-4 space-y-3">
              <h3 className="text-sm font-semibold">Change Password</h3>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password (min 6 characters)"
                  className="rounded-xl pr-10"
                />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button onClick={handleChangePassword} disabled={changingPassword || newPassword.length < 6} className="w-full rounded-xl" size="sm">
                {changingPassword ? "Updating..." : "Update Password"}
              </Button>
            </div>

            <div className="bg-card rounded-2xl border border-destructive/30 p-4 space-y-2">
              <h3 className="text-sm font-semibold text-destructive">Danger Zone</h3>
              <p className="text-xs text-muted-foreground">Permanently delete your account and all associated data.</p>
              <Button variant="destructive" onClick={handleDeleteAccount} className="w-full rounded-xl" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />Delete Account
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Preferences
  if (section === "preferences") {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-8">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-6">
          <SectionHeader title="Preferences" />
          <div className="mt-4 space-y-4">
            <div className="bg-card rounded-2xl border border-border/50 p-4 space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground">Browsing Defaults</h3>
              <div className="space-y-2">
                <Label>Default County Filter</Label>
                <Select value={userPrefs.default_county || "all"} onValueChange={(v) => { updatePreference("default_county", v === "all" ? null : v); toast({ title: "Updated", description: v === "all" ? "Showing all counties" : `Default county set to ${v}` }); }}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="All Counties" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Counties</SelectItem>
                    {LIBERIA_COUNTIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Auto-filter Explore page by this county</p>
              </div>
              <div className="space-y-2">
                <Label>Default Listing Type</Label>
                <Select value={userPrefs.default_listing_type || "all"} onValueChange={(v) => { updatePreference("default_listing_type", v === "all" ? null : v); toast({ title: "Updated", description: v === "all" ? "Showing all listing types" : `Default listing type set` }); }}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Listing Types</SelectItem>
                    <SelectItem value="for_sale">For Sale</SelectItem>
                    <SelectItem value="for_rent">For Rent</SelectItem>
                    <SelectItem value="for_lease">For Lease</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Pre-select listing type when browsing</p>
              </div>
              <div className="space-y-2">
                <Label>Default Property Type</Label>
                <Select value={userPrefs.default_property_type || "all"} onValueChange={(v) => { updatePreference("default_property_type", v === "all" ? null : v); toast({ title: "Updated", description: v === "all" ? "Showing all property types" : `Default property type set` }); }}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Property Types</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="shop">Shop</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Pre-select property type when browsing</p>
              </div>
              <div className="space-y-2">
                <Label>Default Sort Order</Label>
                <Select value={userPrefs.default_sort_order} onValueChange={(v) => { updatePreference("default_sort_order", v); toast({ title: "Updated", description: `Sort order set to ${v === "newest" ? "Newest First" : v === "price_low" ? "Price: Low to High" : "Price: High to Low"}` }); }}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="price_low">Price: Low to High</SelectItem>
                    <SelectItem value="price_high">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">How properties are sorted by default</p>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border/50 p-4 space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground">Display</h3>
              <div className="space-y-2">
                <Label>Currency Display</Label>
                <Select value={userPrefs.currency_display} onValueChange={(v) => { updatePreference("currency_display", v); toast({ title: "Updated", description: `Currency set to ${v === "usd" ? "USD ($)" : "LRD (L$)"}` }); }}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usd">USD ($)</SelectItem>
                    <SelectItem value="lrd">LRD (L$)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Choose how property prices are displayed</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground px-2">All preferences are saved automatically.</p>
          </div>
        </div>
      </div>
    );
  }

  // Listing Management (Agent only)
  if (section === "listings") {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-8">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-6">
          <SectionHeader title="Listing Management" />
          <div className="mt-4 space-y-4">
            <div className="bg-card rounded-2xl border border-border/50 p-4 space-y-3">
              <p className="text-sm text-muted-foreground">Manage all your property listings from your profile page or use the quick actions below.</p>
              <Button onClick={() => navigate("/upload")} className="w-full rounded-xl gap-2">
                <HomeIcon className="h-4 w-4" />Add New Property
              </Button>
              <Button variant="outline" onClick={() => navigate("/profile")} className="w-full rounded-xl gap-2">
                <LayoutList className="h-4 w-4" />View My Listings
              </Button>
              <Button variant="outline" onClick={() => navigate("/dashboard")} className="w-full rounded-xl gap-2">
                <SlidersHorizontal className="h-4 w-4" />Owner Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Support & Help
  if (section === "support") {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-8">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-6">
          <SectionHeader title="Support & Help" />
          <div className="mt-4 space-y-4">
            <div className="bg-card rounded-2xl border border-border/50 p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-1">Frequently Asked Questions</h3>
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-secondary/50 rounded-xl">
                    <p className="font-medium">How do I list a property?</p>
                    <p className="text-muted-foreground text-xs mt-1">Go to your profile and tap "Add Property" or use the Upload page from the navigation.</p>
                  </div>
                  <div className="p-3 bg-secondary/50 rounded-xl">
                    <p className="font-medium">How do I get verified?</p>
                    <p className="text-muted-foreground text-xs mt-1">Go to Verification from your profile and submit your ID documents for review.</p>
                  </div>
                  <div className="p-3 bg-secondary/50 rounded-xl">
                    <p className="font-medium">How do I upgrade to Agent?</p>
                    <p className="text-muted-foreground text-xs mt-1">Property Owners can upgrade to Agent status through the verification process to unlock more features.</p>
                  </div>
                  <div className="p-3 bg-secondary/50 rounded-xl">
                    <p className="font-medium">How do I contact a property owner?</p>
                    <p className="text-muted-foreground text-xs mt-1">Use the Call, Message, or Email buttons on any property detail page or user profile.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border/50 p-4 space-y-3">
              <h3 className="text-sm font-semibold">Contact Support</h3>
              <a href="mailto:support@libhub.com" className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl hover:bg-secondary/80 transition-colors">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Email Support</p>
                  <p className="text-xs text-muted-foreground">support@libhub.com</p>
                </div>
              </a>
              <Button variant="outline" onClick={() => navigate("/feedback")} className="w-full rounded-xl gap-2">
                <MessageSquare className="h-4 w-4" />Send Feedback
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Settings;
