import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Check, X } from "lucide-react";

const AdminHotels = () => {
  const { toast } = useToast();
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("hotels").select("*, profiles:owner_id(name, email, phone)").order("created_at", { ascending: false });
    setHotels((data as any[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, updates: any) => {
    const { error } = await supabase.from("hotels").update(updates).eq("id", id);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Updated" });
    load();
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-bold">Manage Hotels</h2>
      {hotels.length === 0 && <p className="text-muted-foreground">No hotels submitted yet.</p>}
      {hotels.map((h) => (
        <Card key={h.id}>
          <CardContent className="p-4 flex gap-3">
            <div className="w-20 h-20 rounded-lg bg-muted overflow-hidden shrink-0">
              {h.cover_photo && <img src={h.cover_photo} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{h.name}</p>
                  <p className="text-xs text-muted-foreground">{h.address}</p>
                  <p className="text-xs text-muted-foreground">Owner: {h.profiles?.name} · {h.profiles?.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={h.status === "active" ? "default" : "secondary"}>{h.status}</Badge>
                  {h.is_verified && <Badge className="bg-green-600 gap-1"><ShieldCheck className="w-3 h-3" />Verified</Badge>}
                </div>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                {h.status !== "active" && <Button size="sm" onClick={() => setStatus(h.id, { status: "active" })}><Check className="w-4 h-4 mr-1" />Activate</Button>}
                {h.status !== "suspended" && <Button size="sm" variant="destructive" onClick={() => setStatus(h.id, { status: "suspended" })}><X className="w-4 h-4 mr-1" />Suspend</Button>}
                <Button size="sm" variant={h.is_verified ? "outline" : "default"} onClick={() => setStatus(h.id, { is_verified: !h.is_verified })}>
                  <ShieldCheck className="w-4 h-4 mr-1" />{h.is_verified ? "Unverify" : "Verify"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminHotels;
