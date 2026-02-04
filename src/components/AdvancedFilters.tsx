import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Filter, X, Save, Bell } from "lucide-react";
import { LIBERIA_COUNTIES } from "@/lib/constants";
import { useSavedSearches, SearchFilters } from "@/hooks/useSavedSearches";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";

interface AdvancedFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onApply: () => void;
  onReset: () => void;
}

export function AdvancedFilters({ filters, onFiltersChange, onApply, onReset }: AdvancedFiltersProps) {
  const { user } = useAuth();
  const { savedSearches, saveSearch, deleteSearch } = useSavedSearches();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [notifyMatches, setNotifyMatches] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 500000]);

  const handlePriceRangeChange = (value: number[]) => {
    setPriceRange(value);
    onFiltersChange({
      ...filters,
      minPrice: value[0].toString(),
      maxPrice: value[1].toString(),
    });
  };

  const handleSaveSearch = async () => {
    if (!searchName.trim()) return;
    await saveSearch(searchName.trim(), filters, notifyMatches);
    setSaveDialogOpen(false);
    setSearchName("");
    setNotifyMatches(false);
  };

  const applySavedSearch = (savedFilter: SearchFilters) => {
    onFiltersChange(savedFilter);
    if (savedFilter.minPrice && savedFilter.maxPrice) {
      setPriceRange([parseInt(savedFilter.minPrice), parseInt(savedFilter.maxPrice)]);
    }
    onApply();
  };

  const activeFiltersCount = Object.values(filters).filter(
    (v) => v && v !== "all" && v !== ""
  ).length;

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="gap-2 relative">
            <Filter className="h-4 w-4" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filter Properties</SheetTitle>
          </SheetHeader>

          <div className="space-y-6 py-6">
            {/* Saved Searches */}
            {user && savedSearches.length > 0 && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Saved Searches</Label>
                <div className="flex flex-wrap gap-2">
                  {savedSearches.slice(0, 5).map((search) => (
                    <Badge
                      key={search.id}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground flex items-center gap-1"
                      onClick={() => applySavedSearch(search.filters)}
                    >
                      {search.notify_new_matches && <Bell className="h-3 w-3" />}
                      {search.name}
                      <X
                        className="h-3 w-3 ml-1 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSearch(search.id);
                        }}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Property Type */}
            <div className="space-y-2">
              <Label>Property Type</Label>
              <Select
                value={filters.type || "all"}
                onValueChange={(value) => onFiltersChange({ ...filters, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="shop">Shop</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Listing Type */}
            <div className="space-y-2">
              <Label>Listing Type</Label>
              <Select
                value={filters.listing || "all"}
                onValueChange={(value) => onFiltersChange({ ...filters, listing: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Listings</SelectItem>
                  <SelectItem value="for_sale">For Sale</SelectItem>
                  <SelectItem value="for_rent">For Rent</SelectItem>
                  <SelectItem value="for_lease">For Lease</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.status || "all"}
                onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="rented">Rented</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* County */}
            <div className="space-y-2">
              <Label>County</Label>
              <Select
                value={filters.county || "all"}
                onValueChange={(value) => onFiltersChange({ ...filters, county: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Counties</SelectItem>
                  {LIBERIA_COUNTIES.map((county) => (
                    <SelectItem key={county} value={county}>
                      {county}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price Range Slider */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Price Range (USD)</Label>
                <span className="text-sm text-muted-foreground">
                  ${priceRange[0].toLocaleString()} - ${priceRange[1].toLocaleString()}
                </span>
              </div>
              <Slider
                value={priceRange}
                onValueChange={handlePriceRangeChange}
                min={0}
                max={500000}
                step={5000}
                className="mt-2"
              />
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice || ""}
                  onChange={(e) => {
                    onFiltersChange({ ...filters, minPrice: e.target.value });
                    setPriceRange([parseInt(e.target.value) || 0, priceRange[1]]);
                  }}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice || ""}
                  onChange={(e) => {
                    onFiltersChange({ ...filters, maxPrice: e.target.value });
                    setPriceRange([priceRange[0], parseInt(e.target.value) || 500000]);
                  }}
                />
              </div>
            </div>

            {/* Bedrooms */}
            <div className="space-y-2">
              <Label>Bedrooms</Label>
              <div className="flex gap-2">
                {["any", "1", "2", "3", "4", "5+"].map((value) => (
                  <Button
                    key={value}
                    variant={filters.bedrooms === value ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => onFiltersChange({ ...filters, bedrooms: value === "any" ? "" : value })}
                  >
                    {value === "any" ? "Any" : value}
                  </Button>
                ))}
              </div>
            </div>

            {/* Bathrooms */}
            <div className="space-y-2">
              <Label>Bathrooms</Label>
              <div className="flex gap-2">
                {["any", "1", "2", "3", "4+"].map((value) => (
                  <Button
                    key={value}
                    variant={filters.bathrooms === value ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => onFiltersChange({ ...filters, bathrooms: value === "any" ? "" : value })}
                  >
                    {value === "any" ? "Any" : value}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <SheetFooter className="gap-2 flex-col sm:flex-row">
            {user && (
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setSaveDialogOpen(true)}
              >
                <Save className="h-4 w-4" />
                Save Search
              </Button>
            )}
            <Button variant="outline" onClick={onReset}>
              Reset
            </Button>
            <Button onClick={onApply}>
              Apply Filters
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Save Search Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Search</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Search Name</Label>
              <Input
                placeholder="e.g., 3BR Houses in Montserrado"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Notify me of new matches</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when new properties match this search
                </p>
              </div>
              <Switch
                checked={notifyMatches}
                onCheckedChange={setNotifyMatches}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSearch} disabled={!searchName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
