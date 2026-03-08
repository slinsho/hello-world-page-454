import { useEffect } from "react";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  canonical?: string;
  noIndex?: boolean;
}

export function SEOHead({
  title = "L-Prop - Find Properties in Liberia",
  description = "Discover houses, apartments, and shops for sale or rent across Liberia. Browse verified listings from trusted property owners and agents.",
  keywords = "Liberia real estate, property for sale Liberia, rent house Liberia, Monrovia apartments, Liberian property listings",
  ogImage = "/og-image.png",
  ogType = "website",
  canonical,
  noIndex = false,
}: SEOHeadProps) {
  useEffect(() => {
    // Title
    document.title = title.includes("L-Prop") ? title : `${title} | L-Prop`;

    // Meta tags
    const setMeta = (name: string, content: string, property = false) => {
      const attr = property ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    setMeta("description", description);
    setMeta("keywords", keywords);
    setMeta("og:title", title, true);
    setMeta("og:description", description, true);
    setMeta("og:image", ogImage, true);
    setMeta("og:type", ogType, true);
    setMeta("og:site_name", "LibHub", true);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    setMeta("twitter:image", ogImage);

    if (noIndex) {
      setMeta("robots", "noindex, nofollow");
    } else {
      setMeta("robots", "index, follow");
    }

    // Canonical
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (canonical) {
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = canonical;
    } else if (link) {
      link.remove();
    }

    return () => {
      document.title = "LibHub - Find Properties in Liberia";
    };
  }, [title, description, keywords, ogImage, ogType, canonical, noIndex]);

  return null;
}
