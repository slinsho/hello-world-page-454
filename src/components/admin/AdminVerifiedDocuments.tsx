import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { ZoomIn, ShieldCheck, User } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ApprovedVerification {
  id: string;
  user_id: string;
  id_type: string;
  date_of_birth: string;
  id_images: string[];
  selfie_image: string;
  verification_type: string;
  agency_name: string | null;
  agency_logo: string | null;
  office_location: string | null;
  business_phone: string | null;
  processed_at: string | null;
  created_at: string;
  profiles: {
    name: string;
    email: string;
  } | null;
}

export function AdminVerifiedDocuments() {
  const [verifications, setVerifications] = useState<ApprovedVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");

  const fetchApproved = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("verification_requests")
      .select("*")
      .eq("status", "approved")
      .order("processed_at", { ascending: false });

    if (error || !data) {
      setLoading(false);
      return;
    }

    const userIds = [...new Set(data.map(r => r.user_id))];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, name, email")
      .in("id", userIds);

    const profilesMap = new Map(profilesData?.map(p => [p.id, p]));

    const enriched = data.map(r => ({
      ...r,
      profiles: profilesMap.get(r.user_id) || null,
    })) as ApprovedVerification[];

    setVerifications(enriched);

    // Generate signed URLs
    const urlMap: Record<string, string> = {};
    for (const req of data) {
      for (const imgPath of req.id_images) {
        if (!urlMap[imgPath]) {
          const { data: s } = await supabase.storage.from("verification-docs").createSignedUrl(imgPath, 3600);
          if (s?.signedUrl) urlMap[imgPath] = s.signedUrl;
        }
      }
      if (!urlMap[req.selfie_image]) {
        const { data: s } = await supabase.storage.from("verification-docs").createSignedUrl(req.selfie_image, 3600);
        if (s?.signedUrl) urlMap[req.selfie_image] = s.signedUrl;
      }
      if (req.agency_logo && !urlMap[req.agency_logo]) {
        const { data: s } = await supabase.storage.from("verification-docs").createSignedUrl(req.agency_logo, 3600);
        if (s?.signedUrl) urlMap[req.agency_logo] = s.signedUrl;
      }
    }
    setSignedUrls(urlMap);
    setLoading(false);
  };

  useEffect(() => {
    fetchApproved();
  }, []);

  const filtered = verifications.filter(v => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      v.profiles?.name?.toLowerCase().includes(q) ||
      v.profiles?.email?.toLowerCase().includes(q) ||
      v.agency_name?.toLowerCase().includes(q) ||
      v.id_type.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Verified Documents</h2>
          <p className="text-sm text-muted-foreground">{verifications.length} approved verification(s)</p>
        </div>
        <Input
          placeholder="Search by name, email, agency..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              {searchQuery ? "No results found" : "No approved verifications yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        filtered.map((v) => (
          <Card key={v.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{v.profiles?.name || "Unknown"}</CardTitle>
                  <Badge variant={v.verification_type === "agent" ? "default" : "secondary"} className="text-[10px]">
                    {v.verification_type === "agent" ? (
                      <><ShieldCheck className="h-3 w-3 mr-1" />Agent</>
                    ) : (
                      <><User className="h-3 w-3 mr-1" />Owner</>
                    )}
                  </Badge>
                </div>
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Approved</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{v.profiles?.email || "No email"}</p>
              {v.processed_at && (
                <p className="text-xs text-muted-foreground">
                  Approved on {format(new Date(v.processed_at), "PPP")}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">ID Type</p>
                  <p className="text-sm font-medium">{v.id_type}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Date of Birth</p>
                  <p className="text-sm font-medium">{format(new Date(v.date_of_birth), "PPP")}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Submitted</p>
                  <p className="text-sm font-medium">{format(new Date(v.created_at), "PPP")}</p>
                </div>
              </div>

              {v.verification_type === "agent" && (v.agency_name || v.office_location || v.business_phone) && (
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-semibold text-blue-500">Agency Information</p>
                  <div className="grid grid-cols-2 gap-3">
                    {v.agency_name && (
                      <div>
                        <p className="text-xs text-muted-foreground">Agency Name</p>
                        <p className="text-sm font-medium">{v.agency_name}</p>
                      </div>
                    )}
                    {v.office_location && (
                      <div>
                        <p className="text-xs text-muted-foreground">Office Location</p>
                        <p className="text-sm font-medium">{v.office_location}</p>
                      </div>
                    )}
                    {v.business_phone && (
                      <div>
                        <p className="text-xs text-muted-foreground">Business Phone</p>
                        <p className="text-sm font-medium">{v.business_phone}</p>
                      </div>
                    )}
                  </div>
                  {v.agency_logo && signedUrls[v.agency_logo] && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Agency Logo</p>
                      <img
                        src={signedUrls[v.agency_logo]}
                        alt="Agency Logo"
                        className="h-16 w-16 object-contain rounded-lg border border-border bg-white cursor-pointer"
                        onClick={() => setSelectedImage(signedUrls[v.agency_logo!])}
                      />
                    </div>
                  )}
                </div>
              )}

              <div>
                <p className="text-sm font-medium mb-2">Verification Documents</p>
                <div className="bg-secondary/30 p-4 rounded-lg space-y-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">ID Documents</p>
                    <div className="grid grid-cols-2 gap-3">
                      {v.id_images.map((imgPath, idx) => {
                        const url = signedUrls[imgPath];
                        if (!url) return null;
                        return (
                          <div key={idx} className="relative group cursor-pointer" onClick={() => setSelectedImage(url)}>
                            <img src={url} alt={`ID ${idx + 1}`} className="rounded-lg border-2 border-border w-full h-48 object-contain bg-white" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                              <ZoomIn className="h-8 w-8 text-white" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Selfie Photo</p>
                    {signedUrls[v.selfie_image] && (
                      <div className="relative group cursor-pointer inline-block w-full max-w-xs" onClick={() => setSelectedImage(signedUrls[v.selfie_image])}>
                        <img src={signedUrls[v.selfie_image]} alt="Selfie" className="rounded-lg border-2 border-border w-full h-64 object-contain bg-white" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <ZoomIn className="h-8 w-8 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Verification Document</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="flex items-center justify-center p-4">
              <img src={selectedImage} alt="Document" className="max-w-full h-auto rounded-lg" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
