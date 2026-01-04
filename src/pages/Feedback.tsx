import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Star } from "lucide-react";
import { z } from "zod";

// Input validation schema
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
    
    // Validate form data with zod
    const validationResult = feedbackSchema.safeParse(formData);
    
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast({
        title: "Validation Error",
        description: firstError.message,
        variant: "destructive",
      });
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

      toast({
        title: "Thank You!",
        description: "Your feedback has been submitted successfully",
      });
      navigate(-1);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Tell Us Your Experience</CardTitle>
            <CardDescription>
              Your feedback helps us improve the app for everyone
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* A) Who Are You */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">A) Who Are You?</Label>
                <RadioGroup
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="owner" id="owner" />
                    <Label htmlFor="owner" className="font-normal cursor-pointer">Owner</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="agent" id="agent" />
                    <Label htmlFor="agent" className="font-normal cursor-pointer">Agent</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="property_seeker" id="property_seeker" />
                    <Label htmlFor="property_seeker" className="font-normal cursor-pointer">Property Seeker</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* B) Rate Your Experience */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">B) Rate Your Experience</Label>
                <p className="text-sm text-muted-foreground">How would you rate our app from 1 to 5 stars?</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: star })}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= formData.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* C) What Were You Trying to Do */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">C) What Were You Trying to Do?</Label>
                <Select
                  value={formData.activity}
                  onValueChange={(value) => setFormData({ ...formData, activity: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an activity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="posting_property">Posting a property</SelectItem>
                    <SelectItem value="searching_property">Searching for a property</SelectItem>
                    <SelectItem value="contacting">Contacting an owner or agent</SelectItem>
                    <SelectItem value="managing_listings">Managing your listings</SelectItem>
                    <SelectItem value="uploading_media">Uploading photos or videos</SelectItem>
                    <SelectItem value="other">Something else</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* D) What Problem Did You Face */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">D) What Problem Did You Face?</Label>
                <p className="text-sm text-muted-foreground">What was difficult or confusing for you?</p>
                <Textarea
                  value={formData.problem}
                  onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                  placeholder="Example: I couldn't upload pictures. Search is slow. I want more filters."
                  className="min-h-[100px]"
                  required
                />
              </div>

              {/* E) How Can We Improve */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">E) How Can We Improve?</Label>
                <p className="text-sm text-muted-foreground">What should we add or improve to make the app better?</p>
                <Textarea
                  value={formData.suggestions}
                  onChange={(e) => setFormData({ ...formData, suggestions: e.target.value })}
                  placeholder="Share your ideas for improvement..."
                  className="min-h-[100px]"
                />
              </div>

              {/* F) Contact Information */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">F) Contact Information (Optional)</Label>
                <p className="text-sm text-muted-foreground">Help us reach you if we need more details</p>
                <div className="space-y-2">
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Email"
                  />
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Phone"
                  />
                  <Input
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="WhatsApp"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Submitting..." : "Submit Feedback"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Feedback;
