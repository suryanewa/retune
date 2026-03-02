"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import {
  useDocumentStore,
  selectPageElements,
  selectPagesArray,
  selectActivePageStyles,
  type DocumentState,
} from "@/app/editor/store/document-store";
import type {
  CanvasElement,
  Page,
  PageStyles,
} from "@/lib/playground/store";
import type { EditorMutations } from "@/app/editor/components/context/editor-mutations-types";
import { EditorMutationsContext } from "@/app/editor/components/context/editor-mutations-context";
import { CameraProvider } from "@/app/editor/components/CameraContext";
import { VisualBellProvider } from "@/app/editor/components/visual-bell/VisualBellContext";
import {
  editorStateStore,
  setSelectedIds,
  setDraggedId,
  setEditingElementId,
  setFocusedContainerId,
  setCreationTool,
  setViewMode,
  setDevice,
  setPanelTab,
  setPreviewFont,
  setLastSelectedId,
} from "@/app/editor/components/context/editor-state-store";
import type { CreationTool } from "@/lib/playground/editor-types";
import { ARTBOARD_LAYER_ID } from "@/lib/playground/store";
import { elementClipboard, setHoveredId } from "@/app/editor/components/editor-clipboard";

// ─── ComposerContext Value Type ──────────────────────────────────────────────

export interface ComposerContextValue {
  // ── Data ────────────────────────────────────────────────────────────────────
  elements: Record<string, CanvasElement>;
  elementsArray: CanvasElement[];
  pages: Page[];
  activePageId: string;
  pageStyles: PageStyles;
  homepageId: string;
  localUser: { id: string; name: string; color: string };
  isAdmin: boolean;
  others: never[];

  // ── Editor UI State (convenience — mirrors editorStateStore) ────────────────
  state: {
    selectedIds: string[];
    viewMode: "edit" | "preview";
    creationTool: CreationTool;
    device: "desktop" | "tablet" | "mobile";
    focusedContainerId: string | null;
    editingElementId: string | null;
    draggedId: string | null;
    panelTab: "design" | "animate";
    previewFont: string | null;
    isAdmin: boolean;
    lastSelectedId: string | null;
  };

  // ── Mutations (full EditorMutations interface) ──────────────────────────────
  selectElement: EditorMutations["selectElement"];
  hoverElement: EditorMutations["hoverElement"];
  toggleElementSelection: EditorMutations["toggleElementSelection"];
  addToSelection: EditorMutations["addToSelection"];
  rangeSelectElements: EditorMutations["rangeSelectElements"];
  selectAllAtLevel: EditorMutations["selectAllAtLevel"];
  clearSelection: EditorMutations["clearSelection"];
  setSelection: EditorMutations["setSelection"];
  getEffectiveTarget: EditorMutations["getEffectiveTarget"];
  enterContainer: EditorMutations["enterContainer"];
  exitContainer: EditorMutations["exitContainer"];
  setFocusedContainer: EditorMutations["setFocusedContainer"];
  addElement: EditorMutations["addElement"];
  addCanvasElement: EditorMutations["addCanvasElement"];
  updateElement: EditorMutations["updateElement"];
  deleteElement: EditorMutations["deleteElement"];
  duplicateElement: EditorMutations["duplicateElement"];
  duplicateElementForDrag: EditorMutations["duplicateElementForDrag"];
  pasteElement: EditorMutations["pasteElement"];
  pasteElements: EditorMutations["pasteElements"];
  moveElement: EditorMutations["moveElement"];
  reorderElement: EditorMutations["reorderElement"];
  deleteElements: EditorMutations["deleteElements"];
  duplicateElements: EditorMutations["duplicateElements"];
  moveElements: EditorMutations["moveElements"];
  updateStyles: EditorMutations["updateStyles"];
  updateResponsiveStyles: EditorMutations["updateResponsiveStyles"];
  clearResponsiveOverride: EditorMutations["clearResponsiveOverride"];
  wrapInContainer: EditorMutations["wrapInContainer"];
  ungroupContainer: EditorMutations["ungroupContainer"];
  setDragging: EditorMutations["setDragging"];
  dropElement: EditorMutations["dropElement"];
  dropElementDirect: EditorMutations["dropElementDirect"];
  reparentIntoContainer: EditorMutations["reparentIntoContainer"];
  convertToArtboard: EditorMutations["convertToArtboard"];
  convertToCanvas: EditorMutations["convertToCanvas"];
  setCreationTool: EditorMutations["setCreationTool"];
  setViewMode: EditorMutations["setViewMode"];
  setDevice: EditorMutations["setDevice"];
  setPreviewFont: EditorMutations["setPreviewFont"];
  setPanelTab: EditorMutations["setPanelTab"];
  undo: EditorMutations["undo"];
  redo: EditorMutations["redo"];
  pauseHistory: EditorMutations["pauseHistory"];
  resumeHistory: EditorMutations["resumeHistory"];
  updatePageStyles: EditorMutations["updatePageStyles"];
  setEditingElementId: EditorMutations["setEditingElementId"];
  toggleVisibility: EditorMutations["toggleVisibility"];
  toggleLock: EditorMutations["toggleLock"];
  toggleCore: EditorMutations["toggleCore"];
  isElementEffectivelyHidden: EditorMutations["isElementEffectivelyHidden"];
  getElement: EditorMutations["getElement"];
  setActivePageId: EditorMutations["setActivePageId"];
  addPage: EditorMutations["addPage"];
  deletePage: EditorMutations["deletePage"];
  renamePage: EditorMutations["renamePage"];
  duplicatePage: EditorMutations["duplicatePage"];
  updatePage: EditorMutations["updatePage"];
  setHomepage: EditorMutations["setHomepage"];
  reorderPages: EditorMutations["reorderPages"];

