import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Search, Flag, CheckCircle, XCircle, Eye, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ModerationProperty {
  id: string;
  title: string;
  property_type: string;
  listing_type: string;
  price_usd: number;
  county: string;
  address: string;
  status: string;
  moderation_status: string | null;
  moderation_note: string | null;
  flagged_count: number | null;
  created_at: string;
  photos: string[];
  description: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  owner_name?: string;
}

export function AdminContentModeration() {
  const { toast } = useToast();
  const [properties, setProperties] = useState<ModerationProperty[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedProperty, setSelectedProperty] = useState<ModerationProperty | null>(null);
  const [moderationNote, setModerationNote] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    const { data, error } = await supabase
      .from("properties")
      .select("id, title, property_type, listing_type, price_usd, county, address, status, moderation_status, moderation_note, flagged_count, created_at, owner_id, photos, description, bedrooms, bathrooms")
      .order("created_at", { ascending: false });

    if (error || !data) { setLoading(false); return; }

    const ownerIds = [...new Set(data.map(p => p.owner_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name")
      .in("id", ownerIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p.name]));

    setProperties(data.map(p => ({
      ...p,
      owner_name: profileMap.get(p.owner_id) || "Unknown",
    })));
    setLoading(false);
  };

  const handleModerate = async (propertyId: string, status: string) => {
    const { error } = await supabase
      .from("properties")
      .update({ 
        moderation_status: status, 
        moderation_note: moderationNote || null,
        status: status === "rejected" ? "inactive" : "active",
      })
      .eq("id", propertyId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Updated", description: `Property ${status}` });
    setSelectedProperty(null);
    setModerationNote("");
    fetchProperties();
  };

  const getModerationBadge = (status: string | null) => {
    switch (status) {
      case "approved": return <Badge className="bg-green-500/10 text-green-600 border-green-200">Approved</Badge>;
      case "rejected": return <Badge variant="destructive">Rejected</Badge>;
      case "flagged": return <Badge className="bg-orange-500/10 text-orange-600 border-orange-200">Flagged</Badge>;
      default: return <Badge variant="secondary">Pending Review</Badge>;
    }
  };

  const filtered = properties.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.county.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterStatus === "all" || p.moderation_status === filterStatus || (filterStatus === "pending" && !p.moderation_status);
    return matchesSearch && matchesFilter;
  });

  if (loading) return <div className="py-12 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6 mt-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search properties..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="flagged">Flagged</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", count: properties.length, icon: Eye },
          { label: "Pending", count: properties.filter(p => !p.moderation_status || p.moderation_status === "pending").length, icon: AlertTriangle },
          { label: "Flagged", count: properties.filter(p => p.moderation_status === "flagged").length, icon: Flag },
          { label: "Rejected", count: properties.filter(p => p.moderation_status === "rejected").length, icon: XCircle },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{s.count}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Property List */}
      <div className="space-y-3">
        {filtered.map(property => (
          <Card key={property.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold truncate">{property.title}</h3>
                    {getModerationBadge(property.moderation_status)}
                    {(property.flagged_count || 0) > 0 && (
                      <Badge variant="outline" className="text-orange-500 gap-1">
                        <Flag className="h-3 w-3" /> {property.flagged_count}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {property.owner_name} · {property.county} · ${property.price_usd.toLocaleString()}
                  </p>
                  {property.moderation_note && (
                    <p className="text-xs text-muted-foreground italic">Note: {property.moderation_note}</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => { setSelectedProperty(property); setModerationNote(property.moderation_note || ""); }}>
                    Review
                  </Button>
                  <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => handleModerate(property.id, "approved")}>
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleModerate(property.id, "rejected")}>
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selectedProperty} onOpenChange={() => setSelectedProperty(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review: {selectedProperty?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Type:</span> <span className="capitalize">{selectedProperty?.property_type}</span></div>
              <div><span className="text-muted-foreground">Price:</span> ${selectedProperty?.price_usd.toLocaleString()}</div>
              <div><span className="text-muted-foreground">County:</span> {selectedProperty?.county}</div>
              <div><span className="text-muted-foreground">Owner:</span> {selectedProperty?.owner_name}</div>
            </div>
            <Textarea
              placeholder="Add a moderation note (optional)..."
              value={moderationNote}
              onChange={e => setModerationNote(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => selectedProperty && handleModerate(selectedProperty.id, "flagged")} className="gap-1">
              <Flag className="h-4 w-4" /> Flag
            </Button>
            <Button variant="destructive" onClick={() => selectedProperty && handleModerate(selectedProperty.id, "rejected")} className="gap-1">
              <XCircle className="h-4 w-4" /> Reject
            </Button>
            <Button onClick={() => selectedProperty && handleModerate(selectedProperty.id, "approved")} className="gap-1 bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4" /> Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
