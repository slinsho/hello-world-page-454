import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Bell, Check, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    fetchNotifications();
  }, [user]);

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
            {notifications.map((notification) => (
              <Card key={notification.id} className={`p-4 cursor-pointer transition-colors ${!notification.is_read ? "bg-primary/5 border-primary/20" : ""}`} onClick={() => handlePropertyClick(notification)}>
                <div className="flex gap-3">
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
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
