import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import HotelShellLayout from "@/components/HotelShellLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, BedDouble, Ban, DollarSign } from "lucide-react";

const monthLabel = (d: Date) => d.toLocaleString(undefined, { month: "long", year: "numeric" });
const iso = (d: Date) => d.toISOString().slice(0, 10);

const HotelCalendarPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomId, setRoomId] = useState<string>("");
  const [cursor, setCursor] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [availability, setAvailability] = useState<Record<string, any>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [priceOverride, setPriceOverride] = useState("");

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    (async () => {
      const { data: h } = await supabase.from("hotels").select("id").eq("owner_id", user.id);
      const ids = (h || []).map((x: any) => x.id);
      if (!ids.length) return;
      const { data: r } = await supabase.from("hotel_rooms").select("id, name, price_per_night, hotel_id").in("hotel_id", ids);
      setRooms(r || []);
      if (r?.[0]) setRoomId(r[0].id);
    })();
  }, [user, navigate]);

  useEffect(() => {
    if (!roomId) return;
    const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    (supabase.from("room_availability" as any) as any)
      .select("*").eq("room_id", roomId).gte("date", iso(start)).lte("date", iso(end))
      .then(({ data }: any) => {
        const map: Record<string, any> = {};
        (data || []).forEach((x: any) => { map[x.date] = x; });
        setAvailability(map);
      });
  }, [roomId, cursor]);

  const days = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    const startPad = first.getDay();
    const cells: (Date | null)[] = Array(startPad).fill(null);
    for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    return cells;
  }, [cursor]);

  const upsert = async (date: string, patch: any) => {
    const existing = availability[date];
    if (existing) {
      const { data, error } = await (supabase.from("room_availability" as any) as any).update(patch).eq("id", existing.id).select().single();
      if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
      setAvailability({ ...availability, [date]: data });
    } else {
      const { data, error } = await (supabase.from("room_availability" as any) as any).insert({ room_id: roomId, date, ...patch }).select().single();
      if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
      setAvailability({ ...availability, [date]: data });
    }
  };

  const currentRoom = rooms.find((r) => r.id === roomId);
  const selEntry = selected ? availability[selected] : null;

  return (
    <HotelShellLayout title="Calendar" subtitle="Availability & prices">
      <div className="space-y-4">
        <div className="rounded-2xl bg-muted/60 p-1">
          <Select value={roomId} onValueChange={setRoomId}>
            <SelectTrigger className="border-0 bg-transparent shadow-none h-10 text-[14px] font-semibold">
              <div className="flex items-center gap-2"><BedDouble className="w-4 h-4 text-muted-foreground" /><SelectValue placeholder="Select room" /></div>
            </SelectTrigger>
            <SelectContent>{rooms.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {!roomId && (
          <div className="py-16 text-center">
            <p className="font-semibold">No rooms yet</p>
            <p className="text-sm text-muted-foreground mt-1">Create a room to manage availability.</p>
          </div>
        )}

        {roomId && (
          <div className="rounded-3xl bg-background border p-4">
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="p-2 rounded-full hover:bg-muted"><ChevronLeft className="w-4 h-4" /></button>
              <p className="font-semibold">{monthLabel(cursor)}</p>
              <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="p-2 rounded-full hover:bg-muted"><ChevronRight className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground uppercase mb-1">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((d, i) => {
                if (!d) return <div key={i} />;
                const key = iso(d);
                const entry = availability[key];
                const blocked = entry?.is_blocked;
                const priced = entry?.price_override != null;
                return (
                  <button
                    key={i}
                    onClick={() => { setSelected(key); setPriceOverride(entry?.price_override ?? ""); }}
                    className={`aspect-square rounded-lg text-[13px] font-medium flex flex-col items-center justify-center relative ${
                      blocked ? "bg-destructive/15 text-destructive" : priced ? "bg-emerald-500/15 text-emerald-700" : "bg-muted/50 hover:bg-muted"
                    }`}
                  >
                    <span>{d.getDate()}</span>
                    {priced && !blocked && <span className="text-[8px] font-bold">${entry.price_override}</span>}
                    {blocked && <Ban className="w-2.5 h-2.5 mt-0.5" />}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-3 mt-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-muted" /> Open</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-500/30" /> Custom price</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-destructive/30" /> Blocked</span>
            </div>
          </div>
        )}

        <Dialog open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>{selected}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Base price: ${currentRoom?.price_per_night}/night</p>
              <div>
                <label className="text-xs font-semibold">Custom price for this date</label>
                <div className="flex items-center gap-2 mt-1">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <Input type="number" placeholder="Leave empty to reset" value={priceOverride} onChange={(e) => setPriceOverride(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => upsert(selected!, { price_override: priceOverride ? Number(priceOverride) : null })}>Save price</Button>
                <Button
                  variant={selEntry?.is_blocked ? "default" : "destructive"}
                  className="flex-1"
                  onClick={() => upsert(selected!, { is_blocked: !selEntry?.is_blocked })}
                >
                  {selEntry?.is_blocked ? "Unblock" : "Block"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </HotelShellLayout>
  );
};

export default HotelCalendarPage;