import Navbar from "@/components/Navbar";
import { SEOHead } from "@/components/SEOHead";
import { PropertyList } from "@/components/PropertyList";
import { usePropertyList } from "@/hooks/usePropertyList";

const WantToBuy = () => {
  const list = usePropertyList({ listingType: "sale", sort: "newest" });
  return (
    <div className="min-h-screen bg-background pb-20">
      <SEOHead title="Properties for Sale in Liberia | L-Prop" description="Browse verified properties for sale in Liberia. Request professional inspections before you buy." />
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-5 space-y-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Want to Buy?</h1>
          <p className="text-sm text-muted-foreground">All properties currently listed for sale. Request an inspection from any listing before you commit.</p>
        </div>
        <PropertyList {...list} />
      </main>
    </div>
  );
};

export default WantToBuy;
