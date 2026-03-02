"use client";

/**
 * YjsEditorContext compatibility layer.
 *
 * The original Liveblocks/Yjs-based context has been replaced by the Zustand-backed
 * ComposerProvider. This module re-exports the items that other files still import
 * by name from "./YjsEditorContext":
 *
 * - `elementClipboard` — module-level clipboard for copy/paste
 * - `useHoveredId`     — lightweight hovered-element tracking (module-level ref)
 * - `setHoveredId`     — setter for the hovered element
 * - `useYjsEditor`     — alias for `useComposer()` (EditorCanvas still imports this)
 */

import { useSyncExternalStore, useCallback } from "react";
import { useComposer } from "@/app/editor/provider/ComposerProvider";
import {
  elementClipboard,
  setHoveredId,
  getHoveredId,
  subscribeHoveredId,
} from "./editor-clipboard";

// ─── Re-exports ──────────────────────────────────────────────────────────────

export { elementClipboard, setHoveredId };

// ─── useHoveredId hook ───────────────────────────────────────────────────────

export function useHoveredId(): string | null {
  const subscribe = useCallback((cb: () => void) => {
    return subscribeHoveredId(cb);
  }, []);

  const getSnapshot = useCallback(() => {
    return getHoveredId();
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

// ─── useYjsEditor (alias for useComposer) ───────────────────────────────────

export function useYjsEditor() {
  return useComposer();
}
