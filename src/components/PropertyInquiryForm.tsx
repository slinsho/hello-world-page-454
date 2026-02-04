import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Send, Loader2 } from "lucide-react";

interface PropertyInquiryFormProps {
  propertyId: string;
  propertyTitle: string;
  ownerId: string;
  ownerName: string;
}

export function PropertyInquiryForm({ propertyId, propertyTitle, ownerId, ownerName }: PropertyInquiryFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create inquiry
      const { error: inquiryError } = await supabase
        .from("property_inquiries")
        .insert({
          property_id: propertyId,
          sender_id: user?.id || null,
          sender_name: formData.name,
          sender_email: formData.email || null,
          sender_phone: formData.phone || null,
          message: formData.message,
        });

      if (inquiryError) throw inquiryError;

      // If user is logged in, also create/get a conversation for real-time chat
      if (user) {
        // Check if conversation already exists
        const { data: existingConvo } = await supabase
          .from("conversations")
          .select("id")
          .eq("property_id", propertyId)
          .or(`and(participant_1.eq.${user.id},participant_2.eq.${ownerId}),and(participant_1.eq.${ownerId},participant_2.eq.${user.id})`)
          .maybeSingle();

        let conversationId = existingConvo?.id;

        // Create conversation if it doesn't exist
        if (!conversationId) {
          const { data: newConvo, error: convoError } = await supabase
            .from("conversations")
            .insert({
              property_id: propertyId,
              participant_1: user.id,
              participant_2: ownerId,
            })
            .select("id")
            .single();

          if (convoError) throw convoError;
          conversationId = newConvo.id;
        }

        // Send initial message
        await supabase.from("messages").insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: formData.message,
        });
      }

      toast({
        title: "Inquiry Sent!",
        description: user
          ? "Your message has been sent. You can continue the conversation in Messages."
          : "The property owner will receive your inquiry.",
      });

      setFormData({ name: "", email: "", phone: "", message: "" });
      setOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send inquiry",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Send Inquiry
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contact {ownerName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            About: {propertyTitle}
          </p>

          <div className="space-y-2">
            <Label htmlFor="name">Your Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Enter your name"
            />
          </div>

          {!user && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+231 XXX XXX XXX"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
              placeholder="Hi, I'm interested in this property..."
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
