import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ZoomIn } from "lucide-react";

interface VerificationRequest {
  id: string;
  user_id: string;
  id_type: string;
  date_of_birth: string;
  id_images: string[];
  selfie_image: string;
  status: string;
  created_at: string;
  profiles: {
    name: string;
    email: string;
  } | null;
}

export function AdminVerifications() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const fetchRequests = async () => {
    const { data: requestsData, error: requestsError } = await supabase
      .from("verification_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (requestsError || !requestsData) return;

    const userIds = [...new Set(requestsData.map(r => r.user_id))];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, name, email")
      .in("id", userIds);

    const profilesMap = new Map(profilesData?.map(p => [p.id, p]));

    const enrichedRequests = requestsData.map(request => ({
      ...request,
      profiles: profilesMap.get(request.user_id) || null,
    }));

    setRequests(enrichedRequests as VerificationRequest[]);

    // Generate signed URLs for all verification documents
    const urlMap: Record<string, string> = {};
    for (const request of requestsData) {
      // Generate signed URLs for ID images
      for (const idPath of request.id_images) {
        if (!urlMap[idPath]) {
          const { data } = await supabase.storage
            .from("verification-docs")
            .createSignedUrl(idPath, 3600); // 1 hour expiry
          if (data?.signedUrl) {
            urlMap[idPath] = data.signedUrl;
          }
        }
      }
      
      // Generate signed URL for selfie
      if (!urlMap[request.selfie_image]) {
        const { data } = await supabase.storage
          .from("verification-docs")
          .createSignedUrl(request.selfie_image, 3600);
        if (data?.signedUrl) {
          urlMap[request.selfie_image] = data.signedUrl;
        }
      }
    }
    setSignedUrls(urlMap);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (requestId: string, userId: string) => {
    try {
      const { error } = await supabase.functions.invoke('process-verification', {
        body: {
          requestId,
          userId,
          action: 'approve',
          adminNote: notes[requestId] || null,
        },
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Verification request approved',
      });

      fetchRequests();
    } catch (err: any) {
      console.error('Approve error:', err);
      toast({
        title: 'Error',
        description: err?.message || 'Failed to approve request',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (requestId: string, userId: string) => {
    if (!notes[requestId]) {
      toast({
        title: 'Error',
        description: 'Please provide a rejection reason',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('process-verification', {
        body: {
          requestId,
          userId,
          action: 'reject',
          adminNote: notes[requestId],
        },
      });

      if (error) throw error;

      setNotes((prev) => {
        const newNotes = { ...prev };
        delete newNotes[requestId];
        return newNotes;
      });

      toast({
        title: 'Success',
        description: 'Verification request rejected',
      });

      fetchRequests();
    } catch (err: any) {
      console.error('Reject error:', err);
      toast({
        title: 'Error',
        description: err?.message || 'Failed to reject request',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6 mt-6">
      {requests.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No pending verification requests
            </p>
          </CardContent>
        </Card>
      ) : (
        requests.map((request) => (
          <Card key={request.id}>
            <CardHeader className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex-1">
                  <CardTitle className="text-base md:text-lg break-words">{request.profiles?.name || 'Unknown'}</CardTitle>
                  <p className="text-sm text-muted-foreground break-all mt-1">
                    {request.profiles?.email || 'No email'}
                  </p>
                </div>
                <Badge variant="secondary" className="self-start sm:self-center">
                  {request.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-4 md:p-6 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <p className="text-sm font-medium">Date of Birth</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(request.date_of_birth), "PPP")}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">ID Type</p>
                  <p className="text-sm text-muted-foreground">
                    {request.id_type}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Verification Documents</p>
                <div className="bg-secondary/30 p-3 md:p-4 rounded-lg space-y-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">ID Documents</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                      {request.id_images.map((imgPath, idx) => {
                        const signedUrl = signedUrls[imgPath];
                        if (!signedUrl) return null;
                        return (
                          <div key={idx} className="relative group cursor-pointer" onClick={() => setSelectedImage(signedUrl)}>
                            <img
                              src={signedUrl}
                              alt={`ID ${idx + 1}`}
                              className="rounded-lg border-2 border-border w-full h-40 md:h-48 object-contain bg-white"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                              <ZoomIn className="h-6 w-6 md:h-8 md:w-8 text-white" />
                            </div>
                            <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                              Click to enlarge
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Selfie Photo</p>
                    {signedUrls[request.selfie_image] && (
                      <div 
                        className="relative group cursor-pointer inline-block w-full sm:max-w-xs" 
                        onClick={() => setSelectedImage(signedUrls[request.selfie_image])}
                      >
                        <img
                          src={signedUrls[request.selfie_image]}
                          alt="Selfie"
                          className="rounded-lg border-2 border-border w-full h-48 md:h-64 object-contain bg-white"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <ZoomIn className="h-6 w-6 md:h-8 md:w-8 text-white" />
                        </div>
                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                          Click to enlarge
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Admin Note</p>
                <Textarea
                  placeholder="Add a note (optional for approval, required for rejection)"
                  value={notes[request.id] || ""}
                  onChange={(e) =>
                    setNotes({ ...notes, [request.id]: e.target.value })
                  }
                  className="min-h-[80px]"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button
                  onClick={() => handleApprove(request.id, request.user_id)}
                  className="flex-1"
                >
                  Approve
                </Button>
                <Button
                  onClick={() => handleReject(request.id, request.user_id)}
                  variant="destructive"
                  className="flex-1"
                >
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Verification Document</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="flex items-center justify-center p-2 md:p-4">
              <img
                src={selectedImage}
                alt="Verification document"
                className="max-w-full h-auto rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
