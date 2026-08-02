import { useEffect, useState, useRef, useCallback } from "react";
import { notifyAdmins } from "@/lib/notifyAdmins";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Mail, Phone, MapPin, Send, Loader2, Users, ArrowUpRight,
  CheckCircle2, Search, TrendingUp, HeartHandshake,
  ChevronDown, ChevronUp, Award
} from "lucide-react";

const FacebookIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
);
const InstagramIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12s.014 3.668.072 4.948c.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24s3.668-.014 4.948-.072c4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
);
const TwitterIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
);
const LinkedInIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
);

interface TeamMember {
  name: string; role: string; photo: string; bio: string;
  facebook?: string; instagram?: string; twitter?: string; linkedin?: string;
}
interface WorkPhoto { url: string; caption: string; }
interface ServiceCard { title: string; description: string; }
interface FAQItem { question: string; answer: string; }

interface AboutContent {
  company_name: string; tagline: string; description: string; hero_subtitle: string;
  mission: string; vision: string; banner_image: string; mission_image: string;
  experience_title: string; experience_description: string; experience_image: string;
  dreams_title: string; dreams_description: string; dreams_image: string; dreams_checklist: string[];
  email: string; phone: string; address: string; whatsapp: string;
  values: { title: string; description: string }[];
  stats: { label: string; value: string; sublabel: string }[];
  team_members: TeamMember[]; work_photos: WorkPhoto[];
  services: ServiceCard[]; faqs: FAQItem[];
  newsletter_title: string; newsletter_description: string;
}

const DEFAULT_CONTENT: AboutContent = {
  company_name: "L-Prop",
  tagline: "About",
  description: "Building the property layer for Liberia.",
  hero_subtitle: "L-Prop is the modern marketplace for property in Liberia — verified listings, transparent pricing, and tools built for the way people actually buy, rent, and sell.",
  mission: "Transform property discovery into a transparent, accessible, and trusted digital experience that empowers every Liberian.",
  vision: "Africa's most trusted property ecosystem — where every citizen has effortless access to verified listings and modern tools.",
  banner_image: "",
  mission_image: "",
  experience_title: "Don't just buy real estate — experience it.",
  experience_description: "L-Prop ensures every user gets personalized support throughout their property journey. Connect with verified agents and access premium listings.",
  experience_image: "",
  dreams_title: "Turning your real estate dreams true.",
  dreams_description: "We help you find the right property — this isn't just a listing site, it's a platform to discover your ideal living space.",
  dreams_image: "",
  dreams_checklist: ["Expert Local Knowledge", "Hassle-Free Transactions", "Comprehensive Support"],
  email: "support@lprop.com",
  phone: "",
  address: "Monrovia, Liberia",
  whatsapp: "",
  values: [],
  stats: [],
  team_members: [],
  work_photos: [],
  services: [
    { title: "Personalized Search", description: "Match preferences to properties across location, type, and budget." },
    { title: "Experienced Team", description: "Professionals with deep knowledge of Liberia's property market." },
    { title: "Track Record", description: "Proven record of successful transactions and satisfied clients." },
    { title: "Client-Centric", description: "Every decision is centered on a great client experience." },
  ],
  faqs: [
    { question: "What services does L-Prop provide?", answer: "A comprehensive platform for listing, searching, and managing properties across Liberia." },
    { question: "Can I list my property as an owner?", answer: "Yes — create an account, get verified, and list directly." },
    { question: "How do I search for properties?", answer: "Use advanced filters by county, type, price range, and more." },
    { question: "Do you help with paperwork?", answer: "We provide resources and connect you with verified agents for documentation support." },
    { question: "Are there fees?", answer: "Browsing is free. Optional paid promotion features are available for owners." },
    { question: "How do I hire an agent?", answer: "Browse verified agents, view profiles and reviews, then contact them through messaging." },
  ],
  newsletter_title: "Stay updated on the market.",
  newsletter_description: "One email per week. Market trends, new listings, and product updates.",
};

