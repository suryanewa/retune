/**
 * Module-level clipboard for copy/paste operations.
 * Separated into its own module to avoid circular dependencies
 * between ComposerProvider and YjsEditorContext.
 */

// ─── Element Clipboard (module-level, survives re-renders) ───────────────────

export const elementClipboard: {
  rootIds: string[];
  snapshots: Record<string, Record<string, unknown>>;
} = {
  rootIds: [],
  snapshots: {},
};

// ─── Hovered Element ID (module-level for zero-overhead reads) ───────────────

let _hoveredId: string | null = null;
const _hoveredListeners = new Set<() => void>();

function emitHovered() {
  _hoveredListeners.forEach((cb) => cb());
}

export function setHoveredId(id: string | null) {
  if (_hoveredId === id) return;
  _hoveredId = id;
  emitHovered();
}

export function getHoveredId(): string | null {
  return _hoveredId;
}

export function subscribeHoveredId(cb: () => void): () => void {
  _hoveredListeners.add(cb);
  return () => {
    _hoveredListeners.delete(cb);
  };
}
