/**
 * ============================================================
 *  DEBUG PANEL  —  the floating window you open when stuck
 * ============================================================
 *
 *  HOW TO OPEN:
 *  ------------
 *    Press   Ctrl + Shift + D   on a keyboard.
 *    On a phone, tap the small 🐞 dot at the bottom-right.
 *
 *  WHAT YOU SEE:
 *  -------------
 *    - A live list of everything that happened in the app
 *      (clicks, API calls, errors), newest at the top.
 *    - Filter buttons (All / Errors only) to narrow it down.
 *    - "Copy report" → puts everything on your clipboard so
 *      you can paste it into a chat with Lovable / a dev.
 *    - "Clear" → wipes the list (handy before reproducing
 *      a bug, so the list only shows what's relevant).
 *
 *  THIS PANEL IS SAFE IN PRODUCTION — it only shows data
 *  that already lives in the user's own browser. It never
 *  sends anything anywhere on its own.
 * ============================================================
 */

import { useEffect, useState } from "react";
import { Bug, X, Copy, Trash2, Check } from "lucide-react";
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
  info: "text-blue-400",
  success: "text-green-400",
  warn: "text-yellow-400",
  error: "text-red-400",
  network: "text-purple-400",
};

const LEVEL_EMOJI: Record<LogLevel, string> = {
  info: "🔵",
  success: "✅",
  warn: "⚠️",
  error: "❌",
  network: "🌐",
};

export const DebugPanel = () => {
  // Whether the panel is currently open on screen.
  const [open, setOpen] = useState(false);
  // The list of log entries (kept in sync with src/lib/debug.ts).
  const [items, setItems] = useState<LogEntry[]>(getEntries());
  // Current filter: show all entries or just errors/warnings.
  const [filter, setFilter] = useState<"all" | "issues">("all");
  // Briefly flips to true after pressing "Copy report" so we can
  // show a tick icon for visual feedback.
  const [copied, setCopied] = useState(false);

  // Subscribe to the log store so the panel updates in real time.
  useEffect(() => {
    // subscribe() returns an unsubscribe function — call it on cleanup
    // (the wrapper ensures we return void, which useEffect requires).
    const unsub = subscribe(() => setItems(getEntries()));
    return () => {
      unsub();
    };
  }, []);

  // Keyboard shortcut: Ctrl + Shift + D toggles the panel.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "D" || e.key === "d")) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Apply the filter before rendering.
  const visible =
    filter === "issues"
      ? items.filter((i) => i.level === "error" || i.level === "warn")
      : items;
  // We show newest first so the most recent events are easy to spot.
  const ordered = [...visible].reverse();

  // Copy the full report to clipboard and show feedback.
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildReport());
      setCopied(true);
      log.success("Debug report copied to clipboard");
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      log.error("Could not copy debug report", err);
    }
  };

  return (
    <>
      {/* The little floating bug button (always present). Tap to open. */}
      <button
        type="button"
        aria-label="Open debug panel"
        onClick={() => setOpen(true)}
        className="fixed bottom-2 right-2 z-[9998] h-8 w-8 rounded-full bg-foreground/10 hover:bg-foreground/20 flex items-center justify-center text-foreground/60 hover:text-foreground transition-colors backdrop-blur-sm"
        title="Open debug panel (Ctrl+Shift+D)"
      >
        <Bug className="h-4 w-4" />
      </button>

      {/* The panel itself — only rendered when open. */}
      {open && (
        <div
          className="fixed inset-x-2 bottom-2 z-[9999] max-h-[70vh] rounded-lg border border-border bg-background/95 backdrop-blur-md shadow-2xl flex flex-col md:left-auto md:right-4 md:w-[480px]"
          role="dialog"
          aria-label="Debug panel"
        >
          {/* Header: title + filter buttons + copy / clear / close */}
          <div className="flex items-center justify-between gap-2 p-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Bug className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Debug ({items.length})</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`text-xs px-2 py-1 rounded ${
                  filter === "all" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilter("issues")}
                className={`text-xs px-2 py-1 rounded ${
                  filter === "issues" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                Issues
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs px-2 py-1 rounded hover:bg-muted flex items-center gap-1"
                title="Copy full report"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                Copy
              </button>
              <button
                type="button"
                onClick={clearEntries}
                className="text-xs px-2 py-1 rounded hover:bg-muted flex items-center gap-1"
                title="Clear all entries"
              >
                <Trash2 className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs px-2 py-1 rounded hover:bg-muted"
                aria-label="Close debug panel"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Body: the scrollable list of log entries */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs font-mono">
            {ordered.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">
                No entries yet. Use the app and events will appear here.
              </p>
            ) : (
              ordered.map((e) => (
                <div
                  key={e.id}
                  className="p-2 rounded bg-muted/30 break-words"
                >
                  <div className="flex items-start gap-2">
                    <span>{LEVEL_EMOJI[e.level]}</span>
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold ${LEVEL_STYLES[e.level]}`}>
                        {e.message}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {new Date(e.timestamp).toLocaleTimeString()} · {e.route}
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
          </div>

          {/* Footer hint */}
          <div className="p-2 border-t border-border text-[10px] text-muted-foreground text-center">
            Shortcut: Ctrl + Shift + D
          </div>
        </div>
      )}
    </>
  );
};

export default DebugPanel;
