import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Search, Upload, Shield, Heart, ChevronRight, X } from "lucide-react";

const STEPS = [
  {
    icon: Search,
    title: "Browse Properties",
    description: "Explore houses, apartments, and shops across all 15 Liberian counties. Use filters to find exactly what you need.",
  },
  {
    icon: Heart,
    title: "Save Favorites",
    description: "Tap the heart icon on any property to save it to your favorites list for easy access later.",
  },
  {
    icon: Shield,
    title: "Get Verified",
    description: "Verify your identity to list properties and build trust with potential buyers and renters.",
  },
  {
    icon: Upload,
    title: "List Your Property",
    description: "Once verified, upload property photos, set your price, and reach thousands of potential clients.",
  },
];

export function OnboardingGuide() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!user) return;
    const key = `onboarding_shown_${user.id}`;
    const shown = localStorage.getItem(key);
    if (!shown) {
      // Delay to let the page load first
      const timer = setTimeout(() => setOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleClose = () => {
    if (user) localStorage.setItem(`onboarding_shown_${user.id}`, "true");
    setOpen(false);
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  };

  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl border-border/50" aria-describedby="onboarding-step-description">
        <div className="relative">
          <button onClick={handleClose} className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-background/80 flex items-center justify-center hover:bg-background transition-colors" aria-label="Close onboarding">
            <X className="h-4 w-4" />
          </button>
          
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-8 flex items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center">
              <Icon className="h-10 w-10 text-primary" />
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-bold">{current.title}</h2>
              <p id="onboarding-step-description" className="text-sm text-muted-foreground leading-relaxed">{current.description}</p>
            </div>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-2" role="tablist" aria-label="Onboarding steps">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`h-2 rounded-full transition-all ${i === step ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30"}`}
                  aria-label={`Step ${i + 1}`}
                  role="tab"
                  aria-selected={i === step}
                />
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={handleClose} className="flex-1 rounded-xl">
                Skip
              </Button>
              <Button onClick={handleNext} className="flex-1 rounded-xl gap-2">
                {step < STEPS.length - 1 ? "Next" : "Get Started"}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
