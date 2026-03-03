import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Upload, X, Camera, Building2, User, ArrowLeft, ShieldCheck, ChevronRight } from "lucide-react";
import { z } from "zod";

const ownerVerificationSchema = z.object({
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  idType: z.enum(["citizen_card", "voter_card", "passport"]),
});

const agentVerificationSchema = z.object({
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  idType: z.enum(["citizen_card", "voter_card", "passport"]),
  businessPhone: z.string().min(5, "Business phone is required"),
  agencyName: z.string().min(2, "Agency name is required"),
  officeLocation: z.string().min(3, "Office location is required"),
});

const Verification = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [idImages, setIdImages] = useState<File[]>([]);
  const [selfieImage, setSelfieImage] = useState<File | null>(null);
  const [agencyLogo, setAgencyLogo] = useState<File | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [formData, setFormData] = useState({
    dateOfBirth: "",
    idType: "citizen_card" as "citizen_card" | "voter_card" | "passport",
    businessPhone: "",
    agencyName: "",
    officeLocation: "",
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    const fetchRole = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (data) {
        const params = new URLSearchParams(window.location.search);
        if (params.get("upgrade") === "agent") {
          setUserRole("agent");
        } else {
          setUserRole(data.role);
        }
      }
    };
    fetchRole();
  }, [user, navigate]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleIdImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setIdImages((prev) => [...prev, ...files].slice(0, 2));
  };

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setIsCameraOpen(true);
    } catch (error) {
      console.error("Camera error:", error);
      toast({ title: "Camera Error", description: "Unable to access camera. Please check permissions.", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (isCameraOpen && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(err => console.error("Error playing video:", err));
    }
  }, [isCameraOpen]);

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: "image/jpeg" });
        setSelfieImage(file);
        closeCamera();
      }
    }, "image/jpeg", 0.95);
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const handleSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelfieImage(file);
  };

  const handleAgencyLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAgencyLogo(file);
  };

  const removeIdImage = (index: number) => {
    setIdImages((prev) => prev.filter((_, i) => i !== index));
  };

  const isAgent = userRole === "agent";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (isAgent) {
        agentVerificationSchema.parse(formData);
      } else {
        ownerVerificationSchema.parse(formData);
      }

      if (idImages.length === 0) {
        toast({ title: "ID Required", description: "Please upload your ID card", variant: "destructive" });
        return;
      }
      if (!selfieImage) {
        toast({ title: "Selfie Required", description: "Please upload a selfie holding your ID", variant: "destructive" });
        return;
      }

      setLoading(true);

      const idPaths: string[] = [];
      for (const idImage of idImages) {
        const fileExt = idImage.name.split(".").pop();
        const fileName = `${user.id}/id-${Date.now()}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("verification-docs").upload(fileName, idImage);
        if (uploadError) throw uploadError;
        idPaths.push(fileName);
      }

      const selfieExt = selfieImage.name.split(".").pop();
      const selfieFileName = `${user.id}/selfie-${Date.now()}.${selfieExt}`;
      const { error: selfieError } = await supabase.storage.from("verification-docs").upload(selfieFileName, selfieImage);
      if (selfieError) throw selfieError;

      let agencyLogoPath: string | null = null;
      if (isAgent && agencyLogo) {
        const logoExt = agencyLogo.name.split(".").pop();
        const logoFileName = `${user.id}/agency-logo-${Date.now()}.${logoExt}`;
        const { error: logoError } = await supabase.storage.from("verification-docs").upload(logoFileName, agencyLogo);
        if (logoError) throw logoError;
        agencyLogoPath = logoFileName;
      }

      const insertData: any = {
        user_id: user.id,
        date_of_birth: formData.dateOfBirth,
        id_type: formData.idType,
        id_images: idPaths,
        selfie_image: selfieFileName,
        verification_type: isAgent ? "agent" : "owner",
      };

      if (isAgent) {
        insertData.business_phone = formData.businessPhone;
        insertData.agency_name = formData.agencyName;
        insertData.office_location = formData.officeLocation;
        if (agencyLogoPath) insertData.agency_logo = agencyLogoPath;
      }

      const { error } = await supabase.from("verification_requests").insert([insertData]);
      if (error) throw error;

      const profileUpdate: any = { verification_status: "pending" };
      if (isAgent) {
        profileUpdate.role = "agent";
      }
      await supabase.from("profiles").update(profileUpdate).eq("id", user.id);

      toast({ title: "Success!", description: "Your verification request has been submitted." });
      navigate("/profile");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({ title: "Validation Error", description: error.errors[0].message, variant: "destructive" });
      } else {
        toast({ title: "Error", description: error.message || "Failed to submit verification", variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile App Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" className="rounded-full shrink-0" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold truncate">
            {isAgent ? "Agent Verification" : "Owner Verification"}
          </h1>
        </div>
      </div>

      <main className="px-4 py-6 max-w-lg mx-auto pb-12">
        {/* Hero Badge */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className={`h-20 w-20 rounded-full flex items-center justify-center mb-4 ${isAgent ? "bg-blue-500/10" : "bg-green-500/10"}`}>
            {isAgent ? (
              <Building2 className="h-10 w-10 text-blue-500" />
            ) : (
              <User className="h-10 w-10 text-green-500" />
            )}
          </div>
          <h2 className="text-xl font-bold mb-1">
            {isAgent ? "Get Your Blue Badge 🔵" : "Get Your Green Badge ✅"}
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            {isAgent
              ? "Submit your documents and agency details to unlock unlimited listings and all features."
              : "Verify your identity to start listing properties and earn trust from buyers."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Agent: Business Phone */}
          {isAgent && (
            <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-semibold">Business Contact</span>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="businessPhone" className="text-xs text-muted-foreground">Business Phone *</Label>
                <Input
                  id="businessPhone"
                  type="tel"
                  value={formData.businessPhone}
                  onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })}
                  placeholder="+231..."
                  required
                  className="rounded-xl"
                />
              </div>
            </div>
          )}

          {/* Personal Info Card */}
          <div className="bg-card rounded-2xl p-4 border border-border space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Personal Information</span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dob" className="text-xs text-muted-foreground">Date of Birth *</Label>
              <Input
                id="dob"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                required
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">National ID Type *</Label>
              <Select
                value={formData.idType}
                onValueChange={(value: any) => setFormData({ ...formData, idType: value })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="citizen_card">Citizen Card</SelectItem>
                  <SelectItem value="voter_card">Voter Card</SelectItem>
                  <SelectItem value="passport">Passport</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ID Upload Card */}
          <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold">National ID (Front & Back) *</span>
              <span className="text-xs text-muted-foreground">{idImages.length}/2</span>
            </div>

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleIdImagesChange}
              className="hidden"
              id="id-upload"
              disabled={idImages.length >= 2}
            />
            <label
              htmlFor="id-upload"
              className={`flex items-center justify-center gap-3 border-2 border-dashed border-border rounded-2xl p-5 cursor-pointer transition-colors hover:border-primary/50 ${idImages.length >= 2 ? "opacity-50 pointer-events-none" : ""}`}
            >
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Tap to upload ID images</span>
            </label>

            {idImages.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {idImages.map((image, index) => (
                  <div key={index} className="relative rounded-xl overflow-hidden">
                    <img src={URL.createObjectURL(image)} alt={`ID ${index + 1}`} className="w-full h-28 object-cover" />
                    <Button type="button" variant="destructive" size="icon" className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full" onClick={() => removeIdImage(index)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selfie Card */}
          <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
            <span className="text-sm font-semibold">Selfie Holding ID *</span>

            {!isCameraOpen && !selfieImage && (
              <div className="space-y-3">
                <Button type="button" onClick={openCamera} className="w-full rounded-xl gap-2 h-12" variant="outline">
                  <Camera className="h-5 w-5" />
                  Take Selfie with Camera
                </Button>
                <div className="relative text-center">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or</span></div>
                </div>
                <div>
                  <input type="file" accept="image/*" onChange={handleSelfieChange} className="hidden" id="selfie-upload" />
                  <label
                    htmlFor="selfie-upload"
                    className="flex items-center justify-center gap-3 border-2 border-dashed border-border rounded-2xl p-5 cursor-pointer transition-colors hover:border-primary/50"
                  >
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Upload from files</span>
                  </label>
                </div>
              </div>
            )}

            {isCameraOpen && (
              <div className="space-y-3">
                <div className="relative w-full bg-black rounded-2xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                </div>
                <div className="flex gap-2">
                  <Button type="button" onClick={capturePhoto} className="flex-1 rounded-xl h-11">
                    <Camera className="h-4 w-4 mr-2" />
                    Capture
                  </Button>
                  <Button type="button" onClick={closeCamera} variant="outline" className="flex-1 rounded-xl h-11">Cancel</Button>
                </div>
              </div>
            )}

            {selfieImage && !isCameraOpen && (
              <div className="relative w-40 mx-auto">
                <img src={URL.createObjectURL(selfieImage)} alt="Selfie" className="w-full h-40 object-cover rounded-2xl" />
                <Button type="button" variant="destructive" size="icon" className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full" onClick={() => setSelfieImage(null)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>

          {/* Agent: Agency Information Card */}
          {isAgent && (
            <div className="bg-card rounded-2xl p-4 border border-border space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-semibold">Agency Information</span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="agencyName" className="text-xs text-muted-foreground">Agency Name *</Label>
                <Input
                  id="agencyName"
                  value={formData.agencyName}
                  onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                  placeholder="Your agency or company name"
                  required
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="officeLocation" className="text-xs text-muted-foreground">Office Location *</Label>
                <Input
                  id="officeLocation"
                  value={formData.officeLocation}
                  onChange={(e) => setFormData({ ...formData, officeLocation: e.target.value })}
                  placeholder="Office address"
                  required
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Agency Logo (Optional)</Label>
                <input type="file" accept="image/*" onChange={handleAgencyLogoChange} className="hidden" id="logo-upload" />
                <label
                  htmlFor="logo-upload"
                  className="flex items-center justify-center gap-3 border-2 border-dashed border-border rounded-2xl p-4 cursor-pointer transition-colors hover:border-primary/50"
                >
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {agencyLogo ? agencyLogo.name : "Upload agency logo"}
                  </span>
                </label>
                {agencyLogo && (
                  <div className="relative w-20 mx-auto mt-2">
                    <img src={URL.createObjectURL(agencyLogo)} alt="Agency Logo" className="w-20 h-20 object-cover rounded-xl" />
                    <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => setAgencyLogo(null)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button type="submit" className="w-full rounded-xl h-12 text-base font-semibold" disabled={loading}>
            {loading ? "Submitting..." : `Submit ${isAgent ? "Agent" : "Owner"} Verification`}
          </Button>
        </form>
      </main>
    </div>
  );
};

export default Verification;
