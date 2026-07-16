import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SEOHead } from "@/components/SEOHead";
import {
  ArrowLeft, CalendarDays, Heart, IdCard, MessageCircle, Plus, Trash2, ChevronRight,
  Building2, User as UserIcon, Hotel, Home, ClipboardCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type Tab = "bookings" | "favorites" | "ids" | "inquiries" | "inspections";

const ID_TYPES = [
  { value: "national_id", label: "National ID" },
  { value: "passport", label: "Passport" },
  { value: "drivers_license", label: "Driver's License" },
  { value: "voter_id", label: "Voter ID" },
];

const IDS_KEY = "customer_saved_ids_v1";

const loadIds = (): { name: string; type: string; number: string }[] => {
  try { return JSON.parse(localStorage.getItem(IDS_KEY) || "[]"); } catch { return []; }
};
const saveIds = (v: any[]) => localStorage.setItem(IDS_KEY, JSON.stringify(v));

const MyAccount = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("bookings");

  const [bookings, setBookings] = useState<any[]>([]);
  const [favProps, setFavProps] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);
  const [ids, setIds] = useState(loadIds());
  const [newId, setNewId] = useState({ name: "", type: "national_id", number: "" });
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/auth"); return; }
    (async () => {
      const [{ data: p }, { data: b }, { data: f }, { data: q }, { data: o }, { data: ins }] = await Promise.all([
        supabase.from("profiles").select("name,email,profile_photo_url,phone").eq("id", user.id).maybeSingle(),
        supabase.from("hotel_bookings").select("*, hotels(name,city,county,cover_photo), hotel_rooms(name)").eq("guest_id", user.id).order("created_at", { ascending: false }),
        supabase.from("favorites").select("*, properties(id,title,price_usd,photos,county)").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("property_inquiries").select("*, properties(id,title,photos,county,price_usd)").eq("sender_id", user.id).order("created_at", { ascending: false }),
        supabase.from("property_offers").select("*, properties(id,title,photos,county,price_usd)").eq("buyer_id", user.id).order("created_at", { ascending: false }),
        supabase.from("property_inspections").select("*, properties(id,title,photos,county,price_usd)").eq("requester_id", user.id).order("created_at", { ascending: false }),
      ]);
      setProfile(p);
      setBookings(b || []);
      setFavProps(f || []);
      setInquiries(q || []);
      setOffers(o || []);
      setInspections(ins || []);
    })();
  }, [user, loading, navigate]);

  const addId = () => {
    if (!newId.name.trim() || !newId.number.trim()) { toast({ title: "Name and number required", variant: "destructive" }); return; }
    const next = [...ids, newId];
    setIds(next); saveIds(next);
    setNewId({ name: "", type: "national_id", number: "" });
    toast({ title: "ID saved" });
  };
  const removeId = (i: number) => {
    const next = ids.filter((_, idx) => idx !== i);
    setIds(next); saveIds(next);
  };

  const statusStyle = (s: string) => {
    const map: Record<string, string> = {
      pending: "bg-amber-500/15 text-amber-600",
      confirmed: "bg-green-500/15 text-green-600",
      checked_in: "bg-blue-500/15 text-blue-600",
      completed: "bg-muted text-muted-foreground",
      cancelled: "bg-destructive/15 text-destructive",
    };
    return map[s] || "bg-muted text-muted-foreground";
  };

  const TABS: { key: Tab; label: string; icon: any; count: number }[] = [
    { key: "bookings", label: "Hotel Bookings", icon: Hotel, count: bookings.length },
    { key: "inspections", label: "Inspections", icon: ClipboardCheck, count: inspections.length },
    { key: "favorites", label: "Saved", icon: Heart, count: favProps.length },
    { key: "ids", label: "IDs", icon: IdCard, count: ids.length },
    { key: "inquiries", label: "Activity", icon: MessageCircle, count: inquiries.length + offers.length },
  ];

  const upcomingCount = bookings.filter((b) => ["pending", "confirmed", "checked_in"].includes(b.status)).length;
  const totalSpent = bookings.reduce((s, b) => s + Number(b.total || 0), 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      <SEOHead title="My Account" description="View your hotel bookings, saved properties, saved IDs and activity." />

      {/* Gradient hero header */}
      <div className="relative bg-gradient-to-br from-primary via-primary to-primary/70 text-primary-foreground pt-3 pb-8 rounded-b-[2rem] shadow-lg">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 grid place-items-center rounded-full bg-white/15 backdrop-blur active:scale-95 transition-transform"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1" />
            <Link to="/settings" className="text-xs font-semibold px-3 py-2 rounded-full bg-white/15 backdrop-blur">
              Settings
            </Link>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur ring-4 ring-white/30 overflow-hidden grid place-items-center shrink-0">
              {profile?.profile_photo_url ? (
                <img src={profile.profile_photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-7 h-7" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-wider opacity-80 font-semibold">Welcome back</p>
              <h1 className="text-xl font-bold tracking-tight truncate">
                {profile?.name || user?.email?.split("@")[0] || "My account"}
              </h1>
              <p className="text-[11px] opacity-80 truncate">{profile?.email || user?.email}</p>
            </div>
          </div>

          {/* Stat mini-cards */}
          <div className="grid grid-cols-3 gap-2 mt-5">
            <StatMini label="Upcoming" value={upcomingCount} />
            <StatMini label="Saved" value={favProps.length} />
            <StatMini label="Spent" value={`$${totalSpent.toFixed(0)}`} />
          </div>
        </div>
      </div>

      {/* Tab strip */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border/60 -mt-1">
        <div className="max-w-2xl mx-auto flex gap-1 px-2 py-2 overflow-x-auto scrollbar-hide">
          {TABS.map((t) => {
            const active = tab === t.key;
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`shrink-0 flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                  active ? "bg-primary text-primary-foreground shadow-md" : "bg-muted/60 text-foreground/70"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
                {t.count > 0 && (
                  <span className={`text-[10px] px-1.5 rounded-full ${active ? "bg-primary-foreground/25" : "bg-background"}`}>
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 pt-3">
        {/* BOOKINGS */}
        {tab === "bookings" && (
          <div className="space-y-2.5">
            {bookings.length === 0 && (
              <EmptyBlock icon={Hotel} title="No bookings yet" cta="Browse hotels" onClick={() => navigate("/hotels")} />
            )}
            {bookings.map((b) => (
              <div key={b.id} className="flex gap-3 p-2.5 rounded-2xl bg-card border border-border">
                <div className="w-20 h-20 rounded-xl bg-muted overflow-hidden shrink-0">
                  {b.hotels?.cover_photo && <img src={b.hotels.cover_photo} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0 py-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-sm leading-tight truncate">{b.hotels?.name || "Hotel"}</h3>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusStyle(b.status)}`}>
                      {b.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">{b.hotel_rooms?.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />
                    {new Date(b.check_in).toLocaleDateString(undefined, { month: "short", day: "numeric" })} →{" "}
                    {new Date(b.check_out).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </p>
                  <p className="text-primary font-bold text-sm mt-1 tabular-nums">${Number(b.total).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FAVORITES */}
        {tab === "favorites" && (
          <div className="space-y-2.5">
            {favProps.length === 0 && (
              <EmptyBlock icon={Heart} title="No saved properties" cta="Explore properties" onClick={() => navigate("/explore")} />
            )}
            {favProps.map((f) => f.properties && (
              <Link key={f.id} to={`/property/${f.properties.id}`} className="flex gap-3 p-2.5 rounded-2xl bg-card border border-border active:scale-[0.99] transition">
                <div className="w-20 h-20 rounded-xl bg-muted overflow-hidden shrink-0">
                  {f.properties.photos?.[0] && <img src={f.properties.photos[0]} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0 py-0.5">
                  <h3 className="font-bold text-sm leading-tight truncate">{f.properties.title}</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{f.properties.county}</p>
                  <p className="text-primary font-bold text-sm mt-1 tabular-nums">${Number(f.properties.price_usd).toLocaleString()}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground self-center" />
              </Link>
            ))}
          </div>
        )}

        {/* SAVED IDS */}
        {tab === "ids" && (
          <div className="space-y-3">
            <div className="rounded-2xl bg-primary/5 border border-primary/20 p-3 text-[11px] text-muted-foreground">
              Save your IDs here for faster hotel check-in. Stored only on this device.
            </div>

            <section className="rounded-2xl bg-card border border-border p-3 space-y-2">
              <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Add new ID</h3>
              <Input
                placeholder="Full name on ID"
                value={newId.name}
                onChange={(e) => setNewId({ ...newId, name: e.target.value })}
                className="rounded-xl h-11"
              />
              <div className="flex flex-wrap gap-1.5">
                {ID_TYPES.map((t) => {
                  const sel = newId.type === t.value;
                  return (
                    <button
                      key={t.value}
                      onClick={() => setNewId({ ...newId, type: t.value })}
                      className={`h-8 px-3 rounded-full text-[11px] font-semibold transition ${
                        sel ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
              <Input
                placeholder="ID number"
                value={newId.number}
                onChange={(e) => setNewId({ ...newId, number: e.target.value })}
                className="rounded-xl h-11 tabular-nums"
              />
              <Button onClick={addId} className="w-full h-11 rounded-xl">
                <Plus className="w-4 h-4 mr-1" /> Save ID
              </Button>
            </section>

            <div className="space-y-2">
              {ids.map((x, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary grid place-items-center">
                    <IdCard className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{x.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {ID_TYPES.find((t) => t.value === x.type)?.label} · {x.number}
                    </p>
                  </div>
                  <button
                    onClick={() => removeId(i)}
                    className="w-9 h-9 grid place-items-center rounded-full hover:bg-destructive/10 text-destructive active:scale-90 transition"
                    aria-label="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INQUIRIES & OFFERS */}
        {tab === "inquiries" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-1 mb-2">
                Inquiries · {inquiries.length}
              </h3>
              <div className="space-y-2">
                {inquiries.length === 0 && (
                  <p className="text-xs text-muted-foreground px-1">No inquiries sent yet.</p>
                )}
                {inquiries.map((q: any) => (
                  <Link
                    to={q.properties?.id ? `/property/${q.properties.id}` : "#"}
                    key={q.id}
                    className="flex gap-3 p-2.5 rounded-2xl bg-card border border-border active:scale-[0.99] transition"
                  >
                    <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden shrink-0">
                      {q.properties?.photos?.[0] ? (
                        <img src={q.properties.photos[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full grid place-items-center"><Home className="w-4 h-4 text-muted-foreground" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{q.properties?.title || "Property"}</p>
                      {q.properties?.county && <p className="text-[10px] text-muted-foreground">{q.properties.county}</p>}
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{q.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{new Date(q.created_at).toLocaleDateString()}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-1 mb-2">
                Offers · {offers.length}
              </h3>
              <div className="space-y-2">
                {offers.length === 0 && (
                  <p className="text-xs text-muted-foreground px-1">No offers made yet.</p>
                )}
                {offers.map((o: any) => (
                  <Link
                    to={o.properties?.id ? `/property/${o.properties.id}` : "#"}
                    key={o.id}
                    className="flex gap-3 p-2.5 rounded-2xl bg-card border border-border active:scale-[0.99] transition"
                  >
                    <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden shrink-0">
                      {o.properties?.photos?.[0] ? (
                        <img src={o.properties.photos[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full grid place-items-center"><Home className="w-4 h-4 text-muted-foreground" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold truncate">{o.properties?.title || "Property"}</p>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted shrink-0">{o.status}</span>
                      </div>
                      {o.properties?.county && <p className="text-[10px] text-muted-foreground">{o.properties.county}</p>}
                      <p className="text-primary font-bold text-sm mt-0.5 tabular-nums">${Number(o.offer_amount_usd || 0).toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "inspections" && (
          <div className="space-y-2.5">
            {inspections.length === 0 && (
              <EmptyBlock icon={ClipboardCheck} title="No inspection requests yet" cta="Request inspection" onClick={() => navigate("/explore")} />
            )}
            {inspections.map((ins: any) => (
              <Link
                to={ins.properties?.id ? `/property/${ins.properties.id}` : "#"}
                key={ins.id}
                className="flex gap-3 p-2.5 rounded-2xl bg-card border border-border active:scale-[0.99] transition"
              >
                <div className="w-20 h-20 rounded-xl bg-muted overflow-hidden shrink-0">
                  {ins.properties?.photos?.[0] ? (
                    <img src={ins.properties.photos[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full grid place-items-center"><Home className="w-5 h-5 text-muted-foreground" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0 py-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold truncate">{ins.properties?.title || "Property"}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusStyle(ins.status)}`}>{ins.status}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">{String(ins.inspection_type).split("_").join(" ")}</p>
                  <p className="text-primary font-bold text-sm mt-1 tabular-nums">${Number(ins.fee_usd || 0).toFixed(2)}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(ins.created_at).toLocaleDateString()}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

const StatMini = ({ label, value }: { label: string; value: string | number }) => (
  <div className="bg-white/15 backdrop-blur rounded-2xl px-3 py-2.5 text-center">
    <p className="text-lg font-extrabold leading-none tabular-nums">{value}</p>
    <p className="text-[10px] opacity-80 mt-1 uppercase tracking-wider font-semibold">{label}</p>
  </div>
);

const EmptyBlock = ({ icon: Icon, title, cta, onClick }: { icon: any; title: string; cta: string; onClick: () => void }) => (
  <div className="rounded-2xl border border-dashed border-border p-8 text-center">
    <Icon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
    <p className="text-sm text-muted-foreground mb-3">{title}</p>
    <Button onClick={onClick} variant="outline" size="sm" className="rounded-full">{cta}</Button>
  </div>
);

export default MyAccount;