const About = () => {
  const { toast } = useToast();
  const [content, setContent] = useState<AboutContent>(DEFAULT_CONTENT);
  const [realStats, setRealStats] = useState<{ label: string; value: string; sublabel: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", message: "", property_type: "", budget: "" });
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeWorkPhoto, setActiveWorkPhoto] = useState(0);
  const workScrollRef = useRef<HTMLDivElement>(null);

  const handleWorkScroll = useCallback(() => {
    const el = workScrollRef.current;
    if (!el) return;
    const childWidth = el.children[0]?.clientWidth || 1;
    setActiveWorkPhoto(Math.round(el.scrollLeft / (childWidth + 12)));
  }, []);

  useEffect(() => {
    const fetchContent = async () => {
      const [settingsRes, propsRes, profilesRes] = await Promise.all([
        supabase.from("platform_settings").select("value").eq("key", "about_page_content").single(),
        supabase.from("properties").select("county, status", { count: "exact" }),
        supabase.from("profiles").select("verification_status", { count: "exact" }),
      ]);
      const savedContent = settingsRes.data?.value ? { ...DEFAULT_CONTENT, ...(settingsRes.data.value as any) } : DEFAULT_CONTENT;
      setContent(savedContent);

      const descMap: Record<string, string> = {};
      (savedContent.stats || []).forEach((s: any) => { if (s.label && s.sublabel) descMap[s.label] = s.sublabel; });

      const totalProperties = propsRes.count || 0;
      const activeProperties = propsRes.data?.filter(p => p.status === "active").length || 0;
      const counties = new Set(propsRes.data?.map(p => p.county) || []).size;
      const verifiedUsers = profilesRes.data?.filter(p => p.verification_status === "approved").length || 0;

      const defaultDescs: Record<string, string> = {
        "Total Properties": "Listings across our growing ecosystem.",
        "Active Listings": "Currently available properties.",
        "Verified Users": "Verified people on the marketplace.",
        "Counties Covered": "Communities across Liberia.",
      };

      setRealStats([
        { label: "Total Properties", value: totalProperties.toLocaleString(), sublabel: descMap["Total Properties"] || defaultDescs["Total Properties"] },
        { label: "Active Listings", value: activeProperties.toLocaleString(), sublabel: descMap["Active Listings"] || defaultDescs["Active Listings"] },
        { label: "Verified Users", value: verifiedUsers.toLocaleString(), sublabel: descMap["Verified Users"] || defaultDescs["Verified Users"] },
        { label: "Counties Covered", value: counties.toLocaleString(), sublabel: descMap["Counties Covered"] || defaultDescs["Counties Covered"] },
      ]);
      setLoading(false);
    };
    fetchContent();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) { toast({ title: "Error", description: "Please fill required fields", variant: "destructive" }); return; }
    setSending(true);
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase.from("feedback").insert({
      user_id: auth?.user?.id || null,
      role: "contact_form", activity: "other", problem: form.message, rating: 5,
      email: form.email, phone: form.phone,
      suggestions: `From: ${form.name} | Address: ${form.address} | Type: ${form.property_type} | Budget: ${form.budget}`,
    });
    if (!error) {
      await notifyAdmins({
        title: "New Contact Form Submission",
        message: `${form.name} submitted a contact form: "${form.message.slice(0, 100)}${form.message.length > 100 ? "..." : ""}"`,
        type: "inquiries",
      });
      toast({ title: "Sent", description: "We'll get back to you soon." });
      setForm({ name: "", email: "", phone: "", address: "", message: "", property_type: "", budget: "" });
    } else {
      toast({ title: "Error", description: error.message || "Failed to send", variant: "destructive" });
    }
    setSending(false);
  };

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setSubscribing(true);
    const { error } = await supabase.from("newsletter_subscriptions").insert({ email: newsletterEmail });
    if (error?.code === "23505") toast({ title: "Already subscribed", description: "This email is on the list." });
    else if (error) toast({ title: "Error", description: "Failed to subscribe", variant: "destructive" });
    else { toast({ title: "Subscribed", description: "Welcome aboard." }); setNewsletterEmail(""); }
    setSubscribing(false);
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case "facebook": return <FacebookIcon />;
      case "instagram": return <InstagramIcon />;
      case "twitter": return <TwitterIcon />;
      case "linkedin": return <LinkedInIcon />;
      default: return null;
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background"><Navbar /><div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div></div>
  );

  const inputCls = "w-full rounded-lg px-3 py-2.5 text-sm bg-background border border-border/70 text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors placeholder:text-muted-foreground/60";
  const labelCls = "text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5 block";
  const sectionLabel = (label: string) => (
    <div className="flex items-center gap-3 mb-6">
      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="flex-1 h-px bg-border/60" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <SEOHead title={`About | ${content.company_name}`} description={content.description} />
      <Navbar />

      {/* ===== HERO ===== */}
      <section className="relative border-b border-border/60">
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="relative max-w-6xl mx-auto px-5 md:px-8 pt-12 pb-12 md:pt-24 md:pb-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/40 backdrop-blur px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {content.tagline || "About"}
          </div>
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-foreground leading-[1.05] max-w-3xl">
            {content.description}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-5 max-w-2xl leading-relaxed">
            {content.hero_subtitle}
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Button asChild className="rounded-lg gap-1.5 h-10">
              <Link to="/explore">Browse listings <ArrowUpRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" className="rounded-lg gap-1.5 h-10 border-border/70 bg-card/40 hover:bg-card">
              <Link to="/agents">Meet agents</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="border-b border-border/60">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-10 md:py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border/60 border border-border/60 rounded-xl overflow-hidden bg-card/40">
            {realStats.map((stat, i) => (
              <div key={i} className="p-5 md:p-7">
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">{stat.label}</div>
                <div className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground">{stat.value}</div>
                <p className="text-[11px] md:text-xs text-muted-foreground mt-2 leading-relaxed">{stat.sublabel}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== MISSION / VISION ===== */}
      <section className="border-b border-border/60">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-12 md:py-20">
          {sectionLabel("Principles")}
          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            <div className="rounded-xl border border-border/60 bg-card/40 p-6 md:p-8">
              <div className="text-[10px] font-mono uppercase tracking-widest text-primary mb-3">01 · Mission</div>
              <p className="text-base md:text-lg text-foreground leading-relaxed">{content.mission}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card/40 p-6 md:p-8">
              <div className="text-[10px] font-mono uppercase tracking-widest text-primary mb-3">02 · Vision</div>
              <p className="text-base md:text-lg text-foreground leading-relaxed">{content.vision}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== EXPERIENCE ===== */}
      <section className="border-b border-border/60">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-12 md:py-20 grid md:grid-cols-2 gap-10 items-center">
          <div>
            {sectionLabel("Experience")}
            <h2 className="text-2xl md:text-4xl font-semibold tracking-tight text-foreground leading-tight mb-5">
              {content.experience_title}
            </h2>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              {content.experience_description}
            </p>
          </div>
          <div className="rounded-xl overflow-hidden border border-border/60 bg-card/40 aspect-[4/3]">
            {content.experience_image ? (
              <img src={content.experience_image} alt="Experience" className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-card via-secondary/40 to-background" />
            )}
          </div>
        </div>
      </section>

      {/* ===== DREAMS / CHECKLIST ===== */}
      {(content.dreams_title || content.dreams_checklist?.length > 0) && (
        <section className="border-b border-border/60">
          <div className="max-w-6xl mx-auto px-5 md:px-8 py-12 md:py-20 grid md:grid-cols-2 gap-10 items-center">
            <div className="rounded-xl overflow-hidden border border-border/60 bg-card/40 aspect-[4/3] order-2 md:order-1">
              {content.dreams_image ? (
                <img src={content.dreams_image} alt="Dreams" className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-card via-secondary/40 to-background" />
              )}
            </div>
            <div className="order-1 md:order-2">
              {sectionLabel("Why us")}
              <h2 className="text-2xl md:text-4xl font-semibold tracking-tight text-foreground leading-tight mb-5">
                {content.dreams_title}
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-6">
                {content.dreams_description}
              </p>
              <ul className="space-y-2 mb-8">
                {content.dreams_checklist?.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/40 px-4 py-3">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className="rounded-lg gap-1.5 h-10">
                <Link to="/explore">Get started <ArrowUpRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ===== SERVICES ===== */}
      {content.services?.length > 0 && (
        <section className="border-b border-border/60">
          <div className="max-w-6xl mx-auto px-5 md:px-8 py-12 md:py-20">
            {sectionLabel("Services")}
            <h2 className="text-2xl md:text-4xl font-semibold tracking-tight text-foreground leading-tight mb-10 max-w-2xl">
              Everything you need to find, list, and close.
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {content.services.map((svc, i) => {
                const icons = [Search, Award, TrendingUp, HeartHandshake];
                const Icon = icons[i % icons.length];
                return (
                  <div key={i} className="group rounded-xl border border-border/60 bg-card/40 p-5 hover:bg-card hover:border-border transition-all">
                    <div className="w-9 h-9 rounded-lg border border-border/70 bg-background/50 flex items-center justify-center mb-4 group-hover:border-primary/40 group-hover:text-primary transition-colors">
                      <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
                      0{i + 1}
                    </div>
                    <h3 className="font-semibold text-foreground mb-2 text-sm">{svc.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{svc.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ===== TEAM ===== */}
      {content.team_members?.length > 0 && (
        <section className="border-b border-border/60">
          <div className="max-w-6xl mx-auto px-5 md:px-8 py-12 md:py-20">
            {sectionLabel("Team")}
            <h2 className="text-2xl md:text-4xl font-semibold tracking-tight text-foreground leading-tight mb-10 max-w-2xl">
              Built by people who care about housing.
            </h2>

            {/* Mobile horizontal */}
            <div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory md:hidden -mx-5 px-5 scrollbar-hide">
              {content.team_members.map((member, i) => (
                <div key={i} className="rounded-xl border border-border/60 bg-card/40 overflow-hidden flex-shrink-0 w-44 snap-start">
                  {member.photo ? (
                    <img src={member.photo} alt={member.name} className="w-full h-40 object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-card to-background flex items-center justify-center">
                      <Users className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="p-3">
                    <h3 className="font-semibold text-sm text-foreground truncate">{member.name}</h3>
                    <p className="text-[11px] font-mono text-muted-foreground mb-2">{member.role}</p>
                    <div className="flex gap-1.5">
                      {(["facebook", "instagram", "twitter", "linkedin"] as const).map(p => member[p] && (
                        <a key={p} href={member[p]} target="_blank" rel="noopener noreferrer"
                          className="w-6 h-6 rounded border border-border/70 text-muted-foreground hover:text-primary hover:border-primary/40 flex items-center justify-center transition-colors">
                          {getSocialIcon(p)}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop grid */}
            <div className="hidden md:grid lg:grid-cols-3 md:grid-cols-2 gap-5">
              {content.team_members.map((member, i) => (
                <div key={i} className="group rounded-xl border border-border/60 bg-card/40 overflow-hidden hover:border-border transition-colors">
                  {member.photo ? (
                    <div className="overflow-hidden aspect-[4/5]">
                      <img src={member.photo} alt={member.name} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" loading="lazy" />
                    </div>
                  ) : (
                    <div className="w-full aspect-[4/5] bg-gradient-to-br from-card to-background flex items-center justify-center">
                      <Users className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="font-semibold text-base text-foreground">{member.name}</h3>
                    <p className="text-[11px] font-mono uppercase tracking-wider text-primary mb-2">{member.role}</p>
                    {member.bio && <p className="text-xs text-muted-foreground mb-3 leading-relaxed line-clamp-2">{member.bio}</p>}
                    <div className="flex gap-1.5">
                      {(["facebook", "instagram", "twitter", "linkedin"] as const).map(p => member[p] && (
                        <a key={p} href={member[p]} target="_blank" rel="noopener noreferrer"
                          className="w-7 h-7 rounded border border-border/70 text-muted-foreground hover:text-primary hover:border-primary/40 flex items-center justify-center transition-colors">
                          {getSocialIcon(p)}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== AGENTS CTA ===== */}
      <section className="border-b border-border/60">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-12 md:py-20">
          <div className="rounded-xl border border-border/60 bg-card/40 p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-3">
              Meet our agents & owners.
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Browse verified real estate professionals ready to help.
            </p>
            <Button asChild className="rounded-lg gap-1.5 h-10">
              <Link to="/agents">View all <ArrowUpRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ===== CONTACT ===== */}
      <section className="border-b border-border/60">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-12 md:py-20 grid md:grid-cols-2 gap-10 items-start">
          <div>
            {sectionLabel("Contact")}
            <h2 className="text-2xl md:text-4xl font-semibold tracking-tight text-foreground leading-tight mb-3">
              Let's find you the<br />perfect property.
            </h2>
            <p className="text-sm text-muted-foreground mb-8">Send us a note and we'll get back within 24 hours.</p>
            <div className="space-y-3">
              {content.email && (
                <a href={`mailto:${content.email}`} className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/40 hover:bg-card px-4 py-3 transition-colors">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{content.email}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
                </a>
              )}
              {content.phone && (
                <a href={`tel:${content.phone}`} className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/40 hover:bg-card px-4 py-3 transition-colors">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{content.phone}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
                </a>
              )}
              {content.whatsapp && (
                <a href={`https://wa.me/${content.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/40 hover:bg-card px-4 py-3 transition-colors">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{content.whatsapp}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
                </a>
              )}
              {content.address && (
                <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/40 px-4 py-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{content.address}</span>
                </div>
              )}
            </div>
          </div>
          <form onSubmit={handleSubmit} className="rounded-xl border border-border/60 bg-card/40 p-6 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Name</label>
                <input placeholder="John Doe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Looking for</label>
                <input placeholder="Buy a home" value={form.property_type} onChange={e => setForm({ ...form, property_type: e.target.value })} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Phone</label>
                <input placeholder="+231 886 XXX XXXX" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Budget (USD)</label>
                <input placeholder="$5,000" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" placeholder="you@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Address</label>
                <input placeholder="Monrovia, Liberia" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Message</label>
              <textarea placeholder="Tell us more…" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={4} className={`${inputCls} resize-none`} />
            </div>
            <Button type="submit" disabled={sending} className="w-full rounded-lg gap-2 h-10">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? "Sending…" : "Send message"}
            </Button>
          </form>
        </div>
      </section>

      {/* ===== WORK PHOTOS ===== */}
      {content.work_photos?.length > 0 && (
        <section className="border-b border-border/60">
          <div className="max-w-6xl mx-auto px-5 md:px-8 py-12 md:py-20">
            {sectionLabel("Our work")}
            {/* Mobile */}
            <div className="md:hidden">
              <div ref={workScrollRef} onScroll={handleWorkScroll}
                className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory -mx-5 px-5 scrollbar-hide">
                {content.work_photos.map((photo, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden border border-border/60 flex-shrink-0 w-[78vw] snap-center">
                    <img src={photo.url} alt={photo.caption} className="w-full h-44 object-cover" loading="lazy" />
                    {photo.caption && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3">
                        <p className="text-xs font-medium text-white">{photo.caption}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-1.5 mt-3">
                {content.work_photos.map((_, i) => (
                  <button key={i} onClick={() => {
                    const el = workScrollRef.current;
                    if (!el || !el.children[i]) return;
                    (el.children[i] as HTMLElement).scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
                  }} className={`h-1 rounded-full transition-all ${activeWorkPhoto === i ? "w-6 bg-primary" : "w-1 bg-border"}`} />
                ))}
              </div>
            </div>
            {/* Desktop */}
            <div className="hidden md:grid lg:grid-cols-3 md:grid-cols-2 gap-4">
              {content.work_photos.map((photo, i) => (
                <div key={i} className="relative rounded-xl overflow-hidden group border border-border/60">
                  <img src={photo.url} alt={photo.caption} className="w-full h-52 object-cover group-hover:scale-[1.03] transition-transform duration-500" loading="lazy" />
                  {photo.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-sm font-medium text-white">{photo.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== FAQ ===== */}
      {content.faqs?.length > 0 && (
        <section className="border-b border-border/60">
          <div className="max-w-4xl mx-auto px-5 md:px-8 py-12 md:py-20">
            {sectionLabel("FAQ")}
            <h2 className="text-2xl md:text-4xl font-semibold tracking-tight text-foreground leading-tight mb-8">
              Frequently asked questions.
            </h2>
            <div className="rounded-xl border border-border/60 bg-card/40 divide-y divide-border/60 overflow-hidden">
              {content.faqs.map((faq, i) => (
                <div key={i}>
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-card transition-colors">
                    <span className="text-sm font-medium text-foreground pr-3">{faq.question}</span>
                    {openFaq === i
                      ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-5">
                      <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== NEWSLETTER ===== */}
      <section className="border-b border-border/60">
        <div className="max-w-4xl mx-auto px-5 md:px-8 py-12 md:py-20">
          <div className="rounded-xl border border-border/60 bg-card/40 p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-3">
              {content.newsletter_title}
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              {content.newsletter_description}
            </p>
            <form onSubmit={handleNewsletter} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <input type="email" placeholder="you@example.com" value={newsletterEmail}
                onChange={e => setNewsletterEmail(e.target.value)}
                className="flex-1 rounded-lg px-4 h-10 text-sm bg-background border border-border/70 text-foreground outline-none focus:border-primary/50 placeholder:text-muted-foreground/60" />
              <Button type="submit" disabled={subscribing} className="rounded-lg h-10 px-5">
                {subscribing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Subscribe"}
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-border/60">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-12 md:py-16">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">{content.company_name}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                The modern marketplace for property in Liberia.
              </p>
            </div>
            <div>
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">Address</h4>
              <p className="text-xs text-foreground leading-relaxed">{content.address}</p>
              {content.phone && <p className="text-xs text-muted-foreground mt-1">{content.phone}</p>}
              {content.email && <p className="text-xs text-muted-foreground mt-1">{content.email}</p>}
            </div>
            <div>
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">Contact</h4>
              <div className="flex gap-2">
                {content.whatsapp && (
                  <a href={`https://wa.me/${content.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                    className="w-8 h-8 rounded border border-border/70 text-muted-foreground hover:text-primary hover:border-primary/40 flex items-center justify-center transition-colors">
                    <Phone className="h-3.5 w-3.5" />
                  </a>
                )}
                {content.email && (
                  <a href={`mailto:${content.email}`}
                    className="w-8 h-8 rounded border border-border/70 text-muted-foreground hover:text-primary hover:border-primary/40 flex items-center justify-center transition-colors">
                    <Mail className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="border-t border-border/60 mt-10 pt-6 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} {content.company_name}</p>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">v1.0 · Monrovia</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;
