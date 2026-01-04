import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface Banner {
  id: string;
  image_url: string;
  title: string | null;
  link_url: string | null;
}

export function HomepageBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const { data, error } = await supabase
          .from("homepage_banners")
          .select("id, image_url, title, link_url")
          .eq("is_active", true)
          .order("display_order", { ascending: true });

        if (error) throw error;
        setBanners(data || []);
      } catch (error) {
        console.error("Error fetching banners:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-48 md:h-64 lg:h-80 bg-muted animate-pulse rounded-lg" />
    );
  }

  if (banners.length === 0) {
    return null;
  }

  const BannerImage = ({ banner }: { banner: Banner }) => {
    const image = (
      <img
        src={banner.image_url}
        alt={banner.title || "Banner"}
        className="w-full h-48 md:h-64 lg:h-80 object-cover rounded-lg"
      />
    );

    if (banner.link_url) {
      return (
        <a
          href={banner.link_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          {image}
        </a>
      );
    }

    return image;
  };

  if (banners.length === 1) {
    return (
      <div className="w-full">
        <BannerImage banner={banners[0]} />
      </div>
    );
  }

  return (
    <Carousel className="w-full" opts={{ loop: true }}>
      <CarouselContent>
        {banners.map((banner) => (
          <CarouselItem key={banner.id}>
            <BannerImage banner={banner} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-2" />
      <CarouselNext className="right-2" />
    </Carousel>
  );
}
