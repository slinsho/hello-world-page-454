import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HotelShellLayout from "@/components/HotelShellLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Check, Trash2, Building2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const HOTEL_KEYWORDS = /(hotel|room|booking|reservation|check-?in|check-?out|guest)/i;

const HotelNotificationsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => {
        const all = (data || []) as any[];
        const hotelOnly = all.filter((n) => HOTEL_KEYWORDS.test(`${n.title} ${n.message}`));
        setItems(hotelOnly);
        setLoading(false);
      });
  }, [user, navigate]);

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };
  const remove = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    setItems((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <HotelShellLayout title="Notifications" subtitle="Hotel activity">
      <div className="max-w-md mx-auto space-y-3">
        {loading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
        ) : items.length === 0 ? (
          <Card className="rounded-2xl p-8 text-center">
            <Bell className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
            <p className="font-semibold">No hotel notifications</p>
            <p className="text-xs text-muted-foreground">Bookings, guest activity and hotel updates will appear here.</p>
          </Card>
        ) : (
          items.map((n) => (
            <Card key={n.id} className={`rounded-2xl p-3 ${!n.is_read ? "bg-primary/5 border-primary/20" : ""}`}>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm line-clamp-1">{n.title}</p>
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </span>
                    <div className="flex gap-1">
                      {!n.is_read && (
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => markRead(n.id)}>
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(n.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </HotelShellLayout>
  );
};

export default HotelNotificationsPage;