import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import PropertyCard from "@/components/PropertyCard";
import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Filter, Search } from "lucide-react";
import { LIBERIA_COUNTIES } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";

const Explore = () => {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({ type: "all", listing: "all", status: "all", minPrice: "", maxPrice: "", county: "all" });
  const [tempFilters, setTempFilters] = useState(filters);

  useEffect(() => { fetchProperties(); }, [filters, searchQuery]);

  const fetchProperties = async () => {
    setLoading(true);
    let query = supabase.from("properties").select("*").order("is_promoted", { ascending: false }).order("created_at", { ascending: false });
    if (filters.type !== "all") query = query.eq("property_type", filters.type as any);
    if (filters.listing !== "all") query = query.eq("listing_type", filters.listing as any);
    if (filters.status !== "all") query = query.eq("status", filters.status as any);
    if (filters.county !== "all") query = query.eq("county", filters.county);
    if (filters.minPrice) query = query.gte("price_usd", parseFloat(filters.minPrice));
    if (filters.maxPrice) query = query.lte("price_usd", parseFloat(filters.maxPrice));
    if (searchQuery) {
      // Use full-text search with tsvector if available, fallback to ilike
      const tsQuery = searchQuery.trim().split(/\s+/).join(' & ');
      query = query.textSearch('search_vector', tsQuery, { config: 'english' });
    }

    const { data, error } = await query;
    if (!error && data) {
      const ownerIds = [...new Set(data.map((p: any) => p.owner_id))];
      if (ownerIds.length > 0) {
        const { data: profilesData } = await supabase.from("profiles").select("id, name, role, verification_status, phone, profile_photo_url").in("id", ownerIds);
        const profilesMap = new Map((profilesData || []).map(p => [p.id, p]));
        setProperties(data.map((p: any) => ({ ...p, profiles: profilesMap.get(p.owner_id) || null })));
      } else { setProperties(data); }
    }
    setLoading(false);
  };

  const applyFilters = () => { setFilters(tempFilters); };
  const resetFilters = () => { const d = { type: "all", listing: "all", status: "all", minPrice: "", maxPrice: "", county: "all" }; setTempFilters(d); setFilters(d); };

  const FilterPanel = () => (
    <div className="space-y-5">
      <div className="space-y-2"><Label>Property Type</Label><Select value={tempFilters.type} onValueChange={(v) => setTempFilters({ ...tempFilters, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="house">House</SelectItem><SelectItem value="apartment">Apartment</SelectItem><SelectItem value="shop">Shop</SelectItem></SelectContent></Select></div>
      <div className="space-y-2"><Label>Listing Type</Label><Select value={tempFilters.listing} onValueChange={(v) => setTempFilters({ ...tempFilters, listing: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="for_sale">For Sale</SelectItem><SelectItem value="for_rent">For Rent</SelectItem><SelectItem value="for_lease">For Lease</SelectItem></SelectContent></Select></div>
      <div className="space-y-2"><Label>Status</Label><Select value={tempFilters.status} onValueChange={(v) => setTempFilters({ ...tempFilters, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="negotiating">Negotiating</SelectItem><SelectItem value="taken">Taken</SelectItem></SelectContent></Select></div>
      <div className="space-y-2"><Label>Price Range (USD)</Label><div className="grid grid-cols-2 gap-2"><Input type="number" placeholder="Min" value={tempFilters.minPrice} onChange={(e) => setTempFilters({ ...tempFilters, minPrice: e.target.value })} /><Input type="number" placeholder="Max" value={tempFilters.maxPrice} onChange={(e) => setTempFilters({ ...tempFilters, maxPrice: e.target.value })} /></div></div>
      <div className="space-y-2"><Label>County</Label><Select value={tempFilters.county} onValueChange={(v) => setTempFilters({ ...tempFilters, county: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{LIBERIA_COUNTIES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent></Select></div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={resetFilters} className="flex-1">Reset</Button>
        <Button onClick={applyFilters} className="flex-1">Apply</Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      
      <main className="max-w-7xl mx-auto py-6 md:py-8 px-4 md:px-6">
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Explore Properties</h1>
          
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by title, address, or county..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            
            {/* Mobile filter trigger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2 md:hidden"><Filter className="h-4 w-4" />Filter</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader><SheetTitle>Filter Properties</SheetTitle></SheetHeader>
                <div className="py-6"><FilterPanel /></div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Desktop: Sidebar + Grid */}
        <div className="md:grid md:grid-cols-[280px_1fr] lg:grid-cols-[300px_1fr] md:gap-8">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden md:block">
            <div className="bg-card rounded-2xl p-5 border border-border sticky top-24">
              <h3 className="font-semibold mb-4">Filters</h3>
              <FilterPanel />
            </div>
          </aside>

          {/* Property Grid */}
          <div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {[...Array(6)].map((_, i) => (<div key={i} className="space-y-3"><Skeleton className="h-48 w-full rounded-2xl" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/2" /></div>))}
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-12"><p className="text-muted-foreground">No properties match your criteria.</p></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {properties.map((property) => (<PropertyCard key={property.id} property={property} />))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Explore;
