import type {
  Page,
  CanvasElement,
  ElementType,
  PageStyles,
} from "@/lib/playground/store";
import type {
  TailwindStyles,
  CreationTool,
} from "@/lib/playground/editor-types";

/**
 * EditorMutations — every stable mutation/action callback exposed by
 * the editor context. Each function reference is guaranteed to be stable
 * (never changes), so consumers wrapped in React.memo will not re-render
 * due to callback identity changes.
 *
 * Organised by domain.
 */
export interface EditorMutations {
  // ─── Selection (single) ──────────────────────────────────────────────
  selectElement: (id: string | null) => void;
  hoverElement: (id: string | null) => void;

  // ─── Selection (multi) ───────────────────────────────────────────────
  toggleElementSelection: (id: string) => void;
  addToSelection: (id: string) => void;
  rangeSelectElements: (targetId: string, addToExisting?: boolean) => void;
  selectAllAtLevel: () => void;
  clearSelection: () => void;
  setSelection: (ids: string[]) => void;

  // ─── Focus model (container enter/exit) ──────────────────────────────
  getEffectiveTarget: (clickedId: string, focusedId: string | null) => string | null;
  enterContainer: (id: string) => void;
  exitContainer: () => void;
  setFocusedContainer: (id: string | null) => void;

  // ─── Element CRUD ────────────────────────────────────────────────────
  addElement: (
    type: ElementType,
    parentId?: string | null,
    options?: {
      isCore?: boolean;
      insertIndex?: number;
      styles?: Partial<TailwindStyles>;
      placement?: "artboard" | "canvas";
      x?: number;
      y?: number;
      width?: number;
      height?: number;
    },
  ) => string;
  addCanvasElement: (
    type: CanvasElement["type"],
    worldX: number,
    worldY: number,
    options?: { width?: number; height?: number },
  ) => string;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  deleteElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  duplicateElementForDrag: (id: string) => string | null;
  pasteElement: (sourceId: string) => string | null;
  pasteElements: (sourceIds: string[]) => string[];
  moveElement: (id: string, direction: "up" | "down") => void;
  reorderElement: (draggedId: string, targetId: string, position: "before" | "after") => void;

  // ─── Multi-element operations ────────────────────────────────────────
  deleteElements: (ids: string[]) => void;
  duplicateElements: (ids: string[]) => void;
  moveElements: (ids: string[], direction: "up" | "down") => void;

  // ─── Style updates ──────────────────────────────────────────────────
  updateStyles: (id: string, styles: Partial<TailwindStyles>) => void;
  updateResponsiveStyles: (
    id: string,
    device: "tablet" | "mobile",
    styles: Partial<TailwindStyles>,
  ) => void;
  clearResponsiveOverride: (
    id: string,
    device: "tablet" | "mobile",
    property: keyof TailwindStyles,
  ) => void;

  // ─── Wrap / Ungroup ──────────────────────────────────────────────────
  wrapInContainer: (elementIds: string[]) => string;
  ungroupContainer: (containerId: string) => void;

  // ─── Drag and drop ───────────────────────────────────────────────────
  setDragging: (isDragging: boolean, draggedId: string | null) => void;
  dropElement: (targetId: string, position: "before" | "after") => void;
  dropElementDirect: (draggedId: string, targetId: string, position: "before" | "after") => void;
  reparentIntoContainer: (draggedId: string, containerId: string | null, insertIndex: number) => void;

  // ─── Canvas / Artboard conversion ────────────────────────────────────
  convertToArtboard: (elementId: string, containerId: string | null, insertIndex: number) => void;
  convertToCanvas: (elementId: string, worldX: number, worldY: number, width: number, height: number) => void;

  // ─── Tool state ──────────────────────────────────────────────────────
  setCreationTool: (tool: CreationTool) => void;

  // ─── View controls ───────────────────────────────────────────────────
  setViewMode: (mode: "edit" | "preview") => void;
  setDevice: (device: "desktop" | "tablet" | "mobile") => void;
  setPreviewFont: (font: string | null) => void;
  setPanelTab: (tab: "design" | "animate") => void;

  // ─── History ─────────────────────────────────────────────────────────
  undo: () => void;
  redo: () => void;
  pauseHistory: () => void;
  resumeHistory: () => void;

  // ─── Page styles ─────────────────────────────────────────────────────
  updatePageStyles: (updates: Partial<PageStyles>) => void;

  // ─── Inline text editing ─────────────────────────────────────────────
  setEditingElementId: (id: string | null) => void;

  // ─── Element visibility / lock / core ────────────────────────────────
  toggleVisibility: (elementId: string) => void;
  toggleLock: (elementId: string) => void;
  toggleCore: (elementId: string) => void;
  isElementEffectivelyHidden: (elementId: string) => boolean;

  // ─── Element lookup (for event handlers needing arbitrary element data) ──
  getElement: (id: string) => CanvasElement | undefined;

  // ─── Multi-page ──────────────────────────────────────────────────────
  setActivePageId: (pageId: string) => void;
  addPage: () => string;
  deletePage: (pageId: string) => void;
  renamePage: (pageId: string, name: string) => void;
  duplicatePage: (pageId: string) => string;
  updatePage: (pageId: string, updates: Partial<Page>) => void;
  setHomepage: (pageId: string) => void;
  reorderPages: (newPageOrder: string[]) => void;
}
