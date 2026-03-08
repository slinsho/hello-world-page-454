import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Star, MessageSquare, Mail, Phone, Send } from "lucide-react";
import { z } from "zod";
import Navbar from "@/components/Navbar";

const feedbackSchema = z.object({
  role: z.enum(["owner", "agent", "property_seeker"], { required_error: "Please select your role" }),
  rating: z.number().min(1, "Please rate your experience").max(5),
  activity: z.enum(["posting_property", "searching_property", "contacting", "managing_listings", "uploading_media", "other"], { required_error: "Please select an activity" }),
  problem: z.string().trim().min(10, "Please describe the problem (minimum 10 characters)").max(2000, "Problem description is too long (maximum 2000 characters)"),
  suggestions: z.string().trim().max(2000, "Suggestions are too long (maximum 2000 characters)").optional().or(z.literal("")),
  email: z.string().trim().email("Please enter a valid email").max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(20, "Phone number is too long").regex(/^[\d\s\-+()]*$/, "Invalid phone number format").optional().or(z.literal("")),
  whatsapp: z.string().trim().max(20, "WhatsApp number is too long").regex(/^[\d\s\-+()]*$/, "Invalid WhatsApp number format").optional().or(z.literal("")),
});

const Feedback = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    role: "",
    rating: 0,
    activity: "",
    problem: "",
    suggestions: "",
    email: "",
    phone: "",
    whatsapp: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationResult = feedbackSchema.safeParse(formData);
    if (!validationResult.success) {
      toast({ title: "Validation Error", description: validationResult.error.errors[0].message, variant: "destructive" });
      return;
    }

    const validatedData = validationResult.data;
    setLoading(true);
    try {
      const { error } = await supabase.from("feedback").insert({
        user_id: user?.id || null,
        role: validatedData.role,
        rating: validatedData.rating,
        activity: validatedData.activity,
        problem: validatedData.problem,
        suggestions: validatedData.suggestions || null,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        whatsapp: validatedData.whatsapp || null,
      });

      if (error) throw error;
      // Notify admins
      await notifyAdmins({
        title: "New Feedback Submitted",
        message: `${validatedData.role} feedback (${validatedData.rating}★): "${validatedData.problem.slice(0, 80)}..."`,
        type: "status_updates",
      });
      toast({ title: "Thank You!", description: "Your feedback has been submitted successfully" });
      navigate(-1);
    } catch {
      toast({ title: "Error", description: "Failed to submit feedback. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { value: "owner", label: "Owner" },
    { value: "agent", label: "Agent" },
    { value: "property_seeker", label: "Seeker" },
  ];

  const activities = [
    { value: "posting_property", label: "Posting a property" },
    { value: "searching_property", label: "Searching property" },
    { value: "contacting", label: "Contacting owner/agent" },
    { value: "managing_listings", label: "Managing listings" },
    { value: "uploading_media", label: "Uploading media" },
    { value: "other", label: "Something else" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Navbar />

      <main className="max-w-lg mx-auto px-4 pt-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Your Feedback</h1>
            <p className="text-xs text-muted-foreground">Help us improve the app</p>
          </div>
        </div>

        {/* Hero Card */}
        <div className="bg-card rounded-2xl p-5 border border-border mb-6 text-center">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <MessageSquare className="h-7 w-7 text-primary" />
          </div>
          <h2 className="font-semibold mb-1">Tell Us Your Experience</h2>
          <p className="text-xs text-muted-foreground">Your feedback helps us build a better platform for everyone</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Who Are You - Pill Selector */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Who Are You?</Label>
            <div className="flex gap-2">
              {roles.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData({ ...formData, role: value })}
                  className={`flex-1 py-3 rounded-2xl text-sm font-medium transition-all ${
                    formData.role === value
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-muted-foreground hover:border-muted-foreground/30"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div className="bg-card rounded-2xl p-4 border border-border">
            <Label className="text-sm font-semibold mb-3 block">Rate Your Experience</Label>
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating: star })}
                  className="transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    className={`h-10 w-10 ${
                      star <= formData.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
            </div>
            {formData.rating > 0 && (
              <p className="text-center text-xs text-muted-foreground mt-2">
                {formData.rating === 1 ? "Poor" : formData.rating === 2 ? "Fair" : formData.rating === 3 ? "Good" : formData.rating === 4 ? "Great" : "Excellent"}
              </p>
            )}
          </div>

          {/* Activity - Wrap Pills */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">What Were You Doing?</Label>
            <div className="flex flex-wrap gap-2">
              {activities.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData({ ...formData, activity: value })}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                    formData.activity === value
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-muted-foreground hover:border-muted-foreground/30"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Problem */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">What Problem Did You Face?</Label>
            <Textarea
              value={formData.problem}
              onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
              placeholder="Describe what was difficult or confusing..."
              className="min-h-[100px] rounded-xl resize-none"
              required
            />
          </div>

          {/* Suggestions */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">How Can We Improve? <span className="text-muted-foreground font-normal">(Optional)</span></Label>
            <Textarea
              value={formData.suggestions}
              onChange={(e) => setFormData({ ...formData, suggestions: e.target.value })}
              placeholder="Share your ideas for improvement..."
              className="min-h-[80px] rounded-xl resize-none"
            />
          </div>

          {/* Contact - Compact */}
          <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
            <Label className="text-sm font-semibold">Contact Info <span className="text-muted-foreground font-normal">(Optional)</span></Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Email"
                className="rounded-xl h-11 pl-10"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Phone"
                  className="rounded-xl h-11 pl-10"
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="WhatsApp"
                  className="rounded-xl h-11 pl-10"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full h-14 rounded-2xl text-base font-semibold gap-2" disabled={loading}>
            <Send className="h-5 w-5" />
            {loading ? "Submitting..." : "Submit Feedback"}
          </Button>
        </form>
      </main>
    </div>
  );
};

export default Feedback;