  // ── Convenience alias for EditorCanvas ─────────────────────────────────────
  editingElementId: string | null;
}

// ─── Context & Hook ──────────────────────────────────────────────────────────

const ComposerContext = createContext<ComposerContextValue | null>(null);

export function useComposer(): ComposerContextValue {
  const ctx = useContext(ComposerContext);
  if (!ctx) throw new Error("useComposer must be used within ComposerProvider");
  return ctx;
}

// ─── Hardcoded local user (no multiplayer) ───────────────────────────────────

const LOCAL_USER = { id: "local", name: "You", color: "#3b82f6" } as const;
const EMPTY_OTHERS: never[] = [];

// ─── Helper: build the EditorMutations bridge ───────────────────────────────

function buildEditorMutations(store: DocumentState): EditorMutations {
  // ── Selection (single) ─────────────────────────────────────────────────────
  const selectElement = (id: string | null) => {
    if (id === null) {
      setSelectedIds([ARTBOARD_LAYER_ID]);
    } else {
      setSelectedIds([id]);
      setLastSelectedId(id);
    }
  };

  const hoverElement = (id: string | null) => {
    setHoveredId(id);
  };

  // ── Selection (multi) ──────────────────────────────────────────────────────
  const toggleElementSelection = (id: string) => {
    const state = editorStateStore.getSnapshot();
    const ids = state.selectedIds;
    if (ids.includes(id)) {
      const next = ids.filter((sid) => sid !== id);
      setSelectedIds(next.length === 0 ? [ARTBOARD_LAYER_ID] : next);
    } else {
      const next = ids.filter((sid) => sid !== ARTBOARD_LAYER_ID);
      setSelectedIds([...next, id]);
      setLastSelectedId(id);
    }
  };

  const addToSelection = (id: string) => {
    const state = editorStateStore.getSnapshot();
    const ids = state.selectedIds.filter((sid) => sid !== ARTBOARD_LAYER_ID);
    if (!ids.includes(id)) {
      setSelectedIds([...ids, id]);
      setLastSelectedId(id);
    }
  };

  const rangeSelectElements = (targetId: string, addToExisting?: boolean) => {
    const state = editorStateStore.getSnapshot();
    const elements = useDocumentStore.getState().elements;
    const lastId = state.lastSelectedId;

    // Build a flat ordering of element IDs (children in order, root by zIndex)
    const pageId = useDocumentStore.getState().activePageId;
    const allElements = Object.values(elements)
      .filter((el) => (el.pageId ?? "page_default") === pageId)
      .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    // Flatten tree order for range selection
    function flatOrder(parentId: string | null | undefined): string[] {
      const result: string[] = [];
      const children = parentId
        ? elements[parentId]?.children ?? []
        : allElements.filter((el) => !el.parentId).map((el) => el.id);
      for (const childId of children) {
        result.push(childId);
        if (elements[childId]?.children) {
          result.push(...flatOrder(childId));
        }
      }
      return result;
    }

    const ordered = flatOrder(null);
    const startIdx = lastId ? ordered.indexOf(lastId) : -1;
    const endIdx = ordered.indexOf(targetId);

    if (startIdx === -1 || endIdx === -1) {
      selectElement(targetId);
      return;
    }

    const min = Math.min(startIdx, endIdx);
    const max = Math.max(startIdx, endIdx);
    const rangeIds = ordered.slice(min, max + 1);

    if (addToExisting) {
      const existing = state.selectedIds.filter((id) => id !== ARTBOARD_LAYER_ID);
      const merged = Array.from(new Set([...existing, ...rangeIds]));
      setSelectedIds(merged);
    } else {
      setSelectedIds(rangeIds);
    }
  };

  const selectAllAtLevel = () => {
    const state = editorStateStore.getSnapshot();
    const docState = useDocumentStore.getState();
    const elements = docState.elements;
    const pageId = docState.activePageId;
    const focusedId = state.focusedContainerId;

    let siblings: string[];
    if (focusedId && elements[focusedId]?.children) {
      siblings = elements[focusedId].children!;
    } else {
      siblings = Object.values(elements)
        .filter(
          (el) =>
            !el.parentId &&
            (el.pageId ?? "page_default") === pageId
        )
        .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
        .map((el) => el.id);
    }

    if (siblings.length > 0) {
      setSelectedIds(siblings);
    }
  };

  const clearSelection = () => {
    setSelectedIds([ARTBOARD_LAYER_ID]);
    setFocusedContainerId(null);
  };

  const setSelectionFn = (ids: string[]) => {
    setSelectedIds(ids.length === 0 ? [ARTBOARD_LAYER_ID] : ids);
  };

  // ── Focus model ────────────────────────────────────────────────────────────
  const getEffectiveTarget = (clickedId: string, focusedId: string | null): string | null => {
    const elements = useDocumentStore.getState().elements;
    if (!elements[clickedId]) return null;

    // If the clicked element is inside the focused container, target it directly
    if (focusedId) {
      let current = elements[clickedId];
      while (current) {
        if (current.parentId === focusedId) return clickedId;
        if (!current.parentId) break;
        current = elements[current.parentId];
      }
    }

    // Otherwise walk up to find the top-level parent (or child of focused)
    let target = clickedId;
    let el = elements[clickedId];
    while (el?.parentId) {
      if (el.parentId === focusedId) return el.id;
      target = el.parentId;
      el = elements[el.parentId];
    }
    return target;
  };

  const enterContainer = (id: string) => {
    setFocusedContainerId(id);
  };

  const exitContainer = () => {
    const state = editorStateStore.getSnapshot();
    const elements = useDocumentStore.getState().elements;
    const focusedId = state.focusedContainerId;
    if (!focusedId) return;

    const parent = elements[focusedId]?.parentId;
    setFocusedContainerId(parent ?? null);
    setSelectedIds([focusedId]);
  };

  const setFocusedContainerFn = (id: string | null) => {
    setFocusedContainerId(id);
  };

  // ── Element CRUD — delegate to Zustand store ──────────────────────────────
  const duplicateElementForDrag = (id: string): string | null => {
    const result = store.duplicateElement(id);
    // duplicateElement returns string[] in our store
    return result.length > 0 ? result[0] : null;
  };

  const pasteElement = (sourceId: string): string | null => {
    // Use the elementClipboard snapshots
    const snapshots = elementClipboard.snapshots;
    if (!snapshots[sourceId]) return null;
    const state = editorStateStore.getSnapshot();
    const selectedId = state.selectedIds.find((id) => id !== ARTBOARD_LAYER_ID) ?? null;
    return store.pasteElement(snapshots, sourceId, selectedId);
  };

  const pasteElements = (sourceIds: string[]): string[] => {
    const results: string[] = [];
    for (const id of sourceIds) {
      const newId = pasteElement(id);
      if (newId) results.push(newId);
    }
    return results;
  };

  // ── Drag and drop ──────────────────────────────────────────────────────────
  const setDragging = (isDragging: boolean, draggedId: string | null) => {
    setDraggedId(isDragging ? draggedId : null);
  };

  const dropElement = (targetId: string, position: "before" | "after") => {
    const state = editorStateStore.getSnapshot();
    const draggedId = state.draggedId;
    if (!draggedId) return;
    store.reorderElement(draggedId, targetId, position);
    setDraggedId(null);
  };

  const dropElementDirect = (draggedId: string, targetId: string, position: "before" | "after") => {
    store.reorderElement(draggedId, targetId, position);
  };

  // ── View controls ──────────────────────────────────────────────────────────
  const setCreationToolFn = (tool: CreationTool) => {
    setCreationTool(tool);
  };

  const setViewModeFn = (mode: "edit" | "preview") => {
    setViewMode(mode);
  };

  const setDeviceFn = (device: "desktop" | "tablet" | "mobile") => {
    setDevice(device);
  };

  const setPreviewFontFn = (font: string | null) => {
    setPreviewFont(font);
  };

  const setPanelTabFn = (tab: "design" | "animate") => {
    setPanelTab(tab);
  };

  // ── History (placeholders) ─────────────────────────────────────────────────
  const pauseHistory = () => {
    // TODO: implement with zundo temporal middleware
  };

  const resumeHistory = () => {
    // TODO: implement with zundo temporal middleware
  };

  // ── Page styles — bridge the signature difference ──────────────────────────
  // EditorMutations: updatePageStyles(updates: Partial<PageStyles>)
  // Store: updatePageStyles(pageId: string, updates: Partial<PageStyles>)
  const updatePageStylesBridge = (updates: Partial<PageStyles>) => {
    const pageId = useDocumentStore.getState().activePageId;
    store.updatePageStyles(pageId, updates);
  };

  // ── Inline text editing ────────────────────────────────────────────────────
  const setEditingElementIdFn = (id: string | null) => {
    setEditingElementId(id);
  };

  // ── Element lookup ─────────────────────────────────────────────────────────
  const getElement = (id: string): CanvasElement | undefined => {
    return useDocumentStore.getState().elements[id];
  };

  // ── Multi-page — addPage signature bridge ──────────────────────────────────
  // EditorMutations: addPage() => string
  // Store: addPage(name?: string) => string
  const addPageBridge = (): string => {
    return store.addPage();
  };

  // ── duplicateElement signature bridge ──────────────────────────────────────
  // EditorMutations: duplicateElement(id: string) => void
  // Store: duplicateElement(id: string) => string[]
  const duplicateElementBridge = (id: string): void => {
    store.duplicateElement(id);
  };

  // ── duplicateElements signature bridge ─────────────────────────────────────
  // EditorMutations: duplicateElements(ids: string[]) => void
  // Store: duplicateElements(ids: string[]) => string[]
  const duplicateElementsBridge = (ids: string[]): void => {
    store.duplicateElements(ids);
  };

  // ── ungroupContainer signature bridge ──────────────────────────────────────
  // EditorMutations: ungroupContainer(containerId: string) => void
  // Store: ungroupContainer(containerId: string) => string[]
  const ungroupContainerBridge = (containerId: string): void => {
    store.ungroupContainer(containerId);
  };

  return {
    // Selection
    selectElement,
    hoverElement,
    toggleElementSelection,
    addToSelection,
    rangeSelectElements,
    selectAllAtLevel,
    clearSelection,
    setSelection: setSelectionFn,

    // Focus model
    getEffectiveTarget,
    enterContainer,
    exitContainer,
    setFocusedContainer: setFocusedContainerFn,

    // Element CRUD
    addElement: store.addElement,
    addCanvasElement: store.addCanvasElement,
    updateElement: store.updateElement,
    deleteElement: store.deleteElement,
    duplicateElement: duplicateElementBridge,
    duplicateElementForDrag,
    pasteElement,
    pasteElements,
    moveElement: store.moveElement,
    reorderElement: store.reorderElement,

    // Multi-element
    deleteElements: store.deleteElements,
    duplicateElements: duplicateElementsBridge,
    moveElements: store.moveElements,

    // Styles
    updateStyles: store.updateStyles,
    updateResponsiveStyles: store.updateResponsiveStyles,
    clearResponsiveOverride: store.clearResponsiveOverride,

    // Wrap / Ungroup
    wrapInContainer: store.wrapInContainer,
    ungroupContainer: ungroupContainerBridge,

    // Drag and drop
    setDragging,
    dropElement,
    dropElementDirect,
    reparentIntoContainer: store.reparentIntoContainer,

    // Canvas / Artboard
    convertToArtboard: store.convertToArtboard,
    convertToCanvas: store.convertToCanvas,

    // Tool state
    setCreationTool: setCreationToolFn,

    // View controls
    setViewMode: setViewModeFn,
    setDevice: setDeviceFn,
    setPreviewFont: setPreviewFontFn,
    setPanelTab: setPanelTabFn,

    // History
    undo: store.undo,
    redo: store.redo,
    pauseHistory,
    resumeHistory,

    // Page styles
    updatePageStyles: updatePageStylesBridge,

    // Inline text editing
    setEditingElementId: setEditingElementIdFn,

    // Visibility / Lock / Core
    toggleVisibility: store.toggleVisibility,
    toggleLock: store.toggleLock,
    toggleCore: store.toggleCore,
    isElementEffectivelyHidden: store.isElementEffectivelyHidden,

    // Element lookup
    getElement,

    // Multi-page
    setActivePageId: store.setActivePageId,
    addPage: addPageBridge,
    deletePage: store.deletePage,
    renamePage: store.renamePage,
    duplicatePage: store.duplicatePage,
    updatePage: store.updatePage,
    setHomepage: store.setHomepage,
    reorderPages: store.reorderPages,
  };
}

