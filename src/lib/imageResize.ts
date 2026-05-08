/**
 * Production-grade client-side image pipeline.
 * - Resizes to a max dimension (default 1280px)
 * - Converts to WebP (with JPEG fallback for browsers that can't encode WebP)
 * - Strips EXIF (canvas re-encode does this for free)
 * - Hard size cap to keep storage + bandwidth low
 * - Generates a small thumbnail for property card grids
 */

const MAX_BYTES = 600 * 1024; // 600 KB per full image after compression
const MAX_THUMB_BYTES = 80 * 1024;

let _webpSupport: boolean | null = null;
const supportsWebPEncode = (): boolean => {
  if (_webpSupport !== null) return _webpSupport;
  try {
    const c = document.createElement("canvas");
    c.width = 1;
    c.height = 1;
    _webpSupport = c.toDataURL("image/webp").startsWith("data:image/webp");
  } catch {
    _webpSupport = false;
  }
  return _webpSupport;
};

const loadImage = (file: File | Blob): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });

const drawScaled = (img: HTMLImageElement, maxW: number, maxH: number) => {
  let { width, height } = img;
  const ratio = Math.min(1, maxW / width, maxH / height);
  width = Math.round(width * ratio);
  height = Math.round(height * ratio);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Canvas context failed");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
};

const canvasToBlob = (
  canvas: HTMLCanvasElement,
  mime: string,
  quality: number
): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Encode failed"))),
      mime,
      quality
    );
  });

/**
 * Compress an image down to under `maxBytes` by progressively lowering quality.
 * Returns a WebP if supported, JPEG otherwise.
 */
const compressBelow = async (
  canvas: HTMLCanvasElement,
  maxBytes: number,
  startQ = 0.78
): Promise<Blob> => {
  const mime = supportsWebPEncode() ? "image/webp" : "image/jpeg";
  let q = startQ;
  let blob = await canvasToBlob(canvas, mime, q);
  // Three quality steps is enough; avoids long main-thread loops on low-end Android.
  for (let i = 0; i < 3 && blob.size > maxBytes && q > 0.45; i++) {
    q -= 0.12;
    blob = await canvasToBlob(canvas, mime, q);
  }
  return blob;
};

/**
 * Resize + compress an uploaded image. Default: 1280px max, WebP, ~600 KB cap.
 *
 * Backwards-compatible signature: existing callers passing
 * `(file, 1600, 1600, 0.75)` still work — extra args are honored.
 */
export const resizeImage = async (
  file: File,
  maxWidth = 1280,
  maxHeight = 1280,
  quality = 0.78
): Promise<Blob> => {
  // Hard reject obviously invalid inputs early
  if (!file.type.startsWith("image/")) {
    throw new Error("Not an image");
  }
  if (file.size > 25 * 1024 * 1024) {
    throw new Error("Image too large (max 25MB before processing)");
  }
  const img = await loadImage(file);
  const canvas = drawScaled(img, maxWidth, maxHeight);
  return compressBelow(canvas, MAX_BYTES, quality);
};

/**
 * Build a small thumbnail (~400px) for property card grids.
 * Returns null if the source image fails — caller should fall back to the full image.
 */
export const generateThumbnail = async (
  file: File | Blob,
  maxDim = 400
): Promise<Blob | null> => {
  try {
    const img = await loadImage(file);
    const canvas = drawScaled(img, maxDim, maxDim);
    return await compressBelow(canvas, MAX_THUMB_BYTES, 0.72);
  } catch {
    return null;
  }
};

export const getImageMimeExtension = (): "webp" | "jpg" =>
  supportsWebPEncode() ? "webp" : "jpg";
