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
  Heart, Users, Award, Globe, ArrowRight, CheckCircle2
} from "lucide-react";

// Social icons
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

interface AboutContent {
  company_name: string;
  tagline: string;
  description: string;
  mission: string;
  vision: string;
  banner_image: string;
  email: string;
  phone: string;
  address: string;
  whatsapp: string;
  values: { title: string; description: string }[];
  stats: { label: string; value: string }[];
  team_members: TeamMember[];
  work_photos: WorkPhoto[];
}

const DEFAULT_CONTENT: AboutContent = {
  company_name: "LibHub",
  tagline: "Liberia's Premier Property Platform",
  description: "LibHub connects property owners, agents, and seekers across Liberia. Whether you're buying, renting, or leasing — we make finding your next property simple and trustworthy.",
  mission: "To democratize real estate in Liberia by providing a transparent, accessible, and trusted platform for all property transactions.",
  vision: "A Liberia where every citizen has easy access to verified property listings, empowering informed decisions for homeownership and investment.",
  banner_image: "",
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
    { label: "Properties Listed", value: "500+" },
    { label: "Verified Users", value: "1,000+" },
    { label: "Counties Covered", value: "15" },
    { label: "Happy Clients", value: "800+" },
  ],
  team_members: [],
  work_photos: [],
};

