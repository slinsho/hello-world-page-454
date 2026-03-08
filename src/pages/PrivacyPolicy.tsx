import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShieldCheck, Eye, Database, Camera, Lock, Share2, Cookie, Baby,
  RefreshCw, Mail, Globe, FileText
} from "lucide-react";

interface Section {
  icon: string;
  title: string;
  content: string;
  list?: string[];
}

const iconMap: Record<string, any> = {
  ShieldCheck, Eye, Database, Camera, Lock, Share2, Cookie, Baby,
  RefreshCw, Mail, Globe, FileText,
};

const defaultSections: Section[] = [
  {
    icon: "ShieldCheck",
    title: "1. Introduction",
    content: "L-Prop (\"we\", \"our\", \"us\") is committed to protecting the privacy of our users. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.\n\nBy using L-Prop, you consent to the data practices described in this policy. If you do not agree with this policy, please do not use our service.",
  },
  {
    icon: "Database",
    title: "2. Information We Collect",
    content: "We collect the following types of information:",
    list: [
      "Account Information: Full name, email address, phone numbers (Phone 1 and optional Phone 2), and role selection (Property Owner or Agent)",
      "Verification Documents: Government-issued ID images, live selfie photos, date of birth, and for agents — agency name, office location, agency logo, and business phone",
      "Property Listings: Photos, videos, descriptions, pricing, location, and contact details you provide when listing properties",
      "Usage Data: Pages visited, features used, search queries, saved searches, recently viewed properties, and notification preferences",
      "Communication Data: Messages between users, property inquiries, offers, reviews, and feedback submissions",
      "Payment Information: Payment references for verification and promotion fees (we do not store mobile money credentials)",
    ],
  },
  {
    icon: "Eye",
    title: "3. How We Use Your Information",
    content: "We use the collected information for the following purposes:",
    list: [
      "To create and manage your account and verify your identity",
      "To display property listings and connect property owners, agents, and seekers",
      "To process verification and promotion requests and associated payments",
      "To send notifications about inquiries, offers, matches, and account status",
      "To moderate content, investigate reports, and enforce platform policies",
      "To provide analytics and market trends to improve the platform experience",
      "To communicate important updates about the platform and your account",
    ],
  },
  {
    icon: "Share2",
    title: "4. Information Sharing & Visibility",
    content: "Your profile information visibility is controlled by your privacy settings:\n\nPublic Information: Your name, role, verification badge, and active property listings are publicly visible. Your profile photo, cover photo, bio, and social links are visible on your profile page.\n\nControllable Information: You can choose to show or hide your phone number, email address, and location via the Privacy settings in your account.\n\nPrivate Information: Verification documents (ID images, selfies), payment references, and account credentials are never shared publicly. Only platform administrators can access verification documents for approval purposes.\n\nWe do not sell, trade, or rent your personal information to third parties.",
  },
  {
    icon: "Camera",
    title: "5. Verification Data",
    content: "Our verification process requires a live camera selfie for security. File uploads for selfie verification are strictly disabled to prevent fraud.\n\nVerification documents are stored in secure, private storage buckets accessible only to platform administrators. These documents are used solely for identity verification and are retained for the duration of your account plus any legally required retention period.\n\nVerification status (pending, approved, rejected, expired) is visible on your profile, but the underlying documents are never exposed to other users.",
  },
  {
    icon: "Lock",
    title: "6. Data Security",
    content: "We implement appropriate technical and organizational security measures to protect your personal information, including:\n\nSecure authentication with encrypted passwords via Supabase Auth. Row-Level Security (RLS) policies ensuring users can only access their own data. Private storage buckets for sensitive verification documents with temporary signed URLs for admin access. Secure HTTPS connections for all data transfers.\n\nWhile we strive to protect your information, no method of electronic transmission or storage is 100% secure. We cannot guarantee absolute security.",
  },
  {
    icon: "Cookie",
    title: "7. Cookies & Local Storage",
    content: "L-Prop uses cookies and browser local storage for:\n\nSession management and authentication state. Storing user preferences (currency display, default filters, privacy settings). Recently viewed properties and comparison lists.\n\nThese are essential for platform functionality and cannot be disabled while using the service.",
  },
  {
    icon: "Globe",
    title: "8. Third-Party Services",
    content: "We use the following third-party services:\n\nSupabase: For database, authentication, file storage, and edge functions. Your data is processed according to Supabase's privacy policy.\n\nWe do not integrate with advertising networks or share your data with marketing third parties.",
  },
  {
    icon: "Baby",
    title: "9. Children's Privacy",
    content: "L-Prop is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us to have it removed.",
  },
  {
    icon: "FileText",
    title: "10. Your Rights",
    content: "You have the right to:",
    list: [
      "Access and view the personal information we hold about you through your profile and settings",
      "Update your profile information (name, bio, county, address, social links) at any time",
      "Control the visibility of your phone, email, and location through privacy settings",
      "Customize notification preferences for different types of alerts",
      "Delete your account and associated data by contacting platform administrators",
      "Request a copy of your personal data stored on the platform",
    ],
  },
  {
    icon: "RefreshCw",
    title: "11. Changes to This Policy",
    content: "We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated revision date. Continued use of L-Prop after any changes constitutes acceptance of the updated policy.\n\nSignificant changes to data handling practices will be communicated through the platform's notification system.",
  },
  {
    icon: "Mail",
    title: "12. Contact Us",
    content: "If you have questions about this Privacy Policy or our data practices, please contact us through the platform's feedback system or via the contact information provided in the application.",
  },
];

