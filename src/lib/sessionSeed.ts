// Per-session shuffle seed. Rotates every 24h so each visit sees a fresh
// but internally stable random order — pagination never repeats or skips rows.
const KEY = "lprop_shuffle_seed";
const TTL_MS = 24 * 60 * 60 * 1000;

type Stored = { seed: string; createdAt: number };

function generate(): string {
  return (
    Math.random().toString(36).slice(2, 10) +
    Date.now().toString(36)
  );
}

export function getSessionSeed(): string {
  if (typeof window === "undefined") return "server";
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Stored;
      if (parsed?.seed && Date.now() - parsed.createdAt < TTL_MS) {
        return parsed.seed;
      }
    }
  } catch {
    // ignore
  }
  const seed = generate();
  try {
    window.sessionStorage.setItem(
      KEY,
      JSON.stringify({ seed, createdAt: Date.now() } satisfies Stored)
    );
  } catch {
    // ignore storage errors (private mode, quota)
  }
  return seed;
}
