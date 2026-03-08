import Navbar from "@/components/Navbar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { FileText, Users, Home, Shield, Ban, BookOpen, AlertTriangle, RefreshCw, Mail, Scale, CreditCard, Eye, Star, MessageSquare, Bell, Flag, Camera, Clock } from "lucide-react";

const sections = [
  {
    icon: Scale,
    title: "1. Acceptance of Terms",
    content: "By accessing and using LibHub, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use our service.",
  },
  {
    icon: Home,
    title: "2. Use of Service",
    content: "LibHub provides a platform for property owners and agents to list, browse, and connect regarding real estate properties. You agree to use the service only for lawful purposes and in accordance with these Terms and Conditions.",
  },
  {
    icon: Users,
    title: "3. User Accounts",
    content: "When you create an account with us, you must provide accurate, complete, and current information. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.\n\nYou are responsible for safeguarding the password and for all activities that occur under your account. You agree not to disclose your password to any third party.",
  },
  {
    icon: FileText,
    title: "4. Property Listings",
    content: "Users who create property listings warrant that all information provided is accurate and that they have the legal right to list the property. LibHub reserves the right to remove any listing that violates these terms or is deemed inappropriate.",
  },
  {
    icon: Shield,
    title: "5. Verification",
    content: "To list properties, users must complete our verification process. We reserve the right to approve or reject verification requests at our discretion. Verified status may be revoked if fraudulent information is discovered.",
  },
  {
    icon: Ban,
    title: "6. Prohibited Activities",
    content: "You agree not to:",
    list: [
      "Use the service for any illegal purpose",
      "Post false, misleading, or fraudulent property listings",
      "Harass, abuse, or harm other users",
      "Attempt to gain unauthorized access to the service",
      "Use automated systems to access the service without permission",
    ],
  },
  {
    icon: BookOpen,
    title: "7. Intellectual Property",
    content: "The service and its original content, features, and functionality are owned by LibHub and are protected by international copyright, trademark, and other intellectual property laws.",
  },
  {
    icon: AlertTriangle,
    title: "8. Limitation of Liability",
    content: "LibHub shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the service. We do not guarantee the accuracy of property listings or the conduct of users.",
  },
  {
    icon: RefreshCw,
    title: "9. Changes to Terms",
    content: "We reserve the right to modify or replace these Terms at any time. Continued use of the service after changes constitutes acceptance of the new Terms.",
  },
  {
    icon: Mail,
    title: "10. Contact Information",
    content: "If you have any questions about these Terms and Conditions, please contact us through the platform.",
  },
];

const TermsAndConditions = () => {
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

        {/* Sections */}
        <div className="space-y-4 md:space-y-6">
          {sections.map((section, i) => {
            const Icon = section.icon;
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
