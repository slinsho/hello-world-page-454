import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Facebook, Instagram, Twitter, Linkedin, MessageCircle, Link } from "lucide-react";

interface SocialLinks {
  social_facebook?: string | null;
  social_instagram?: string | null;
  social_twitter?: string | null;
  social_linkedin?: string | null;
  social_whatsapp?: string | null;
}

interface SocialLinksEditorProps {
  socialLinks: SocialLinks;
  onSave: (links: SocialLinks) => Promise<void>;
  isOwnProfile: boolean;
}

const socialPlatforms = [
  { key: "social_facebook", label: "Facebook", icon: Facebook, placeholder: "https://facebook.com/username" },
  { key: "social_instagram", label: "Instagram", icon: Instagram, placeholder: "https://instagram.com/username" },
  { key: "social_twitter", label: "X (Twitter)", icon: Twitter, placeholder: "https://x.com/username" },
  { key: "social_linkedin", label: "LinkedIn", icon: Linkedin, placeholder: "https://linkedin.com/in/username" },
  { key: "social_whatsapp", label: "WhatsApp", icon: MessageCircle, placeholder: "+1234567890" },
] as const;

export function SocialLinksEditor({ socialLinks, onSave, isOwnProfile }: SocialLinksEditorProps) {
  const [open, setOpen] = useState(false);
  const [links, setLinks] = useState<SocialLinks>(socialLinks);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(links);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const hasAnySocialLink = Object.values(socialLinks).some((v) => v);

  return (
    <>
      {/* Display Social Links */}
      {hasAnySocialLink && (
        <div className="flex justify-center gap-3 mt-4">
          {socialPlatforms.map(({ key, icon: Icon, label }) => {
            const value = socialLinks[key as keyof SocialLinks];
            if (!value) return null;
            
            const href = key === "social_whatsapp" 
              ? `https://wa.me/${value.replace(/[^0-9]/g, "")}`
              : value;
            
            return (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                title={label}
              >
                <Icon className="h-5 w-5 text-muted-foreground" />
              </a>
            );
          })}
        </div>
      )}

      {/* Edit Button - Only for own profile */}
      {isOwnProfile && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="mt-3 rounded-full gap-1.5 text-xs">
              <Link className="h-3.5 w-3.5" />
              {hasAnySocialLink ? "Edit Social Links" : "Add Social Links"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle>Social Media Links</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {socialPlatforms.map(({ key, label, icon: Icon, placeholder }) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {label}
                  </Label>
                  <Input
                    id={key}
                    value={links[key as keyof SocialLinks] || ""}
                    onChange={(e) => setLinks({ ...links, [key]: e.target.value || null })}
                    placeholder={placeholder}
                    className="rounded-xl"
                  />
                </div>
              ))}
              <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl">
                {saving ? "Saving..." : "Save Links"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
