import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronDown, MapPin, Search } from "lucide-react";

interface Property {
  id: string;
  title: string;
  status: string;
  property_type: string;
  listing_type: string;
  price_usd: number;
  county: string | null;
  district: string | null;
  city: string | null;
  community: string | null;
  street: string | null;
  nearest_landmark: string | null;
}

const UNSET = "— Unspecified —";
const norm = (v: string | null | undefined) => (v && v.trim() ? v.trim() : UNSET);

export function AdminLocationHierarchy() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("properties")
        .select("id,title,status,property_type,listing_type,price_usd,county,district,city,community,street,nearest_landmark")
        .order("county", { ascending: true })
        .limit(2000);
      if (data) setProperties(data as any);
    })();
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return properties;
    return properties.filter((p) =>
      [p.title, p.county, p.district, p.city, p.community, p.street, p.nearest_landmark]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(s))
    );
  }, [properties, search]);

  // Build nested tree: county -> district -> city -> community -> street -> landmark -> [properties]
  const tree = useMemo(() => {
    const root: any = {};
    for (const p of filtered) {
      const path = [norm(p.county), norm(p.district), norm(p.city), norm(p.community), norm(p.street), norm(p.nearest_landmark)];
      let node = root;
      for (const key of path) {
        node[key] = node[key] || { __children: {}, __items: [] as Property[] };
        if (key === path[path.length - 1]) node[key].__items.push(p);
        node = node[key].__children;
      }
    }
    return root;
  }, [filtered]);

  const toggle = (k: string) => setExpanded((prev) => ({ ...prev, [k]: !prev[k] }));

  const renderNode = (node: any, path: string, depth: number, labels: string[]): any => {
    const keys = Object.keys(node).sort((a, b) => (a === UNSET ? 1 : b === UNSET ? -1 : a.localeCompare(b)));
    return keys.map((key) => {
      const fullPath = `${path}/${key}`;
      const isOpen = expanded[fullPath] ?? depth < 1;
      const entry = node[key];
      const items: Property[] = entry.__items || [];
      const childKeys = Object.keys(entry.__children || {});
      const level = labels[depth] || "";
      const count = countAll(entry);
      return (
        <div key={fullPath} style={{ marginLeft: depth === 0 ? 0 : 12 }}>
          <button
            type="button"
            onClick={() => toggle(fullPath)}
            className="w-full flex items-center gap-2 py-2 px-2 hover:bg-muted/50 rounded-md text-left"
          >
            {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            {depth === 0 && <MapPin className="h-4 w-4 text-primary" />}
            <span className="text-xs uppercase tracking-wide text-muted-foreground">{level}</span>
            <span className="font-medium">{key}</span>
            <Badge variant="secondary" className="ml-auto">{count}</Badge>
          </button>
          {isOpen && (
            <div className="pl-4 border-l border-border ml-3">
              {childKeys.length > 0 && renderNode(entry.__children, fullPath, depth + 1, labels)}
              {depth === labels.length - 1 && items.map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/property/${p.id}`)}
                  className="cursor-pointer flex items-center gap-3 py-2 px-2 hover:bg-muted/50 rounded-md text-sm"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{p.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.property_type} • {p.listing_type} • ${p.price_usd.toLocaleString()}
                    </div>
                  </div>
                  <Badge variant={p.status === "active" ? "default" : "secondary"} className="text-[10px]">{p.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    });
  };

  const countAll = (entry: any): number => {
    let n = (entry.__items || []).length;
    for (const k of Object.keys(entry.__children || {})) n += countAll(entry.__children[k]);
    return n;
  };

  const labels = ["County", "District", "City", "Community", "Street", "Landmark"];

  return (
    <div className="space-y-6 mt-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Location Hierarchy</h2>
        <p className="text-sm text-muted-foreground">Browse all properties grouped by County → District → City → Community → Street → Landmark.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by title or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardContent className="pt-6">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No properties found.</p>
          ) : (
            <div className="space-y-1">{renderNode(tree, "", 0, labels)}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
