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
  Search, Users, CheckCircle2, MapPin, ArrowLeft, Building2,
  Trophy, Star, Eye, Crown, Medal, Award,
} from "lucide-react";

interface LeaderRow {
  id: string;
  name: string | null;
  county: string | null;
  profile_photo_url: string | null;
  phone: string | null;
  bio: string | null;
  agency_name: string | null;
  agency_logo: string | null;
  active_listings: number;
  avg_rating: number;
  reviews_count: number;
  total_views: number;
  score: number;
}

interface OwnerRow {
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

type SortKey = "score" | "rating" | "listings" | "views";

export default function Agents() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"agent" | "property_owner">("agent");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("score");
  const [agents, setAgents] = useState<LeaderRow[]>([]);
  const [owners, setOwners] = useState<OwnerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      // Fetch leaderboard view
      const { data: lb } = await supabase
        .from("agent_leaderboard" as any)
        .select("*")
        .order("score", { ascending: false });
      setAgents(((lb as any) || []) as LeaderRow[]);

      // Fetch property owners as before
      const { data: ownersData } = await supabase
        .from("profiles_public")
        .select("*")
        .eq("role", "property_owner")
        .order("name", { ascending: true });

      if (ownersData) {
        const ids = ownersData.map((p) => p.id);
        const { data: properties } = await supabase
          .from("properties")
          .select("owner_id")
          .in("owner_id", ids)
          .eq("status", "active");
        const counts: Record<string, number> = {};
        properties?.forEach((p) => {
          counts[p.owner_id] = (counts[p.owner_id] || 0) + 1;
        });
        const enriched = ownersData.map((p) => ({ ...p, property_count: counts[p.id] || 0 }));
        enriched.sort((a, b) => {
          if (a.verification_status === "approved" && b.verification_status !== "approved") return -1;
          if (b.verification_status === "approved" && a.verification_status !== "approved") return 1;
          return (b.property_count || 0) - (a.property_count || 0);
        });
        setOwners(enriched as OwnerRow[]);
      }
      setLoading(false);
    })();
  }, []);

  const filteredAgents = agents
    .filter((a) => {
      const s = search.toLowerCase();
      if (!s) return true;
      return (
        (a.name || "").toLowerCase().includes(s) ||
        (a.agency_name || "").toLowerCase().includes(s) ||
        (a.county || "").toLowerCase().includes(s)
      );
    })
    .slice()
    .sort((a, b) => {
      switch (sort) {
        case "rating":
          return b.avg_rating - a.avg_rating || b.reviews_count - a.reviews_count;
        case "listings":
          return b.active_listings - a.active_listings;
        case "views":
          return b.total_views - a.total_views;
        default:
          return b.score - a.score;
      }
    });

  const top3 = filteredAgents.slice(0, 3);
  const rest = filteredAgents.slice(3);

  const filteredOwners = owners.filter((p) =>
    !search
      ? true
      : p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.county?.toLowerCase().includes(search.toLowerCase())
  );

  const goToAgent = (id: string) => navigate(`/profile/${id}`);

  return (
    <>
      <SEOHead
        title="Top Agents & Property Owners | L-Prop"
        description="Explore Liberia's top-ranked verified real estate agents and browse trusted property owners on L-Prop."
      />
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Navbar />

        {/* Hero */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
          <div className="relative max-w-6xl mx-auto px-4 pt-6 pb-4 md:pt-12 md:pb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="mb-3 gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <h1 className="text-2xl md:text-4xl font-bold tracking-tight">Agent Leaderboard</h1>
                <p className="text-muted-foreground text-sm md:text-base mt-1 max-w-lg">
                  Ranked by listings, reviews, and views. Verified agents only.
                </p>
              </div>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, agency, county…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 rounded-xl bg-card border-border"
                />
              </div>
            </div>

            <div className="mt-5">
              <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
                <TabsList className="bg-card border border-border">
                  <TabsTrigger value="agent" className="gap-1.5 text-xs md:text-sm">
                    Agents
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">
                      {agents.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="property_owner" className="gap-1.5 text-xs md:text-sm">
                    Property Owners
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">
                      {owners.length}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 pb-16 md:pb-24">
          {loading ? (
            <div className="grid gap-3 mt-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-card animate-pulse h-20" />
              ))}
            </div>
          ) : tab === "agent" ? (
            filteredAgents.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No agents yet"
                description={search ? "Try a different search." : "Verified agents will appear here."}
              />
            ) : (
              <>
                {/* Sort chips */}
                <div className="flex gap-2 overflow-x-auto py-3 mt-2 scrollbar-hide">
                  {[
                    { k: "score", l: "Top Overall", icon: Trophy },
                    { k: "rating", l: "Top Rated", icon: Star },
                    { k: "listings", l: "Most Listings", icon: Building2 },
                    { k: "views", l: "Most Viewed", icon: Eye },
                  ].map((s) => (
                    <button
                      key={s.k}
                      onClick={() => setSort(s.k as SortKey)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors shrink-0 ${
                        sort === s.k
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <s.icon className="h-3.5 w-3.5" />
                      {s.l}
                    </button>
                  ))}
                </div>

                {/* Podium — top 3 */}
                {top3.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                    {top3.map((a, i) => {
                      const RankIcon = i === 0 ? Crown : i === 1 ? Medal : Award;
                      const rankColor = i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : "text-amber-600";
                      return (
                        <button
                          key={a.id}
                          onClick={() => goToAgent(a.id)}
                          className="text-left rounded-2xl bg-gradient-to-br from-primary/10 to-card border border-border p-4 hover:border-primary/40 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              <div className="h-14 w-14 rounded-full overflow-hidden bg-muted">
                                {a.agency_logo || a.profile_photo_url ? (
                                  <img
                                    src={a.agency_logo || a.profile_photo_url || ""}
                                    alt={a.name || ""}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Building2 className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <RankIcon className={`absolute -top-1 -right-1 h-5 w-5 ${rankColor} drop-shadow`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-sm truncate">
                                {a.agency_name || a.name || "Agent"}
                              </p>
                              <div className="flex items-center gap-1 text-[11px] text-muted-foreground truncate">
                                <MapPin className="h-3 w-3 shrink-0" />
                                {a.county || "—"}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-lg font-bold text-primary leading-none">#{i + 1}</p>
                              <p className="text-[10px] text-muted-foreground">score {a.score}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-1 mt-3 text-center">
                            <div className="rounded-lg bg-muted/40 py-1.5">
                              <p className="text-xs font-bold">{a.active_listings}</p>
                              <p className="text-[9px] text-muted-foreground uppercase">listings</p>
                            </div>
                            <div className="rounded-lg bg-muted/40 py-1.5">
                              <p className="text-xs font-bold">{a.avg_rating.toFixed(1)}</p>
                              <p className="text-[9px] text-muted-foreground uppercase">rating</p>
                            </div>
                            <div className="rounded-lg bg-muted/40 py-1.5">
                              <p className="text-xs font-bold">{a.total_views}</p>
                              <p className="text-[9px] text-muted-foreground uppercase">views</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Rest of the list */}
                {rest.length > 0 && (
                  <div className="rounded-2xl bg-card border border-border overflow-hidden divide-y divide-border">
                    {rest.map((a, i) => (
                      <button
                        key={a.id}
                        onClick={() => goToAgent(a.id)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-muted/40 transition-colors text-left"
                      >
                        <span className="text-sm font-bold text-muted-foreground w-6 shrink-0 text-center">
                          {i + 4}
                        </span>
                        <div className="h-10 w-10 rounded-full overflow-hidden bg-muted shrink-0">
                          {a.agency_logo || a.profile_photo_url ? (
                            <img
                              src={a.agency_logo || a.profile_photo_url || ""}
                              alt={a.name || ""}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-sm truncate">
                              {a.agency_name || a.name || "Agent"}
                            </p>
                            <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {a.county || "—"} · {a.active_listings} listings · ⭐ {a.avg_rating.toFixed(1)} ({a.reviews_count})
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-semibold text-primary">{a.score}</p>
                          <p className="text-[9px] text-muted-foreground">score</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )
          ) : filteredOwners.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No property owners found"
              description={search ? "Try adjusting your search terms." : "No property owners have registered yet."}
            />
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-3 gap-3 md:gap-6 mt-6">
              {filteredOwners.map((person) => (
                <div
                  key={person.id}
                  onClick={() => navigate(`/profile/${person.id}`)}
                  className="group cursor-pointer rounded-2xl bg-card border border-border overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:-translate-y-1"
                >
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
                    {person.verification_status === "approved" && (
                      <div className="absolute top-2 right-2 md:top-3 md:right-3">
                        <div className="bg-green-500 text-white rounded-full p-1 md:p-1.5 shadow-lg">
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
                  <div className="p-2.5 md:p-4">
                    <h3 className="font-semibold text-xs md:text-base text-foreground truncate leading-tight">
                      {person.name}
                    </h3>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Badge variant="outline" className="text-[9px] md:text-[10px] px-1.5 py-0 h-4 md:h-5">
                        Owner
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
