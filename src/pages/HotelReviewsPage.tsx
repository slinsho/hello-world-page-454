import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HotelShellLayout from "@/components/HotelShellLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Star, Reply, Flag, MessageSquare } from "lucide-react";

const HotelReviewsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "unanswered" | "flagged">("all");
  const [replyOn, setReplyOn] = useState<any>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    (async () => {
      const { data: h } = await supabase.from("hotels").select("id, name").eq("owner_id", user.id);
      const ids = (h || []).map((x: any) => x.id);
      if (!ids.length) { setReviews([]); return; }
      const { data } = await (supabase.from("hotel_reviews" as any) as any).select("*").in("hotel_id", ids).order("created_at", { ascending: false });
      const hotelName: Record<string, string> = {};
      (h || []).forEach((x: any) => { hotelName[x.id] = x.name; });
      setReviews((data || []).map((r: any) => ({ ...r, hotel_name: hotelName[r.hotel_id] })));
    })();
  }, [user, navigate]);

  const saveReply = async () => {
    if (!replyOn) return;
    const { data, error } = await (supabase.from("hotel_reviews" as any) as any)
      .update({ owner_reply: replyText, owner_reply_at: new Date().toISOString() })
      .eq("id", replyOn.id).select().single();
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    setReviews(reviews.map((r) => r.id === data.id ? { ...r, ...data } : r));
    setReplyOn(null); setReplyText("");
    toast({ title: "Reply posted" });
  };

  const toggleFlag = async (r: any) => {
    const { data, error } = await (supabase.from("hotel_reviews" as any) as any).update({ is_flagged: !r.is_flagged }).eq("id", r.id).select().single();
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    setReviews(reviews.map((x) => x.id === data.id ? { ...x, ...data } : x));
  };

  const filtered = filter === "unanswered" ? reviews.filter((r) => !r.owner_reply) : filter === "flagged" ? reviews.filter((r) => r.is_flagged) : reviews;
  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "0.0";

  return (
    <HotelShellLayout title="Reviews" subtitle="Guest feedback">
      <div className="space-y-4">
        <div className="rounded-3xl bg-gradient-to-br from-amber-500 to-amber-400 text-white p-5">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 fill-white" />
            <p className="text-3xl font-bold">{avg}</p>
            <p className="opacity-80 text-sm">/ 5.0</p>
          </div>
          <p className="text-xs opacity-90 mt-1">{reviews.length} reviews · {reviews.filter((r) => !r.owner_reply).length} unanswered</p>
        </div>

        <div className="flex gap-2">
          {(["all", "unanswered", "flagged"] as const).map((k) => (
            <button key={k} onClick={() => setFilter(k)} className={`flex-1 h-9 rounded-full text-[13px] font-semibold border capitalize ${filter === k ? "bg-foreground text-background border-foreground" : "bg-background text-muted-foreground"}`}>{k}</button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-3"><MessageSquare className="w-7 h-7 text-muted-foreground" /></div>
            <p className="font-semibold">No reviews</p>
          </div>
        )}

        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className="rounded-3xl bg-background border p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{r.guest_name || "Guest"}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{r.hotel_name} · {new Date(r.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                  ))}
                </div>
              </div>
              {r.comment && <p className="text-sm mt-2 text-foreground/90">{r.comment}</p>}
              {r.owner_reply && (
                <div className="mt-3 rounded-2xl bg-muted/60 p-3">
                  <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">Your reply</p>
                  <p className="text-sm mt-1">{r.owner_reply}</p>
                </div>
              )}
              <div className="flex gap-2 mt-3">
                <button onClick={() => { setReplyOn(r); setReplyText(r.owner_reply || ""); }} className="flex-1 h-9 rounded-full border border-border text-sm font-semibold flex items-center justify-center gap-1"><Reply className="w-4 h-4" />{r.owner_reply ? "Edit reply" : "Reply"}</button>
                <button onClick={() => toggleFlag(r)} className={`w-9 h-9 rounded-full border flex items-center justify-center ${r.is_flagged ? "bg-destructive/15 text-destructive border-destructive/20" : "text-muted-foreground border-border"}`} aria-label="Flag"><Flag className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>

        <Dialog open={!!replyOn} onOpenChange={(o) => { if (!o) { setReplyOn(null); setReplyText(""); } }}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Reply publicly</DialogTitle></DialogHeader>
            <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={5} placeholder="Thank the guest, address concerns..." />
            <Button onClick={saveReply} className="w-full">Post reply</Button>
          </DialogContent>
        </Dialog>
      </div>
    </HotelShellLayout>
  );
};

export default HotelReviewsPage;