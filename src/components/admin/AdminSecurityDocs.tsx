/**
 * ============================================================
 *  ADMIN SECURITY DOCUMENTATION
 * ============================================================
 *  Static, in-app reference for the admin team. Documents the
 *  security model of L-Prop and the response steps to follow
 *  when investigating a bug or incident.
 *
 *  This page is purely informational — it changes nothing in
 *  the database. Update the constants below when policies
 *  evolve.
 * ============================================================
 */
import {
  ShieldCheck,
  Lock,
  Database,
  KeyRound,
  Bug,
  AlertTriangle,
  FileText,
  Eye,
  UserCheck,
  Server,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

interface Section {
  id: string;
  title: string;
  icon: React.ElementType;
  level?: "info" | "warning" | "critical";
  body: React.ReactNode;
}

const SECTIONS: Section[] = [
  {
    id: "overview",
    title: "1. Security Overview",
    icon: ShieldCheck,
    body: (
      <div className="space-y-2 text-sm">
        <p>
          L-Prop is a property marketplace for Liberia. Authentication and data are powered by Supabase.
          Every public table is protected by Row-Level Security (RLS) policies.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Frontend uses the public <code>anon</code> key only.</li>
          <li>Admin actions go through the <code>winner-54</code> hidden routes and require the <code>admin</code> role from <code>user_roles</code>.</li>
          <li>Secrets (service role, CRON, API keys) live only in Supabase Edge Function secrets, never in the codebase.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "roles",
    title: "2. User Roles & Permissions",
    icon: UserCheck,
    body: (
      <div className="space-y-2 text-sm">
        <p>Roles are stored in <code>public.user_roles</code> — never on the profile.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><b>user</b> — default for every new signup.</li>
          <li><b>Verified Owner</b> ✅ — max 2 properties, cannot post offers/reviews.</li>
          <li><b>Verified Agent</b> 🔵 — unlimited listings, full marketplace features.</li>
          <li><b>admin</b> — full access to /winner-54 portal.</li>
        </ul>
        <p>Always check roles via the <code>has_role(uid, role)</code> SECURITY DEFINER function — never via client-side flags.</p>
      </div>
    ),
  },
  {
    id: "rls",
    title: "3. Row-Level Security Rules",
    icon: Lock,
    level: "critical",
    body: (
      <div className="space-y-2 text-sm">
        <p>Before touching any table, verify its RLS policies. Key rules:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><code>properties</code> — owners manage their own; everyone reads <code>active</code> ones.</li>
          <li><code>property_views</code> — owners see only non-PII columns (id, property_id, viewer_id, viewed_at). IP and user-agent are never exposed.</li>
          <li><code>verification_requests</code> — only the requesting user or an admin can read.</li>
          <li><code>verification-docs</code> bucket — private; access via signed URLs only.</li>
          <li><code>messages</code> / <code>conversations</code> — restricted to the two participants.</li>
          <li><code>user_roles</code> — read by <code>has_role()</code> only; no public access.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "secrets",
    title: "4. Secrets Management",
    icon: KeyRound,
    level: "critical",
    body: (
      <div className="space-y-2 text-sm">
        <p>Never paste secrets in code or chat. Existing secrets:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><code>SUPABASE_SERVICE_ROLE_KEY</code> — server-only, bypasses RLS.</li>
          <li><code>CRON_SECRET</code> — required on every scheduled edge call.</li>
          <li><code>LOVABLE_API_KEY</code> — rotate via the dedicated tool.</li>
        </ul>
        <p>If a secret is suspected leaked: rotate immediately, then audit edge function logs.</p>
      </div>
    ),
  },
  {
    id: "storage",
    title: "5. Storage Buckets",
    icon: Database,
    body: (
      <div className="space-y-2 text-sm">
        <ul className="list-disc pl-5 space-y-1">
          <li><b>property-photos</b> — public read, owner write.</li>
          <li><b>verification-docs</b> — private; admin reads via signed temporary URLs.</li>
          <li><b>homepage-banners</b> — public read, admin write.</li>
          <li><b>blog-media</b> — public read, admin write.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "auth",
    title: "6. Authentication Flow",
    icon: Eye,
    body: (
      <div className="space-y-2 text-sm">
        <p>Email + password via Supabase Auth. Sessions are cleaned by removing <code>sb-*</code> keys on logout with <code>scope: "local"</code>.</p>
        <p>Verification uses live camera selfies only — file uploads for ID are forbidden.</p>
      </div>
    ),
  },
  {
    id: "incident",
    title: "7. Incident Response Checklist",
    icon: AlertTriangle,
    level: "warning",
    body: (
      <div className="space-y-2 text-sm">
        <ol className="list-decimal pl-5 space-y-1">
          <li><b>Confirm.</b> Reproduce the issue in another tab. Open <i>Admin → Debug Console</i> and click "Clear".</li>
          <li><b>Capture.</b> Trigger the bug again. The Debug Console records every API call and error.</li>
          <li><b>Filter.</b> Click "Issues" to isolate errors/warnings.</li>
          <li><b>Report.</b> Click "Copy report" and paste it into chat with Lovable.</li>
          <li><b>Contain.</b> If user data may be exposed: rotate keys, disable the affected feature, notify users.</li>
          <li><b>Fix.</b> Apply the migration/patch, re-run the security scan.</li>
          <li><b>Verify.</b> Confirm RLS still blocks unauthorized access on the affected tables.</li>
        </ol>
      </div>
    ),
  },
  {
    id: "debugging",
    title: "8. Debugging Tools",
    icon: Bug,
    body: (
      <div className="space-y-2 text-sm">
        <ul className="list-disc pl-5 space-y-1">
          <li><b>Admin → Debug Console</b> — live log of the current admin session.</li>
          <li><b>Supabase Edge Logs</b> — function-by-function logs in the Supabase dashboard.</li>
          <li><b>Browser DevTools</b> — Console (F12) shows the same events with emoji prefixes.</li>
          <li><b>ErrorBoundary</b> — render crashes are captured and shown to the user with a reload button.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "donts",
    title: "9. What Must Never Happen",
    icon: AlertTriangle,
    level: "critical",
    body: (
      <div className="space-y-2 text-sm">
        <ul className="list-disc pl-5 space-y-1">
          <li>No <code>service_role_key</code> in frontend code or browser.</li>
          <li>No roles stored on profiles table — only in <code>user_roles</code>.</li>
          <li>No file uploads for identity documents — live selfie only.</li>
          <li>No native <code>prompt()</code>/<code>confirm()</code> — always use AlertDialog.</li>
          <li>No tables in <code>public</code> without explicit GRANT + RLS policies.</li>
          <li>No CHECK constraints with time-based logic — use validation triggers.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "edge",
    title: "10. Edge Function Hardening",
    icon: Server,
    body: (
      <div className="space-y-2 text-sm">
        <p>Every authenticated edge function must:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Validate the JWT with <code>supabase.auth.getClaims(token)</code>.</li>
          <li>Scope queries by <code>claims.sub</code> or check role via <code>has_role()</code>.</li>
          <li>For cron-triggered jobs, verify <code>CRON_SECRET</code> header.</li>
          <li>Return CORS headers; never log secrets.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "contact",
    title: "11. Escalation Contacts",
    icon: FileText,
    body: (
      <div className="space-y-2 text-sm">
        <ul className="list-disc pl-5 space-y-1">
          <li><b>Supabase project ref:</b> sijxsadlinayqxdxkmcr</li>
          <li><b>Edge function logs:</b> Supabase Dashboard → Functions → Logs</li>
          <li><b>Security scanner:</b> Run from Lovable chat when a change touches RLS, secrets, or tables.</li>
        </ul>
      </div>
    ),
  },
];

const LEVEL_BADGE: Record<NonNullable<Section["level"]>, { label: string; cls: string }> = {
  info: { label: "Info", cls: "bg-blue-500/10 text-blue-500" },
  warning: { label: "Warning", cls: "bg-yellow-500/10 text-yellow-500" },
  critical: { label: "Critical", cls: "bg-red-500/10 text-red-500" },
};

export function AdminSecurityDocs() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" /> Security Documentation
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Operating manual for keeping L-Prop secure. Read before changing RLS, secrets, or auth.
        </p>
      </div>

      <Card className="p-4">
        <Accordion type="multiple" defaultValue={["overview", "incident"]} className="w-full">
          {SECTIONS.map((s) => (
            <AccordionItem key={s.id} value={s.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  <s.icon className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-medium">{s.title}</span>
                  {s.level && (
                    <Badge variant="outline" className={LEVEL_BADGE[s.level].cls}>
                      {LEVEL_BADGE[s.level].label}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pl-7">{s.body}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Card>
    </div>
  );
}

export default AdminSecurityDocs;
