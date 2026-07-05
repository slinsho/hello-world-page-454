import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, MapPin, Search, ArrowLeft, Building2, Home } from "lucide-react";
import flagBomi from "@/assets/county-flags/Bomi.svg";
import flagBong from "@/assets/county-flags/Bong.svg";
import flagGbarpolu from "@/assets/county-flags/Gbarpolu.svg";
import flagGrandBassa from "@/assets/county-flags/Grand_Bassa.svg";
import flagGrandCapeMount from "@/assets/county-flags/Grand_Cape_Mount.svg";
import flagGrandGedeh from "@/assets/county-flags/Grand_Gedeh.svg";
import flagGrandKru from "@/assets/county-flags/Grand_Kru.svg";
import flagLofa from "@/assets/county-flags/Lofa.svg";
import flagMargibi from "@/assets/county-flags/Margibi.svg";
import flagMaryland from "@/assets/county-flags/Maryland.svg";
import flagMontserrado from "@/assets/county-flags/Montserrado.png";
import flagNimba from "@/assets/county-flags/Nimba.png";
import flagRiverCess from "@/assets/county-flags/River_Cess.png";
import flagRiverGee from "@/assets/county-flags/River_Gee.svg";
import flagSinoe from "@/assets/county-flags/Sinoe.png";

interface Property {
  id: string;
  title: string;
  status: string;
  property_type: string;
  listing_type: string;
  price_usd: number;
  photos: string[] | null;
  county: string | null;
  district: string | null;
  city: string | null;
  community: string | null;
  street: string | null;
  nearest_landmark: string | null;
}

const COUNTY_FLAGS: Record<string, string> = {
  "Bomi": flagBomi,
  "Bong": flagBong,
  "Gbarpolu": flagGbarpolu,
  "Grand Bassa": flagGrandBassa,
  "Grand Cape Mount": flagGrandCapeMount,
  "Grand Gedeh": flagGrandGedeh,
  "Grand Kru": flagGrandKru,
  "Lofa": flagLofa,
  "Margibi": flagMargibi,
  "Maryland": flagMaryland,
  "Montserrado": flagMontserrado,
  "Nimba": flagNimba,
  "River Cess": flagRiverCess,
  "River Gee": flagRiverGee,
  "Sinoe": flagSinoe,
};

const LIBERIA_COUNTIES = Object.keys(COUNTY_FLAGS);


const UNSET = "— Unspecified —";
const norm = (v: string | null | undefined) => (v && v.trim() ? v.trim() : UNSET);

type Level = "county" | "district" | "city" | "community";

interface Crumb {
  level: Level;
  value: string;
}

