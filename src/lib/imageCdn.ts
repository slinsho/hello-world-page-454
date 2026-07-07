/**
 * Supabase Storage image transformation helpers.
 *
 * Supabase serves objects at:
 *   /storage/v1/object/public/<bucket>/<path>
 * and offers on-the-fly resizing at:
 *   /storage/v1/render/image/public/<bucket>/<path>?width=W&quality=Q&resize=cover
 *
 * We rewrite public URLs to the render endpoint so property cards can request
 * a right-sized WebP thumbnail instead of the full 1280px original. This is
 * the single biggest LCP + bandwidth win on the home / explore / near-me
 * grids on slow mobile connections.
 *
 * Non-Supabase URLs (external images, blob:, data:) are returned unchanged.
 */

const OBJECT_PATH = "/storage/v1/object/public/";
const RENDER_PATH = "/storage/v1/render/image/public/";

export interface TransformOptions {
  width?: number;
  height?: number;
  quality?: number; // 20-100, defaults to 70
  resize?: "cover" | "contain" | "fill";
}

/**
 * Rewrite a Supabase public storage URL to the image render endpoint.
 * Safe to call on any string — non-storage URLs pass through untouched.
 */
export function transformImage(
  url: string | undefined | null,
  opts: TransformOptions = {}
): string {
  if (!url) return "";
  // Never rewrite blob:, data:, or already-signed URLs
  if (!url.includes(OBJECT_PATH)) return url;

  const { width, height, quality = 70, resize = "cover" } = opts;
  const base = url.replace(OBJECT_PATH, RENDER_PATH);
  const params = new URLSearchParams();
  if (width) params.set("width", String(width));
  if (height) params.set("height", String(height));
  params.set("quality", String(quality));
  params.set("resize", resize);
  return `${base}?${params.toString()}`;
}

/**
 * Build a responsive srcSet at 1x/2x for a target CSS width.
 * Use with a matching `sizes` attribute so browsers pick the right variant.
 */
export function transformSrcSet(
  url: string | undefined | null,
  cssWidth: number,
  opts: Omit<TransformOptions, "width"> = {}
): string {
  if (!url || !url.includes(OBJECT_PATH)) return "";
  const w1 = transformImage(url, { ...opts, width: cssWidth });
  const w2 = transformImage(url, { ...opts, width: cssWidth * 2 });
  return `${w1} 1x, ${w2} 2x`;
}
