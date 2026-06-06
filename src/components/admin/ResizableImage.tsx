import Image from "@tiptap/extension-image";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import { useEffect, useRef, useState } from "react";

/**
 * Resizable + draggable image node for TipTap.
 * - Click image to select (blue outline appears)
 * - Drag any of 4 corner handles to resize (mouse + touch)
 * - Drag the image body to move it elsewhere in the document
 */
function ResizableImageNodeView({
  node,
  updateAttributes,
  selected,
  editor,
  getPos,
}: NodeViewProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const wrapRef = useRef<HTMLSpanElement | null>(null);
  const [resizing, setResizing] = useState(false);

  const src: string = node.attrs.src;
  const alt: string = node.attrs.alt ?? "";
  const title: string = node.attrs.title ?? "";
  const width: string | number | null = node.attrs.width;
  const style: string = node.attrs.style ?? "";

  // Click selects this node so the toolbar buttons work.
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof getPos === "function") {
      editor.commands.setNodeSelection(getPos());
    }
  };

  // Generic pointer-based resize from any corner.
  const startResize = (
    e: React.PointerEvent,
    corner: "br" | "bl" | "tr" | "tl"
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const img = imgRef.current;
    if (!img) return;

    const startX = e.clientX;
    const startW = img.getBoundingClientRect().width;
    const xSign = corner === "br" || corner === "tr" ? 1 : -1;

    setResizing(true);

    const onMove = (ev: PointerEvent) => {
      const delta = (ev.clientX - startX) * xSign;
      const next = Math.max(60, Math.round(startW + delta));
      img.style.width = `${next}px`;
      img.style.height = "auto";
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      setResizing(false);
      const finalW = imgRef.current?.getBoundingClientRect().width;
      if (finalW) {
        updateAttributes({
          width: Math.round(finalW),
          style: `width: ${Math.round(finalW)}px; height: auto;`,
        });
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  // Make the wrapper draggable so the user can move the image with mouse/touch.
  useEffect(() => {
    // No-op — Tiptap handles drag via draggable: true on the extension.
  }, []);

  const handleStyle: React.CSSProperties = {
    position: "absolute",
    width: 14,
    height: 14,
    background: "#3b82f6",
    border: "2px solid #fff",
    borderRadius: 9999,
    boxShadow: "0 1px 2px rgba(0,0,0,0.4)",
    zIndex: 5,
    touchAction: "none",
  };

  return (
    <NodeViewWrapper
      as="span"
      ref={wrapRef as never}
      data-drag-handle
      draggable="true"
      className="resizable-image-wrapper"
      style={{
        display: "inline-block",
        position: "relative",
        lineHeight: 0,
        maxWidth: "100%",
        outline: selected || resizing ? "2px solid #3b82f6" : "2px solid transparent",
        outlineOffset: 2,
        borderRadius: 8,
        cursor: "move",
        // Carry over inline style (float / margin etc.) from node.attrs.style
      }}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        title={title}
        onClick={handleClick}
        draggable={false}
        style={{
          display: "block",
          maxWidth: "100%",
          height: "auto",
          borderRadius: 8,
          width: width ? `${width}px` : undefined,
          // Inline style string (e.g. float/margin from align buttons)
          ...parseStyleString(style),
        }}
      />

      {selected && (
        <>
          <span
            onPointerDown={(e) => startResize(e, "tl")}
            style={{ ...handleStyle, top: -7, left: -7, cursor: "nwse-resize" }}
          />
          <span
            onPointerDown={(e) => startResize(e, "tr")}
            style={{ ...handleStyle, top: -7, right: -7, cursor: "nesw-resize" }}
          />
          <span
            onPointerDown={(e) => startResize(e, "bl")}
            style={{ ...handleStyle, bottom: -7, left: -7, cursor: "nesw-resize" }}
          />
          <span
            onPointerDown={(e) => startResize(e, "br")}
            style={{ ...handleStyle, bottom: -7, right: -7, cursor: "nwse-resize" }}
          />
        </>
      )}
    </NodeViewWrapper>
  );
}

// Minimal "style string" -> object parser for the few props we set
// (float, margin, display, width, max-width, height).
function parseStyleString(s: string): React.CSSProperties {
  const out: Record<string, string> = {};
  if (!s) return out;
  s.split(";").forEach((decl) => {
    const [rawKey, ...rest] = decl.split(":");
    if (!rawKey || rest.length === 0) return;
    const key = rawKey
      .trim()
      .replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    out[key] = rest.join(":").trim();
  });
  return out as React.CSSProperties;
}

export const ResizableImage = Image.extend({
  name: "image",
  draggable: true,
  selectable: true,
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el) => el.getAttribute("width"),
        renderHTML: (attrs) =>
          attrs.width ? { width: attrs.width } : {},
      },
      style: {
        default: null,
        parseHTML: (el) => el.getAttribute("style"),
        renderHTML: (attrs) => (attrs.style ? { style: attrs.style } : {}),
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageNodeView);
  },
});
