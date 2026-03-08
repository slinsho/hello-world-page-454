import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import {
  FileText, Users, Home, Shield, Ban, BookOpen, AlertTriangle,
  RefreshCw, Mail, Scale, CreditCard, Eye, Star, MessageSquare,
  Bell, Flag, Camera, Clock
} from "lucide-react";

interface Section {
  icon: string;
  title: string;
  content: string;
  list?: string[];
}

const iconMap: Record<string, any> = {
  Scale, Home, Users, Shield, Ban, BookOpen, AlertTriangle,
  RefreshCw, Mail, FileText, CreditCard, Eye, Star, MessageSquare,
  Bell, Flag, Camera, Clock,
};

const defaultSections: Section[] = [
  {
    icon: "Scale",
    title: "1. Acceptance of Terms",
    content: "By accessing and using L-Prop, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use our service.",
  },
  {
    icon: "Home",
    title: "2. Use of Service",
    content: "L-Prop provides a platform for property owners and agents to list, browse, and connect regarding real estate properties in Liberia. You agree to use the service only for lawful purposes and in accordance with these Terms and Conditions.",
  },
  {
    icon: "Users",
    title: "3. User Accounts & Roles",
    content: "When you create an account, you must select a role — either Property Owner or Agent. Each role has specific permissions and limitations:\n\nProperty Owners may list up to 2 properties. Exceeding this limit requires upgrading to an Agent account. Owners are restricted from making offers, submitting inquiries, or leaving reviews.\n\nAgents have full platform access including unlimited listings, messaging, offers, inquiries, and reviews.\n\nYou are responsible for safeguarding your password and for all activities under your account. Phone numbers provided during registration cannot be changed after account creation.",
  },
  {
    icon: "Shield",
    title: "4. Verification & Payment",
    content: "To list properties, users must complete identity verification. This process requires a live camera selfie (file uploads are not permitted for security reasons), a valid government-issued ID, and date of birth.\n\nAgent verification additionally requires business phone, National ID, and agency credentials (name, location, logo).\n\nUpon qualification, a verification fee is required before approval. Owner verification costs 500 LRD (or USD equivalent), and Agent verification costs $20 USD (or LRD equivalent). These fees are configurable by the platform administrator.\n\nPayment must be made via mobile money. Users must include their full name as payment reference and submit their payment reference number through the platform. Verification is approved only after admin confirmation of payment.",
  },
  {
    icon: "Clock",
    title: "5. Verification Duration & Renewal",
    content: "Verification is valid for a limited period (default 5 days, configurable by admin). Upon expiration:\n\nAll user properties are automatically hidden from the homepage and explore pages. Properties appear disabled on the user's profile page. The user's verification status is set to 'expired.'\n\nUsers may submit a renewal request, which follows the same payment and approval process as initial verification. Once renewal is confirmed, all properties are restored and made visible again.",
  },
  {
    icon: "FileText",
    title: "6. Property Listings",
    content: "Users who create property listings warrant that all information provided is accurate and that they have the legal right to list the property. L-Prop reserves the right to remove any listing that violates these terms or is deemed inappropriate.\n\nListings may be categorized as For Sale, For Rent, or For Lease. Property types include Houses, Apartments, and Shops. All listings are subject to content moderation by platform administrators.",
  },
  {
    icon: "Star",
    title: "7. Property Promotions",
    content: "Users may request to promote their listings for increased visibility. Promotion requests are subject to admin approval and require payment of a promotion fee.\n\nPromoted properties receive priority placement on the homepage and explore pages through a fair round-robin display system. L-Prop does not guarantee any specific results from property promotions.",
  },
  {
    icon: "MessageSquare",
    title: "8. Messaging & Inquiries",
    content: "The platform provides direct messaging between agents and other users, property inquiry forms, and an offer system for negotiations. All communications must be respectful and related to legitimate property transactions.\n\nL-Prop is not responsible for the content of messages exchanged between users or the outcome of any negotiations conducted through the platform.",
  },
  {
    icon: "Flag",
    title: "9. Reporting & Moderation",
    content: "Users may report property listings they believe are fraudulent, misleading, or inappropriate. All reports are reviewed by platform administrators.\n\nL-Prop reserves the right to flag, hide, or remove any listing and to suspend or terminate accounts that repeatedly violate platform policies. Users who submit false reports may also face account restrictions.",
  },
  {
    icon: "Eye",
    title: "10. Privacy & Data",
    content: "L-Prop collects and stores user information necessary for platform operation, including profile details, verification documents, property data, and communication records.\n\nUsers can control the visibility of their phone number, email, and location through privacy settings. Verification documents (IDs, selfies) are stored securely and accessible only to platform administrators for verification purposes.\n\nWe use cookies and similar technologies for session management and platform functionality.",
  },
  {
    icon: "Bell",
    title: "11. Notifications",
    content: "LibHub sends notifications for property matches, inquiries, offers, verification status updates, and other platform activities. Users may customize their notification preferences through account settings.\n\nCritical notifications related to account security and verification status cannot be disabled.",
  },
  {
    icon: "CreditCard",
    title: "12. Fees & Payments",
    content: "All fees on the platform (verification fees, promotion fees) are set by the platform administrator and are subject to change. Current rates and exchange rates (USD to LRD) are displayed in the platform settings.\n\nPayments are processed via mobile money services. LibHub does not store payment credentials. All payment confirmations are verified manually by platform administrators.\n\nFees paid are non-refundable unless otherwise determined by the platform administrator.",
  },
  {
    icon: "Ban",
    title: "13. Prohibited Activities",
    content: "You agree not to:",
    list: [
      "Use the service for any illegal purpose",
      "Post false, misleading, or fraudulent property listings",
      "Submit forged or manipulated identity documents for verification",
      "Create multiple accounts to circumvent listing limits or bans",
      "Harass, abuse, or harm other users through messaging or reviews",
      "Attempt to gain unauthorized access to the service or admin features",
      "Use automated systems or bots to access the service without permission",
      "Manipulate the promotion or review system",
    ],
  },
  {
    icon: "BookOpen",
    title: "14. Intellectual Property",
    content: "The service and its original content, features, and functionality are owned by LibHub and are protected by international copyright, trademark, and other intellectual property laws.\n\nUser-uploaded content (photos, descriptions) remains the property of the respective users but LibHub is granted a non-exclusive license to display such content on the platform.",
  },
  {
    icon: "AlertTriangle",
    title: "15. Limitation of Liability",
    content: "LibHub shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the service.\n\nWe do not guarantee the accuracy of property listings, the identity of users (beyond our verification process), or the outcome of any property transactions. LibHub acts solely as a platform connecting property owners, agents, and prospective buyers or renters.",
  },
  {
    icon: "RefreshCw",
    title: "16. Changes to Terms",
    content: "We reserve the right to modify or replace these Terms at any time. Changes to verification fees, promotion pricing, verification duration, and other platform settings may be made by the administrator without prior notice.\n\nContinued use of the service after changes constitutes acceptance of the new Terms. Users will be notified of significant policy changes through the platform's notification system.",
  },
  {
    icon: "Mail",
    title: "17. Contact Information",
    content: "If you have any questions about these Terms and Conditions, please contact us through the platform's feedback system or via the contact information provided in the application.",
  },
];

const TermsAndConditions = () => {
  const [sections, setSections] = useState<Section[]>(defaultSections);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      const { data } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "terms_and_conditions_sections")
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
              <FileText className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Terms & Conditions</h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
          <p className="text-sm md:text-base text-muted-foreground mt-3 md:mt-4 leading-relaxed">
            Please read these terms carefully before using LibHub. By using our platform, you agree to be bound by these terms.
          </p>
          <div className="mt-2">
            <Link to="/privacy" className="text-sm text-primary hover:underline">
              View our Privacy Policy →
            </Link>
          </div>
        </div>

        <Separator className="mb-6 md:mb-8" />

        {/* Table of Contents - Desktop only */}
        <nav className="hidden md:block mb-10 rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Contents</h2>
          <div className="grid grid-cols-2 gap-2">
            {sections.map((section, i) => (
              <a
                key={i}
                href={`#section-${i}`}
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
                  id={`section-${i}`}
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
            © {new Date().getFullYear()} LibHub. All rights reserved.
          </p>
        </div>
      </main>
    </div>
  );
};

export default TermsAndConditions;
