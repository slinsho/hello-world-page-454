import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useRecentSearches } from "@/hooks/useRecentSearches";
import { useSearchOverlay } from "@/hooks/useSearchOverlay";
import PropertyList from "@/components/PropertyList";
import Navbar from "@/components/Navbar";
import { FeaturedPropertiesBanner } from "@/components/FeaturedPropertiesBanner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Filter, Search, Clock, X } from "lucide-react";
import { LIBERIA_COUNTIES } from "@/lib/constants";
import type { PropertyListFilters, PropertySort } from "@/hooks/usePropertyList";

const Explore = () => {
  const { preferences } = useUserPreferences();
  const searchOverlay = useSearchOverlay();
  const { recents, addRecent, removeRecent, clearRecents } = useRecentSearches();
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get("search") || "";
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [searchInput, setSearchInput] = useState(urlSearch);

  // Keep in sync when a search is launched from the navbar.
  useEffect(() => {
    setSearchQuery(urlSearch);
    setSearchInput(urlSearch);
  }, [urlSearch]);

  const [showRecents, setShowRecents] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [filters, setFilters] = useState({ type: "all", listing: "all", minPrice: "", maxPrice: "", county: "all" });
  const [tempFilters, setTempFilters] = useState(filters);
  const [sortOrder, setSortOrder] = useState<PropertySort>("newest");

  // Apply defaults from preferences on first load
  useEffect(() => {
    if (!initialized) {
      const updated = {
        ...filters,
        county: preferences.default_county || "all",
        listing: preferences.default_listing_type || "all",
        type: preferences.default_property_type || "all",
      };
      setFilters(updated);
      setTempFilters(updated);
      setSortOrder((preferences.default_sort_order as PropertySort) || "newest");
    }
    setInitialized(true);
  }, [preferences.default_county, preferences.default_listing_type, preferences.default_property_type, preferences.default_sort_order]);

  // Close recent searches dropdown when clicking outside
  useEffect(() => {
    if (!showRecents) return;
    const onDown = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setShowRecents(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [showRecents]);

  const listFilters: PropertyListFilters = useMemo(() => ({
    county: filters.county !== "all" ? filters.county : undefined,
    propertyType: filters.type !== "all" ? filters.type : undefined,
    listingType: filters.listing !== "all" ? filters.listing : undefined,
    minPrice: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
    search: searchQuery || undefined,
  }), [filters, searchQuery]);


  const applyFilters = () => { searchOverlay.start("Applying filters"); setFilters(tempFilters); };
  const resetFilters = () => { const d = { type: "all", listing: "all", minPrice: "", maxPrice: "", county: "all" }; setTempFilters(d); setFilters(d); };

  const FilterPanel = () => (
    <div className="space-y-5">
      <div className="space-y-2"><Label>Property Type</Label><Select value={tempFilters.type} onValueChange={(v) => setTempFilters({ ...tempFilters, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="house">House</SelectItem><SelectItem value="apartment">Apartment</SelectItem><SelectItem value="shop">Shop</SelectItem></SelectContent></Select></div>
      <div className="space-y-2"><Label>Listing Type</Label><Select value={tempFilters.listing} onValueChange={(v) => setTempFilters({ ...tempFilters, listing: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="for_sale">For Sale</SelectItem><SelectItem value="for_rent">For Rent</SelectItem><SelectItem value="for_lease">For Lease</SelectItem></SelectContent></Select></div>
      <div className="space-y-2"><Label>Sort By</Label><Select value={sortOrder} onValueChange={(v) => setSortOrder(v as PropertySort)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="newest">Newest</SelectItem><SelectItem value="random">Random</SelectItem><SelectItem value="price_low">Price: Low to High</SelectItem><SelectItem value="price_high">Price: High to Low</SelectItem></SelectContent></Select></div>
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
          
          <div className="flex gap-2 items-center">
            <div className="relative flex-1" ref={searchWrapRef}>
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
              <Input
                placeholder="Search properties..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onFocus={() => setShowRecents(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const v = searchInput.trim();
                    setSearchQuery(v);
                    if (v) addRecent(v);
                    setShowRecents(false);
                  } else if (e.key === "Escape") {
                    setShowRecents(false);
                  }
                }}
                className="pl-9 pr-9"
              />
              {searchInput && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => { setSearchInput(""); setSearchQuery(""); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {showRecents && recents.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 z-30 bg-popover border border-border rounded-xl shadow-lg overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                    <span className="text-xs font-medium text-muted-foreground">Recent searches</span>
                    <button
                      type="button"
                      onClick={clearRecents}
                      className="text-xs text-primary hover:underline"
                    >
                      Clear all
                    </button>
                  </div>
                  <ul className="max-h-64 overflow-y-auto">
                    {recents
                      .filter((r) => !searchInput || r.toLowerCase().includes(searchInput.toLowerCase()))
                      .map((r) => (
                        <li key={r} className="flex items-center group hover:bg-muted">
                          <button
                            type="button"
                            onClick={() => {
                              setSearchInput(r);
                              setSearchQuery(r);
                              addRecent(r);
                              setShowRecents(false);
                            }}
                            className="flex-1 flex items-center gap-2 px-3 py-2 text-sm text-left"
                          >
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="truncate">{r}</span>
                          </button>
                          <button
                            type="button"
                            aria-label={`Remove ${r}`}
                            onClick={(e) => { e.stopPropagation(); removeRecent(r); }}
                            className="px-2 py-2 text-muted-foreground opacity-60 hover:opacity-100"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
            
            {/* Mobile filter trigger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden flex-shrink-0 h-10 w-10"><Filter className="h-4 w-4" /></Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader><SheetTitle>Filter Properties</SheetTitle></SheetHeader>
                <div className="py-6"><FilterPanel /></div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Featured Promoted Properties */}
        <FeaturedPropertiesBanner />

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
            <PropertyList
              scope="explore"
              filters={listFilters}
              sort={sortOrder}
              pageSize={15}
              gridClassName="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6"
              emptyTitle="No properties match your criteria"
              emptyDescription="Try adjusting or resetting your filters."
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Explore;
