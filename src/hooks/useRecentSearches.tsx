import { useCallback, useEffect, useState } from "react";

const KEY = "recent_searches_v1";
const MAX = 6;

export function useRecentSearches() {
  const [recents, setRecents] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setRecents(arr.filter((s) => typeof s === "string").slice(0, MAX));
      }
    } catch {}
  }, []);

  const persist = (arr: string[]) => {
    setRecents(arr);
    try { localStorage.setItem(KEY, JSON.stringify(arr)); } catch {}
  };

  const addRecent = useCallback((term: string) => {
    const t = term.trim();
    if (!t || t.length > 80) return;
    setRecents((prev) => {
      const next = [t, ...prev.filter((s) => s.toLowerCase() !== t.toLowerCase())].slice(0, MAX);
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const removeRecent = useCallback((term: string) => {
    setRecents((prev) => {
      const next = prev.filter((s) => s !== term);
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const clearRecents = useCallback(() => persist([]), []);

  return { recents, addRecent, removeRecent, clearRecents };
}
