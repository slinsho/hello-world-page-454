import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { z } from "zod";
import heroImage from "@/assets/auth-hero.jpg";

const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["agent", "property_owner"]),
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
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "property_owner" as "agent" | "property_owner",
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

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
        const { error } = await supabase.auth.updateUser({
          password: formData.password,
        });

        if (error) throw error;

        toast({
          title: "Password updated!",
          description: "Your password has been successfully reset.",
        });
        setIsResettingPassword(false);
        navigate("/");
      } else if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
          redirectTo: `${window.location.origin}/auth`,
        });

        if (error) throw error;

        toast({
          title: "Check your email",
          description: "We've sent you a password reset link.",
        });
        setIsForgotPassword(false);
      } else if (isSignUp) {
        const validatedData = signUpSchema.parse(formData);
        
        const { error } = await supabase.auth.signUp({
          email: validatedData.email,
          password: validatedData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              name: validatedData.name,
              role: validatedData.role,
            },
          },
        });

        if (error) throw error;

        toast({
          title: "Account created!",
          description: "You can now sign in.",
        });
        setIsSignUp(false);
      } else {
        const validatedData = signInSchema.parse({ email: formData.email, password: formData.password });
        
        const { error } = await supabase.auth.signInWithPassword({
          email: validatedData.email,
          password: validatedData.password,
        });

        if (error) throw error;

        toast({
          title: "Welcome back!",
          description: "You've successfully signed in.",
        });
        navigate("/");
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "An error occurred",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const [showForm, setShowForm] = useState(false);

  // Show form for login, signup, password reset, or forgot password
  if (isResettingPassword || isForgotPassword || isSignUp || showForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              {isResettingPassword 
                ? "Set New Password" 
                : isForgotPassword 
                ? "Reset Password" 
                : isSignUp
                ? "Create Account"
                : "Sign In"}
            </h1>
            <p className="text-muted-foreground">
              {isResettingPassword
                ? "Enter your new password"
                : isForgotPassword
                ? "Enter your email to receive a password reset link"
                : isSignUp
                ? "Join LibHub to list your properties"
                : "Welcome back to LibHub"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isResettingPassword ? (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter your new password"
                  required
                  minLength={6}
                  className="bg-card border-border text-foreground"
                />
                <p className="text-sm text-muted-foreground">
                  Password must be at least 6 characters
                </p>
              </div>
            ) : (
              <>
                {isSignUp && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-foreground">Full Name</Label>
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="bg-card border-border text-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-foreground">I am a</Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value: "agent" | "property_owner") =>
                          setFormData({ ...formData, role: value })
                        }
                      >
                        <SelectTrigger className="bg-card border-border text-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="property_owner">Property Owner</SelectItem>
                          <SelectItem value="agent">Agent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="bg-card border-border text-foreground"
                  />
                </div>

                {!isForgotPassword && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-foreground">Password</Label>
                      {!isSignUp && (
                        <button
                          type="button"
                          onClick={() => setIsForgotPassword(true)}
                          className="text-sm text-primary hover:underline"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      className="bg-card border-border text-foreground"
                    />
                  </div>
                )}
              </>
            )}

            {isSignUp && (
              <p className="text-sm text-muted-foreground text-center">
                By signing up to LibHub, you agree to our{" "}
                <Link to="/terms" className="text-primary hover:underline">
                  terms and conditions
                </Link>
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading 
                ? "Loading..." 
                : isResettingPassword
                ? "Update Password"
                : isForgotPassword 
                ? "Send Reset Link" 
                : isSignUp 
                ? "Sign Up" 
                : "Sign In"}
            </Button>

            <>
              {isForgotPassword ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setIsForgotPassword(false)}
                >
                  Back to Sign In
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setShowForm(true);
                  }}
                >
                  {isSignUp
                    ? "Already have an account? Sign In"
                    : "Don't have an account? Sign Up"}
                </Button>
              )}
            </>
          </form>
        </div>
      </div>
    );
  }

  // Main welcome/login screen
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
        </div>

        {/* Content */}
        <div className="relative flex-1 flex flex-col justify-end p-6 pb-12">
          <div className="space-y-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
              Your Trusted Guide<br />in finding properties
            </h1>
            <p className="text-base text-foreground/90 max-w-md mx-auto">
              Navigating the Path to Your Property.
            </p>

            {/* Pagination dots */}
            <div className="flex justify-center gap-2 pt-4">
              <div className="w-8 h-1 bg-primary rounded-full" />
              <div className="w-1 h-1 bg-muted rounded-full" />
              <div className="w-1 h-1 bg-muted rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="p-6 space-y-3">
        <Button 
          onClick={() => navigate("/")}
          className="w-full h-14 text-base font-semibold rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Get Started
        </Button>
        <Button 
          onClick={() => {
            setIsSignUp(false);
            setShowForm(true);
          }}
          variant="secondary"
          className="w-full h-14 text-base font-semibold rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80"
        >
          Log in
        </Button>
      </div>
    </div>
  );
};

export default Auth;
