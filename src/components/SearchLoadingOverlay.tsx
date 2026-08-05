import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import lpropLogo from "@/assets/lprop-logo.png";

interface Props {
  query?: string;
  /** Results are ready — the ring races to 100% then the overlay closes. */
  done?: boolean;
  onDone?: () => void;
  onCancel?: () => void;
}

const SIZE = 132;
const STROKE = 5;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

const SearchLoadingOverlay = ({ query, done, onDone, onCancel }: Props) => {
  const [progress, setProgress] = useState(6);
  const raf = useRef<number | null>(null);
  const finishedRef = useRef(false);

  // Creep toward 88% while waiting.
  useEffect(() => {
    if (done) return;
    const id = window.setInterval(() => {
      setProgress((p) => (p >= 88 ? p : p + Math.max(0.6, (88 - p) * 0.08)));
    }, 60);
    return () => window.clearInterval(id);
  }, [done]);

  // Complete the circle, then close.
  useEffect(() => {
    if (!done) return;
    setProgress(100);
    const t = window.setTimeout(() => {
      if (!finishedRef.current) {
        finishedRef.current = true;
        onDone?.();
      }
    }, 420);
    return () => window.clearTimeout(t);
  }, [done, onDone]);

  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/60 backdrop-blur-xl animate-fade-in"
      role="status"
      aria-live="polite"
    >
      {onCancel && (
        <button
          onClick={onCancel}
          aria-label="Cancel search"
          className="absolute top-4 right-4 h-10 w-10 rounded-full bg-card/80 border border-border flex items-center justify-center hover:bg-card transition-colors"
        >
          <X className="h-5 w-5 text-foreground" />
        </button>
      )}

      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            strokeWidth={STROKE}
            className="stroke-muted"
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            strokeWidth={STROKE}
            strokeLinecap="round"
            className="stroke-primary"
            strokeDasharray={C}
            strokeDashoffset={C - (C * progress) / 100}
            style={{ transition: "stroke-dashoffset 300ms ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <img
            src={lpropLogo}
            alt="L-Prop"
            className="h-16 w-16 rounded-2xl shadow-xl"
          />
        </div>
      </div>

      <p className="mt-5 text-sm font-semibold text-foreground text-center px-6 max-w-xs truncate">
        {query ? `Searching "${query}"` : "Loading results"}
      </p>
      <p className="mt-1 text-xs text-muted-foreground tabular-nums">{Math.round(progress)}%</p>
    </div>
  );
};

export default SearchLoadingOverlay;
