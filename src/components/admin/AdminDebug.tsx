/**
 * ============================================================
 *  ADMIN DEBUG TAB
 * ============================================================
 *  An embedded version of the debug console — lives inside the
 *  admin portal instead of as a floating overlay. Shows the
 *  live in-memory log (info / success / warn / error / network)
 *  recorded by src/lib/debug.ts, with filters, copy-to-report
 *  and clear buttons.
 *
 *  HOW TO USE WHEN AN ERROR HAPPENS IN THE APP:
 *  1. Reproduce the bug (open the page, click the button…).
 *  2. Come to Admin → Debug Console.
 *  3. Click "Issues" to filter only errors/warnings.
 *  4. Click "Copy report" and paste it into chat with Lovable.
 * ============================================================
 */
import { useEffect, useState } from "react";
import { Bug, Copy, Trash2, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  getEntries,
  subscribe,
  clearEntries,
  buildReport,
  log,
  type LogEntry,
  type LogLevel,
} from "@/lib/debug";

const LEVEL_STYLES: Record<LogLevel, string> = {
  info: "text-blue-500",
  success: "text-green-500",
  warn: "text-yellow-500",
  error: "text-red-500",
  network: "text-purple-500",
};

const LEVEL_EMOJI: Record<LogLevel, string> = {
  info: "🔵",
  success: "✅",
  warn: "⚠️",
  error: "❌",
  network: "🌐",
};

export function AdminDebug() {
  const [items, setItems] = useState<LogEntry[]>(getEntries());
  const [filter, setFilter] = useState<"all" | "issues" | "network">("all");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsub = subscribe(() => setItems(getEntries()));
    return () => {
      unsub();
    };
  }, []);

  const visible =
    filter === "issues"
      ? items.filter((i) => i.level === "error" || i.level === "warn")
      : filter === "network"
      ? items.filter((i) => i.level === "network")
      : items;
  const ordered = [...visible].reverse();

  const errorCount = items.filter((i) => i.level === "error").length;
  const warnCount = items.filter((i) => i.level === "warn").length;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildReport());
      setCopied(true);
      log.success("Debug report copied from admin");
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      log.error("Could not copy debug report", err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Bug className="h-5 w-5 text-primary" /> Debug Console
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Live event log from the app. Use this to diagnose bugs reported by users.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => setItems(getEntries())}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
          </Button>
          <Button size="sm" variant="outline" onClick={handleCopy}>
            {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
            Copy report
          </Button>
          <Button size="sm" variant="outline" onClick={clearEntries}>
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Total events</p>
          <p className="text-2xl font-bold">{items.length}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Errors</p>
          <p className="text-2xl font-bold text-red-500">{errorCount}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Warnings</p>
          <p className="text-2xl font-bold text-yellow-500">{warnCount}</p>
        </Card>
      </div>

      <div className="flex items-center gap-2">
        {(["all", "issues", "network"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded capitalize ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <Card className="p-2 max-h-[60vh] overflow-y-auto space-y-1 text-xs font-mono">
        {ordered.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No entries to show. Reproduce the bug in another tab, then come back.
          </p>
        ) : (
          ordered.map((e) => (
            <div key={e.id} className="p-2 rounded bg-muted/30 break-words">
              <div className="flex items-start gap-2">
                <span>{LEVEL_EMOJI[e.level]}</span>
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold ${LEVEL_STYLES[e.level]}`}>{e.message}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {new Date(e.timestamp).toLocaleString()} · {e.route}
                  </div>
                  {e.data !== undefined && (
                    <pre className="mt-1 text-[10px] text-muted-foreground whitespace-pre-wrap">
                      {(() => {
                        try {
                          if (e.data instanceof Error)
                            return e.data.message + "\n" + (e.data.stack ?? "");
                          return JSON.stringify(e.data, null, 2);
                        } catch {
                          return String(e.data);
                        }
                      })()}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}

export default AdminDebug;
