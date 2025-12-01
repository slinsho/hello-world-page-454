import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Search, Upload, User, Bell, MapPin, SlidersHorizontal, Navigation, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [userCounty, setUserCounty] = useState<string | null>(null);
  
  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/explore", label: "Search", icon: Search },
    { path: "/upload", label: "Add", icon: Upload, requiresAuth: true },
    { path: "/near-me", label: "Near Me", icon: Navigation },
    { path: "/profile", label: "Profile", icon: User, requiresAuth: true },
  ];

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      fetchUserProfile();
    } else {
      setUserCounty(null);
    }
  }, [user, location.pathname]);

  const fetchUserProfile = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("profiles")
        .select("county")
        .eq("id", user.id)
        .maybeSingle();
      if (data?.county) {
        setUserCounty(data.county);
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

  const handleFilterClick = () => {
    navigate('/explore');
  };

  return (
    <>
      {/* Top Navigation - Home Page Only */}
      {isHomePage && (
        <div className="sticky top-0 z-50 bg-background border-b border-border">
          <div className="px-4 py-3 space-y-3">
            {/* Location and Notification */}
            <div className="flex items-center justify-between">
              <Link to={userCounty ? `/near-me?county=${encodeURIComponent(userCounty)}` : "/profile"} className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground font-medium">
                  {userCounty || "Set Location"}
                </span>
              </Link>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => navigate("/favorites")}
                >
                  <Heart className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 relative"
                  onClick={() => navigate("/notifications")}
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
              </div>
            </div>

            {/* Search Bar */}
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
              <Button 
                type="button"
                variant="secondary" 
                size="icon" 
                className="h-11 w-11 rounded-xl"
                onClick={handleFilterClick}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </form>

            {/* Filter Chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <Badge 
                variant={selectedFilter === "all" ? "default" : "secondary"}
                className="cursor-pointer px-4 py-1.5 rounded-full whitespace-nowrap"
                onClick={() => handleFilterChange("all")}
              >
                All
              </Badge>
              <Badge 
                variant={selectedFilter === "house" ? "default" : "secondary"}
                className="cursor-pointer px-4 py-1.5 rounded-full whitespace-nowrap"
                onClick={() => handleFilterChange("house")}
              >
                House
              </Badge>
              <Badge 
                variant={selectedFilter === "shop" ? "default" : "secondary"}
                className="cursor-pointer px-4 py-1.5 rounded-full whitespace-nowrap"
                onClick={() => handleFilterChange("shop")}
              >
                Shop
              </Badge>
              <Badge 
                variant={selectedFilter === "apartment" ? "default" : "secondary"}
                className="cursor-pointer px-4 py-1.5 rounded-full whitespace-nowrap"
                onClick={() => handleFilterChange("apartment")}
              >
                Apartment
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Top Navigation - Other Pages */}
      {!isHomePage && (
        <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
          <div className="container flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <Home className="h-6 w-6 text-primary" />
              <span className="text-2xl font-bold text-primary">LibHub</span>
            </Link>

            {/* Desktop/Tablet Navigation */}
            <div className="hidden md:flex items-center gap-2">
              {navItems.map((item) => {
                if (item.requiresAuth && !user) return null;
                
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Button
                    key={item.path}
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    asChild
                    className="gap-2"
                  >
                    <Link to={item.path}>
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </Button>
                );
              })}
              
              {!user && (
                <Button variant="default" size="sm" asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
              )}
            </div>
          </div>
        </nav>
      )}

      {/* Bottom Navigation - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            if (item.requiresAuth && !user) return null;
            
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Button
                key={item.path}
                variant="ghost"
                size="sm"
                asChild
                className={`flex-col h-14 gap-0.5 flex-1 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Link to={item.path}>
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px]">{item.label}</span>
                </Link>
              </Button>
            );
          })}
          
          {!user && (
            <Button variant="ghost" size="sm" asChild className="flex-col h-14 gap-0.5 flex-1 text-muted-foreground">
              <Link to="/auth">
                <User className="h-5 w-5" />
                <span className="text-[10px]">Sign In</span>
              </Link>
            </Button>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
