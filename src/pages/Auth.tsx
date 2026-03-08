import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";
import { Eye, EyeOff, ArrowLeft, UserPlus, LogIn, Mail, Lock, Phone, User, Home, Shield, Star } from "lucide-react";
import heroImage from "@/assets/auth-hero.jpg";
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

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    if (type === 'recovery') {
      setIsResettingPassword(true);
    } else if (user && !isResettingPassword) {
      navigate("/");
    }
  }, [user, navigate, isResettingPassword]);

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

  // Form view
  if (isResettingPassword || isForgotPassword || isSignUp || showForm) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row bg-background">
        {/* Left - Hero (desktop only) */}
        <div className="hidden md:flex md:w-1/2 relative overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-transparent" />
          <div className="relative z-10 flex flex-col justify-end p-12 pb-16">
            <div className="flex items-center gap-3 mb-6">
             <img src={lpropLogo} alt="L-Prop" className="w-12 h-12 rounded-xl" />
              <span className="text-2xl font-bold text-foreground">L-Prop</span>
            </div>
            <h2 className="text-3xl font-bold text-foreground leading-tight mb-3">
              Your Trusted Guide<br />in finding properties
            </h2>
            <p className="text-muted-foreground text-lg">
              Navigating the Path to Your Property.
            </p>
          </div>
        </div>

        {/* Right - Form */}
        <div className="flex-1 flex flex-col min-h-screen md:min-h-0">
          {/* Mobile header */}
          <div className="p-4 md:hidden">
            <button
              onClick={() => {
                if (isForgotPassword) setIsForgotPassword(false);
                else if (isResettingPassword) setIsResettingPassword(false);
                else { setShowForm(false); setIsSignUp(false); }
              }}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
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
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">Back</span>
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center px-6 py-8 md:px-12">
            <div className="w-full max-w-md space-y-8">
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
                    className="w-full h-12 rounded-xl border-border"
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

  // Welcome / splash screen - Desktop & Mobile
  return (
    <div className="min-h-screen md:min-h-screen flex flex-col md:flex-row bg-background h-[100dvh] md:h-auto overflow-hidden">
      {/* Left side - Hero image (desktop) / Full background (mobile) */}
      <div className="relative flex-1 md:w-1/2 md:min-h-screen">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        {/* Mobile gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/50 to-background md:hidden" />
        {/* Desktop gradient */}
        <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-background/10 via-transparent to-background/80" />
        
        {/* Desktop hero content */}
        <div className="hidden md:flex relative z-10 h-full flex-col justify-between p-10 lg:p-14">
           <div className="flex items-center gap-3">
            <img src={lpropLogo} alt="L-Prop" className="w-14 h-14 rounded-xl" />
            <span className="text-2xl font-bold text-white drop-shadow-lg">L-Prop</span>
          </div>
          
          <div className="max-w-md">
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-4 drop-shadow-lg">
              Your Trusted Guide<br />
              <span className="text-primary">in Properties</span>
            </h1>
            <p className="text-lg text-white/90 drop-shadow mb-8">
              Navigating the Path to Your Property in Liberia.
            </p>
            
            {/* Feature highlights */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-white/90">
                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
                  <Home className="w-4 h-4" />
                </div>
                <span className="text-sm">Browse verified property listings</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="text-sm">Trusted agents and property owners</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
                  <Star className="w-4 h-4" />
                </div>
                <span className="text-sm">Premium listings for better visibility</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile logo */}
         <div className="md:hidden relative z-10 p-6 pt-12">
          <div className="flex items-center gap-3">
            <img src={lpropLogo} alt="L-Prop" className="w-12 h-12 rounded-xl" />
            <span className="text-xl font-bold text-foreground">L-Prop</span>
          </div>
        </div>
      </div>

      {/* Right side - CTA (desktop) / Bottom section (mobile) */}
      <div className="relative z-10 md:w-1/2 md:flex md:items-center md:justify-center">
        {/* Mobile bottom section */}
        <div className="md:hidden px-6 pb-10 pt-4 space-y-6">
          <div className="space-y-3 text-center">
            <h1 className="text-4xl font-bold text-foreground leading-[1.1] tracking-tight">
              Your Trusted Guide<br />
              <span className="text-primary">in Properties</span>
            </h1>
            <p className="text-muted-foreground text-base max-w-sm mx-auto">
              Navigating the Path to Your Property.
            </p>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-1.5">
            <div className="w-7 h-1 bg-primary rounded-full" />
            <div className="w-1.5 h-1 bg-muted-foreground/40 rounded-full" />
            <div className="w-1.5 h-1 bg-muted-foreground/40 rounded-full" />
          </div>

          {/* Buttons */}
          <div className="space-y-3 pt-2">
            <Button
              onClick={() => navigate("/")}
              className="w-full h-14 text-base font-semibold rounded-xl"
            >
              Get Started
            </Button>
            <Button
              onClick={() => { setIsSignUp(false); setShowForm(true); }}
              variant="outline"
              className="w-full h-14 text-base font-semibold rounded-xl border-border hover:bg-secondary"
            >
              Log in
            </Button>
          </div>
        </div>

        {/* Desktop CTA section */}
        <div className="hidden md:block w-full max-w-md px-10 lg:px-14">
          <div className="bg-card border border-border rounded-2xl p-8 lg:p-10 shadow-xl">
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
                <span className="bg-card px-4 text-muted-foreground">New to L-Prop?</span>
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
