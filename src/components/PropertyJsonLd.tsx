import { useEffect } from "react";

interface PropertyJsonLdProps {
  property: {
    id: string;
    title: string;
    description?: string;
    price_usd: number;
    county: string;
    address: string;
    photos: string[];
    listing_type: string;
    bedrooms?: number;
    bathrooms?: number;
    property_type: string;
  };
}

export function PropertyJsonLd({ property }: PropertyJsonLdProps) {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "property-jsonld";
    
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: property.title,
      description: property.description || property.title,
      url: `${window.location.origin}/property/${property.id}`,
      image: property.photos?.[0],
      offers: {
        "@type": "Offer",
        price: property.price_usd,
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
      address: {
        "@type": "PostalAddress",
        addressRegion: property.county,
        streetAddress: property.address,
        addressCountry: "LR",
      },
      numberOfRooms: property.bedrooms,
      numberOfBathroomsTotal: property.bathrooms,
    };

    script.textContent = JSON.stringify(jsonLd);

    // Remove old one if exists
    document.getElementById("property-jsonld")?.remove();
    document.head.appendChild(script);

    return () => {
      document.getElementById("property-jsonld")?.remove();
    };
  }, [property]);

  return null;
}
