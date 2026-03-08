import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { format } from "date-fns";
import { ZoomIn, DollarSign, CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";

interface VerificationRequest {
  id: string;
  user_id: string;
  id_type: string;
  date_of_birth: string;
  id_images: string[];
  selfie_image: string;
  status: string;
  created_at: string;
  verification_type: string;
  agency_name?: string;
  office_location?: string;
  business_phone?: string;
  agency_logo?: string;
  payment_status: string;
  payment_amount?: number;
  payment_reference?: string;
  payment_requested_at?: string;
  payment_confirmed_at?: string;
  expires_at?: string;
  is_renewal: boolean;
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
  const [processing, setProcessing] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const { settings } = usePlatformSettings();

  const fetchRequests = async () => {
    // Fetch pending, payment_requested, and renewal requests
    const { data: requestsData, error: requestsError } = await supabase
      .from("verification_requests")
      .select("*")
      .in("status", ["pending", "approved", "expired"])
      .order("created_at", { ascending: false });

    if (requestsError || !requestsData) return;

    // Filter: show pending ones, and ones with payment_requested status, and expired/renewal ones
    const filtered = (requestsData as any[]).filter((r) => 
      r.status === 'pending' || 
      r.payment_status === 'payment_requested' ||
      r.payment_status === 'submitted' ||
      (r.status === 'expired') ||
      (r.is_renewal === true && r.status !== 'approved')
    );

    const userIds = [...new Set(filtered.map((r: any) => r.user_id))];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, name, email")
      .in("id", userIds);

    const profilesMap = new Map(profilesData?.map((p) => [p.id, p]));

    const enrichedRequests = filtered.map((request: any) => ({
      ...request,
      profiles: profilesMap.get(request.user_id) || null,
    }));

    setRequests(enrichedRequests as VerificationRequest[]);

    // Generate signed URLs
    const urlMap: Record<string, string> = {};
    for (const request of filtered) {
      for (const idPath of (request as any).id_images || []) {
        if (!urlMap[idPath]) {
          const { data } = await supabase.storage.from("verification-docs").createSignedUrl(idPath, 3600);
          if (data?.signedUrl) urlMap[idPath] = data.signedUrl;
        }
      }
      if ((request as any).selfie_image && !urlMap[(request as any).selfie_image]) {
        const { data } = await supabase.storage.from("verification-docs").createSignedUrl((request as any).selfie_image, 3600);
        if (data?.signedUrl) urlMap[(request as any).selfie_image] = data.signedUrl;
      }
      if ((request as any).agency_logo && !urlMap[(request as any).agency_logo]) {
        const { data } = await supabase.storage.from("verification-docs").createSignedUrl((request as any).agency_logo, 3600);
        if (data?.signedUrl) urlMap[(request as any).agency_logo] = data.signedUrl;
      }
    }
    setSignedUrls(urlMap);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (requestId: string, userId: string, action: string) => {
    if (action === 'reject' && !notes[requestId]) {
      toast({ title: 'Error', description: 'Please provide a rejection reason', variant: 'destructive' });
      return;
    }

    setProcessing((prev) => ({ ...prev, [requestId]: true }));
    try {
      const { error } = await supabase.functions.invoke('process-verification', {
        body: { requestId, userId, action, adminNote: notes[requestId] || null },
      });
      if (error) throw error;

      const actionLabels: Record<string, string> = {
        reject: 'Verification rejected',
        request_payment: 'Payment requested from user',
        confirm_payment: 'Payment confirmed & verification approved',
        request_renewal_payment: 'Renewal payment requested from user',
        confirm_renewal_payment: 'Renewal payment confirmed & verification renewed',
      };

      toast({ title: 'Success', description: actionLabels[action] || 'Action completed' });
      fetchRequests();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Action failed', variant: 'destructive' });
    } finally {
      setProcessing((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  const getPaymentStatusBadge = (request: VerificationRequest) => {
    const ps = request.payment_status;
    if (ps === 'none') return null;
    if (ps === 'payment_requested') return <Badge variant="outline" className="text-yellow-500 border-yellow-500/30">Payment Requested</Badge>;
    if (ps === 'submitted') return <Badge variant="outline" className="text-blue-500 border-blue-500/30">Payment Submitted</Badge>;
    if (ps === 'confirmed') return <Badge variant="outline" className="text-green-500 border-green-500/30">Payment Confirmed</Badge>;
    return null;
  };

  const getStatusBadge = (request: VerificationRequest) => {
    if (request.status === 'pending') return <Badge variant="secondary">Pending</Badge>;
    if (request.status === 'expired') return <Badge variant="destructive">Expired</Badge>;
    if (request.is_renewal) return <Badge variant="outline" className="text-orange-500 border-orange-500/30"><RefreshCw className="h-3 w-3 mr-1" />Renewal</Badge>;
    return <Badge variant="secondary">{request.status}</Badge>;
  };

  const getFeeDisplay = (request: VerificationRequest) => {
    const isAgent = request.verification_type === 'agent';
    if (isAgent) {
      return `$${settings.agent_verification_fee_usd} (L$${(settings.agent_verification_fee_usd * settings.usd_to_lrd_rate).toLocaleString()})`;
    }
    return `L$${settings.owner_verification_fee_lrd.toLocaleString()} ($${(settings.owner_verification_fee_lrd / settings.usd_to_lrd_rate).toFixed(2)})`;
  };

  return (
    <div className="space-y-6 mt-6">
      {requests.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No pending verification requests</p>
          </CardContent>
        </Card>
      ) : (
        requests.map((request) => (
          <Card key={request.id}>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base">{request.profiles?.name || 'Unknown'}</CardTitle>
                <div className="flex items-center gap-2">
                  {getStatusBadge(request)}
                  {getPaymentStatusBadge(request)}
                  <Badge variant={request.verification_type === 'agent' ? 'default' : 'secondary'}>
                    {request.verification_type === 'agent' ? '🔵 Agent' : '✅ Owner'}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{request.profiles?.email || 'No email'}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Fee info */}
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="font-medium">Verification Fee:</span>
                  <span>{getFeeDisplay(request)}</span>
                </div>
                {request.expires_at && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(request.expires_at) > new Date() 
                      ? `Expires: ${format(new Date(request.expires_at), 'PPP')}` 
                      : `Expired: ${format(new Date(request.expires_at), 'PPP')}`}
                  </p>
                )}
              </div>

              {/* Payment reference if submitted */}
              {request.payment_reference && (
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                  <p className="text-xs font-medium text-blue-500 mb-1">Payment Reference</p>
                  <p className="text-sm font-mono">{request.payment_reference}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Date of Birth</p>
                  <p className="text-sm text-muted-foreground">{format(new Date(request.date_of_birth), "PPP")}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">ID Type</p>
                  <p className="text-sm text-muted-foreground">{request.id_type}</p>
                </div>
              </div>

              {/* Agency Information */}
              {request.verification_type === 'agent' && (
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-blue-500">Agency Information</span>
                    <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-500">Agent</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {request.agency_name && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Agency Name</p>
                        <p className="text-sm font-medium">{request.agency_name}</p>
                      </div>
                    )}
                    {request.office_location && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Office Location</p>
                        <p className="text-sm font-medium">{request.office_location}</p>
                      </div>
                    )}
                    {request.business_phone && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Business Phone</p>
                        <p className="text-sm font-medium">{request.business_phone}</p>
                      </div>
                    )}
                  </div>
                  {request.agency_logo && signedUrls[request.agency_logo] && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Agency Logo</p>
                      <img
                        src={signedUrls[request.agency_logo]}
                        alt="Agency Logo"
                        className="h-16 w-16 object-contain rounded-lg border border-border bg-white cursor-pointer"
                        onClick={() => setSelectedImage(signedUrls[request.agency_logo!])}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Documents */}
              <div>
                <p className="text-sm font-medium mb-2">Verification Documents</p>
                <div className="bg-secondary/30 p-4 rounded-lg space-y-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">ID Documents</p>
                    <div className="grid grid-cols-2 gap-3">
                      {request.id_images.map((imgPath, idx) => {
                        const signedUrl = signedUrls[imgPath];
                        if (!signedUrl) return null;
                        return (
                          <div key={idx} className="relative group cursor-pointer" onClick={() => setSelectedImage(signedUrl)}>
                            <img src={signedUrl} alt={`ID ${idx + 1}`} className="rounded-lg border-2 border-border w-full h-48 object-contain bg-white" />
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
                    {signedUrls[request.selfie_image] && (
                      <div className="relative group cursor-pointer inline-block w-full max-w-xs" onClick={() => setSelectedImage(signedUrls[request.selfie_image])}>
                        <img src={signedUrls[request.selfie_image]} alt="Selfie" className="rounded-lg border-2 border-border w-full h-64 object-contain bg-white" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <ZoomIn className="h-8 w-8 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Admin Note */}
              <div>
                <p className="text-sm font-medium mb-2">Admin Note</p>
                <Textarea
                  placeholder="Add a note (required for rejection)"
                  value={notes[request.id] || ""}
                  onChange={(e) => setNotes({ ...notes, [request.id]: e.target.value })}
                />
              </div>

              {/* Action Buttons - Dynamic based on state */}
              <div className="flex flex-col gap-3">
                {/* New/Pending: Request Payment or Reject */}
                {request.status === 'pending' && request.payment_status === 'none' && (
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleAction(request.id, request.user_id, 'request_payment')}
                      disabled={processing[request.id]}
                      className="flex-1 gap-2"
                    >
                      <DollarSign className="h-4 w-4" />
                      Request Payment ({getFeeDisplay(request)})
                    </Button>
                    <Button
                      onClick={() => handleAction(request.id, request.user_id, 'reject')}
                      disabled={processing[request.id]}
                      variant="destructive"
                      className="flex-1 gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                )}

                {/* Payment Requested: Confirm Payment or Reject */}
                {(request.payment_status === 'payment_requested' || request.payment_status === 'submitted') && request.status === 'pending' && (
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleAction(request.id, request.user_id, 'confirm_payment')}
                      disabled={processing[request.id]}
                      className="flex-1 gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Confirm Payment & Approve
                    </Button>
                    <Button
                      onClick={() => handleAction(request.id, request.user_id, 'reject')}
                      disabled={processing[request.id]}
                      variant="destructive"
                      className="flex-1 gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                )}

                {/* Expired: Request Renewal Payment */}
                {request.status === 'expired' && request.payment_status !== 'payment_requested' && (
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleAction(request.id, request.user_id, 'request_renewal_payment')}
                      disabled={processing[request.id]}
                      className="flex-1 gap-2"
                    >
                      <DollarSign className="h-4 w-4" />
                      Request Renewal Payment
                    </Button>
                  </div>
                )}

                {/* Renewal Payment Requested: Confirm */}
                {request.status === 'expired' && request.payment_status === 'payment_requested' && (
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleAction(request.id, request.user_id, 'confirm_renewal_payment')}
                      disabled={processing[request.id]}
                      className="flex-1 gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Confirm Renewal Payment & Approve
                    </Button>
                  </div>
                )}

                {processing[request.id] && (
                  <p className="text-xs text-muted-foreground text-center animate-pulse">Processing...</p>
                )}
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
              <img src={selectedImage} alt="Verification document" className="max-w-full h-auto rounded-lg" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
