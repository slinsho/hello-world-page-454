import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import SearchLoadingOverlay from "@/components/SearchLoadingOverlay";

type Ctx = {
  /** Show the branded overlay while a search/filter result is being fetched. */
  start: (label?: string) => void;
  /** Mark the pending results as ready — the ring completes then the overlay fades. */
  finish: () => void;
  /** Hide immediately (user cancelled). */
  cancel: () => void;
  active: boolean;
};

const SearchOverlayContext = createContext<Ctx>({
  start: () => {},
  finish: () => {},
  cancel: () => {},
  active: false,
});

export const useSearchOverlay = () => useContext(SearchOverlayContext);

export const SearchOverlayProvider = ({ children }: { children: React.ReactNode }) => {
  const [active, setActive] = useState(false);
  const [done, setDone] = useState(false);
  const [label, setLabel] = useState<string | undefined>(undefined);
  const safety = useRef<number | null>(null);

  const clearSafety = () => {
    if (safety.current !== null) {
      window.clearTimeout(safety.current);
      safety.current = null;
    }
  };

  const cancel = useCallback(() => {
    clearSafety();
    setActive(false);
    setDone(false);
  }, []);

  const finish = useCallback(() => {
    setActive((a) => {
      if (a) setDone(true);
      return a;
    });
  }, []);

  const start = useCallback((l?: string) => {
    clearSafety();
    setLabel(l);
    setDone(false);
    setActive(true);
    // Never trap the user: auto-complete after 8s.
    safety.current = window.setTimeout(() => setDone(true), 8000);
  }, []);

  const value = useMemo(() => ({ start, finish, cancel, active }), [start, finish, cancel, active]);

  return (
    <SearchOverlayContext.Provider value={value}>
      {children}
      {active && (
        <SearchLoadingOverlay
          query={label}
          done={done}
          onDone={() => {
            clearSafety();
            setActive(false);
            setDone(false);
          }}
          onCancel={cancel}
        />
      )}
    </SearchOverlayContext.Provider>
  );
};
