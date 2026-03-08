import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Shield, Lock, Mail, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { z } from "zod";

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const AdminLogin = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    const checkAdminAndRedirect = async () => {
      if (user) {
        try {
          const { data: isAdmin } = await supabase.rpc("is_admin", { user_id: user.id });
          if (isAdmin) navigate("/winner-54/dashboard");
        } catch {}
      }
    };
    if (!authLoading) checkAdminAndRedirect();
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const validatedData = signInSchema.parse({ email, password });
      const { data, error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      });
      if (error) throw error;

      const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin", { user_id: data.user.id });
      if (adminError) throw adminError;

      if (!isAdmin) {
        await supabase.auth.signOut();
        toast({ title: "Access Denied", description: "You do not have admin privileges.", variant: "destructive" });
        return;
      }

      toast({ title: "Welcome, Admin!", description: "You've successfully signed in." });
      navigate("/winner-54/dashboard");
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // ─── MOBILE: splash → form flow ───
  const mobileView = (
    <div className="md:hidden min-h-screen bg-background flex flex-col">
      {!showForm ? (
        // Splash screen
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="relative mb-8">
            <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Lock className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Admin Portal</h1>
          <p className="text-muted-foreground text-sm max-w-xs mb-2">
            Secure access to the LibHub management dashboard
          </p>
          <p className="text-muted-foreground/60 text-xs mb-10">
            Authorized personnel only
          </p>
          <Button
            onClick={() => setShowForm(true)}
            className="w-full max-w-xs rounded-xl h-12 text-base gap-2"
          >
            Sign In <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      ) : (
        // Form screen
        <div className="flex-1 flex flex-col px-6 pt-12 pb-8">
          <button onClick={() => setShowForm(false)} className="text-muted-foreground text-sm mb-8 self-start">
            ← Back
          </button>
          <div className="mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-1">Welcome back</h2>
            <p className="text-muted-foreground text-sm">Sign in to your admin account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 flex-1">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@libhub.com"
                  className="pl-10 h-12 rounded-xl bg-card border-border text-foreground"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="pl-10 pr-11 h-12 rounded-xl bg-card border-border text-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 rounded-xl text-base gap-2 mt-2" disabled={loading}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
            </Button>
          </form>

          <p className="text-center text-muted-foreground/50 text-[11px] mt-6">
            Protected by LibHub Security
          </p>
        </div>
      )}
    </div>
  );

  // ─── DESKTOP: split-screen ───
  const desktopView = (
    <div className="hidden md:flex min-h-screen">
      {/* Left panel — decorative */}
      <div className="w-1/2 bg-card relative overflow-hidden flex items-center justify-center">
        {/* Abstract grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />
        
        {/* Glowing accent */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-60 h-60 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative z-10 max-w-md text-center px-10">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-8">
            <Shield className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-4xl font-bold text-foreground mb-4 leading-tight">
            Admin<br />Control Center
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-8">
            Manage properties, users, verifications, and platform settings from one secure dashboard.
          </p>
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground/60">
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              Encrypted
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              Role-Based
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              Audit Logged
            </span>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-1/2 bg-background flex items-center justify-center px-10">
        <div className="w-full max-w-sm">
          <div className="mb-10">
            <h1 className="text-2xl font-bold text-foreground mb-1">Sign in</h1>
            <p className="text-muted-foreground text-sm">Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@libhub.com"
                  className="pl-10 h-11 rounded-xl bg-card border-border text-foreground"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="pl-10 pr-11 h-11 rounded-xl bg-card border-border text-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 rounded-xl gap-2" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign In <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>

          <p className="text-center text-muted-foreground/40 text-xs mt-10">
            © {new Date().getFullYear()} LibHub · Admin Access Only
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {mobileView}
      {desktopView}
    </>
  );
};

export default AdminLogin;
