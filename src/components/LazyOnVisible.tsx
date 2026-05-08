import { ReactNode, useEffect, useRef, useState } from "react";

interface LazyOnVisibleProps {
  children: ReactNode;
  /** Pixel margin to start loading before entering viewport */
  rootMargin?: string;
  /** Min height while collapsed to prevent CLS */
  minHeight?: number | string;
  /** Render even if IntersectionObserver is unavailable */
  fallback?: ReactNode;
  className?: string;
}

/**
 * Defers rendering of expensive children (charts, recommendation lists, etc.)
 * until the placeholder scrolls within `rootMargin` of the viewport.
 * Once visible it stays mounted — no re-mounting on scroll-out.
 */
export const LazyOnVisible = ({
  children,
  rootMargin = "300px",
  minHeight = 200,
  fallback = null,
  className,
}: LazyOnVisibleProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(
    typeof IntersectionObserver === "undefined"
  );

  useEffect(() => {
    if (visible || !ref.current || typeof IntersectionObserver === "undefined") {
      return;
    }
    const el = ref.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible, rootMargin]);

  return (
    <div
      ref={ref}
      className={className}
      style={!visible ? { minHeight } : undefined}
    >
      {visible ? children : fallback}
    </div>
  );
};

export default LazyOnVisible;
