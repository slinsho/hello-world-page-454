/**
 * Scaling Analysis + Payment Migration Guide
 * Plain-English doc shown inside the admin portal.
 */
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, TrendingUp, Smartphone } from "lucide-react";

export function AdminScalingDocs() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">Scaling & Payments Guide</h1>
        <p className="text-sm text-muted-foreground">
          Capacity prediction at 20,000 users and step-by-step plan to migrate from manual payments to Mobile Money.
        </p>
      </div>

      {/* SCALING PREDICTION */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-5 w-5 text-primary" />
            Will the app crash at 20,000 users?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">Short answer: No, it will NOT crash.</p>
              <p className="text-muted-foreground mt-1">
                The frontend is a static React app served from a global CDN, and the backend (Supabase) auto-scales.
                20,000 total registered users translates to roughly 500–2,000 concurrent active users on a busy day —
                well within the free/pro tier of Supabase.
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Capacity estimates at 20K users</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2">Resource</th>
                    <th className="text-left py-2 px-2">Expected load</th>
                    <th className="text-left py-2 px-2">Limit</th>
                    <th className="text-left py-2 px-2">Status</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border/50">
                    <td className="py-2 px-2">Database rows</td>
                    <td className="py-2 px-2">~200K rows total</td>
                    <td className="py-2 px-2">Millions</td>
                    <td className="py-2 px-2"><Badge variant="secondary" className="bg-emerald-500/15 text-emerald-600">OK</Badge></td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 px-2">DB connections</td>
                    <td className="py-2 px-2">~30–80 concurrent</td>
                    <td className="py-2 px-2">200 (pooled)</td>
                    <td className="py-2 px-2"><Badge variant="secondary" className="bg-emerald-500/15 text-emerald-600">OK</Badge></td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 px-2">Storage (photos)</td>
                    <td className="py-2 px-2">~50–100 GB</td>
                    <td className="py-2 px-2">Pay-as-you-go</td>
                    <td className="py-2 px-2"><Badge variant="secondary" className="bg-amber-500/15 text-amber-600">Watch cost</Badge></td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 px-2">Realtime channels</td>
                    <td className="py-2 px-2">~500 concurrent</td>
                    <td className="py-2 px-2">10,000</td>
                    <td className="py-2 px-2"><Badge variant="secondary" className="bg-emerald-500/15 text-emerald-600">OK</Badge></td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 px-2">Edge function calls</td>
                    <td className="py-2 px-2">~50K/day</td>
                    <td className="py-2 px-2">2M/month free</td>
                    <td className="py-2 px-2"><Badge variant="secondary" className="bg-emerald-500/15 text-emerald-600">OK</Badge></td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2">Bandwidth (CDN)</td>
                    <td className="py-2 px-2">~200–500 GB/mo</td>
                    <td className="py-2 px-2">250 GB free</td>
                    <td className="py-2 px-2"><Badge variant="secondary" className="bg-amber-500/15 text-amber-600">May upgrade</Badge></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">Likely cost surprises (not crashes)</p>
              <ul className="text-muted-foreground mt-1 list-disc list-inside space-y-1">
                <li><strong>Storage</strong>: property photos add up fast. Already optimized to 1600px / 75% quality.</li>
                <li><strong>Bandwidth</strong>: thumbnails served per page view. Could exceed 250 GB free tier.</li>
                <li><strong>Email sending</strong>: default Supabase email is rate-limited; switch to Resend/SendGrid before scaling.</li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Recommendations to handle 20K users smoothly</h3>
            <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground">
              <li><strong>Upgrade Supabase to Pro</strong> ($25/mo) before reaching 5K active users — gives daily backups, 8 GB DB, 100 GB storage, 250 GB bandwidth.</li>
              <li><strong>Add database indexes</strong> on hot columns: <code className="text-xs bg-muted px-1 py-0.5 rounded">properties(county, status, listing_type)</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">properties(created_at desc)</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">notifications(user_id, is_read)</code>.</li>
              <li><strong>Enable Cloudflare</strong> in front of the custom domain for free image caching + DDoS protection.</li>
              <li><strong>Switch email provider</strong> to Resend or a custom SMTP (Supabase default = spam folder + low limits).</li>
              <li><strong>Add a CAPTCHA</strong> (hCaptcha or Turnstile) on signup/contact forms to block bots.</li>
              <li><strong>Pagination everywhere</strong> — never fetch more than 50 properties per page. Already mostly done.</li>
              <li><strong>Monitor Edge Function logs weekly</strong> — slow functions (>1s) become the bottleneck first.</li>
              <li><strong>Schedule a weekly DB backup export</strong> in addition to Supabase's daily auto-backup.</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* PAYMENT MIGRATION */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Smartphone className="h-5 w-5 text-primary" />
            Migrate from Manual Payment → Mobile Money API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Today, users pay manually (Orange Money / Lonestar MTN) and submit a payment reference that an admin
            verifies. To automate this, integrate a Mobile Money API (Orange Money API, MTN MoMo API, or a Liberia
            aggregator like <strong>FlutterWave</strong> or <strong>Paystack</strong>).
          </p>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="step-1">
              <AccordionTrigger className="text-sm font-semibold">Step 1 — Choose a provider & get API keys</AccordionTrigger>
              <AccordionContent className="space-y-2 text-muted-foreground">
                <p><strong>Recommended for Liberia:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Flutterwave</strong> — supports Orange Money LR + MTN MoMo, easy API, USD/LRD. <a href="https://developer.flutterwave.com" target="_blank" rel="noreferrer" className="text-primary underline">developer.flutterwave.com</a></li>
                  <li><strong>MTN MoMo Developer Portal</strong> — direct integration, more setup. <a href="https://momodeveloper.mtn.com" target="_blank" rel="noreferrer" className="text-primary underline">momodeveloper.mtn.com</a></li>
                  <li><strong>Orange Money API</strong> — apply via Orange Liberia business team.</li>
                </ul>
                <p>You will need: <code className="text-xs bg-muted px-1 py-0.5 rounded">PUBLIC_KEY</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">SECRET_KEY</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">ENCRYPTION_KEY</code>, and a <strong>webhook URL</strong> (we'll create one).</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-2">
              <AccordionTrigger className="text-sm font-semibold">Step 2 — Add API keys as Supabase secrets</AccordionTrigger>
              <AccordionContent className="space-y-2 text-muted-foreground">
                <p>In Lovable chat, ask: <em>"Add these secrets: FLW_SECRET_KEY, FLW_PUBLIC_KEY, FLW_WEBHOOK_HASH"</em></p>
                <p>NEVER paste secret keys in code or in the chat directly. Use the secrets tool. The keys become available in edge functions via <code className="text-xs bg-muted px-1 py-0.5 rounded">Deno.env.get("FLW_SECRET_KEY")</code>.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-3">
              <AccordionTrigger className="text-sm font-semibold">Step 3 — Database changes</AccordionTrigger>
              <AccordionContent className="space-y-2 text-muted-foreground">
                <p>Add fields to <code className="text-xs bg-muted px-1 py-0.5 rounded">verification_requests</code> and <code className="text-xs bg-muted px-1 py-0.5 rounded">promotion_requests</code>:</p>
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`ALTER TABLE verification_requests
  ADD COLUMN provider_tx_id text,           -- ID returned by Flutterwave
  ADD COLUMN provider_status text,          -- pending|successful|failed
  ADD COLUMN provider_webhook_payload jsonb;-- raw webhook for audit

ALTER TABLE promotion_requests
  ADD COLUMN provider_tx_id text,
  ADD COLUMN provider_status text,
  ADD COLUMN provider_webhook_payload jsonb;

CREATE INDEX idx_ver_provider_tx ON verification_requests(provider_tx_id);
CREATE INDEX idx_promo_provider_tx ON promotion_requests(provider_tx_id);`}
                </pre>
                <p>Ask Lovable: <em>"Create a migration that adds these provider_* columns to verification_requests and promotion_requests."</em></p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-4">
              <AccordionTrigger className="text-sm font-semibold">Step 4 — Backend: create 2 edge functions</AccordionTrigger>
              <AccordionContent className="space-y-2 text-muted-foreground">
                <p><strong>A) <code className="text-xs bg-muted px-1 py-0.5 rounded">supabase/functions/initiate-payment/index.ts</code></strong></p>
                <p>Called from the frontend when the user clicks "Pay Now". It:</p>
                <ol className="list-decimal list-inside space-y-0.5 ml-2">
                  <li>Authenticates the user (JWT).</li>
                  <li>Calls Flutterwave <code className="text-xs bg-muted px-1 py-0.5 rounded">POST /v3/charges?type=mobile_money_franco</code> with amount, phone, currency.</li>
                  <li>Stores the returned <code className="text-xs bg-muted px-1 py-0.5 rounded">tx_ref</code> in <code className="text-xs bg-muted px-1 py-0.5 rounded">provider_tx_id</code> and sets <code className="text-xs bg-muted px-1 py-0.5 rounded">provider_status='pending'</code>.</li>
                  <li>Returns a redirect URL or USSD code to the frontend.</li>
                </ol>
                <p className="mt-2"><strong>B) <code className="text-xs bg-muted px-1 py-0.5 rounded">supabase/functions/payment-webhook/index.ts</code></strong></p>
                <p>Public URL given to Flutterwave. When payment completes, Flutterwave calls this. It:</p>
                <ol className="list-decimal list-inside space-y-0.5 ml-2">
                  <li>Verifies the <code className="text-xs bg-muted px-1 py-0.5 rounded">verif-hash</code> header equals <code className="text-xs bg-muted px-1 py-0.5 rounded">FLW_WEBHOOK_HASH</code>.</li>
                  <li>Looks up the request by <code className="text-xs bg-muted px-1 py-0.5 rounded">provider_tx_id</code>.</li>
                  <li>On success → updates <code className="text-xs bg-muted px-1 py-0.5 rounded">payment_status='confirmed'</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">status='approved'</code>, sets expiry, re-enables properties (same logic as <code className="text-xs bg-muted px-1 py-0.5 rounded">confirm_payment</code> in <code className="text-xs bg-muted px-1 py-0.5 rounded">process-verification</code> today).</li>
                  <li>Sends notification to user.</li>
                </ol>
                <p className="mt-2">Add <code className="text-xs bg-muted px-1 py-0.5 rounded">[functions.payment-webhook] verify_jwt = false</code> to <code className="text-xs bg-muted px-1 py-0.5 rounded">supabase/config.toml</code> (webhooks come without a JWT).</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-5">
              <AccordionTrigger className="text-sm font-semibold">Step 5 — Frontend changes</AccordionTrigger>
              <AccordionContent className="space-y-2 text-muted-foreground">
                <p><strong>Files to update:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li><code className="text-xs bg-muted px-1 py-0.5 rounded">src/pages/Verification.tsx</code> — replace the "Submit Payment Reference" form with a <strong>Pay Now</strong> button that calls <code className="text-xs bg-muted px-1 py-0.5 rounded">supabase.functions.invoke("initiate-payment")</code> and redirects to the returned URL.</li>
                  <li><code className="text-xs bg-muted px-1 py-0.5 rounded">src/components/PromotePropertyDialog.tsx</code> — same change for promotion payments.</li>
                  <li><strong>Remove</strong> the manual reference input UI; keep it only as a fallback ("Pay manually instead").</li>
                  <li>Add a phone-number field for the Mobile Money wallet (pre-filled from profile).</li>
                </ul>
                <p className="mt-2">Example call:</p>
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`const { data, error } = await supabase.functions.invoke("initiate-payment", {
  body: {
    type: "verification",         // or "promotion"
    requestId: verReq.id,
    amount: feeUsd,
    currency: "USD",              // or "LRD"
    phone: profile.phone,
    provider: "mobile_money",
  },
});
if (data?.redirect_url) window.location.href = data.redirect_url;`}
                </pre>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-6">
              <AccordionTrigger className="text-sm font-semibold">Step 6 — Admin UI changes</AccordionTrigger>
              <AccordionContent className="space-y-2 text-muted-foreground">
                <ul className="list-disc list-inside space-y-1">
                  <li><code className="text-xs bg-muted px-1 py-0.5 rounded">src/components/admin/AdminVerifications.tsx</code> — the manual "Confirm Payment" button stays but becomes a <strong>fallback</strong>. Add a column showing <code className="text-xs bg-muted px-1 py-0.5 rounded">provider_tx_id</code> + auto-confirmed badge.</li>
                  <li><code className="text-xs bg-muted px-1 py-0.5 rounded">src/components/admin/AdminPromotions.tsx</code> — same.</li>
                  <li>No need to remove existing manual flow — keep it for users with no Mobile Money account.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-7">
              <AccordionTrigger className="text-sm font-semibold">Step 7 — Register webhook & test in sandbox</AccordionTrigger>
              <AccordionContent className="space-y-2 text-muted-foreground">
                <ol className="list-decimal list-inside space-y-1">
                  <li>In the Flutterwave dashboard, set webhook URL to:<br/>
                    <code className="text-xs bg-muted px-1 py-0.5 rounded break-all">https://sijxsadlinayqxdxkmcr.supabase.co/functions/v1/payment-webhook</code>
                  </li>
                  <li>Copy the "Secret Hash" → save as <code className="text-xs bg-muted px-1 py-0.5 rounded">FLW_WEBHOOK_HASH</code> secret.</li>
                  <li>Use Flutterwave sandbox keys first. Test with their test wallet numbers.</li>
                  <li>Watch logs at the Supabase Edge Function logs page during a test payment.</li>
                  <li>Only after a successful sandbox flow, swap to live keys.</li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-8">
              <AccordionTrigger className="text-sm font-semibold">Step 8 — Go-live checklist</AccordionTrigger>
              <AccordionContent className="space-y-1 text-muted-foreground">
                <ul className="list-disc list-inside space-y-1">
                  <li>Switch <code className="text-xs bg-muted px-1 py-0.5 rounded">FLW_SECRET_KEY</code> + <code className="text-xs bg-muted px-1 py-0.5 rounded">FLW_PUBLIC_KEY</code> to live values.</li>
                  <li>Update webhook hash to live value.</li>
                  <li>Run one real low-amount test payment.</li>
                  <li>Confirm: notification arrives + verification auto-approves + property re-activates.</li>
                  <li>Keep manual flow available for 30 days as backup.</li>
                  <li>Monitor Edge Function logs daily for the first week.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-9">
              <AccordionTrigger className="text-sm font-semibold">Step 9 — What to tell Lovable (copy-paste prompts)</AccordionTrigger>
              <AccordionContent className="space-y-2 text-muted-foreground">
                <p className="font-semibold text-foreground">Prompt 1:</p>
                <pre className="text-xs bg-muted p-3 rounded whitespace-pre-wrap">
{`Add the following secrets: FLW_SECRET_KEY, FLW_PUBLIC_KEY, FLW_WEBHOOK_HASH.`}
                </pre>
                <p className="font-semibold text-foreground">Prompt 2:</p>
                <pre className="text-xs bg-muted p-3 rounded whitespace-pre-wrap">
{`Create a migration that adds provider_tx_id (text), provider_status (text),
provider_webhook_payload (jsonb) to verification_requests and promotion_requests,
with matching indexes on provider_tx_id.`}
                </pre>
                <p className="font-semibold text-foreground">Prompt 3:</p>
                <pre className="text-xs bg-muted p-3 rounded whitespace-pre-wrap">
{`Create two edge functions:
1) initiate-payment — authenticated, takes {type, requestId, amount, currency, phone},
   calls Flutterwave /v3/charges mobile_money_franco, saves provider_tx_id, returns redirect_url.
2) payment-webhook — public (verify_jwt=false), validates verif-hash header against FLW_WEBHOOK_HASH,
   on successful charge updates the matching verification_requests or promotion_requests row to
   approved/active using the same expiry logic as process-verification, and inserts a notification.`}
                </pre>
                <p className="font-semibold text-foreground">Prompt 4:</p>
                <pre className="text-xs bg-muted p-3 rounded whitespace-pre-wrap">
{`In src/pages/Verification.tsx and src/components/PromotePropertyDialog.tsx,
add a "Pay with Mobile Money" button that invokes initiate-payment and redirects
to data.redirect_url. Keep manual reference input as a collapsible fallback.`}
                </pre>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20 mt-4">
            <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-muted-foreground">
              <strong className="text-foreground">Rollback plan:</strong> the manual payment flow stays in the codebase.
              If the API integration breaks, set a feature flag in <code className="text-xs bg-muted px-1 py-0.5 rounded">platform_settings</code>
              (key: <code className="text-xs bg-muted px-1 py-0.5 rounded">payment_mode</code>, value: <code className="text-xs bg-muted px-1 py-0.5 rounded">manual</code>) to hide the Pay Now button instantly without a redeploy.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
