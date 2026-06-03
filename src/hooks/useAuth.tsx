/**
 * ============================================================
 *  useAuth  —  "who is currently logged in?"
 * ============================================================
 *  This hook is the single source of truth for the logged-in user.
 *  Any component can call `useAuth()` to get:
 *      - user      → the user object (or null if signed out)
 *      - session   → the raw Supabase session (with tokens)
 *      - loading   → true while we're still checking
 *
 *  HOW IT WORKS, STEP BY STEP:
 *  ---------------------------
 *  1. AuthProvider wraps the entire app in App.tsx.
 *  2. On mount, it asks Supabase: "is there a stored session?"
 *  3. It also subscribes to auth state changes (login / logout /
 *     token refresh) so the UI reacts instantly.
 *  4. The current state is shared with every component through
 *     React Context (no prop-drilling needed).
 *
 *  DEBUG TIP:
 *  ----------
 *  Every auth event is logged via src/lib/debug.ts, so if a
 *  user "loses their session", open the Debug Panel and look
 *  for ❌ or ⚠️ entries around the time it happened.
 * ============================================================
 */
import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { log } from "@/lib/debug";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for sign-in / sign-out / token-refresh events.
    // This MUST be set up BEFORE the getSession() call below,
    // otherwise we can miss the very first event.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        log.info(`auth event: ${event}`, { userId: session?.user?.id ?? null });
      }
    );

    // Check whether the browser already has a saved session
    // (e.g. user logged in yesterday and just reopened the app).
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      log.info("initial session check", { hasSession: !!session });
    });

    // Cleanup: stop listening when the app unmounts.
    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Tiny helper so components can do `const { user } = useAuth()`
// instead of importing the context object directly.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
