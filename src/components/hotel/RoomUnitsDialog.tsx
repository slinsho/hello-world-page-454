import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Hash, Loader2 } from "lucide-react";

interface Props {
  room: any | null;
  onOpenChange: (open: boolean) => void;
  onCountChange?: (roomId: string, count: number) => void;
}

/** Lets a hotel manage the individual room numbers that belong to a room type. */
const RoomUnitsDialog = ({ room, onOpenChange, onCountChange }: Props) => {
  const { toast } = useToast();
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState("101");
  const [to, setTo] = useState("110");
  const [floor, setFloor] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!room) { setUnits([]); return; }
    setLoading(true);
    (supabase.from("hotel_room_units" as any) as any)
      .select("*").eq("room_id", room.id).order("room_number")
      .then(({ data }: any) => { setUnits(data || []); setLoading(false); });
  }, [room]);

  const sync = (list: any[]) => {
    setUnits(list);
    if (room) onCountChange?.(room.id, list.length);
  };

  const bulkAdd = async () => {
    if (!room) return;
    const a = parseInt(from, 10);
    const b = parseInt(to, 10);
    let numbers: string[] = [];
    if (!isNaN(a) && !isNaN(b) && b >= a && b - a < 200) {
      for (let n = a; n <= b; n++) numbers.push(String(n));
    } else if (from.trim()) {
      numbers = [from.trim()];
    }
    const existing = new Set(units.map((u) => u.room_number));
    numbers = numbers.filter((n) => !existing.has(n));
    if (!numbers.length) { toast({ title: "Nothing to add", description: "Those room numbers already exist." }); return; }
    setSaving(true);
    const { data, error } = await (supabase.from("hotel_room_units" as any) as any)
      .insert(numbers.map((n) => ({ hotel_id: room.hotel_id, room_id: room.id, room_number: n, floor: floor || null })))
      .select();
    setSaving(false);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    sync([...units, ...(data || [])].sort((x: any, y: any) => x.room_number.localeCompare(y.room_number, undefined, { numeric: true })));
    toast({ title: `${numbers.length} room number${numbers.length > 1 ? "s" : ""} added` });
  };

  const remove = async (id: string) => {
    const { error } = await (supabase.from("hotel_room_units" as any) as any).delete().eq("id", id);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    sync(units.filter((u) => u.id !== id));
  };

  const HK = ["clean", "dirty", "out_of_service"] as const;
  const cycleHousekeeping = async (u: any) => {
    const next = HK[(HK.indexOf(u.housekeeping_status || "clean") + 1) % HK.length];
    const { data, error } = await (supabase.from("hotel_room_units" as any) as any)
      .update({ housekeeping_status: next }).eq("id", u.id).select().single();
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    sync(units.map((x) => (x.id === u.id ? data : x)));
  };

  const toggleActive = async (u: any) => {
    const { data, error } = await (supabase.from("hotel_room_units" as any) as any)
      .update({ is_active: !u.is_active }).eq("id", u.id).select().single();
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    sync(units.map((x) => (x.id === u.id ? data : x)));
  };

  return (
    <Dialog open={!!room} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Room numbers — {room?.name}</DialogTitle>
          <DialogDescription>Add room numbers and track housekeeping (tap the status chip to cycle clean → dirty → out of service).</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-2xl border p-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bulk add</p>
            <div className="grid grid-cols-3 gap-2">
              <Input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="From e.g. 101" />
              <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="To e.g. 110" />
              <Input value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="Floor" />
            </div>
            <Button onClick={bulkAdd} disabled={saving} className="w-full rounded-full h-10">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Hash className="w-4 h-4 mr-1" />Add room numbers</>}
            </Button>
          </div>

          {loading && <p className="text-sm text-muted-foreground text-center py-4">Loading…</p>}
          {!loading && units.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No room numbers yet.</p>
          )}

          <div className="max-h-64 overflow-y-auto space-y-2">
            {units.map((u) => (
              <div key={u.id} className="flex items-center gap-2 rounded-xl border px-3 py-2">
                <span className="font-mono font-semibold">{u.room_number}</span>
                {u.floor && <span className="text-xs text-muted-foreground">Floor {u.floor}</span>}
                <button
                  onClick={() => cycleHousekeeping(u)}
                  className={`ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                    (u.housekeeping_status || "clean") === "clean" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                    : u.housekeeping_status === "dirty" ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                    : "bg-rose-500/10 text-rose-600 border-rose-500/20"}`}
                >
                  {(u.housekeeping_status || "clean") === "out_of_service" ? "Out of service" : (u.housekeeping_status || "clean") === "dirty" ? "Dirty" : "Clean"}
                </button>
                <button
                  onClick={() => toggleActive(u)}
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${u.is_active ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-muted text-muted-foreground"}`}
                >
                  {u.is_active ? "Active" : "Out of service"}
                </button>
                <button onClick={() => remove(u.id)} className="text-destructive p-1" aria-label="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoomUnitsDialog;
