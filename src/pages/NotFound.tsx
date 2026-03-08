import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center max-w-md space-y-6">
        <div className="space-y-2">
          <h1 className="text-7xl font-bold text-primary">404</h1>
          <h2 className="text-2xl font-bold">Page not found</h2>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => window.history.back()} variant="outline" className="gap-2 rounded-xl">
            <ArrowLeft className="h-4 w-4" /> Go Back
          </Button>
          <Button asChild className="gap-2 rounded-xl">
            <Link to="/"><Home className="h-4 w-4" /> Home</Link>
          </Button>
          <Button variant="secondary" asChild className="gap-2 rounded-xl">
            <Link to="/explore"><Search className="h-4 w-4" /> Explore</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