// ─── Provider Component ──────────────────────────────────────────────────────

export function ComposerProvider({ children }: { children: ReactNode }) {
  // ── Read data from Zustand store with selectors ────────────────────────────
  const elements = useDocumentStore(selectPageElements);
  const pages = useDocumentStore(selectPagesArray);
  const pageStyles = useDocumentStore(selectActivePageStyles);
  const activePageId = useDocumentStore((s) => s.activePageId);

  // Derive elementsArray from elements (sorted by zIndex for stable ordering)
  const elementsArray = useMemo(
    () => Object.values(elements).sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)),
    [elements]
  );

  // Derive homepage ID
  const homepageId = useMemo(() => {
    const hp = pages.find((p) => p.isHomepage);
    return hp?.id ?? (pages.length > 0 ? pages[0].id : "");
  }, [pages]);

  // Get the full store state for building mutations
  // (Zustand actions from getState() are stable references)
  const storeActions = useDocumentStore.getState();

  // Build the mutations object — store actions are stable so this is safe
  const mutations = useMemo(
    () => buildEditorMutations(storeActions),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // Store actions are stable references from Zustand, never change
  );

  // Read editor UI state snapshot
  const editorState = editorStateStore.getSnapshot();

  // Build the full context value
  const value = useMemo<ComposerContextValue>(
    () => ({
      // Data
      elements,
      elementsArray,
      pages,
      activePageId,
      pageStyles,
      homepageId,
      localUser: LOCAL_USER,
      isAdmin: editorState.isAdmin,
      others: EMPTY_OTHERS,

      // Editor UI state (for EditorCanvas which destructures `state`)
      state: editorState,

      // All mutations
      ...mutations,

      // Convenience alias
      editingElementId: editorState.editingElementId,
    }),
    [elements, elementsArray, pages, activePageId, pageStyles, homepageId, editorState, mutations]
  );

  return (
    <ComposerContext.Provider value={value}>
      <EditorMutationsContext.Provider value={mutations}>
        <CameraProvider>
          <VisualBellProvider>
            {children}
          </VisualBellProvider>
        </CameraProvider>
      </EditorMutationsContext.Provider>
    </ComposerContext.Provider>
  );
}
