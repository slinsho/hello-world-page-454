import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Building2, Mail, Phone, MapPin, Send, Loader2, Target, Eye,
  Users, ArrowRight, CheckCircle2, Search, Award, TrendingUp, HeartHandshake,
  ChevronDown, ChevronUp
} from "lucide-react";

const FacebookIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
);
const InstagramIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
);
const TwitterIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
);
const LinkedInIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
);

interface TeamMember {
  name: string;
  role: string;
  photo: string;
  bio: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
}

interface WorkPhoto {
  url: string;
  caption: string;
}

interface ServiceCard {
  title: string;
  description: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface AboutContent {
  company_name: string;
  tagline: string;
  description: string;
  hero_subtitle: string;
  mission: string;
  vision: string;
  banner_image: string;
  mission_image: string;
  experience_title: string;
  experience_description: string;
  experience_image: string;
  dreams_title: string;
  dreams_description: string;
  dreams_image: string;
  dreams_checklist: string[];
  email: string;
  phone: string;
  address: string;
  whatsapp: string;
  values: { title: string; description: string }[];
  stats: { label: string; value: string; sublabel: string }[];
  team_members: TeamMember[];
  work_photos: WorkPhoto[];
  services: ServiceCard[];
  faqs: FAQItem[];
  newsletter_title: string;
  newsletter_description: string;
}

const DEFAULT_CONTENT: AboutContent = {
  company_name: "LibHub",
  tagline: "About Us",
  description: "Explore your real estate dream into reality. Sharing home since 2024.",
  hero_subtitle: "At LibHub, we're redefining how property is found by delivering end-to-end property services. From search to close, we provide real estate services, strategies, and resources for the entire Liberian market.",
  mission: "Our mission is to transform property discovery and transactions into a transparent, accessible, and trusted digital experience that empowers every Liberian to make informed decisions.",
  vision: "Our vision is to create Africa's most trusted property ecosystem where every citizen has effortless access to verified property listings and modern digital tools for homeownership, investment, and growth.",
  banner_image: "",
  mission_image: "",
  experience_title: "Don't just buy real estate — experience it.",
  experience_description: "Best opportunities lie at the junction — where your ambition meets our expertise. LibHub ensures every user gets personalized support throughout their property journey.",
  experience_image: "",
  dreams_title: "Turning your real estate dreams true!",
  dreams_description: "We help you find the 5-star property — this isn't just a listing site, it's a platform to discover your ideal living space.",
  dreams_image: "",
  dreams_checklist: ["Expert Local Knowledge", "Hassle-Free Transactions", "Comprehensive Support"],
  email: "support@libhub.com",
  phone: "",
  address: "Monrovia, Liberia",
  whatsapp: "",
  values: [
    { title: "Transparency", description: "We believe in open, honest property listings with verified information." },
    { title: "Trust", description: "Every user and property goes through a verification process." },
    { title: "Innovation", description: "We leverage technology to simplify the real estate experience." },
    { title: "Community", description: "We are building a connected community of property stakeholders." },
  ],
  stats: [
    { label: "Properties", value: "10K+", sublabel: "Listed properties reflect our growing real estate ecosystem." },
    { label: "Happy Clients", value: "5K", sublabel: "Happy clients through our marketplace and local connections." },
    { label: "Properties Agents", value: "100+", sublabel: "Professional agents bringing experience, trust, and reliability." },
    { label: "Satisfaction", value: "95%", sublabel: "High satisfaction every time across all interactions." },
  ],
  team_members: [],
  work_photos: [],
  services: [
    { title: "Personalized Search", description: "We make your preferences to find properties that exactly match your needs." },
    { title: "Experienced Team", description: "Our professionals have extensive knowledge and market expertise." },
    { title: "Track Record", description: "Proven track record of successful transactions and satisfied clients." },
    { title: "Client-Centric", description: "Every decision we make is centered on giving the best client experience." },
  ],
  faqs: [
    { question: "What services does LibHub provide for buyers and sellers?", answer: "LibHub provides a comprehensive platform for listing, searching, and managing properties across Liberia, with verified listings, agent connections, and digital tools for both buyers and sellers." },
    { question: "How can I search for properties on LibHub?", answer: "You can use our advanced search filters on the Explore page to filter by county, property type, listing type, price range, and more." },
    { question: "Can I list my property on LibHub as an owner?", answer: "Yes! Once you create an account and get verified, you can list your properties directly from your dashboard." },
    { question: "Do you help with property paperwork?", answer: "While we provide resources and agent connections, we recommend working with a verified agent on our platform for legal and documentation support." },
    { question: "Does LibHub charge fees for its services?", answer: "Browsing and searching is completely free. Property owners may use optional paid promotion features to boost visibility." },
    { question: "How do I hire a property agent?", answer: "Browse our verified agents on the platform, view their profiles and reviews, then contact them directly through our messaging system." },
  ],
  newsletter_title: "Stay Updated on Latest Property",
  newsletter_description: "Subscribe to our newsletter and stay updated.",
};

const About = () => {
  const { toast } = useToast();
  const [content, setContent] = useState<AboutContent>(DEFAULT_CONTENT);
  const [realStats, setRealStats] = useState<{ label: string; value: string; sublabel: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", message: "", property_type: "" });
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      const [settingsRes, propsRes, profilesRes] = await Promise.all([
        supabase.from("platform_settings").select("value").eq("key", "about_page_content").single(),
        supabase.from("properties").select("county, status", { count: "exact" }),
        supabase.from("profiles").select("verification_status", { count: "exact" }),
      ]);

      if (settingsRes.data?.value) setContent({ ...DEFAULT_CONTENT, ...(settingsRes.data.value as any) });

      const totalProperties = propsRes.count || 0;
      const activeProperties = propsRes.data?.filter(p => p.status === "active").length || 0;
      const counties = new Set(propsRes.data?.map(p => p.county) || []).size;
      const verifiedUsers = profilesRes.data?.filter(p => p.verification_status === "approved").length || 0;

      setRealStats([
        { label: "Properties", value: `${totalProperties.toLocaleString()}+`, sublabel: "Listed properties reflect our growing real estate ecosystem." },
        { label: "Happy Clients", value: `${verifiedUsers.toLocaleString()}`, sublabel: "Happy clients through our marketplace and local connections." },
        { label: "Properties Agents", value: `${activeProperties.toLocaleString()}+`, sublabel: "Professional agents bringing experience, trust, and reliability." },
        { label: "Satisfaction", value: "95%", sublabel: `High satisfaction across ${counties} counties.` },
      ]);

      setLoading(false);
    };
    fetchContent();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast({ title: "Error", description: "Please fill required fields", variant: "destructive" });
      return;
    }
    setSending(true);
    const { error } = await supabase.from("feedback").insert({
      role: "contact_form", activity: "Contact Us", problem: form.message, rating: 5,
      email: form.email, phone: form.phone,
      suggestions: `From: ${form.name} | Address: ${form.address} | Type: ${form.property_type}`,
    });
    if (error) toast({ title: "Error", description: "Failed to send", variant: "destructive" });
    else { toast({ title: "Sent!", description: "We'll get back to you soon." }); setForm({ name: "", email: "", phone: "", address: "", message: "", property_type: "" }); }
    setSending(false);
  };

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setSubscribing(true);
    const { error } = await supabase.from("newsletter_subscriptions").insert({ email: newsletterEmail });
    if (error?.code === "23505") toast({ title: "Already subscribed", description: "This email is already on our list." });
    else if (error) toast({ title: "Error", description: "Failed to subscribe", variant: "destructive" });
    else { toast({ title: "Subscribed!", description: "Welcome aboard!" }); setNewsletterEmail(""); }
    setSubscribing(false);
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case "facebook": return <FacebookIcon className="w-4 h-4" />;
      case "instagram": return <InstagramIcon className="w-4 h-4" />;
      case "twitter": return <TwitterIcon className="w-4 h-4" />;
      case "linkedin": return <LinkedInIcon className="w-4 h-4" />;
      default: return null;
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background"><Navbar /><div className="flex items-center justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div></div>
  );

  const displayStats = realStats.length > 0 ? realStats : content.stats;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <SEOHead title={`About Us | ${content.company_name}`} description={content.description} />
      <Navbar />

      {/* ===== HERO BANNER ===== */}
      <section className="relative h-[280px] md:h-[400px] overflow-hidden">
        {content.banner_image ? (
          <img src={content.banner_image} alt="About Us" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/80 via-primary/60 to-primary/40" />
        )}
        <div className="absolute inset-0 bg-foreground/50" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block border-b-2 border-primary pb-2 mb-2">
              <h1 className="text-3xl md:text-5xl font-bold text-primary-foreground">{content.tagline || "About Us"}</h1>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TAGLINE + MISSION/VISION ===== */}
      <section className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        <div className="mb-10">
          <h2 className="text-2xl md:text-4xl font-serif italic text-foreground leading-snug max-w-3xl">
            {content.description}
          </h2>
        </div>
        <p className="text-muted-foreground leading-relaxed max-w-3xl mb-10 text-sm md:text-base">
          {content.hero_subtitle}
        </p>
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Mission</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{content.mission}</p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><Eye className="h-4 w-4 text-primary" /> Vision</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{content.vision}</p>
            </div>
          </div>
          {content.mission_image && (
            <div className="rounded-2xl overflow-hidden">
              <img src={content.mission_image} alt="Our Mission" className="w-full h-64 object-cover" loading="lazy" />
            </div>
          )}
        </div>
      </section>

      {/* ===== EXPERIENCE SECTION ===== */}
      <section className="bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-16 grid md:grid-cols-2 gap-8 items-center">
          {content.experience_image && (
            <div className="rounded-2xl overflow-hidden">
              <img src={content.experience_image} alt="Experience" className="w-full h-72 object-cover" loading="lazy" />
            </div>
          )}
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 leading-tight">
              {content.experience_title}
            </h2>
            <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
              {content.experience_description}
            </p>
          </div>
        </div>
      </section>

      {/* ===== STATS BAR ===== */}
      <section className="bg-card border-y border-border">
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {displayStats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-5xl font-bold text-foreground mb-1">{stat.value}</div>
                <div className="text-sm font-semibold text-foreground mb-2">{stat.label}</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{stat.sublabel}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== DREAMS SECTION ===== */}
      {(content.dreams_title || content.dreams_checklist?.length > 0) && (
        <section className="max-w-6xl mx-auto px-4 py-12 md:py-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 leading-tight italic">
                {content.dreams_title}
              </h2>
              <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                {content.dreams_description}
              </p>
              <div className="space-y-3">
                {content.dreams_checklist?.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-card rounded-xl border border-border p-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm font-medium text-foreground">{item}</span>
                  </div>
                ))}
              </div>
              <Button className="mt-6 rounded-xl gap-2" asChild>
                <a href="/explore">Get started <ArrowRight className="h-4 w-4" /></a>
              </Button>
            </div>
            {content.dreams_image && (
              <div className="rounded-2xl overflow-hidden">
                <img src={content.dreams_image} alt="Dreams" className="w-full h-80 object-cover" loading="lazy" />
              </div>
            )}
          </div>
        </section>
      )}

      {/* ===== SERVICES / TRUSTED PARTNER ===== */}
      {content.services?.length > 0 && (
        <section className="bg-muted/30">
          <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Your Trusted Real Estate Partner</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {content.services.map((svc, i) => {
                const icons = [Search, Users, TrendingUp, HeartHandshake];
                const Icon = icons[i % icons.length];
                return (
                  <div key={i} className="bg-card rounded-2xl border border-border p-6 text-center hover:shadow-lg transition-shadow">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="font-bold mb-2">{svc.title}</h3>
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
        <section className="max-w-6xl mx-auto px-4 py-12 md:py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Start Your Journey With Our<br />Amazing Agents
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {content.team_members.map((member, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden group">
                {member.photo ? (
                  <img src={member.photo} alt={member.name} className="w-full h-60 object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                ) : (
                  <div className="w-full h-60 bg-muted flex items-center justify-center"><Users className="h-16 w-16 text-muted-foreground/30" /></div>
                )}
                <div className="p-5 text-center">
                  <h3 className="font-bold text-lg text-foreground">{member.name}</h3>
                  <p className="text-primary text-sm font-medium mb-2">{member.role}</p>
                  {member.bio && <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{member.bio}</p>}
                  <div className="flex gap-2 justify-center">
                    {(["facebook", "instagram", "twitter", "linkedin"] as const).map((platform) => {
                      const url = member[platform];
                      if (!url) return null;
                      return (
                        <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                          className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors text-muted-foreground">
                          {getSocialIcon(platform)}
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== CONTACT FORM ===== */}
      <section className="bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Let's Find You<br />Perfect Property</h2>
              <p className="text-muted-foreground text-sm mb-6">Fill in the form and we'll help you find the best match.</p>
              <div className="space-y-3">
                {content.email && (
                  <a href={`mailto:${content.email}`} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Mail className="h-5 w-5 text-primary" /></div>
                    <span className="text-sm text-muted-foreground">{content.email}</span>
                  </a>
                )}
                {content.phone && (
                  <a href={`tel:${content.phone}`} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Phone className="h-5 w-5 text-primary" /></div>
                    <span className="text-sm text-muted-foreground">{content.phone}</span>
                  </a>
                )}
                {content.address && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><MapPin className="h-5 w-5 text-primary" /></div>
                    <span className="text-sm text-muted-foreground">{content.address}</span>
                  </div>
                )}
              </div>
            </div>
            <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-6 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Your name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl" />
                <Input placeholder="What do you want?" value={form.property_type} onChange={(e) => setForm({ ...form, property_type: e.target.value })} className="rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-xl" />
                <Input placeholder="Your budget (USD)" className="rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input type="email" placeholder="Your email address *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-xl" />
                <Input placeholder="Your address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="rounded-xl" />
              </div>
              <Textarea placeholder="Your message..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} className="rounded-xl resize-none" />
              <Button type="submit" disabled={sending} className="w-full rounded-xl gap-2">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {sending ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* ===== WORK PHOTOS ===== */}
      {content.work_photos?.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-12 md:py-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Our Work</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {content.work_photos.map((photo, i) => (
              <div key={i} className="relative rounded-2xl overflow-hidden group">
                <img src={photo.url} alt={photo.caption} className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                {photo.caption && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <p className="text-white text-sm font-medium">{photo.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== FAQ ===== */}
      {content.faqs?.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 py-12 md:py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Frequently Asked Questions</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {content.faqs.map((faq, i) => (
              <div key={i} className="bg-card rounded-xl border border-border overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="text-sm font-medium text-foreground pr-2">{faq.question}</span>
                  {openFaq === i ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== NEWSLETTER ===== */}
      <section className="bg-primary">
        <div className="max-w-4xl mx-auto px-4 py-12 md:py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-2">
            {content.newsletter_title || "Stay Updated on Latest Property"}
          </h2>
          <p className="text-primary-foreground/70 text-sm mb-6">
            {content.newsletter_description || "Subscribe to our newsletter and stay updated."}
          </p>
          <form onSubmit={handleNewsletter} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Your email"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              className="rounded-xl bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
            />
            <Button type="submit" variant="secondary" disabled={subscribing} className="rounded-xl whitespace-nowrap">
              {subscribing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Subscribe"}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default About;
