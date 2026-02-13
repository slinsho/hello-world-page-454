import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Upload, X, Camera, Building2, User } from "lucide-react";
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
    // Fetch user role
    const fetchRole = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (data) setUserRole(data.role);
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
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(err => console.error("Error playing video:", err));
        }
      }, 100);
    } catch (error) {
      console.error("Camera error:", error);
      toast({ title: "Camera Error", description: "Unable to access camera. Please check permissions.", variant: "destructive" });
    }
  };

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

      // Upload ID images
      const idPaths: string[] = [];
      for (const idImage of idImages) {
        const fileExt = idImage.name.split(".").pop();
        const fileName = `${user.id}/id-${Date.now()}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("verification-docs").upload(fileName, idImage);
        if (uploadError) throw uploadError;
        idPaths.push(fileName);
      }

      // Upload selfie
      const selfieExt = selfieImage.name.split(".").pop();
      const selfieFileName = `${user.id}/selfie-${Date.now()}.${selfieExt}`;
      const { error: selfieError } = await supabase.storage.from("verification-docs").upload(selfieFileName, selfieImage);
      if (selfieError) throw selfieError;

      // Upload agency logo if agent
      let agencyLogoPath: string | null = null;
      if (isAgent && agencyLogo) {
        const logoExt = agencyLogo.name.split(".").pop();
        const logoFileName = `${user.id}/agency-logo-${Date.now()}.${logoExt}`;
        const { error: logoError } = await supabase.storage.from("verification-docs").upload(logoFileName, agencyLogo);
        if (logoError) throw logoError;
        agencyLogoPath = logoFileName;
      }

      // Create verification request
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

      // Update profile status
      await supabase
        .from("profiles")
        .update({ verification_status: "pending" })
        .eq("id", user.id);

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
      <Navbar />
      
      <main className="container py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              {isAgent ? (
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-500" />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-green-500" />
                </div>
              )}
              <div>
                <CardTitle>{isAgent ? "Agent Verification" : "Owner Verification"}</CardTitle>
                <CardDescription>
                  {isAgent
                    ? "Submit your documents and agency details to get your blue verified badge"
                    : "Submit your documents to get your green verified badge and start listing properties"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Phone Number - Agent only */}
              {isAgent && (
                <div className="space-y-2">
                  <Label htmlFor="businessPhone">Business Phone *</Label>
                  <Input
                    id="businessPhone"
                    type="tel"
                    value={formData.businessPhone}
                    onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })}
                    placeholder="+231..."
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth *</Label>
                <Input
                  id="dob"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>National ID Type *</Label>
                <Select
                  value={formData.idType}
                  onValueChange={(value: any) => setFormData({ ...formData, idType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="citizen_card">Citizen Card</SelectItem>
                    <SelectItem value="voter_card">Voter Card</SelectItem>
                    <SelectItem value="passport">Passport</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>National ID (Front & Back) * (Max 2)</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleIdImagesChange}
                    className="hidden"
                    id="id-upload"
                    disabled={idImages.length >= 2}
                  />
                  <label htmlFor="id-upload" className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Upload ID images ({idImages.length}/2)</span>
                  </label>
                </div>

                {idImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {idImages.map((image, index) => (
                      <div key={index} className="relative">
                        <img src={URL.createObjectURL(image)} alt={`ID ${index + 1}`} className="w-full h-32 object-cover rounded" />
                        <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => removeIdImage(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Selfie Holding ID *</Label>
                
                {!isCameraOpen && !selfieImage && (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      <Button type="button" onClick={openCamera} className="w-full flex items-center justify-center gap-2" variant="outline">
                        <Camera className="h-5 w-5" />
                        Take Selfie with Camera
                      </Button>
                    </div>
                    <div className="relative text-center">
                      <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                      <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or</span></div>
                    </div>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      <input type="file" accept="image/*" onChange={handleSelfieChange} className="hidden" id="selfie-upload" />
                      <label htmlFor="selfie-upload" className="cursor-pointer flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Upload selfie from files</span>
                      </label>
                    </div>
                  </div>
                )}

                {isCameraOpen && (
                  <div className="space-y-4">
                    <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" onClick={capturePhoto} className="flex-1">
                        <Camera className="h-4 w-4 mr-2" />
                        Capture Photo
                      </Button>
                      <Button type="button" onClick={closeCamera} variant="outline" className="flex-1">Cancel</Button>
                    </div>
                  </div>
                )}

                {selfieImage && !isCameraOpen && (
                  <div className="relative mt-4 w-48 mx-auto">
                    <img src={URL.createObjectURL(selfieImage)} alt="Selfie" className="w-full h-48 object-cover rounded" />
                    <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => setSelfieImage(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Agent-specific: Agency Information */}
              {isAgent && (
                <div className="space-y-4 border-t pt-6">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-500" />
                    Agency Information
                  </h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="agencyName">Agency Name *</Label>
                    <Input
                      id="agencyName"
                      value={formData.agencyName}
                      onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                      placeholder="Your agency or company name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="officeLocation">Office Location *</Label>
                    <Input
                      id="officeLocation"
                      value={formData.officeLocation}
                      onChange={(e) => setFormData({ ...formData, officeLocation: e.target.value })}
                      placeholder="Office address"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Agency Logo (Optional)</Label>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      <input type="file" accept="image/*" onChange={handleAgencyLogoChange} className="hidden" id="logo-upload" />
                      <label htmlFor="logo-upload" className="cursor-pointer flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {agencyLogo ? agencyLogo.name : "Upload agency logo"}
                        </span>
                      </label>
                    </div>
                    {agencyLogo && (
                      <div className="relative mt-2 w-24 mx-auto">
                        <img src={URL.createObjectURL(agencyLogo)} alt="Agency Logo" className="w-24 h-24 object-cover rounded-xl" />
                        <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6" onClick={() => setAgencyLogo(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Submitting..." : `Submit ${isAgent ? "Agent" : "Owner"} Verification`}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Verification;
