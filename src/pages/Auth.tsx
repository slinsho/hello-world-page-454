import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isInstalledMobilePwa as checkInstalledMobilePwa } from "@/lib/pwa";
import { z } from "zod";
import { Eye, EyeOff, ArrowLeft, UserPlus, LogIn, Mail, Lock, Phone, User, Home, Shield, Star } from "lucide-react";
import heroImage from "@/assets/auth-pwa-hero.jpg";
import lpropLogo from "@/assets/lprop-logo.png";

const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["agent", "property_owner"]),
  phone: z.string().min(5, "Phone number is required").max(20),
  phone_2: z.string().max(20).optional(),
});

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "property_owner" as "agent" | "property_owner",
    phone: "",
    phone_2: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [isInstalledPwaMobile, setIsInstalledPwaMobile] = useState(false);
  const [showIntroSplash, setShowIntroSplash] = useState(false);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    if (type === 'recovery') {
      setIsResettingPassword(true);
    } else if (user && !isResettingPassword) {
      navigate("/");
    }
  }, [user, navigate, isResettingPassword]);

  useEffect(() => {
    const syncInstalledPwaState = () => {
      const installedMobilePwa = checkInstalledMobilePwa();
      setIsInstalledPwaMobile(installedMobilePwa);

      if (installedMobilePwa && !isResettingPassword && !isForgotPassword && !isSignUp && !showForm) {
        setShowIntroSplash(true);
        return;
      }

      setShowIntroSplash(false);
    };

    syncInstalledPwaState();

    const displayModeQuery = window.matchMedia("(display-mode: standalone)");
    const handleDisplayModeChange = () => syncInstalledPwaState();

    displayModeQuery.addEventListener?.("change", handleDisplayModeChange);
    window.addEventListener("resize", handleDisplayModeChange);

    return () => {
      displayModeQuery.removeEventListener?.("change", handleDisplayModeChange);
      window.removeEventListener("resize", handleDisplayModeChange);
    };
  }, [isForgotPassword, isResettingPassword, isSignUp, showForm]);

  useEffect(() => {
    if (!showIntroSplash) return;

    const timer = window.setTimeout(() => setShowIntroSplash(false), 2200);
    return () => window.clearTimeout(timer);
  }, [showIntroSplash]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isResettingPassword) {
        const { error } = await supabase.auth.updateUser({ password: formData.password });
        if (error) throw error;
        toast({ title: "Password updated!", description: "Your password has been successfully reset." });
        setIsResettingPassword(false);
        navigate("/");
      } else if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) throw error;
        toast({ title: "Check your email", description: "We've sent you a password reset link." });
        setIsForgotPassword(false);
      } else if (isSignUp) {
        const validatedData = signUpSchema.parse({ ...formData, phone_2: formData.phone_2 || undefined });
        const { error } = await supabase.auth.signUp({
          email: validatedData.email,
          password: validatedData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              name: validatedData.name,
              role: validatedData.role,
              phone: validatedData.phone,
              contact_phone_2: validatedData.phone_2 || null,
            },
          },
        });
        if (error) throw error;
        toast({ title: "Account created!", description: "You can now sign in." });
        setIsSignUp(false);
      } else {
        const validatedData = signInSchema.parse({ email: formData.email, password: formData.password });
        const { error } = await supabase.auth.signInWithPassword({
          email: validatedData.email,
          password: validatedData.password,
        });
        if (error) throw error;
        toast({ title: "Welcome back!", description: "You've successfully signed in." });
        navigate("/");
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({ title: "Validation Error", description: error.errors[0].message, variant: "destructive" });
      } else {
        toast({ title: "Error", description: error.message || "An error occurred", variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  const formTitle = isResettingPassword
    ? "Set New Password"
    : isForgotPassword
    ? "Reset Password"
    : isSignUp
    ? "Create Account"
    : "Welcome Back";

  const formSubtitle = isResettingPassword
    ? "Enter your new password below"
    : isForgotPassword
    ? "We'll send you a reset link"
    : isSignUp
    ? "Join L-Prop and start exploring"
    : "Sign in to continue";

  if (showIntroSplash) {
    return (
      <div className="relative h-[100dvh] overflow-hidden bg-background md:hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})`, backgroundPosition: "center 18%" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/40 to-background/95" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background/40 to-transparent" />

        <div className="relative z-10 flex h-full flex-col justify-between px-6 pb-10 pt-12">
          <div className="flex w-fit items-center gap-3 rounded-2xl border border-border/40 bg-card/45 px-4 py-3 shadow-2xl backdrop-blur-xl">
            <img src={lpropLogo} alt="L-Prop" className="h-11 w-11 rounded-2xl" />
            <div>
              <p className="text-sm font-semibold text-foreground">L-Prop</p>
              <p className="text-xs text-foreground/70">Installed mobile experience</p>
            </div>
          </div>

          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-[2rem] border border-border/40 bg-card/25 p-2 shadow-2xl backdrop-blur-xl">
              <img
                src={heroImage}
                alt="L-Prop welcome splash"
                className="h-full w-full rounded-[1.5rem] object-cover"
              />
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">Liberia Property</p>
              <h1 className="text-4xl font-bold leading-tight text-foreground">
                Find the next place to call home.
              </h1>
              <p className="mx-auto max-w-xs text-sm text-foreground/75">
                Fast updates, verified listings, and a polished mobile-first experience every time you open L-Prop.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 text-center">
            <div className="h-1.5 w-28 overflow-hidden rounded-full bg-secondary/80">
              <div className="h-full w-full origin-left rounded-full bg-primary animate-intro-progress" />
            </div>
            <p className="text-xs text-foreground/60">Launching your installed app…</p>
          </div>
        </div>
      </div>
    );
  }

  // Form view
  if (isResettingPassword || isForgotPassword || isSignUp || showForm) {
    return (
      <div className="h-[100dvh] md:min-h-screen flex flex-col md:flex-row overflow-hidden relative">
        {/* Full background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})`, backgroundPosition: 'center 20%' }}
        />
        {/* Subtle overlay for form readability */}
        <div className="absolute inset-0 bg-black/50 md:bg-black/40" />

        {/* Left - Hero content (desktop only) */}
        <div className="hidden md:flex md:w-1/2 relative z-10 overflow-hidden">
          <div className="relative z-10 flex flex-col justify-end p-12 pb-16">
            <div className="flex items-center gap-3 mb-6">
              <img src={lpropLogo} alt="L-Prop" className="w-12 h-12 rounded-xl" />
              <span className="text-2xl font-bold text-white drop-shadow-lg">L-Prop</span>
            </div>
            <h2 className="text-3xl font-bold text-white leading-tight mb-3 drop-shadow-lg">
              Your Trusted Guide<br />
              <span className="text-primary">in Properties</span>
            </h2>
            <p className="text-white/80 text-lg drop-shadow">
              Navigating the Path to Your Property.
            </p>
          </div>
        </div>

        {/* Right - Form */}
        <div className="flex-1 flex flex-col min-h-0 relative z-10">
          {/* Mobile header */}
          <div className="p-4 md:hidden">
            <button
              onClick={() => {
                if (isForgotPassword) setIsForgotPassword(false);
                else if (isResettingPassword) setIsResettingPassword(false);
                else { setShowForm(false); setIsSignUp(false); }
              }}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">Back</span>
            </button>
          </div>

          {/* Desktop back button */}
          <div className="hidden md:block p-6">
            <button
              onClick={() => {
                if (isForgotPassword) setIsForgotPassword(false);
                else if (isResettingPassword) setIsResettingPassword(false);
                else { setShowForm(false); setIsSignUp(false); }
              }}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">Back</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 md:px-12 md:py-8 md:flex md:items-center md:justify-center">
            <div className="w-full max-w-md mx-auto space-y-6 md:space-y-8 bg-background/80 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-border/50 shadow-2xl">
              {/* Header */}
              <div className="space-y-2">
                <div className="flex items-center gap-3 mb-6 md:hidden">
                  <img src={lpropLogo} alt="L-Prop" className="w-10 h-10 rounded-xl" />
                  <span className="text-xl font-bold text-foreground">L-Prop</span>
                </div>
                <h1 className="text-3xl font-bold text-foreground">{formTitle}</h1>
                <p className="text-muted-foreground">{formSubtitle}</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {isResettingPassword ? (
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-foreground text-sm font-medium">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Min. 6 characters"
                        required
                        minLength={6}
                        className="pl-10 pr-10 h-12 bg-secondary border-border text-foreground rounded-xl"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {isSignUp && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-foreground text-sm font-medium">Full Name</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="name"
                              type="text"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              placeholder="Enter your full name"
                              required
                              className="pl-10 h-12 bg-secondary border-border text-foreground rounded-xl"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="role" className="text-foreground text-sm font-medium">I am a</Label>
                          <Select
                            value={formData.role}
                            onValueChange={(value: "agent" | "property_owner") =>
                              setFormData({ ...formData, role: value })
                            }
                          >
                            <SelectTrigger className="h-12 bg-secondary border-border text-foreground rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="property_owner">Property Owner</SelectItem>
                              <SelectItem value="agent">Agent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="phone" className="text-foreground text-sm font-medium">Phone *</Label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                id="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                required
                                maxLength={20}
                                placeholder="+231..."
                                className="pl-10 h-12 bg-secondary border-border text-foreground rounded-xl"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone_2" className="text-foreground text-sm font-medium">
                              Phone 2 <span className="text-muted-foreground font-normal text-xs">(Optional)</span>
                            </Label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                id="phone_2"
                                type="tel"
                                value={formData.phone_2}
                                onChange={(e) => setFormData({ ...formData, phone_2: e.target.value })}
                                maxLength={20}
                                placeholder="+231..."
                                className="pl-10 h-12 bg-secondary border-border text-foreground rounded-xl"
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-foreground text-sm font-medium">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="you@example.com"
                          required
                          className="pl-10 h-12 bg-secondary border-border text-foreground rounded-xl"
                        />
                      </div>
                    </div>

                    {!isForgotPassword && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="password" className="text-foreground text-sm font-medium">Password</Label>
                          {!isSignUp && (
                            <button
                              type="button"
                              onClick={() => setIsForgotPassword(true)}
                              className="text-xs text-primary hover:text-primary/80 transition-colors"
                            >
                              Forgot password?
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="Min. 6 characters"
                            required
                            className="pl-10 pr-10 h-12 bg-secondary border-border text-foreground rounded-xl"
                          />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {isSignUp && (
                  <p className="text-xs text-muted-foreground text-center">
                    By signing up, you agree to our{" "}
                    <Link to="/terms" className="text-primary hover:underline">
                      Terms & Conditions
                    </Link>
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold rounded-xl gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Please wait...
                    </span>
                  ) : isResettingPassword ? (
                    "Update Password"
                  ) : isForgotPassword ? (
                    <>
                      <Mail className="w-4 h-4" />
                      Send Reset Link
                    </>
                  ) : isSignUp ? (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Create Account
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      Sign In
                    </>
                  )}
                </Button>

                {/* Divider */}
                {!isResettingPassword && (
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-background px-4 text-muted-foreground">
                        {isForgotPassword ? "or" : isSignUp ? "Already have an account?" : "New to L-Prop?"}
                      </span>
                    </div>
                  </div>
                )}

                {isForgotPassword ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 rounded-xl border-white/20 text-foreground hover:bg-white/10"
                    onClick={() => setIsForgotPassword(false)}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Sign In
                  </Button>
                ) : !isResettingPassword && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 rounded-xl border-border"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setShowForm(true);
                    }}
                  >
                    {isSignUp ? "Sign In Instead" : "Create an Account"}
                  </Button>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Welcome / splash screen - Cinematic immersive
  return (
    <div className="h-[100dvh] md:min-h-screen flex flex-col md:flex-row overflow-hidden relative">
      {/* Full-screen background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})`, backgroundPosition: 'center 15%' }}
      />
      {/* Bottom-only gradient for mobile — keeps face clean */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent md:hidden" />
      {/* Desktop gradient */}
      <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-black/60" />

      {/* Mobile: everything floats on the image */}
      <div className="md:hidden relative z-10 flex flex-col h-full">
        {/* Top logo */}
        <div className="p-6 pt-12">
          <div className="flex items-center gap-3">
            <img src={lpropLogo} alt="L-Prop" className="w-11 h-11 rounded-xl shadow-lg" />
            <span className="text-lg font-bold text-white drop-shadow-lg">L-Prop</span>
          </div>
        </div>

        {/* Spacer pushes content to bottom */}
        <div className="flex-1" />

        {/* Bottom floating content */}
        <div className="px-6 pb-10 space-y-5">
            {isInstalledPwaMobile && (
              <div className="inline-flex items-center rounded-full border border-border/40 bg-card/35 px-3 py-1 text-[11px] font-medium text-foreground/80 backdrop-blur-md">
                Installed app mode
              </div>
            )}

          <div className="space-y-2">
            <h1 className="text-[2.2rem] font-bold text-white leading-[1.1] tracking-tight drop-shadow-lg">
              Your Trusted Guide<br />
              <span className="text-primary drop-shadow-lg">in Properties</span>
            </h1>
            <p className="text-white/70 text-sm">
              Navigating the Path to Your Property.
            </p>
          </div>

          {/* Dots */}
          <div className="flex gap-1.5">
            <div className="w-7 h-1 bg-primary rounded-full" />
            <div className="w-1.5 h-1 bg-white/30 rounded-full" />
            <div className="w-1.5 h-1 bg-white/30 rounded-full" />
          </div>

          {/* Buttons */}
          <div className="space-y-3 pt-2">
            <Button
              onClick={() => navigate("/")}
              className="w-full h-14 text-base font-semibold rounded-2xl shadow-lg shadow-primary/30"
            >
              Get Started
            </Button>
            <Button
              onClick={() => { setIsSignUp(false); setShowForm(true); }}
              variant="outline"
              className="w-full h-14 text-base font-semibold rounded-2xl border-white/25 text-white bg-white/5 backdrop-blur-sm hover:bg-white/15"
            >
              Log in
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden md:flex relative z-10 w-full">
        {/* Left hero content */}
        <div className="w-1/2 flex flex-col justify-between p-10 lg:p-14">
          <div className="flex items-center gap-3">
            <img src={lpropLogo} alt="L-Prop" className="w-14 h-14 rounded-xl shadow-lg" />
            <span className="text-2xl font-bold text-white drop-shadow-lg">L-Prop</span>
          </div>

          <div className="max-w-md">
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-4 drop-shadow-lg">
              Your Trusted Guide<br />
              <span className="text-primary">in Properties</span>
            </h1>
            <p className="text-lg text-white/80 drop-shadow mb-8">
              Navigating the Path to Your Property in Liberia.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-white/90">
                <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center">
                  <Home className="w-4 h-4" />
                </div>
                <span className="text-sm">Browse verified property listings</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="text-sm">Trusted agents and property owners</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center">
                  <Star className="w-4 h-4" />
                </div>
                <span className="text-sm">Premium listings for better visibility</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right CTA */}
        <div className="w-1/2 flex items-center justify-center p-10 lg:p-14">
          <div className="w-full max-w-md bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl p-8 lg:p-10 shadow-2xl">
            <div className="text-center mb-8">
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                Welcome to L-Prop
              </h2>
              <p className="text-muted-foreground">
                Find your dream property in Liberia
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={() => navigate("/")}
                className="w-full h-14 text-base font-semibold rounded-xl gap-2"
                size="lg"
              >
                <Home className="w-5 h-5" />
                Get Started
              </Button>
              <Button
                onClick={() => { setIsSignUp(false); setShowForm(true); }}
                variant="outline"
                className="w-full h-14 text-base font-semibold rounded-xl border-border hover:bg-secondary gap-2"
                size="lg"
              >
                <LogIn className="w-5 h-5" />
                Log in
              </Button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background/80 px-4 text-muted-foreground">New to L-Prop?</span>
              </div>
            </div>

            <Button
              onClick={() => { setIsSignUp(true); setShowForm(true); }}
              variant="secondary"
              className="w-full h-12 text-sm font-medium rounded-xl gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Create an Account
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-6">
              By continuing, you agree to our{" "}
              <Link to="/terms" className="text-primary hover:underline">
                Terms & Conditions
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
