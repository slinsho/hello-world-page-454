/**
 * ============================================================
 *  DEBUG TOOLKIT  —  read this first if something breaks
 * ============================================================
 *
 *  WHAT THIS FILE DOES (in plain English):
 *  --------------------------------------
 *  This is a "black box recorder" for your app. Every time
 *  something important happens (a click, an error, a database
 *  call), it writes a tiny note in memory. Later you can:
 *
 *    1. See the notes in the floating Debug Panel
 *       (press   Ctrl + Shift + D   anywhere in the app)
 *    2. Copy ALL the notes to your clipboard with one click
 *       and paste them to Lovable / a developer to get help.
 *
 *  WHEN TO USE IT:
 *  ---------------
 *  - The app does something weird? Open the panel, look at the
 *    last few entries — the bug is almost always there.
 *  - You can't figure it out? Click "Copy report" and paste it.
 *
 *  HOW TO ADD A LOG IN YOUR OWN CODE:
 *  ----------------------------------
 *      import { log } from "@/lib/debug";
 *      log.info("user clicked Save");
 *      log.success("property saved", { id: "123" });
 *      log.error("upload failed", error);
 *
 *  Each line you add shows up in the Debug Panel automatically.
 * ============================================================
 */

import { supabase } from "@/integrations/supabase/client";

// The maximum number of notes we keep in memory.
// Older notes are dropped so we don't slow the phone down.
const MAX_ENTRIES = 200;

/**
 * Persist critical errors + warnings to the database so admins can review
 * production crashes from real users in the Admin → Error Logs tab.
 * Fire-and-forget; never blocks the UI, never throws.
 */
const persistedRecently = new Map<string, number>();
const PERSIST_DEDUPE_MS = 60_000;

async function persistToDb(level: LogLevel, message: string, data?: unknown) {
  if (typeof window === "undefined") return;
  if (level !== "error" && level !== "warn") return;
  // Skip noisy expected errors
  if (/AbortError|ResizeObserver|NetworkError when attempting/i.test(message)) return;

  const key = `${level}:${message}`;
  const now = Date.now();
  const last = persistedRecently.get(key);
  if (last && now - last < PERSIST_DEDUPE_MS) return;
  persistedRecently.set(key, now);

  try {
    let stack: string | null = null;
    let context: Record<string, unknown> | null = null;
    if (data instanceof Error) {
      stack = data.stack ?? null;
      context = { name: data.name };
    } else if (data && typeof data === "object") {
      try {
        context = JSON.parse(JSON.stringify(data));
      } catch {
        context = { note: "unserialisable" };
      }
    }
    const { data: auth } = await supabase.auth.getUser();
    await supabase.from("error_logs").insert({
      user_id: auth?.user?.id ?? undefined,
      level,
      message: message.slice(0, 2000),
      stack: stack?.slice(0, 4000) ?? undefined,
      route: window.location.pathname,
      user_agent: navigator.userAgent,
      context: context as any,
    });
  } catch {
    // Never let logging break the app
  }
}

// The "level" of a log entry. Each level gets its own emoji
// so you can scan the panel quickly with your eyes.
export type LogLevel = "info" | "success" | "warn" | "error" | "network";

export interface LogEntry {
  id: string;          // unique id (used by React when listing)
  level: LogLevel;     // info / success / warn / error / network
  message: string;     // the human-readable text
  data?: unknown;      // optional extra info (object, error, etc.)
  timestamp: string;   // when it happened (ISO string)
  route: string;       // which page the user was on
}

// The actual list of notes lives here, in memory only.
// (It is wiped when the user closes / refreshes the tab.)
const entries: LogEntry[] = [];

// A list of functions to call whenever a new entry is added.
// The Debug Panel subscribes so it re-renders in real time.
const listeners = new Set<() => void>();

// Internal helper — adds an entry and tells listeners to refresh.
function push(level: LogLevel, message: string, data?: unknown) {
  const entry: LogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    level,
    message,
    data,
    timestamp: new Date().toISOString(),
    route: typeof window !== "undefined" ? window.location.pathname : "",
  };

  entries.push(entry);
  // Trim old entries so the list never grows unbounded.
  if (entries.length > MAX_ENTRIES) entries.shift();

  // Also mirror to the browser DevTools console with emojis,
  // so developers can use both tools at once.
  const emoji = {
    info: "🔵",
    success: "✅",
    warn: "⚠️",
    error: "❌",
    network: "🌐",
  }[level];
  const fn =
    level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  fn(`${emoji} [debug] ${message}`, data ?? "");

  // Notify the Debug Panel (if open) to re-render.
  listeners.forEach((l) => l());

  // Best-effort DB persistence for errors/warnings (production monitoring).
  void persistToDb(level, message, data);
}

/**
 * Public API — what you actually call from anywhere in the app.
 * Pick the verb that matches what you want to record.
 */
export const log = {
  info: (msg: string, data?: unknown) => push("info", msg, data),
  success: (msg: string, data?: unknown) => push("success", msg, data),
  warn: (msg: string, data?: unknown) => push("warn", msg, data),
  error: (msg: string, data?: unknown) => push("error", msg, data),
  network: (msg: string, data?: unknown) => push("network", msg, data),
};

// Used by the Debug Panel to read the current list.
export const getEntries = () => entries.slice();

// Used by the Debug Panel to subscribe / unsubscribe.
export const subscribe = (fn: () => void): (() => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

// Used by the "Clear" button in the panel.
export const clearEntries = () => {
  entries.length = 0;
  listeners.forEach((l) => l());
};

/**
 * Builds the big text blob you copy with "Copy report".
 * Includes app version, current URL, browser info and the
 * full list of recent log entries — everything a developer
 * needs to understand what happened.
 */
export const buildReport = () => {
  const lines: string[] = [];
  lines.push("=== L-Prop Debug Report ===");
  lines.push(`Time:   ${new Date().toISOString()}`);
  if (typeof window !== "undefined") {
    lines.push(`URL:    ${window.location.href}`);
    lines.push(`UA:     ${navigator.userAgent}`);
    lines.push(`Online: ${navigator.onLine}`);
    lines.push(`Screen: ${window.innerWidth}x${window.innerHeight}`);
  }
  lines.push("");
  lines.push(`--- Last ${entries.length} log entries ---`);
  for (const e of entries) {
    const dataStr = e.data
      ? " " +
        (() => {
          try {
            // Errors don't serialise well — pull out the useful fields.
            if (e.data instanceof Error)
              return JSON.stringify({
                name: e.data.name,
                message: e.data.message,
                stack: e.data.stack,
              });
            return JSON.stringify(e.data);
          } catch {
            return "[unserialisable]";
          }
        })()
      : "";
    lines.push(`[${e.timestamp}] ${e.level.toUpperCase()} (${e.route}) ${e.message}${dataStr}`);
  }
  return lines.join("\n");
};

/**
 * Automatic capture — these listeners run as soon as the file is
 * loaded so we record problems even before the panel is opened.
 */
if (typeof window !== "undefined") {
  // Any uncaught JavaScript error (the red screens of death).
  window.addEventListener("error", (e) => {
    push("error", `Uncaught: ${e.message}`, {
      filename: e.filename,
      line: e.lineno,
      col: e.colno,
    });
  });

  // Any rejected Promise that nobody handled (async errors).
  window.addEventListener("unhandledrejection", (e) => {
    push("error", "Unhandled promise rejection", e.reason);
  });

  // Online / offline state — useful when API calls suddenly fail.
  window.addEventListener("online", () => push("info", "Network: back online"));
  window.addEventListener("offline", () => push("warn", "Network: went offline"));
}