export function AdminLocationHierarchy() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [search, setSearch] = useState("");
  const [path, setPath] = useState<Crumb[]>([]); // drill-down path
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("properties")
        .select("id,title,status,property_type,listing_type,price_usd,photos,county,district,city,community,street,nearest_landmark")
        .order("county", { ascending: true })
        .limit(2000);
      if (data) setProperties(data as any);
      setLoading(false);
    })();
  }, []);

  // Filter by search across all fields
  const searched = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return properties;
    return properties.filter((p) =>
      [p.title, p.county, p.district, p.city, p.community, p.street, p.nearest_landmark]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(s))
    );
  }, [properties, search]);

  // Scope to current path
  const scoped = useMemo(() => {
    return searched.filter((p) =>
      path.every((c) => norm((p as any)[c.level]) === c.value)
    );
  }, [searched, path]);

  const currentLevel: Level | "properties" =
    path.length === 0 ? "county"
    : path.length === 1 ? "district"
    : path.length === 2 ? "city"
    : path.length === 3 ? "community"
    : "properties";

  // Build cards for current level
  const cards = useMemo(() => {
    if (currentLevel === "properties") return [];
    const groups = new Map<string, number>();
    for (const p of scoped) {
      const key = norm((p as any)[currentLevel]);
      groups.set(key, (groups.get(key) || 0) + 1);
    }
    // For county level, always include all 15 Liberian counties (even with 0)
    if (currentLevel === "county" && !search.trim()) {
      for (const c of LIBERIA_COUNTIES) if (!groups.has(c)) groups.set(c, 0);
    }
    return Array.from(groups.entries())
      .sort((a, b) => {
        if (a[0] === UNSET) return 1;
        if (b[0] === UNSET) return -1;
        return a[0].localeCompare(b[0]);
      })
      .map(([value, count]) => ({ value, count }));
  }, [scoped, currentLevel, search]);

  const levelLabels: Record<Level, string> = {
    county: "County",
    district: "District",
    city: "City",
    community: "Community",
  };

  const drillInto = (value: string) => {
    if (currentLevel === "properties") return;
    setPath([...path, { level: currentLevel, value }]);
  };

  const goToCrumb = (idx: number) => setPath(path.slice(0, idx));

  return (
    <div className="space-y-6 mt-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Location Tree</h2>
        <p className="text-sm text-muted-foreground">
          Drill down: County → District → City → Community → Properties.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by title or any location field..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center flex-wrap gap-2 text-sm">
        <Button
          variant={path.length === 0 ? "default" : "outline"}
          size="sm"
          onClick={() => setPath([])}
          className="h-8 gap-1.5"
        >
          <Home className="h-3.5 w-3.5" />
          All Counties
        </Button>
        {path.map((c, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Button
              variant={idx === path.length - 1 ? "default" : "outline"}
              size="sm"
              onClick={() => goToCrumb(idx + 1)}
              className="h-8"
            >
              <span className="text-[10px] uppercase tracking-wide mr-1.5 opacity-70">
                {levelLabels[c.level]}
              </span>
              {c.value}
            </Button>
          </div>
        ))}
        {path.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => goToCrumb(path.length - 1)}
            className="h-8 gap-1 text-muted-foreground ml-auto"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : currentLevel === "properties" ? (
        // Properties list at deepest level
        scoped.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No properties in this community.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {scoped.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/property/${p.id}`)}
                className="text-left rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all overflow-hidden group"
              >
                <div className="aspect-video bg-muted overflow-hidden">
                  {p.photos?.[0] ? (
                    <img
                      src={p.photos[0]}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-medium text-sm line-clamp-1 flex-1">{p.title}</p>
                    <Badge
                      variant={p.status === "active" ? "default" : "secondary"}
                      className="text-[10px] shrink-0"
                    >
                      {p.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">
                    {p.property_type} • {p.listing_type.replace("_", " ")}
                  </p>
                  <p className="text-sm font-semibold text-primary mt-1">
                    ${p.price_usd.toLocaleString()}
                  </p>
                  {(p.street || p.nearest_landmark) && (
                    <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">
                        {[p.street, p.nearest_landmark].filter(Boolean).join(" • ")}
                      </span>
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )
      ) : cards.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No {levelLabels[currentLevel].toLowerCase()}s found.
          </CardContent>
        </Card>
      ) : currentLevel === "county" ? (
        // County level: rich flag cards
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {cards.map(({ value, count }) => {
            const disabled = count === 0;
            const flag = COUNTY_FLAGS[value];
            return (
              <button
                key={value}
                onClick={() => !disabled && drillInto(value)}
                disabled={disabled}
                className={`group text-left rounded-2xl border border-border bg-card overflow-hidden transition-all ${
                  disabled
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:border-primary/60 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
                }`}
              >
                <div className="relative aspect-[5/3] bg-muted overflow-hidden border-b border-border">
                  {flag ? (
                    <img
                      src={flag}
                      alt={`${value} County flag`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MapPin className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge
                      variant={count > 0 ? "default" : "secondary"}
                      className="text-[10px] shadow-md"
                    >
                      {count} {count === 1 ? "property" : "properties"}
                    </Badge>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                    County
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm truncate">{value}</p>
                    {!disabled && (
                      <ChevronRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {cards.map(({ value, count }) => {
            const disabled = count === 0;
            return (
              <button
                key={value}
                onClick={() => !disabled && drillInto(value)}
                disabled={disabled}
                className={`group text-left rounded-xl border border-border bg-card p-4 transition-all ${
                  disabled
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:border-primary/60 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant={count > 0 ? "default" : "secondary"} className="text-[10px]">
                    {count}
                  </Badge>
                </div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                  {levelLabels[currentLevel]}
                </p>
                <p className="font-semibold text-sm line-clamp-2">{value}</p>
                {!disabled && (
                  <div className="mt-2 flex items-center gap-1 text-[11px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Explore <ChevronRight className="h-3 w-3" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

    </div>
  );
}