const PrivacyPolicy = () => {
  const [sections, setSections] = useState<Section[]>(defaultSections);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      const { data } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "privacy_policy_sections")
        .single();
      if (data?.value && Array.isArray(data.value)) {
        setSections(data.value as unknown as Section[]);
      }
      setLoading(false);
    };
    fetchContent();
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-10">
        {/* Header */}
        <div className="mb-6 md:mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Privacy Policy</h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
          <p className="text-sm md:text-base text-muted-foreground mt-3 md:mt-4 leading-relaxed">
            This Privacy Policy describes how L-Prop collects, uses, and protects your personal information.
          </p>
        </div>

        <Separator className="mb-6 md:mb-8" />

        {/* Table of Contents - Desktop only */}
        <nav className="hidden md:block mb-10 rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Contents</h2>
          <div className="grid grid-cols-2 gap-2">
            {sections.map((section, i) => (
              <a
                key={i}
                href={`#privacy-section-${i}`}
                className="text-sm text-foreground/80 hover:text-primary transition-colors py-1"
              >
                {section.title}
              </a>
            ))}
          </div>
        </nav>

        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {sections.map((section, i) => {
              const Icon = iconMap[section.icon] || FileText;
              return (
                <section
                  key={i}
                  id={`privacy-section-${i}`}
                  className="rounded-xl border border-border bg-card p-4 md:p-6 scroll-mt-24"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="h-8 w-8 md:h-9 md:w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    </div>
                    <h2 className="text-base md:text-lg font-semibold leading-snug">{section.title}</h2>
                  </div>

                  {section.content.split("\n\n").map((paragraph, pi) => (
                    <p key={pi} className="text-sm md:text-base text-muted-foreground leading-relaxed mb-2 last:mb-0 pl-11 md:pl-12">
                      {paragraph}
                    </p>
                  ))}

                  {section.list && (
                    <ul className="mt-2 space-y-1.5 pl-11 md:pl-12">
                      {section.list.map((item, li) => (
                        <li key={li} className="flex items-start gap-2 text-sm md:text-base text-muted-foreground">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        )}

        {/* Footer note */}
        <div className="mt-8 md:mt-10 text-center">
          <p className="text-xs md:text-sm text-muted-foreground">
            © {new Date().getFullYear()} L-Prop. All rights reserved.
          </p>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
