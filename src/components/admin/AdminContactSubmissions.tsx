import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Mail, Phone, MapPin, User, Home, DollarSign, MessageSquare, Search, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface ContactSubmission {
  id: string;
  created_at: string;
  email: string | null;
  phone: string | null;
  problem: string; // message
  suggestions: string | null; // "From: name | Address: ... | Type: ... | Budget: ..."
  whatsapp: string | null;
}

function parseDetails(suggestions: string | null) {
  if (!suggestions) return { name: "", address: "", propertyType: "", budget: "" };
  const parts: Record<string, string> = {};
  suggestions.split("|").forEach((part) => {
    const [key, ...val] = part.split(":");
    if (key && val.length) parts[key.trim().toLowerCase()] = val.join(":").trim();
  });
  return {
    name: parts["from"] || parts["name"] || "",
    address: parts["address"] || "",
    propertyType: parts["type"] || "",
    budget: parts["budget"] || "",
  };
}

export function AdminContactSubmissions() {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("feedback")
      .select("id, created_at, email, phone, problem, suggestions, whatsapp")
      .eq("role", "contact_form")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching contact submissions:", error);
    } else {
      setSubmissions(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("feedback").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Could not delete submission.", variant: "destructive" });
    } else {
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      toast({ title: "Deleted", description: "Contact submission removed." });
    }
  };

  const filtered = submissions.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const details = parseDetails(s.suggestions);
    return (
      details.name.toLowerCase().includes(q) ||
      (s.email || "").toLowerCase().includes(q) ||
      (s.phone || "").toLowerCase().includes(q) ||
      s.problem.toLowerCase().includes(q) ||
      details.address.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="space-y-4 mt-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-lg font-semibold">
          Contact Submissions ({submissions.length})
        </h2>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            {search ? "No matching submissions" : "No contact submissions yet"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((sub) => {
            const details = parseDetails(sub.suggestions);
            return (
              <Card key={sub.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{details.name || "Unknown"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(sub.created_at), { addSuffix: true })}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleDelete(sub.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {sub.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" /> {sub.email}
                    </span>
                  )}
                  {sub.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" /> {sub.phone}
                    </span>
                  )}
                  {details.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {details.address}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {details.propertyType && (
                    <Badge variant="secondary" className="gap-1">
                      <Home className="h-3 w-3" /> {details.propertyType}
                    </Badge>
                  )}
                  {details.budget && (
                    <Badge variant="outline" className="gap-1">
                      <DollarSign className="h-3 w-3" /> {details.budget}
                    </Badge>
                  )}
                </div>

                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm">{sub.problem}</p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
