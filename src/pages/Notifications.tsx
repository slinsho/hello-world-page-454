import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Bell, Check, Trash2, Send, DollarSign, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  property_id: string | null;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  property?: { id: string; title: string; photos: string[]; price_usd: number; county: string; };
}

const Notifications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentRefs, setPaymentRefs] = useState<Record<string, string>>({});
  const [senderNames, setSenderNames] = useState<Record<string, string>>({});
  const [submittingRef, setSubmittingRef] = useState<string | null>(null);
  const [submittedNotifications, setSubmittedNotifications] = useState<Set<string>>(new Set());
  const [paymentInfo, setPaymentInfo] = useState<{ number: string; name: string; instructions: string } | null>(null);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    fetchNotifications();
    fetchPaymentInfo();
  }, [user]);

  const fetchPaymentInfo = async () => {
    const { data } = await supabase.from("platform_settings" as any).select("value").eq("key", "payment_info").single();
    if (data) setPaymentInfo((data as any).value);
  };

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase.from("notifications").select(`*, property:properties(id, title, photos, price_usd, county)`).order("created_at", { ascending: false });
      if (error) throw error;
      setNotifications(data || []);
    } catch (error) { console.error("Error fetching notifications:", error); }
    finally { setLoading(false); }
  };

  const markAsRead = async (id: string) => { await supabase.from("notifications").update({ is_read: true }).eq("id", id); setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n)); };
  const deleteNotification = async (id: string) => { await supabase.from("notifications").delete().eq("id", id); setNotifications(prev => prev.filter(n => n.id !== id)); };
  const handlePropertyClick = (notification: Notification) => { if (notification.property_id) { markAsRead(notification.id); navigate(`/property/${notification.property_id}`); } };

  const isPaymentNotification = (notification: Notification) => {
    return (notification.title.includes("Payment Required") || notification.title.includes("Qualified") || notification.title.includes("Resend Required"))
      && !notification.title.includes("Promoted")
      && !notification.title.includes("Rejected");
  };

  const handleSubmitPaymentRef = async (notification: Notification) => {
    if (!user || !notification.property_id) return;
    const ref = paymentRefs[notification.id]?.trim();
    const name = senderNames[notification.id]?.trim();
    if (!name || name.length < 2) {
      toast({ title: "Name Required", description: "Please enter your full name.", variant: "destructive" });
      return;
    }
    if (!ref || ref.length < 4) {
      toast({ title: "Invalid Reference", description: "Reference must be at least 4 characters.", variant: "destructive" });
      return;
    }

    setSubmittingRef(notification.id);
    try {
      const { data: promoRequests } = await supabase
        .from("promotion_requests")
        .select("id")
        .eq("property_id", notification.property_id)
        .eq("user_id", user.id)
        .eq("status", "approved")
        .eq("payment_status", "requested")
        .limit(1);

      if (!promoRequests || promoRequests.length === 0) {
        toast({ title: "No Pending Request", description: "Could not find a pending promotion request for this property.", variant: "destructive" });
        return;
      }

      const { error } = await supabase
        .from("promotion_requests")
        .update({ payment_status: "paid", payment_reference: `${name} - ${ref}` } as any)
        .eq("id", promoRequests[0].id);

      if (error) throw error;

      toast({ title: "Payment Reference Sent!", description: "Admin will verify and activate your promotion shortly." });
      markAsRead(notification.id);
      setSubmittedNotifications(prev => new Set(prev).add(notification.id));
      setPaymentRefs(prev => ({ ...prev, [notification.id]: "" }));
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmittingRef(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="md:hidden"><ArrowLeft className="h-5 w-5" /></Button>
          <div className="flex items-center gap-2"><Bell className="h-5 w-5 text-primary" /><h1 className="text-xl md:text-2xl font-bold">Notifications</h1></div>
        </div>
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12"><Bell className="h-12 w-12 mx-auto text-muted-foreground mb-3" /><p className="text-muted-foreground">No notifications yet</p></div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const showPaymentInput = isPaymentNotification(notification) && !submittedNotifications.has(notification.id);

              return (
                <Card key={notification.id} className={`p-4 transition-colors ${!notification.is_read ? "bg-primary/5 border-primary/20" : ""}`}>
                  <div className="flex gap-3 cursor-pointer" onClick={() => handlePropertyClick(notification)}>
                    {notification.property?.photos?.[0] && <img src={notification.property.photos[0]} alt={notification.property.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div><h3 className="font-semibold text-sm line-clamp-1">{notification.title}</h3><p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{notification.message}</p></div>
                        {!notification.is_read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</span>
                        <div className="flex gap-1">
                          {!notification.is_read && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}><Check className="h-3.5 w-3.5" /></Button>}
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Inline payment reference input — hidden after submission */}
                  {showPaymentInput && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      <div className="flex items-center gap-2 text-xs text-amber-700">
                        <DollarSign className="h-3.5 w-3.5" />
                        <span className="font-medium">Submit your payment reference below:</span>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={paymentRefs[notification.id] || ""}
                          onChange={(e) => setPaymentRefs(prev => ({ ...prev, [notification.id]: e.target.value }))}
                          placeholder="e.g. TXN-20260308-12345"
                          maxLength={100}
                          className="rounded-xl text-sm h-9"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Button
                          size="sm"
                          className="gap-1.5 rounded-xl h-9 px-3"
                          disabled={submittingRef === notification.id || !paymentRefs[notification.id]?.trim()}
                          onClick={(e) => { e.stopPropagation(); handleSubmitPaymentRef(notification); }}
                        >
                          <Send className="h-3.5 w-3.5" />
                          {submittingRef === notification.id ? "Sending..." : "Send"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Show success state after submission */}
                  {isPaymentNotification(notification) && submittedNotifications.has(notification.id) && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center gap-2 text-xs text-green-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span className="font-medium">Payment reference submitted — awaiting admin verification</span>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
