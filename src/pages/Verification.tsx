import { useState, useEffect, useRef } from "react";
import { notifyAdmins } from "@/lib/notifyAdmins";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Upload, X, Camera, Building2, User, ArrowLeft, ShieldCheck, Hotel as HotelIcon, FileText } from "lucide-react";
import { z } from "zod";
import Navbar from "@/components/Navbar";

const ownerVerificationSchema = z.object({ dateOfBirth: z.string().min(1, "Date of birth is required"), idType: z.enum(["citizen_card", "voter_card", "passport"]) });
const agentVerificationSchema = z.object({ dateOfBirth: z.string().min(1, "Date of birth is required"), idType: z.enum(["citizen_card", "voter_card", "passport"]), businessPhone: z.string().min(5, "Business phone is required"), agencyName: z.string().min(2, "Agency name is required"), officeLocation: z.string().min(3, "Office location is required") });
const buyerVerificationSchema = z.object({ dateOfBirth: z.string().min(1, "Date of birth is required"), idType: z.enum(["citizen_card", "voter_card", "passport"]) });
const hotelVerificationSchema = z.object({
  hotelName: z.string().min(2, "Hotel name is required"),
  businessLicenseNo: z.string().min(3, "Business license number is required"),
  tinNumber: z.string().min(3, "TIN is required"),
  businessPhone: z.string().min(5, "Business phone is required"),
  officeLocation: z.string().min(3, "Office/hotel location is required"),
});

type CamTarget = "selfie" | "license" | "ownership";