const About = () => {
  const { toast } = useToast();
  const [content, setContent] = useState<AboutContent>(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  useEffect(() => {
    const fetchContent = async () => {
      const { data } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "about_page_content")
        .single();
      if (data?.value) setContent({ ...DEFAULT_CONTENT, ...(data.value as any) });
      setLoading(false);
    };
    fetchContent();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    setSending(true);
    const { error } = await supabase.from("feedback").insert({
      role: "contact_form",
      activity: "Contact Us",
      problem: form.message,
      rating: 5,
      email: form.email,
      suggestions: `From: ${form.name}`,
    });
    if (error) {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    } else {
      toast({ title: "Message Sent!", description: "We'll get back to you soon." });
      setForm({ name: "", email: "", message: "" });
    }
    setSending(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <SEOHead title={`About Us | ${content.company_name}`} description={content.description} />
      <Navbar />

      {/* Hero Banner */}
      <section className="relative overflow-hidden">
        {content.banner_image ? (
          <img
            src={content.banner_image}
            alt={content.company_name}
            className="w-full h-72 md:h-[420px] object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-72 md:h-[420px] bg-gradient-to-br from-primary/20 via-background to-primary/10" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/15 text-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-4 backdrop-blur-sm">
            <Building2 className="h-4 w-4" />
            {content.company_name}
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-3 leading-tight">
            {content.tagline}
          </h1>
          <p className="text-muted-foreground max-w-2xl leading-relaxed text-sm md:text-base">
            {content.description}
          </p>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 space-y-12 mt-8">
        {/* Stats Bar */}
        {content.stats && content.stats.length > 0 && (
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {content.stats.map((stat, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border/50 p-5 text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-xs md:text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </section>
        )}

        {/* Mission & Vision */}
        <section className="grid md:grid-cols-2 gap-6">
          {content.mission && (
            <div className="bg-card rounded-2xl border border-border/50 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Our Mission</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">{content.mission}</p>
            </div>
          )}
          {content.vision && (
            <div className="bg-card rounded-2xl border border-border/50 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Eye className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Our Vision</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">{content.vision}</p>
            </div>
          )}
        </section>

        {/* Core Values */}
        {content.values && content.values.length > 0 && (
          <section>
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Our Core Values</h2>
              <div className="w-16 h-1 bg-primary mx-auto rounded-full" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {content.values.map((val, i) => {
                const icons = [Heart, Award, Globe, Users];
                const Icon = icons[i % icons.length];
                return (
                  <div key={i} className="bg-card rounded-2xl border border-border/50 p-5 group hover:border-primary/30 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-1.5">{val.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{val.description}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Meet The Team / Founders */}
        {content.team_members && content.team_members.length > 0 && (
          <section>
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Meet Our Team</h2>
              <p className="text-muted-foreground text-sm">The people behind {content.company_name}</p>
              <div className="w-16 h-1 bg-primary mx-auto rounded-full mt-2" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {content.team_members.map((member, i) => (
                <div key={i} className="bg-card rounded-2xl border border-border/50 overflow-hidden group">
                  {member.photo ? (
                    <img
                      src={member.photo}
                      alt={member.name}
                      className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-56 bg-secondary flex items-center justify-center">
                      <Users className="h-16 w-16 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="font-bold text-lg">{member.name}</h3>
                    <p className="text-primary text-sm font-medium mb-2">{member.role}</p>
                    {member.bio && (
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">{member.bio}</p>
                    )}
                    <div className="flex gap-2">
                      {(["facebook", "instagram", "twitter", "linkedin"] as const).map((platform) => {
                        const url = member[platform];
                        if (!url) return null;
                        return (
                          <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors text-muted-foreground"
                          >
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

        {/* Work / Office Photos */}
        {content.work_photos && content.work_photos.length > 0 && (
          <section>
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Our Work</h2>
              <p className="text-muted-foreground text-sm">A glimpse into what we do</p>
              <div className="w-16 h-1 bg-primary mx-auto rounded-full mt-2" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {content.work_photos.map((photo, i) => (
                <div key={i} className="relative rounded-2xl overflow-hidden group">
                  <img
                    src={photo.url}
                    alt={photo.caption}
                    className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
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

        {/* Why Choose Us */}
        <section className="bg-card rounded-2xl border border-border/50 p-6 md:p-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Why Choose {content.company_name}?</h2>
            <div className="w-16 h-1 bg-primary mx-auto rounded-full" />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              "Verified property listings you can trust",
              "Direct contact with property owners & agents",
              "Coverage across all 15 counties of Liberia",
              "Easy-to-use platform on any device",
              "Dedicated support team ready to help",
              "Free for property seekers to browse & inquire",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Info + Form */}
        <section className="grid md:grid-cols-2 gap-6">
          <div className="bg-card rounded-2xl border border-border/50 p-6 space-y-4">
            <h2 className="text-xl font-bold">Contact Information</h2>
            <div className="w-12 h-1 bg-primary rounded-full" />
            {content.email && (
              <a href={`mailto:${content.email}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Mail className="h-5 w-5 text-primary" /></div>
                <div>
                  <div className="text-xs text-muted-foreground">Email</div>
                  <span className="text-sm font-medium">{content.email}</span>
                </div>
              </a>
            )}
            {content.phone && (
              <a href={`tel:${content.phone}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Phone className="h-5 w-5 text-primary" /></div>
                <div>
                  <div className="text-xs text-muted-foreground">Phone</div>
                  <span className="text-sm font-medium">{content.phone}</span>
                </div>
              </a>
            )}
            {content.whatsapp && (
              <a href={`https://wa.me/${content.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Phone className="h-5 w-5 text-primary" /></div>
                <div>
                  <div className="text-xs text-muted-foreground">WhatsApp</div>
                  <span className="text-sm font-medium">{content.whatsapp}</span>
                </div>
              </a>
            )}
            {content.address && (
              <div className="flex items-center gap-3 p-3 rounded-xl">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><MapPin className="h-5 w-5 text-primary" /></div>
                <div>
                  <div className="text-xs text-muted-foreground">Address</div>
                  <span className="text-sm font-medium">{content.address}</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-card rounded-2xl border border-border/50 p-6">
            <h2 className="text-xl font-bold mb-1">Send us a Message</h2>
            <p className="text-sm text-muted-foreground mb-4">We'd love to hear from you</p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl" />
              <Input type="email" placeholder="Your email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-xl" />
              <Textarea placeholder="Your message..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4} className="rounded-xl resize-none" />
              <Button type="submit" disabled={sending} className="w-full rounded-xl gap-2">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {sending ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-2xl border border-primary/20 p-8 text-center">
          <h2 className="text-xl md:text-2xl font-bold mb-2">Ready to Find Your Perfect Property?</h2>
          <p className="text-muted-foreground text-sm mb-5 max-w-lg mx-auto">
            Join thousands of Liberians who trust {content.company_name} for their property needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="rounded-xl gap-2">
              <a href="/explore">Browse Properties <ArrowRight className="h-4 w-4" /></a>
            </Button>
            <Button variant="outline" asChild className="rounded-xl gap-2">
              <a href="/auth">Create Account</a>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default About;
