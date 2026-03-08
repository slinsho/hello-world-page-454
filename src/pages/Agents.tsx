import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { SEOHead } from "@/components/SEOHead";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search, Users, CheckCircle2, MapPin, Phone, ArrowLeft,
  Building2,
} from "lucide-react";

interface ProfileItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  bio: string | null;
  profile_photo_url: string | null;
  county: string | null;
  verification_status: string;
  role: string;
  property_count?: number;
}

export default function Agents() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"agent" | "property_owner">("agent");

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);

      const { data: allProfiles, error } = await supabase
        .from("profiles")
        .select("*")
        .in("role", ["agent", "property_owner"])
        .order("name", { ascending: true });

      if (error || !allProfiles) {
        setLoading(false);
        return;
      }

      const ids = allProfiles.map((p) => p.id);
      const { data: properties } = await supabase
        .from("properties")
        .select("owner_id")
        .in("owner_id", ids)
        .eq("status", "active");

      const countMap: Record<string, number> = {};
      properties?.forEach((p) => {
        countMap[p.owner_id] = (countMap[p.owner_id] || 0) + 1;
      });

      const enriched = allProfiles.map((p) => ({
        ...p,
        property_count: countMap[p.id] || 0,
      }));

      // Sort: verified first, then by property count
      enriched.sort((a, b) => {
        if (a.verification_status === "approved" && b.verification_status !== "approved") return -1;
        if (b.verification_status === "approved" && a.verification_status !== "approved") return 1;
        return (b.property_count || 0) - (a.property_count || 0);
      });

      setProfiles(enriched);
      setLoading(false);
    };

    fetchAll();
  }, []);

  const filtered = profiles
    .filter((p) => p.role === tab)
    .filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.county && p.county.toLowerCase().includes(search.toLowerCase()))
    );

  const agentCount = profiles.filter((p) => p.role === "agent").length;
  const ownerCount = profiles.filter((p) => p.role === "property_owner").length;

  return (
    <>
      <SEOHead
        title="Agents & Property Owners | LibHub"
        description="Browse verified real estate agents and property owners on LibHub. Find trusted professionals in Liberia."
      />
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Navbar />

        {/* Hero */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
          <div className="relative max-w-6xl mx-auto px-4 pt-8 pb-6 md:pt-14 md:pb-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="mb-4 gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <h1 className="text-2xl md:text-4xl font-bold text-foreground tracking-tight">
                  Agents & Property Owners
                </h1>
                <p className="text-muted-foreground text-sm md:text-base mt-1 max-w-lg">
                  Connect with trusted, verified professionals and property owners across Liberia.
                </p>
              </div>

              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or county..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 rounded-xl bg-card border-border"
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-6">
              <Tabs value={tab} onValueChange={(v) => setTab(v as "agent" | "property_owner")}>
                <TabsList className="bg-card border border-border">
                  <TabsTrigger value="agent" className="gap-1.5 text-xs md:text-sm">
                    Agents
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">
                      {agentCount}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="property_owner" className="gap-1.5 text-xs md:text-sm">
                    Property Owners
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">
                      {ownerCount}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="max-w-6xl mx-auto px-4 pb-16 md:pb-24">
          {loading ? (
            <div className="grid grid-cols-3 md:grid-cols-3 gap-3 md:gap-6 mt-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-card animate-pulse aspect-[3/4]" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Users}
              title={`No ${tab === "agent" ? "agents" : "property owners"} found`}
              description={search ? "Try adjusting your search terms." : `No ${tab === "agent" ? "agents" : "property owners"} have registered yet.`}
            />
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-3 gap-3 md:gap-6 mt-6">
              {filtered.map((person) => (
                <div
                  key={person.id}
                  onClick={() => navigate(`/profile/${person.id}`)}
                  className="group cursor-pointer rounded-2xl bg-card border border-border overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
                >
                  {/* Photo area */}
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    {person.profile_photo_url ? (
                      <img
                        src={person.profile_photo_url}
                        alt={person.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary">
                        <Users className="h-10 w-10 md:h-16 md:w-16 text-muted-foreground/30" />
                      </div>
                    )}

                    {/* Verified badge */}
                    {person.verification_status === "approved" && (
                      <div className="absolute top-2 right-2 md:top-3 md:right-3">
                        <div className={`${person.role === "agent" ? "bg-blue-500" : "bg-green-500"} text-white rounded-full p-1 md:p-1.5 shadow-lg`}>
                          <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4" />
                        </div>
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />

                    {(person.property_count ?? 0) > 0 && (
                      <div className="absolute bottom-2 left-2 md:bottom-3 md:left-3">
                        <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5 md:px-2.5 md:py-1">
                          <Building2 className="h-2.5 w-2.5 md:h-3 md:w-3 text-primary" />
                          <span className="text-[10px] md:text-xs font-medium text-white">
                            {person.property_count}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-2.5 md:p-4">
                    <h3 className="font-semibold text-xs md:text-base text-foreground truncate leading-tight">
                      {person.name}
                    </h3>

                    <div className="flex items-center gap-1 mt-0.5">
                      <Badge variant="outline" className="text-[9px] md:text-[10px] px-1.5 py-0 h-4 md:h-5">
                        {person.role === "agent" ? "Agent" : "Owner"}
                      </Badge>
                    </div>

                    {person.county && (
                      <div className="flex items-center gap-1 mt-0.5 md:mt-1">
                        <MapPin className="h-2.5 w-2.5 md:h-3.5 md:w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-[10px] md:text-xs text-muted-foreground truncate">
                          {person.county}
                        </span>
                      </div>
                    )}

                    {person.phone && (
                      <div className="hidden md:flex items-center gap-1 mt-1">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-xs text-muted-foreground truncate">
                          {person.phone}
                        </span>
                      </div>
                    )}

                    {person.bio && (
                      <p className="hidden md:block text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                        {person.bio}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