const Verification = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [idImages, setIdImages] = useState<File[]>([]);
  const [selfieImage, setSelfieImage] = useState<File | null>(null);
  const [licenseImage, setLicenseImage] = useState<File | null>(null);
  const [ownershipImage, setOwnershipImage] = useState<File | null>(null);
  const [agencyLogo, setAgencyLogo] = useState<File | null>(null);
  const [camTarget, setCamTarget] = useState<CamTarget | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [formData, setFormData] = useState({
    dateOfBirth: "",
    idType: "citizen_card" as "citizen_card" | "voter_card" | "passport",
    businessPhone: "",
    agencyName: "",
    officeLocation: "",
    hotelName: "",
    businessLicenseNo: "",
    tinNumber: "",
  });

  // Initialise synchronously from the URL (and a cached role) so the correct
  // form renders on first paint instead of flashing the owner/green-badge view.
  const initialParams = new URLSearchParams(window.location.search);
  const initialType = initialParams.get("type");
  const cachedRole = typeof localStorage !== "undefined" ? localStorage.getItem("lprop_role") : null;
  const [isBuyer, setIsBuyer] = useState(initialType === "buyer");
  const [isHotel, setIsHotel] = useState(initialType === "hotel" || (initialType !== "buyer" && cachedRole === "hotel"));
  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    const fetchRole = async () => {
      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (data) {
        const params = new URLSearchParams(window.location.search);
        const type = params.get("type");
        const wantBuyer = type === "buyer";
        const wantHotel = type === "hotel" || data.role === "hotel";
        try { localStorage.setItem("lprop_role", String(data.role)); } catch { /* ignore */ }
        setIsBuyer(wantBuyer);
        setIsHotel(wantHotel && !wantBuyer);
        setUserRole(wantBuyer ? "buyer" : wantHotel ? "hotel" : params.get("upgrade") === "agent" ? "agent" : data.role);
      }
    };
    fetchRole();
  }, [user, navigate]);
  useEffect(() => { return () => { if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()); }; }, []);

  const handleIdImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setIdImages((prev) => [...prev, ...files].slice(0, 2));
  };
  const openCamera = async (target: CamTarget) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: target === "selfie" ? "user" : "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setCamTarget(target);
    } catch (error) {
      console.error("Camera error:", error);
      toast({ title: "Camera Error", description: "Unable to access camera.", variant: "destructive" });
    }
  };
  useEffect(() => {
    if (camTarget && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(err => console.error("Error playing video:", err));
    }
  }, [camTarget]);
  const capturePhoto = () => {
    if (!videoRef.current || !camTarget) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    const target = camTarget;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `${target}-${Date.now()}.jpg`, { type: "image/jpeg" });
      if (target === "selfie") setSelfieImage(file);
      else if (target === "license") setLicenseImage(file);
      else if (target === "ownership") setOwnershipImage(file);
      closeCamera();
    }, "image/jpeg", 0.95);
  };
  const closeCamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setCamTarget(null);
  };
  const handleAgencyLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) setAgencyLogo(file); };
  const removeIdImage = (index: number) => setIdImages((prev) => prev.filter((_, i) => i !== index));
  const isAgent = userRole === "agent" && !isBuyer && !isHotel;

  const uploadOne = async (file: File, prefix: string) => {
    const ext = file.name.split(".").pop();
    const path = `${user!.id}/${prefix}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("verification-docs").upload(path, file);
    if (error) throw error;
    return path;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      if (isHotel) {
        hotelVerificationSchema.parse(formData);
        if (!licenseImage) { toast({ title: "Business license photo required", variant: "destructive" }); return; }
        if (!ownershipImage) { toast({ title: "Ownership proof photo required", variant: "destructive" }); return; }
        if (!selfieImage) { toast({ title: "Owner selfie required", variant: "destructive" }); return; }
      } else {
        if (isBuyer) buyerVerificationSchema.parse(formData);
        else if (isAgent) agentVerificationSchema.parse(formData);
        else ownerVerificationSchema.parse(formData);
        if (idImages.length === 0) { toast({ title: "ID Required", description: "Please upload your ID card", variant: "destructive" }); return; }
        if (!selfieImage) { toast({ title: "Selfie Required", description: "Please upload a selfie holding your ID", variant: "destructive" }); return; }
      }
      setLoading(true);

      const insertData: any = {
        user_id: user.id,
        verification_type: isHotel ? "hotel" : isBuyer ? "buyer" : isAgent ? "agent" : "owner",
      };

      if (isHotel) {
        insertData.hotel_name = formData.hotelName;
        insertData.business_license_no = formData.businessLicenseNo;
        insertData.tin_number = formData.tinNumber;
        insertData.business_phone = formData.businessPhone;
        insertData.office_location = formData.officeLocation;
        insertData.business_license_photo = await uploadOne(licenseImage!, "license");
        insertData.ownership_proof_photo = await uploadOne(ownershipImage!, "ownership");
        insertData.selfie_image = await uploadOne(selfieImage!, "selfie");
      } else {
        const idPaths: string[] = [];
        for (const idImage of idImages) idPaths.push(await uploadOne(idImage, "id"));
        insertData.id_type = formData.idType;
        insertData.date_of_birth = formData.dateOfBirth;
        insertData.id_images = idPaths;
        insertData.selfie_image = await uploadOne(selfieImage!, "selfie");
        if (isAgent) {
          insertData.business_phone = formData.businessPhone;
          insertData.agency_name = formData.agencyName;
          insertData.office_location = formData.officeLocation;
          if (agencyLogo) insertData.agency_logo = await uploadOne(agencyLogo, "agency-logo");
        }
      }

      const { error } = await supabase.from("verification_requests").insert([insertData]);
      if (error) throw error;
      if (!isBuyer) {
        const profileUpdate: any = { verification_status: "pending" };
        if (isAgent) profileUpdate.role = "agent";
        await supabase.from("profiles").update(profileUpdate).eq("id", user.id);
      }
      const { data: profile } = await supabase.from("profiles").select("name").eq("id", user.id).single();
      const userName = profile?.name || "A user";
      const kind = isHotel ? "hotel" : isBuyer ? "buyer" : isAgent ? "agent" : "owner";
      await notifyAdmins({
        title: "New Verification Request",
        message: `${userName} submitted a ${kind} verification request.`,
        type: "status_updates",
      });
      toast({ title: "Success!", description: "Your verification request has been submitted." });
      navigate(isHotel ? "/hotel-dashboard" : "/profile");
    } catch (error: any) {
      if (error instanceof z.ZodError) toast({ title: "Validation Error", description: error.errors[0].message, variant: "destructive" });
      else toast({ title: "Error", description: error.message || "Failed to submit verification", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const title = isHotel ? "Hotel Business Verification" : isBuyer ? "Buyer Verification" : isAgent ? "Agent Verification" : "Owner Verification";
  const heroTitle = isHotel ? "Verify Your Hotel Business 🏨" : isBuyer ? "Get a Verified Buyer Badge" : isAgent ? "Get Your Blue Badge 🔵" : "Get Your Green Badge ✅";
  const heroSub = isHotel
    ? "Submit your business license, TIN and ownership proof so guests can book with confidence. Live camera captures only."
    : isBuyer ? "Verify your identity so owners and agents know your inquiries and offers come from a real person. It's free."
    : isAgent ? "Submit your documents and agency details to unlock unlimited listings and all features."
    : "Verify your identity to start listing properties and earn trust from buyers.";

  const CamCard = ({ label, image, target, onClear }: { label: string; image: File | null; target: CamTarget; onClear: () => void }) => (
    <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
      <span className="text-sm font-semibold">{label} *</span>
      {!image && camTarget !== target && (
        <Button type="button" onClick={() => openCamera(target)} className="w-full rounded-xl gap-2 h-12" variant="outline">
          <Camera className="h-5 w-5" />Take photo
        </Button>
      )}
      {camTarget === target && (
        <div className="space-y-3">
          <div className="relative w-full bg-black rounded-2xl overflow-hidden" style={{ aspectRatio: "4/3" }}>
            <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${target === "selfie" ? "transform scale-x-[-1]" : ""}`} />
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={capturePhoto} className="flex-1 rounded-xl h-11"><Camera className="h-4 w-4 mr-2" />Capture</Button>
            <Button type="button" onClick={closeCamera} variant="outline" className="flex-1 rounded-xl h-11">Cancel</Button>
          </div>
        </div>
      )}
      {image && camTarget !== target && (
        <div className="relative w-full">
          <img src={URL.createObjectURL(image)} alt={label} className="w-full h-44 object-cover rounded-2xl" />
          <Button type="button" variant="destructive" size="icon" className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full" onClick={onClear}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden md:block"><Navbar /></div>
      <div className="md:hidden sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" className="rounded-full shrink-0" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
          <h1 className="text-lg font-semibold truncate">{title}</h1>
        </div>
      </div>

      <main className="px-4 py-6 max-w-lg mx-auto pb-12 md:max-w-3xl md:py-10">
        <div className="flex flex-col items-center text-center mb-8">
          <div className={`h-20 w-20 rounded-full flex items-center justify-center mb-4 ${isHotel ? "bg-amber-500/10" : isBuyer ? "bg-primary/10" : isAgent ? "bg-blue-500/10" : "bg-green-500/10"}`}>
            {isHotel ? <HotelIcon className="h-10 w-10 text-amber-600" />
              : isBuyer ? <ShieldCheck className="h-10 w-10 text-primary" />
              : isAgent ? <Building2 className="h-10 w-10 text-blue-500" />
              : <User className="h-10 w-10 text-green-500" />}
          </div>
          <h2 className="text-xl md:text-2xl font-bold mb-1">{heroTitle}</h2>
          <p className="text-sm text-muted-foreground max-w-md">{heroSub}</p>
        </div>

        {/* HOTEL FORM */}
        {isHotel ? (
          <form onSubmit={handleSubmit} className="space-y-5 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
            <div className="space-y-5">
              <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
                <div className="flex items-center gap-2 mb-1"><HotelIcon className="h-4 w-4 text-amber-600" /><span className="text-sm font-semibold">Business Information</span></div>
                <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Hotel Name *</Label><Input value={formData.hotelName} onChange={(e) => setFormData({ ...formData, hotelName: e.target.value })} placeholder="Legal registered name" required className="rounded-xl" /></div>
                <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Business License No. *</Label><Input value={formData.businessLicenseNo} onChange={(e) => setFormData({ ...formData, businessLicenseNo: e.target.value })} placeholder="Issued by LBR/MOCI" required className="rounded-xl" /></div>
                <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">TIN Number *</Label><Input value={formData.tinNumber} onChange={(e) => setFormData({ ...formData, tinNumber: e.target.value })} placeholder="Tax Identification Number" required className="rounded-xl" /></div>
                <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Business Phone *</Label><Input type="tel" value={formData.businessPhone} onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })} placeholder="+231..." required className="rounded-xl" /></div>
                <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Hotel Address / Location *</Label><Input value={formData.officeLocation} onChange={(e) => setFormData({ ...formData, officeLocation: e.target.value })} placeholder="e.g., Sinkor, Monrovia" required className="rounded-xl" /></div>
              </div>
              <CamCard label="Business License Photo" image={licenseImage} target="license" onClear={() => setLicenseImage(null)} />
            </div>
            <div className="space-y-5">
              <CamCard label="Ownership / Property Deed Photo" image={ownershipImage} target="ownership" onClear={() => setOwnershipImage(null)} />
              <CamCard label="Owner Selfie" image={selfieImage} target="selfie" onClear={() => setSelfieImage(null)} />
              <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs flex gap-2">
                <FileText className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>All photos must be captured live — uploads from gallery are not accepted. Admin will review within 24–48 hours.</span>
              </div>
              <Button type="submit" disabled={loading} className="w-full h-14 rounded-2xl text-base font-semibold">
                {loading ? "Submitting..." : "Submit Hotel Verification"}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
            <div className="space-y-5">
              {isAgent && (
                <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
                  <div className="flex items-center gap-2 mb-1"><ShieldCheck className="h-4 w-4 text-blue-500" /><span className="text-sm font-semibold">Business Contact</span></div>
                  <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Business Phone *</Label><Input type="tel" value={formData.businessPhone} onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })} placeholder="+231..." required className="rounded-xl" /></div>
                </div>
              )}
              <div className="bg-card rounded-2xl p-4 border border-border space-y-4">
                <div className="flex items-center gap-2 mb-1"><User className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-semibold">Personal Information</span></div>
                <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Date of Birth *</Label><Input type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} required className="rounded-xl" /></div>
                <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">National ID Type *</Label><Select value={formData.idType} onValueChange={(v: any) => setFormData({ ...formData, idType: v })}><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="citizen_card">Citizen Card</SelectItem><SelectItem value="voter_card">Voter Card</SelectItem><SelectItem value="passport">Passport</SelectItem></SelectContent></Select></div>
              </div>
              <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
                <div className="flex items-center justify-between mb-1"><span className="text-sm font-semibold">National ID (Front & Back) *</span><span className="text-xs text-muted-foreground">{idImages.length}/2</span></div>
                <input type="file" accept="image/*" multiple onChange={handleIdImagesChange} className="hidden" id="id-upload" disabled={idImages.length >= 2} />
                <label htmlFor="id-upload" className={`flex items-center justify-center gap-3 border-2 border-dashed border-border rounded-2xl p-5 cursor-pointer transition-colors hover:border-primary/50 ${idImages.length >= 2 ? "opacity-50 pointer-events-none" : ""}`}><Upload className="h-6 w-6 text-muted-foreground" /><span className="text-sm text-muted-foreground">Tap to upload ID images</span></label>
                {idImages.length > 0 && (<div className="grid grid-cols-2 gap-2">{idImages.map((image, index) => (<div key={index} className="relative rounded-xl overflow-hidden"><img src={URL.createObjectURL(image)} alt={`ID ${index + 1}`} className="w-full h-28 object-cover" /><Button type="button" variant="destructive" size="icon" className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full" onClick={() => removeIdImage(index)}><X className="h-3.5 w-3.5" /></Button></div>))}</div>)}
              </div>
            </div>
            <div className="space-y-5">
              <CamCard label="Selfie Holding ID" image={selfieImage} target="selfie" onClear={() => setSelfieImage(null)} />
              {isAgent && (
                <div className="bg-card rounded-2xl p-4 border border-border space-y-4">
                  <div className="flex items-center gap-2 mb-1"><Building2 className="h-4 w-4 text-blue-500" /><span className="text-sm font-semibold">Agency Information</span></div>
                  <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Agency Name *</Label><Input value={formData.agencyName} onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })} placeholder="Your agency or company name" required className="rounded-xl" /></div>
                  <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Office Location *</Label><Input value={formData.officeLocation} onChange={(e) => setFormData({ ...formData, officeLocation: e.target.value })} placeholder="e.g., Congo Town, Monrovia" required className="rounded-xl" /></div>
                  <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Agency Logo (Optional)</Label><input type="file" accept="image/*" onChange={handleAgencyLogoChange} className="hidden" id="logo-upload" /><label htmlFor="logo-upload" className="flex items-center justify-center gap-3 border-2 border-dashed border-border rounded-2xl p-4 cursor-pointer transition-colors hover:border-primary/50"><Upload className="h-5 w-5 text-muted-foreground" /><span className="text-sm text-muted-foreground">Upload Logo</span></label>
                    {agencyLogo && (<div className="relative w-24 mx-auto"><img src={URL.createObjectURL(agencyLogo)} alt="Logo" className="w-full h-24 object-cover rounded-xl" /><Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-5 w-5 rounded-full" onClick={() => setAgencyLogo(null)}><X className="h-3 w-3" /></Button></div>)}
                  </div>
                </div>
              )}
              <Button type="submit" disabled={loading} className="w-full h-14 rounded-2xl text-base font-semibold md:col-span-2">
                {loading ? "Submitting..." : "Submit for Verification"}
              </Button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};

export default Verification;
