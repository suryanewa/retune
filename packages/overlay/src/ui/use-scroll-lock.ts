/**
 * useScrollLock — locks page scroll when a floating UI (dropdown, picker, dialog) is open.
 * Uses a module-level ref counter so nested opens (e.g. color picker inside a dropdown)
 * don't prematurely unlock.
 *
 * Compensates for scrollbar removal by adding padding-right equal to the
 * scrollbar width. Without this, removing the scrollbar (overflow: hidden)
 * causes the page content to shift right on platforms with visible scrollbars
 * (Windows, Linux, Edge on macOS with classic scrollbars).
 */

import { useEffect } from "react";

let lockCount = 0;
let savedOverflow = "";
let savedPaddingRight = "";

export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;

    if (lockCount === 0) {
      const html = document.documentElement;
      const scrollbarWidth = window.innerWidth - html.clientWidth;
      savedOverflow = html.style.overflow;
      savedPaddingRight = html.style.paddingRight;
      html.style.overflow = "hidden";
      if (scrollbarWidth > 0) {
        html.style.paddingRight = `${scrollbarWidth}px`;
      }
    }
    lockCount++;

    return () => {
      lockCount--;
      if (lockCount === 0) {
        const html = document.documentElement;
        html.style.overflow = savedOverflow;
        html.style.paddingRight = savedPaddingRight;
      }
    };
  }, [active]);
}
