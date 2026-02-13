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
  const [filters, setFilters] = useState({
    type: "all",
    listing: "all",
    status: "all",
    minPrice: "",
    maxPrice: "",
    county: "all",
  });
  const [tempFilters, setTempFilters] = useState(filters);

  useEffect(() => {
    fetchProperties();
  }, [filters, searchQuery]);

  const fetchProperties = async () => {
    setLoading(true);
    let query = supabase
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false });

    // Apply filters
    if (filters.type !== "all") {
      query = query.eq("property_type", filters.type as any);
    }
    if (filters.listing !== "all") {
      query = query.eq("listing_type", filters.listing as any);
    }
    if (filters.status !== "all") {
      query = query.eq("status", filters.status as any);
    }
    if (filters.county !== "all") {
      query = query.eq("county", filters.county);
    }
    if (filters.minPrice) {
      query = query.gte("price_usd", parseFloat(filters.minPrice));
    }
    if (filters.maxPrice) {
      query = query.lte("price_usd", parseFloat(filters.maxPrice));
    }

    // Apply search
    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%,county.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query;

    if (!error && data) {
      // Fetch owner profiles for verification badges
      const ownerIds = [...new Set(data.map((p: any) => p.owner_id))];
      if (ownerIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, name, role, verification_status, phone")
          .in("id", ownerIds);
        const profilesMap = new Map((profilesData || []).map(p => [p.id, p]));
        setProperties(data.map((p: any) => ({ ...p, profiles: profilesMap.get(p.owner_id) || null })));
      } else {
        setProperties(data);
      }
    }
    setLoading(false);
  };

  const applyFilters = () => {
    setFilters(tempFilters);
  };

  const resetFilters = () => {
    const defaultFilters = {
      type: "all",
      listing: "all",
      status: "all",
      minPrice: "",
      maxPrice: "",
      county: "all",
    };
    setTempFilters(defaultFilters);
    setFilters(defaultFilters);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container py-8 px-4 md:px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Explore Properties</h1>
          
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, address, or county..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filter Properties</SheetTitle>
                </SheetHeader>
                
                <div className="space-y-6 py-6">
                  <div className="space-y-2">
                    <Label>Property Type</Label>
                    <Select
                      value={tempFilters.type}
                      onValueChange={(value) => setTempFilters({ ...tempFilters, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="house">House</SelectItem>
                        <SelectItem value="apartment">Apartment</SelectItem>
                        <SelectItem value="shop">Shop</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Listing Type</Label>
                    <Select
                      value={tempFilters.listing}
                      onValueChange={(value) => setTempFilters({ ...tempFilters, listing: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="for_sale">For Sale</SelectItem>
                        <SelectItem value="for_rent">For Rent</SelectItem>
                        <SelectItem value="for_lease">For Lease</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={tempFilters.status}
                      onValueChange={(value) => setTempFilters({ ...tempFilters, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="negotiating">Negotiating</SelectItem>
                        <SelectItem value="taken">Taken</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Price Range (USD)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={tempFilters.minPrice}
                        onChange={(e) => setTempFilters({ ...tempFilters, minPrice: e.target.value })}
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={tempFilters.maxPrice}
                        onChange={(e) => setTempFilters({ ...tempFilters, maxPrice: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>County</Label>
                    <Select
                      value={tempFilters.county}
                      onValueChange={(value) => setTempFilters({ ...tempFilters, county: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {LIBERIA_COUNTIES.map((county) => (
                          <SelectItem key={county} value={county}>
                            {county}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <SheetFooter className="gap-2">
                  <Button variant="outline" onClick={resetFilters} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={applyFilters} className="flex-1">
                    Apply
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No properties match your criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Explore;
