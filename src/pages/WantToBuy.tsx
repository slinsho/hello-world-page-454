import Navbar from "@/components/Navbar";
import PropertyList from "@/components/PropertyList";
import { SEOHead } from "@/components/SEOHead";
import { ShoppingBag } from "lucide-react";

const WantToBuy = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <SEOHead title="Properties for Sale in Liberia | L-Prop" description="Browse verified properties for sale in Liberia. Request professional inspections before you buy." />
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-5 space-y-4">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Want to Buy?</h1>
            <p className="text-sm text-muted-foreground">All properties currently for sale. Request an inspection before you commit.</p>
          </div>
        </div>
        <PropertyList
          scope="want-to-buy"
          filters={{ listingType: "sale" }}
          sort="newest"
          pageSize={15}
          gridClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          emptyTitle="No properties for sale right now"
          emptyDescription="Check back soon."
        />
      </main>
    </div>
  );
};

export default WantToBuy;
