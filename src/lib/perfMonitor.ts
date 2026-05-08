/**
 * Lightweight production performance monitor.
 * Logs slow Supabase queries, slow image loads, and slow route transitions
 * to console.warn. Sampled to avoid log spam on real users.
 *
 * Zero-cost on hot paths — feature-flagged off in dev unless explicitly enabled.
 */

const SAMPLE_RATE = 0.05; // 5%
const SLOW_QUERY_MS = 800;
const SLOW_IMAGE_MS = 2000;
const SLOW_ROUTE_MS = 1000;

const enabled =
  typeof window !== "undefined" &&
  (import.meta.env?.PROD || (window as any).__PERF_DEBUG__ === true);

const sampled = () => enabled && Math.random() < SAMPLE_RATE;

export const trackQuery = async <T>(
  name: string,
  promise: Promise<T>
): Promise<T> => {
  if (!sampled()) return promise;
  const start = performance.now();
  try {
    const out = await promise;
    const dur = performance.now() - start;
    if (dur > SLOW_QUERY_MS) {
      console.warn(`[perf] slow query "${name}" took ${Math.round(dur)}ms`);
    }
    return out;
  } catch (err) {
    const dur = performance.now() - start;
    console.warn(`[perf] failed query "${name}" after ${Math.round(dur)}ms`, err);
    throw err;
  }
};

export const trackRoute = (path: string) => {
  if (!sampled()) return;
  const start = performance.now();
  // Measure after paint
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const dur = performance.now() - start;
      if (dur > SLOW_ROUTE_MS) {
        console.warn(`[perf] slow route ${path}: ${Math.round(dur)}ms`);
      }
    });
  });
};

/** Attach to <img onLoad>; warns if the image took too long after mount. */
export const observeImagePerf = (url: string, mountedAt: number) => {
  if (!sampled()) return;
  const dur = performance.now() - mountedAt;
  if (dur > SLOW_IMAGE_MS) {
    console.warn(`[perf] slow image ${url.slice(0, 80)}: ${Math.round(dur)}ms`);
  }
};
