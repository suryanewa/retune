/**
 * PanelBanner — reusable blue banner with copy button + dismiss.
 * Used for update notifications and manifest prompts.
 */

import { useState, useCallback } from "react";
import { AnimatedCopyIcon } from "./AnimatedCopyIcon";

interface PanelBannerProps {
  title: string;
  body: string;
  copyLabel: string;
  copiedLabel: string;
  copyText: string;
  tone?: "blue" | "brand";
  /** Auto-revert copied state after this many ms. 0 = don't revert. */
  revertAfter?: number;
  onDismiss?: () => void;
  onCopy?: () => void;
  visible: boolean;
}

export function PanelBanner({
  title,
  body,
  copyLabel,
  copiedLabel,
  copyText,
  tone = "blue",
  revertAfter = 0,
  onDismiss,
  onCopy,
  visible,
}: PanelBannerProps) {
  const [copied, setCopied] = useState(false);
  const [copyHovered, setCopyHovered] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const handleCopy = useCallback(() => {
    if (copied) return;
    navigator.clipboard.writeText(copyText);
    setCopied(true);
    onCopy?.();
    if (revertAfter > 0) {
      setTimeout(() => {
        setCopied(false);
      }, revertAfter);
    }
  }, [copied, copyText, onCopy, revertAfter]);

  if (!visible || dismissed) return null;

  const ease = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";
  const crossfade = "cubic-bezier(0.215, 0.61, 0.355, 1)";
  const background = tone === "brand" ? "var(--tuna-brand)" : "var(--tuna-blue)";
  const foreground = "var(--tuna-white)";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: dismissing ? "0fr" : "1fr",
        opacity: dismissing ? 0 : 1,
        transition: `grid-template-rows 150ms ${ease}, opacity 150ms ${ease}`,
      }}
      onTransitionEnd={(e) => {
        if (e.propertyName === "opacity" && dismissing) {
          setDismissed(true);
          setDismissing(false);
          onDismiss?.();
        }
      }}
    >
      <div style={{ overflow: "hidden", minHeight: 0 }}>
        <div
          style={{
            padding: "12px 16px",
            background,
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            transform: dismissing ? "translateY(-4px)" : "translateY(0)",
            transition: `transform 150ms ${ease}`,
          }}
        >
          <div style={{
            fontFamily: "inherit", fontSize: "12px", fontWeight: 600,
            lineHeight: "16px", letterSpacing: "-0.06px", color: foreground,
          }}>
            {title}
          </div>
          {body && (
            <div style={{
              fontFamily: "inherit", fontSize: "11px", lineHeight: "16px",
              color: foreground, opacity: 0.85,
            }}>
              {body}
            </div>
          )}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              onClick={handleCopy}
              style={{
                background: "var(--tuna-white)",
                border: "none",
                borderRadius: "6px",
                padding: "6px 8px 6px 4px",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "11px",
                fontWeight: 500,
                lineHeight: "16px",
                letterSpacing: "-0.055px",
                color: "var(--tuna-always-black)",
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                overflow: "visible",
                flexShrink: 0,
                transition: "transform 100ms ease",
              }}
              onPointerDown={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.97)"; }}
              onPointerUp={(e) => { (e.currentTarget as HTMLElement).style.transform = ""; }}
              onPointerLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ""; setCopyHovered(false); }}
              onMouseEnter={() => setCopyHovered(true)}
              onMouseLeave={() => setCopyHovered(false)}
            >
              <AnimatedCopyIcon copied={copied} hovered={copyHovered} size={16} />
              <span
                style={{
                  position: "relative",
                  display: "inline-grid",
                  alignItems: "center",
                  height: 16,
                  lineHeight: "16px",
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ visibility: "hidden", gridArea: "1 / 1", lineHeight: "16px" }}>
                  {copied ? copiedLabel : copyLabel}
                </span>
                <span style={{
                  position: "absolute",
                  inset: 0,
                  display: "block",
                  lineHeight: "16px",
                  opacity: copied ? 0 : 1,
                  filter: copied ? "blur(2px)" : "blur(0)",
                  transition: `opacity 200ms ${crossfade}, filter 200ms ${crossfade}`,
                }}>
                  {copyLabel}
                </span>
                <span style={{
                  position: "absolute",
                  inset: 0,
                  display: "block",
                  lineHeight: "16px",
                  opacity: copied ? 1 : 0,
                  filter: copied ? "blur(0)" : "blur(2px)",
                  transition: `opacity 200ms ${crossfade}, filter 200ms ${crossfade}`,
                }}>
                  {copiedLabel}
                </span>
              </span>
            </button>
            {/* Maybe later */}
            <button
              onClick={() => setDismissing(true)}
              style={{
                background: "none",
                border: "none",
                borderRadius: "6px",
                padding: "6px 8px",
                cursor: copied ? "default" : "pointer",
                fontFamily: "inherit",
                fontSize: "11px",
                fontWeight: 500,
                lineHeight: "16px",
                letterSpacing: "-0.055px",
                color: foreground,
                whiteSpace: "nowrap",
                opacity: copied ? 0 : 0.9,
                filter: copied ? "blur(2px)" : "blur(0)",
                pointerEvents: copied ? "none" : "auto",
                transition: `opacity 200ms ${crossfade}, filter 200ms ${crossfade}`,
              }}
              onMouseEnter={(e) => { if (!copied) (e.currentTarget as HTMLElement).style.opacity = "1"; }}
              onMouseLeave={(e) => { if (!copied) (e.currentTarget as HTMLElement).style.opacity = "0.9"; }}
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
