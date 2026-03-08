import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, DollarSign, Mail, Phone, User, Clock, Home, ChevronDown, ChevronUp, CheckCircle } from "lucide-react";
import { useFormatLRD } from "@/hooks/usePlatformSettings";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Inquiry {
  id: string;
  sender_name: string;
  sender_email: string | null;
  sender_phone: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
  property_id: string;
  property_title?: string;
  property_photo?: string;
}

interface Offer {
  id: string;
  buyer_name: string;
  buyer_phone: string;
  offer_amount_usd: number;
  message: string | null;
  status: string;
  created_at: string;
  property_id: string;
  property_title?: string;
  property_photo?: string;
}

interface DashboardInquiriesProps {
  userId: string;
  propertyIds: string[];
}

export function DashboardInquiries({ userId, propertyIds }: DashboardInquiriesProps) {
  const { toast } = useToast();
  const formatLRD = useFormatLRD();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedInquiry, setExpandedInquiry] = useState<string | null>(null);
  const [expandedOffer, setExpandedOffer] = useState<string | null>(null);

  useEffect(() => {
    if (propertyIds.length > 0) fetchData();
    else setLoading(false);
  }, [propertyIds]);

  const fetchData = async () => {
    const [{ data: inquiriesData }, { data: offersData }, { data: propsData }] = await Promise.all([
      supabase.from("property_inquiries").select("*").in("property_id", propertyIds).order("created_at", { ascending: false }).limit(50),
      supabase.from("property_offers").select("*").in("property_id", propertyIds).order("created_at", { ascending: false }).limit(50),
      supabase.from("properties").select("id, title, photos").in("id", propertyIds),
    ]);

    const propsMap = new Map(propsData?.map(p => [p.id, { title: p.title, photo: p.photos?.[0] }]) || []);

    setInquiries((inquiriesData || []).map(inq => ({
      ...inq,
      property_title: propsMap.get(inq.property_id)?.title || "Unknown",
      property_photo: propsMap.get(inq.property_id)?.photo,
    })));

    setOffers((offersData || []).map(off => ({
      ...off,
      property_title: propsMap.get(off.property_id)?.title || "Unknown",
      property_photo: propsMap.get(off.property_id)?.photo,
    })));

    setLoading(false);
  };

  const markInquiryRead = async (id: string) => {
    await supabase.from("property_inquiries").update({ is_read: true }).eq("id", id);
    setInquiries(prev => prev.map(i => i.id === id ? { ...i, is_read: true } : i));
  };

  const updateOfferStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("property_offers").update({ status }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to update offer", variant: "destructive" });
      return;
    }
    setOffers(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    toast({ title: "Offer Updated", description: `Offer has been ${status}` });
  };

  const unreadCount = inquiries.filter(i => !i.is_read).length;
  const pendingOffers = offers.filter(o => o.status === "pending").length;

  if (loading) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-border animate-pulse">
        <div className="h-6 w-48 bg-muted rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <Tabs defaultValue="inquiries" className="w-full">
        <div className="px-4 pt-4">
          <TabsList className="w-full grid grid-cols-2 h-11 rounded-xl">
            <TabsTrigger value="inquiries" className="rounded-lg text-sm gap-1.5">
              <MessageSquare className="h-4 w-4" />
              Inquiries
              {unreadCount > 0 && (
                <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-[10px] rounded-full">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="offers" className="rounded-lg text-sm gap-1.5">
              <DollarSign className="h-4 w-4" />
              Offers
              {pendingOffers > 0 && (
                <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-[10px] rounded-full">
                  {pendingOffers}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="inquiries" className="p-4 pt-3 mt-0">
          {inquiries.length === 0 ? (
            <div className="text-center py-8">
              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium text-sm">No inquiries yet</p>
              <p className="text-xs text-muted-foreground mt-1">Inquiries from interested buyers will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {inquiries.map(inq => {
                const isExpanded = expandedInquiry === inq.id;
                return (
                  <div
                    key={inq.id}
                    className={`rounded-xl border p-3 transition-all ${!inq.is_read ? "border-primary/30 bg-primary/5" : "border-border"}`}
                  >
                    <div
                      className="flex items-start gap-3 cursor-pointer"
                      onClick={() => {
                        setExpandedInquiry(isExpanded ? null : inq.id);
                        if (!inq.is_read) markInquiryRead(inq.id);
                      }}
                    >
                      <div className="h-10 w-10 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                        {inq.property_photo ? (
                          <img src={inq.property_photo} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center"><Home className="h-4 w-4 text-muted-foreground" /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm truncate">{inq.sender_name}</p>
                          <div className="flex items-center gap-1.5">
                            {!inq.is_read && <div className="h-2 w-2 rounded-full bg-primary" />}
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{inq.property_title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{inq.message}</p>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-border space-y-2">
                        <p className="text-sm">{inq.message}</p>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1"><Clock className="h-3 w-3" />{format(new Date(inq.created_at), "MMM d, yyyy h:mm a")}</div>
                          {inq.sender_email && <div className="flex items-center gap-1"><Mail className="h-3 w-3" />{inq.sender_email}</div>}
                          {inq.sender_phone && <div className="flex items-center gap-1"><Phone className="h-3 w-3" />{inq.sender_phone}</div>}
                          {!inq.sender_email && !inq.sender_phone && (
                            <div className="flex items-center gap-1"><User className="h-3 w-3" />Unregistered user</div>
                          )}
                        </div>
                        {inq.sender_phone && (
                          <div className="flex gap-2 mt-2">
                            <Button size="sm" variant="outline" className="text-xs h-8 rounded-lg" asChild>
                              <a href={`tel:${inq.sender_phone}`}><Phone className="h-3 w-3 mr-1" />Call</a>
                            </Button>
                            <Button size="sm" className="text-xs h-8 rounded-lg" asChild>
                              <a href={`https://wa.me/${inq.sender_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${inq.sender_name}, regarding your inquiry about "${inq.property_title}"...`)}`} target="_blank" rel="noopener noreferrer">
                                <MessageSquare className="h-3 w-3 mr-1" />WhatsApp
                              </a>
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="offers" className="p-4 pt-3 mt-0">
          {offers.length === 0 ? (
            <div className="text-center py-8">
              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <DollarSign className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium text-sm">No offers yet</p>
              <p className="text-xs text-muted-foreground mt-1">Price offers from buyers will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {offers.map(off => {
                const isExpanded = expandedOffer === off.id;
                return (
                  <div key={off.id} className={`rounded-xl border p-3 transition-all ${off.status === "pending" ? "border-primary/30 bg-primary/5" : "border-border"}`}>
                    <div
                      className="flex items-start gap-3 cursor-pointer"
                      onClick={() => setExpandedOffer(isExpanded ? null : off.id)}
                    >
                      <div className="h-10 w-10 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                        {off.property_photo ? (
                          <img src={off.property_photo} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center"><Home className="h-4 w-4 text-muted-foreground" /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">{off.buyer_name}</p>
                          <Badge variant={off.status === "pending" ? "default" : off.status === "accepted" ? "default" : "secondary"} className={`text-[10px] h-5 ${off.status === "accepted" ? "bg-green-500/10 text-green-600 border-green-500/20" : off.status === "rejected" ? "bg-red-500/10 text-red-600 border-red-500/20" : ""}`}>
                            {off.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{off.property_title}</p>
                        <p className="text-sm font-semibold text-primary mt-0.5">
                          ${off.offer_amount_usd.toLocaleString()}
                          <span className="text-xs font-normal text-muted-foreground ml-1">({formatLRD(off.offer_amount_usd)})</span>
                        </p>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-border space-y-2">
                        {off.message && <p className="text-sm">{off.message}</p>}
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1"><Clock className="h-3 w-3" />{format(new Date(off.created_at), "MMM d, yyyy h:mm a")}</div>
                          <div className="flex items-center gap-1"><Phone className="h-3 w-3" />{off.buyer_phone}</div>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" variant="outline" className="text-xs h-8 rounded-lg" asChild>
                            <a href={`tel:${off.buyer_phone}`}><Phone className="h-3 w-3 mr-1" />Call</a>
                          </Button>
                          <Button size="sm" className="text-xs h-8 rounded-lg" asChild>
                            <a href={`https://wa.me/${off.buyer_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${off.buyer_name}, regarding your offer of $${off.offer_amount_usd.toLocaleString()} on "${off.property_title}"...`)}`} target="_blank" rel="noopener noreferrer">
                              <MessageSquare className="h-3 w-3 mr-1" />WhatsApp
                            </a>
                          </Button>
                        </div>
                        {off.status === "pending" && (
                          <div className="flex gap-2 mt-2">
                            <Button size="sm" className="text-xs h-8 rounded-lg bg-green-600 hover:bg-green-700 flex-1" onClick={() => updateOfferStatus(off.id, "accepted")}>
                              <CheckCircle className="h-3 w-3 mr-1" />Accept
                            </Button>
                            <Button size="sm" variant="destructive" className="text-xs h-8 rounded-lg flex-1" onClick={() => updateOfferStatus(off.id, "rejected")}>
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
