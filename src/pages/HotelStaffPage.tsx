import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HotelShellLayout from "@/components/HotelShellLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useHotelScope } from "@/hooks/useHotelScope";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Users, Loader2, Power } from "lucide-react";

const HotelStaffPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hotels, hotelIds, isOwner, loading } = useHotelScope();
  const [staff, setStaff] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ hotel_id: "", full_name: "", email: "", password: "" });

  useEffect(() => { if (!user) navigate("/auth"); }, [user, navigate]);

  useEffect(() => {
    if (!hotelIds.length) { setStaff([]); return; }
    (supabase.from("hotel_staff" as any) as any)
      .select("*").in("hotel_id", hotelIds).order("created_at", { ascending: false })
      .then(({ data }: any) => setStaff(data || []));
  }, [hotelIds.join(",")]);

  useEffect(() => {
    if (!form.hotel_id && hotels[0]) setForm((f) => ({ ...f, hotel_id: hotels[0].id }));
  }, [hotels]);

  const create = async () => {
    if (!form.hotel_id || !form.full_name || !form.email || form.password.length < 8) {
      toast({ title: "Fill every field", description: "Password must be at least 8 characters.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { data, error } = await supabase.functions.invoke("create-hotel-staff", { body: form });
    setSaving(false);
    if (error || (data as any)?.error) {
      toast({ title: "Could not create account", description: (data as any)?.error || error?.message, variant: "destructive" });
      return;
    }
    toast({ title: "Receptionist account created", description: `${form.full_name} can now sign in.` });
    setOpen(false);
    setForm({ hotel_id: form.hotel_id, full_name: "", email: "", password: "" });
    const { data: rows } = await (supabase.from("hotel_staff" as any) as any)
      .select("*").in("hotel_id", hotelIds).order("created_at", { ascending: false });
    setStaff(rows || []);
  };

  const toggle = async (s: any) => {
    const { data, error } = await (supabase.from("hotel_staff" as any) as any)
      .update({ is_active: !s.is_active }).eq("id", s.id).select().single();
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    setStaff((list) => list.map((x) => (x.id === s.id ? data : x)));
  };

  if (!loading && !isOwner) {
    return (
      <HotelShellLayout title="Staff" subtitle="Front desk team">
        <p className="text-sm text-muted-foreground py-16 text-center">Only hotel owners can manage staff accounts.</p>
      </HotelShellLayout>
    );
  }

  return (
    <HotelShellLayout title="Staff" subtitle="Front desk team">
      <div className="space-y-4">
        <Button onClick={() => setOpen(true)} className="w-full rounded-full h-11">
          <UserPlus className="w-4 h-4 mr-1" />Add receptionist
        </Button>

        {staff.length === 0 && (
          <div className="py-16 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
              <Users className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="font-semibold">No staff yet</p>
            <p className="text-sm text-muted-foreground mt-1">Receptionists can confirm bookings and run check-in / check-out.</p>
          </div>
        )}

        <div className="space-y-3">
          {staff.map((s) => (
            <div key={s.id} className="rounded-2xl border bg-background p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                {(s.full_name || "R")[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate">{s.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {hotels.find((h) => h.id === s.hotel_id)?.name || "—"} · {s.staff_role}
                </p>
              </div>
              <button
                onClick={() => toggle(s)}
                className={`text-[11px] font-semibold px-3 py-1.5 rounded-full border flex items-center gap-1 ${
                  s.is_active ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-muted text-muted-foreground"
                }`}
              >
                <Power className="w-3 h-3" />{s.is_active ? "Active" : "Disabled"}
              </button>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New receptionist</DialogTitle>
            <DialogDescription>They will only be able to manage bookings and check-in / check-out.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={form.hotel_id} onValueChange={(v) => setForm({ ...form, hotel_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select hotel" /></SelectTrigger>
              <SelectContent>{hotels.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            <Input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input type="text" placeholder="Password (min 8 characters)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <Button onClick={create} disabled={saving} className="w-full rounded-full h-11">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create account"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </HotelShellLayout>
  );
};

export default HotelStaffPage;
