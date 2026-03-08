import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, Upload, User, Bell, MapPin, SlidersHorizontal, Navigation, Heart, Newspaper, MessageCircle, BarChart3, Info } from "lucide-react";
import lpropLogo from "@/assets/lprop-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LIBERIA_COUNTIES } from "@/lib/constants";
import { UpgradeToAgentDialog } from "@/components/UpgradeToAgentDialog";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [userCounty, setUserCounty] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState("");
  
  const [filterOpen, setFilterOpen] = useState(false);
  const [listingType, setListingType] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [countyFilter, setCountyFilter] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  
  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/explore", label: "Search", icon: Search },
    { path: "/blog", label: "News", icon: Newspaper },
    { path: "/about", label: "About", icon: Info, guestOnly: true },
    { path: "/upload", label: "Add", icon: Upload, requiresAuth: true },
    { path: "/near-me", label: "Near Me", icon: Navigation },
    { path: "/profile", label: "Profile", icon: User, requiresAuth: true },
  ];

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      fetchUserProfile();
      fetchUnreadMessages();
    } else {
      setUserCounty(null);
    }
  }, [user, location.pathname]);

  const fetchUnreadMessages = async () => {
    if (!user) return;
    try {
      const { data: conversations } = await supabase
        .from("conversations")
        .select("id")
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`);
      
      if (conversations && conversations.length > 0) {
        const conversationIds = conversations.map(c => c.id);
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .in("conversation_id", conversationIds)
          .eq("is_read", false)
          .neq("sender_id", user.id);
        setUnreadMessages(count || 0);
      }
    } catch (error) {
      console.error("Error fetching unread messages:", error);
    }
  };

  const fetchUserProfile = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("profiles")
        .select("county, role")
        .eq("id", user.id)
        .maybeSingle();
      if (data?.county) {
        setUserCounty(data.county);
      }
      if (data?.role) {
        setUserRole(data.role);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false);
      setUnreadCount(count || 0);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const isHomePage = location.pathname === "/";
  const isOwner = userRole === "property_owner";

  const handleOwnerFeatureClick = (feature: string, route: string) => {
    if (isOwner) {
      setUpgradeFeature(feature);
      setUpgradeOpen(true);
    } else {
      navigate(route);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (location.pathname === "/") {
      const params = new URLSearchParams(window.location.search);
      if (searchQuery) {
        params.set("search", searchQuery);
      } else {
        params.delete("search");
      }
      navigate(`/?${params.toString()}`);
    } else {
      navigate(`/explore?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
    if (location.pathname === "/") {
      const params = new URLSearchParams(window.location.search);
      if (filter !== "all") {
        params.set("type", filter);
      } else {
        params.delete("type");
      }
      navigate(`/?${params.toString()}`);
    }
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (selectedFilter !== "all") params.set("type", selectedFilter);
    if (listingType !== "all") params.set("listing", listingType);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (countyFilter !== "all") params.set("county", countyFilter);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (searchQuery) params.set("search", searchQuery);
    navigate(`/?${params.toString()}`);
    setFilterOpen(false);
  };

  return (
    <>
      <UpgradeToAgentDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} featureName={upgradeFeature} />

      {/* ===== DESKTOP TOP NAV (all pages) ===== */}
      <nav className="hidden md:block sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 flex h-16 items-center gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Home className="h-6 w-6 text-primary" />
            <span className="text-2xl font-bold text-primary">LibHub</span>
          </Link>

          {/* Desktop Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search properties..."
                className="pl-10 bg-card border-border rounded-full h-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>

          {/* Desktop Nav Links */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              if (item.requiresAuth && !user) return null;
              if ((item as any).guestOnly && user) return null;
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Button key={item.path} variant={isActive ? "default" : "ghost"} size="sm" asChild className="gap-2">
                  <Link to={item.path}>
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                </Button>
              );
            })}
          </div>

          {/* Desktop Icons */}
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate("/favorites")}>
              <Heart className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 relative" onClick={() => handleOwnerFeatureClick("Messages", "/messages")}>
              <MessageCircle className="h-4 w-4" />
              {!isOwner && unreadMessages > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                  {unreadMessages > 9 ? "9+" : unreadMessages}
                </span>
              )}
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 relative" onClick={() => navigate("/notifications")}>
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => handleOwnerFeatureClick("Dashboard", "/dashboard")}>
              <BarChart3 className="h-4 w-4" />
            </Button>
            {!user && (
              <Button variant="default" size="sm" asChild className="ml-2">
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Desktop Filter Bar on Homepage */}
        {isHomePage && (
          <div className="border-t border-border bg-background/80">
            <div className="max-w-7xl mx-auto px-6 py-2 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Link to={userCounty ? `/near-me?county=${encodeURIComponent(userCounty)}` : "/profile"} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{userCounty || "Set Location"}</span>
                </Link>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex gap-2">
                {["all", "house", "shop", "apartment"].map((filter) => (
                  <Badge
                    key={filter}
                    variant={selectedFilter === filter ? "default" : "secondary"}
                    className="cursor-pointer px-4 py-1.5 rounded-full whitespace-nowrap capitalize"
                    onClick={() => handleFilterChange(filter)}
                  >
                    {filter === "all" ? "All" : filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </Badge>
                ))}
              </div>
              <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
                <SheetTrigger asChild>
                  <Button type="button" variant="outline" size="sm" className="gap-2 rounded-full ml-auto">
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    More Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[400px]">
                  <SheetHeader className="pb-4">
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Property Type</Label>
                      <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="house">House</SelectItem>
                          <SelectItem value="apartment">Apartment</SelectItem>
                          <SelectItem value="shop">Shop</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Listing Type</Label>
                      <Select value={listingType} onValueChange={setListingType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="for_sale">For Sale</SelectItem>
                          <SelectItem value="for_rent">For Rent</SelectItem>
                          <SelectItem value="for_lease">For Lease</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Status</Label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="sold">Sold</SelectItem>
                          <SelectItem value="rented">Rented</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Price Range (USD)</Label>
                      <div className="flex gap-3">
                        <Input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                        <Input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">County</Label>
                      <Select value={countyFilter} onValueChange={setCountyFilter}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {LIBERIA_COUNTIES.map((county) => (
                            <SelectItem key={county} value={county}>{county}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={applyFilters} className="w-full">Apply Filters</Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        )}
      </nav>

      {/* ===== MOBILE TOP NAV - Home Page Only ===== */}
      {isHomePage && (
        <div className="md:hidden sticky top-0 z-50 bg-background border-b border-border">
          <div className="px-4 py-3 space-y-3">
            <div className="flex items-center justify-between">
              <Link to={userCounty ? `/near-me?county=${encodeURIComponent(userCounty)}` : "/profile"} className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground font-medium">{userCounty || "Set Location"}</span>
              </Link>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/favorites")}>
                  <Heart className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 relative" onClick={() => handleOwnerFeatureClick("Messages", "/messages")}>
                  <MessageCircle className="h-4 w-4" />
                  {!isOwner && unreadMessages > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                      {unreadMessages > 9 ? "9+" : unreadMessages}
                    </span>
                  )}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 relative" onClick={() => navigate("/notifications")}>
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOwnerFeatureClick("Dashboard", "/dashboard")}>
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search properties..."
                  className="pl-10 bg-card border-border rounded-xl h-11"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
                <SheetTrigger asChild>
                  <Button type="button" variant="secondary" size="icon" className="h-11 w-11 rounded-xl">
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-3xl">
                  <SheetHeader className="pb-4">
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-5 max-h-[60vh] overflow-y-auto">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Property Type</Label>
                      <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                        <SelectTrigger className="w-full h-12 rounded-xl"><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="house">House</SelectItem>
                          <SelectItem value="apartment">Apartment</SelectItem>
                          <SelectItem value="shop">Shop</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Listing Type</Label>
                      <Select value={listingType} onValueChange={setListingType}>
                        <SelectTrigger className="w-full h-12 rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="for_sale">For Sale</SelectItem>
                          <SelectItem value="for_rent">For Rent</SelectItem>
                          <SelectItem value="for_lease">For Lease</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Status</Label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full h-12 rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="sold">Sold</SelectItem>
                          <SelectItem value="rented">Rented</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Price Range (USD)</Label>
                      <div className="flex gap-3">
                        <Input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="h-12 rounded-xl" />
                        <Input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="h-12 rounded-xl" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">County</Label>
                      <Select value={countyFilter} onValueChange={setCountyFilter}>
                        <SelectTrigger className="w-full h-12 rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {LIBERIA_COUNTIES.map((county) => (
                            <SelectItem key={county} value={county}>{county}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={applyFilters} className="w-full rounded-xl h-12">Apply</Button>
                  </div>
                </SheetContent>
              </Sheet>
            </form>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {["all", "house", "shop", "apartment"].map((filter) => (
                <Badge
                  key={filter}
                  variant={selectedFilter === filter ? "default" : "secondary"}
                  className="cursor-pointer px-4 py-1.5 rounded-full whitespace-nowrap capitalize"
                  onClick={() => handleFilterChange(filter)}
                >
                  {filter === "all" ? "All" : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Top Nav - Other Pages (hidden on desktop now) */}
      {!isHomePage && (
        <nav className="md:hidden sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur overflow-x-hidden">
          <div className="px-4 flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <Home className="h-6 w-6 text-primary" />
              <span className="text-2xl font-bold text-primary">LibHub</span>
            </Link>
          </div>
        </nav>
      )}

      {/* Bottom Navigation - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            if (item.requiresAuth && !user) return null;
            if ((item as any).guestOnly && user) return null;
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Button
                key={item.path}
                variant="ghost"
                size="sm"
                className={`flex flex-col items-center gap-1 h-14 px-3 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                onClick={() => navigate(item.path)}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px]">{item.label}</span>
              </Button>
            );
          })}
          {!user && (
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center gap-1 h-14 px-3 text-muted-foreground"
              onClick={() => navigate("/auth")}
            >
              <User className="h-5 w-5" />
              <span className="text-[10px]">Sign In</span>
            </Button>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
