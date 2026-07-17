import { useEffect, useRef, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft, Heart, MessageCircle, Share2, MapPin, Bed, Bath,
  Volume2, VolumeX, Play, ShieldCheck, Sparkles, Trees, Eye,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { useFormatLRD } from "@/hooks/usePlatformSettings";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { formatWhatsAppLink } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { SEOHead } from "@/components/SEOHead";

type Reel = {
  id: string;
  title: string;
  property_type: string;
  listing_type: string;
  price_usd: number;
  address: string;
  county: string;
  videos: string[];
  photos: string[];
  bedrooms: number | null;
  bathrooms: number | null;
  contact_phone: string;
  is_promoted: boolean;
  owner_id: string;
  profiles?: {
    name: string;
    role?: string;
    profile_photo_url?: string | null;
    verification_status?: string;
  } | null;
};

const Reels = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { toggleFavorite, isFavorite } = useFavorites();
  const formatLRD = useFormatLRD();
  const { preferences } = useUserPreferences();
  const showLRD = preferences.currency_display === "lrd";

  const [reels, setReels] = useState<Reel[]>([]);
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [muted, setMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const viewTimerRef = useRef<number | null>(null);
  const viewedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("properties")
        .select(`id, title, property_type, listing_type, price_usd, address, county, videos, photos, bedrooms, bathrooms, contact_phone, is_promoted, owner_id`)
        .eq("status", "active")
        .not("videos", "is", null)
        .order("is_promoted", { ascending: false })
        .order("updated_at", { ascending: false })
        .limit(60);

      if (error) {
        console.error("Reels load error", error);
        if (!cancelled) setLoading(false);
        return;
      }

      const isSafeVideoUrl = (u: unknown): u is string => {
        if (typeof u !== "string" || u.length === 0 || u.length > 2048) return false;
        try {
          const parsed = new URL(u);
          if (parsed.protocol !== "https:") return false;
          // Accept supabase-hosted media (public or signed) or any https video file URL
          const isSupabase = /\.supabase\.(co|in)$/i.test(parsed.hostname) &&
            (parsed.pathname.includes("/storage/v1/object/public/") ||
             parsed.pathname.includes("/storage/v1/object/sign/") ||
             parsed.pathname.includes("/storage/v1/render/"));
          const isVideoFile = /\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(parsed.pathname);
          return isSupabase || isVideoFile;
        } catch {
          return false;
        }
      };

      const withSafeMedia = (data as any[])
        .map((r) => ({
          ...r,
          videos: Array.isArray(r.videos) ? r.videos.filter(isSafeVideoUrl) : [],
          photos: Array.isArray(r.photos) ? r.photos.filter((p: unknown) => typeof p === "string") : [],
        }))
        .filter((r) => r.videos.length > 0);

      // Fetch profiles separately (no embedded FK relationship configured)
      const ownerIds = [...new Set(withSafeMedia.map((r) => r.owner_id))];
      let profilesMap = new Map<string, any>();
      if (ownerIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, name, role, profile_photo_url, verification_status")
          .in("id", ownerIds);
        profilesMap = new Map((profilesData || []).map((p: any) => [p.id, p]));
      }

      const filtered = withSafeMedia
        .map((r) => ({ ...r, profiles: profilesMap.get(r.owner_id) || null }))
        .filter((r) => r.is_promoted || r.profiles?.verification_status === "approved");

      const promoted = filtered.filter((r) => r.is_promoted);
      const rest = filtered.filter((r) => !r.is_promoted);
      // Fisher-Yates shuffle (unbiased, unlike sort(() => Math.random() - 0.5))
      for (let i = rest.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rest[i], rest[j]] = [rest[j], rest[i]];
      }
      const finalList = [...promoted, ...rest] as Reel[];

      if (!cancelled) {
        setReels(finalList);
        setLoading(false);

        // Fetch view counts via RPC so all users (not just owners) see the same numbers.
        // Direct SELECT on property_views is restricted by RLS to owners/admins, which
        // caused different users to see different counts.
        if (finalList.length > 0) {
          const ids = finalList.map((r) => r.id);
          const { data: viewData } = await supabase.rpc("get_property_view_counts", {
            p_property_ids: ids,
          });
          if (!cancelled && viewData) {
            const counts: Record<string, number> = {};
            (viewData as any[]).forEach((v) => {
              counts[v.property_id] = Number(v.view_count) || 0;
            });
            setViewCounts(counts);
          }
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // Log a view once per reel after 2s of active playback
  useEffect(() => {
    if (viewTimerRef.current) {
      window.clearTimeout(viewTimerRef.current);
      viewTimerRef.current = null;
    }
    const reel = reels[activeIdx];
    if (!reel || viewedIdsRef.current.has(reel.id)) return;

    // Session-level dedupe: prevents the same guest from inflating a view count
    // by scrolling back to the same reel across page refreshes in one tab.
    const sessionKey = `reel-viewed:${reel.id}`;
    if (sessionStorage.getItem(sessionKey)) {
      viewedIdsRef.current.add(reel.id);
      return;
    }

    viewTimerRef.current = window.setTimeout(async () => {
      viewedIdsRef.current.add(reel.id);
      sessionStorage.setItem(sessionKey, "1");
      try {
        await supabase.from("property_views").insert({
          property_id: reel.id,
          viewer_id: user?.id ?? null,
        });
        setViewCounts((prev) => ({ ...prev, [reel.id]: (prev[reel.id] || 0) + 1 }));
      } catch {/* ignore */}
    }, 2000);
    return () => {
      if (viewTimerRef.current) {
        window.clearTimeout(viewTimerRef.current);
        viewTimerRef.current = null;
      }
    };
  }, [activeIdx, reels, user?.id]);

  useEffect(() => {
    if (!containerRef.current || reels.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = Number((entry.target as HTMLElement).dataset.idx);
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            setActiveIdx(idx);
          }
        });
      },
      { root: containerRef.current, threshold: [0.6] }
    );
    const slides = containerRef.current.querySelectorAll("[data-reel-slide]");
    slides.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [reels]);

  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === activeIdx) {
        v.muted = muted;
        // Ensure the source is loaded before attempting to play — reels that were
        // preload="none" won't have a ready media buffer, so play() rejects silently.
        try {
          if (v.readyState < 2) v.load();
        } catch { /* ignore */ }
        const tryPlay = () => v.play().catch(() => {
          // Retry once muted — browsers block unmuted autoplay without gesture.
          v.muted = true;
          v.play().catch(() => {});
        });
        tryPlay();
      } else {
        v.pause();
        try { v.currentTime = 0; } catch { /* ignore */ }
      }
    });
  }, [activeIdx, muted, reels]);

  const handleShare = useCallback(async (reel: Reel) => {
    const url = `${window.location.origin}/property/${reel.id}`;
    const shareData = { title: reel.title, text: `${reel.title} - ${reel.county}, Liberia`, url };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: "Link copied", description: "Property link copied to clipboard" });
      }
    } catch {/* user cancelled */ }
  }, [toast]);

  const handleWhatsApp = (reel: Reel) => {
    const msg = `Hi, I'm interested in your property "${reel.title}" listed at $${Number(reel.price_usd || 0).toLocaleString()} (${formatLRD(reel.price_usd)}).`;
    window.open(formatWhatsAppLink(reel.contact_phone, msg), "_blank");
  };

  const handleFavorite = (id: string) => {
    if (!user) { navigate("/auth"); return; }
    toggleFavorite(id);
  };

  if (loading) {
    return (
      <div className="h-[100dvh] w-full bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="h-[100dvh] w-full bg-black text-white flex flex-col items-center justify-center px-6 text-center">
        <Play className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold mb-2">No reels yet</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Reels show videos from promoted listings or verified owners. Check back soon.
        </p>
        <Button onClick={() => navigate("/")} variant="secondary">Back to home</Button>
      </div>
    );
  }

  return (
    <>
      <SEOHead title="Property Reels - L-Prop" description="Browse property videos in a vertical feed. Discover land, houses, apartments, and shops in Liberia." />
      <div className="fixed inset-0 z-50 bg-black">
        <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 pt-[env(safe-area-inset-top,0)] pb-3 bg-gradient-to-b from-black/70 to-transparent">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 rounded-full h-9 w-9"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-white font-semibold text-base">Reels</h1>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 rounded-full h-9 w-9"
            onClick={() => setMuted((m) => !m)}
          >
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
        </div>

        <div
          ref={containerRef}
          className="h-[100dvh] w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: "none" }}
        >
          {reels.map((reel, idx) => {
            const fav = isFavorite(reel.id);
            const verified = reel.profiles?.verification_status === "approved";
            const agentRole = reel.profiles?.role === "agent";
            return (
              <section
                key={reel.id}
                data-reel-slide
                data-idx={idx}
                className="relative h-[100dvh] w-full snap-start flex items-center justify-center"
              >
                <video
                  ref={(el) => (videoRefs.current[idx] = el)}
                  src={reel.videos[0]}
                  poster={reel.photos?.[0]}
                  className="h-full w-full object-cover"
                  loop
                  muted={muted}
                  playsInline
                  preload={Math.abs(idx - activeIdx) <= 1 ? "auto" : "none"}
                  onClick={(e) => {
                    const v = e.currentTarget;
                    if (v.paused) v.play(); else v.pause();
                  }}
                />

                <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none" />

                <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5 z-20">
                  <div className="flex flex-col items-center gap-1 text-white">
                    <div className="h-11 w-11 rounded-full bg-white/15 backdrop-blur flex items-center justify-center">
                      <Eye className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] tabular-nums">
                      {(viewCounts[reel.id] || 0) >= 1000
                        ? `${((viewCounts[reel.id] || 0) / 1000).toFixed(1)}k`
                        : viewCounts[reel.id] || 0}
                    </span>
                  </div>
                  <button
                    onClick={() => handleFavorite(reel.id)}
                    className="flex flex-col items-center gap-1 text-white"
                    aria-label="Favorite"
                  >
                    <div className="h-11 w-11 rounded-full bg-white/15 backdrop-blur flex items-center justify-center">
                      <Heart className={`h-5 w-5 ${fav ? "fill-red-500 text-red-500" : ""}`} />
                    </div>
                    <span className="text-[10px]">Save</span>
                  </button>
                  <button
                    onClick={() => handleWhatsApp(reel)}
                    className="flex flex-col items-center gap-1 text-white"
                    aria-label="WhatsApp"
                  >
                    <div className="h-11 w-11 rounded-full bg-[hsl(142,70%,45%)] flex items-center justify-center">
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    <span className="text-[10px]">Chat</span>
                  </button>
                  <button
                    onClick={() => handleShare(reel)}
                    className="flex flex-col items-center gap-1 text-white"
                    aria-label="Share"
                  >
                    <div className="h-11 w-11 rounded-full bg-white/15 backdrop-blur flex items-center justify-center">
                      <Share2 className="h-5 w-5" />
                    </div>
                    <span className="text-[10px]">Share</span>
                  </button>
                </div>

                <div className="absolute inset-x-0 bottom-0 px-4 pb-8 z-20 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Link to={`/profile/${reel.owner_id}`} className="flex items-center gap-2">
                      <Avatar className="h-9 w-9 border border-white/30">
                        <AvatarImage src={reel.profiles?.profile_photo_url || undefined} />
                        <AvatarFallback className="bg-white/20 text-white text-xs">
                          {reel.profiles?.name?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold leading-tight">
                          {reel.profiles?.name || "Owner"}
                        </span>
                        {verified && (
                          <span className={`text-[10px] flex items-center gap-1 ${agentRole ? "text-blue-300" : "text-green-300"}`}>
                            <ShieldCheck className="h-3 w-3" />
                            {agentRole ? "Verified Agent" : "Verified Owner"}
                          </span>
                        )}
                      </div>
                    </Link>
                    {reel.is_promoted && (
                      <Badge className="ml-1 bg-primary/90 text-primary-foreground text-[10px] gap-1">
                        <Sparkles className="h-3 w-3" />Featured
                      </Badge>
                    )}
                  </div>

                  <Link to={`/property/${reel.id}`} className="block">
                    <h2 className="text-base font-bold leading-snug line-clamp-2 mb-1">
                      {reel.title}
                    </h2>
                    <div className="flex items-center gap-1.5 text-xs text-white/80 mb-1.5">
                      <MapPin className="h-3 w-3" />
                      <span className="line-clamp-1">{reel.address}, {reel.county}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-white/85 mb-2">
                      {reel.property_type === "land" ? (
                        <span className="flex items-center gap-1"><Trees className="h-3 w-3" />Land</span>
                      ) : (
                        <>
                          {reel.bedrooms != null && <span className="flex items-center gap-1"><Bed className="h-3 w-3" />{reel.bedrooms} Bed</span>}
                          {reel.bathrooms != null && <span className="flex items-center gap-1"><Bath className="h-3 w-3" />{reel.bathrooms} Bath</span>}
                        </>
                      )}
                      <span className="capitalize">· {reel.property_type}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-primary">
                        {showLRD ? formatLRD(reel.price_usd) : `$${Number(reel.price_usd || 0).toLocaleString()}`}
                      </span>
                      <span className="text-xs text-white/60">
                        {showLRD ? `$${Number(reel.price_usd || 0).toLocaleString()}` : formatLRD(reel.price_usd)}
                      </span>
                    </div>
                  </Link>

                  <Link
                    to={`/property/${reel.id}`}
                    className="mt-3 inline-flex items-center justify-center w-full h-11 rounded-xl bg-white text-black font-semibold text-sm"
                  >
                    View Property
                  </Link>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default Reels;
