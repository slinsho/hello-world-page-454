import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Building2, Mail, Phone, MapPin, Send, Loader2 } from "lucide-react";

interface AboutContent {
  company_name: string;
  tagline: string;
  description: string;
  mission: string;
  email: string;
  phone: string;
  address: string;
  whatsapp: string;
}

const DEFAULT_CONTENT: AboutContent = {
  company_name: "LibHub",
  tagline: "Liberia's Premier Property Platform",
  description: "LibHub connects property owners, agents, and seekers across Liberia. Whether you're buying, renting, or leasing — we make finding your next property simple and trustworthy.",
  mission: "To democratize real estate in Liberia by providing a transparent, accessible, and trusted platform for all property transactions.",
  email: "support@libhub.com",
  phone: "",
  address: "Monrovia, Liberia",
  whatsapp: "",
};

const About = () => {
  const { toast } = useToast();
  const [content, setContent] = useState<AboutContent>(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "about_page_content")
        .single();
      if (data?.value) setContent({ ...DEFAULT_CONTENT, ...(data.value as any) });
      setLoading(false);
    };
    fetch();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    setSending(true);
    // Store as feedback with a special role
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
      <SEOHead title="About Us | LibHub" description="Learn about LibHub - Liberia's premier property platform" />
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-10">
        {/* Hero */}
        <section className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
            <Building2 className="h-5 w-5" />
            <span className="font-semibold">{content.company_name}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">{content.tagline}</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">{content.description}</p>
        </section>

        {/* Mission */}
        {content.mission && (
          <section className="bg-card rounded-2xl border border-border/50 p-6 md:p-8">
            <h2 className="text-xl font-bold mb-3">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed">{content.mission}</p>
          </section>
        )}

        {/* Contact Info + Form */}
        <div className="grid md:grid-cols-2 gap-6">
          <section className="bg-card rounded-2xl border border-border/50 p-6 space-y-4">
            <h2 className="text-xl font-bold">Contact Information</h2>
            {content.email && (
              <a href={`mailto:${content.email}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                <Mail className="h-5 w-5 text-primary" />
                <span className="text-sm">{content.email}</span>
              </a>
            )}
            {content.phone && (
              <a href={`tel:${content.phone}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                <Phone className="h-5 w-5 text-primary" />
                <span className="text-sm">{content.phone}</span>
              </a>
            )}
            {content.address && (
              <div className="flex items-center gap-3 p-3 rounded-xl">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="text-sm">{content.address}</span>
              </div>
            )}
          </section>

          <section className="bg-card rounded-2xl border border-border/50 p-6">
            <h2 className="text-xl font-bold mb-4">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="rounded-xl"
              />
              <Input
                type="email"
                placeholder="Your email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="rounded-xl"
              />
              <Textarea
                placeholder="Your message..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={4}
                className="rounded-xl resize-none"
              />
              <Button type="submit" disabled={sending} className="w-full rounded-xl gap-2">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {sending ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
};

export default About;
