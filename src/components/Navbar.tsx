import { Link, useLocation } from "react-router-dom";
import { Home, Search, Upload, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const Navbar = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/explore", label: "Explore", icon: Search },
    { path: "/upload", label: "Upload", icon: Upload, requiresAuth: true },
    { path: "/profile", label: "Profile", icon: User, requiresAuth: true },
  ];

  return (
    <>
      {/* Top Navigation - Desktop & Tablet */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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

      {/* Bottom Navigation - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-around h-16 px-2">
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
                className="flex-col h-14 gap-1 flex-1"
              >
                <Link to={item.path}>
                  <Icon className="h-5 w-5" />
                  <span className="text-xs">{item.label}</span>
                </Link>
              </Button>
            );
          })}
          
          {!user && (
            <Button variant="default" size="sm" asChild className="flex-col h-14 gap-1 flex-1">
              <Link to="/auth">
                <User className="h-5 w-5" />
                <span className="text-xs">Sign In</span>
              </Link>
            </Button>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
