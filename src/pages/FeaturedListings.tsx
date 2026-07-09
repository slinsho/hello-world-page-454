import Navbar from "@/components/Navbar";
import PropertyList from "@/components/PropertyList";
import { Sparkles } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";

const FeaturedListings = () => {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <SEOHead title="Featured Listings | L-Prop" description="Browse our featured and promoted property listings." />
      <Navbar />

      <main className="px-4 pt-4 md:px-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Featured Listings</h1>
        </div>

        <PropertyList
          scope="featured"
          filters={{ onlyPromoted: true }}
          sort="newest"
          pageSize={15}
          gridClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          emptyTitle="No featured listings yet"
          emptyDescription="Check back soon for promoted properties."
        />
      </main>
    </div>
  );
};

export default FeaturedListings;
