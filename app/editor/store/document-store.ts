import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
  Page,
  CanvasElement,
  ElementType,
  PageStyles,
} from "@/lib/playground/store";
import { defaultPageStyles } from "@/lib/playground/store";
import type { TailwindStyles } from "@/lib/playground/editor-types";
import { createDefaultTailwindElement } from "@/lib/playground/editor-types";
import { nameToSlug, ensureUniqueSlug } from "@/lib/playground/slug-utils";

// ─── Helpers ────────────────────────────────────────────────────────────────────

function generateId(type: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `${type}_${timestamp}_${random}`;
}

function getElementDepth(
  elements: Record<string, CanvasElement>,
  id: string
): number {
  let depth = 0;
  let current = elements[id];
  while (current?.parentId) {
    depth++;
    current = elements[current.parentId];
  }
  return depth;
}

function isDescendantOf(
  elements: Record<string, CanvasElement>,
  elementId: string,
  ancestorId: string
): boolean {
  let current = elements[elementId];
  while (current?.parentId) {
    if (current.parentId === ancestorId) return true;
    current = elements[current.parentId];
  }
  return false;
}

function filterToTopLevel(
  selectedIds: string[],
  elements: Record<string, CanvasElement>
): string[] {
  return selectedIds.filter(
    (id) =>
      !selectedIds.some(
        (otherId) =>
          otherId !== id && isDescendantOf(elements, id, otherId)
      )
  );
}

function isEffectivelyHidden(
  elements: Record<string, CanvasElement>,
  elementId: string
): boolean {
  let current = elements[elementId];
  while (current) {
    if (current.hidden) return true;
    if (!current.parentId) break;
    current = elements[current.parentId];
  }
  return false;
}

// ─── State Types ────────────────────────────────────────────────────────────────

export interface DocumentState {
  // ── Data ────────────────────────────────────────────────────────────────────
  elements: Record<string, CanvasElement>;
  pages: Record<string, Page>;
  pageStylesMap: Record<string, PageStyles>;
  activePageId: string;

  // ── Computed (derived selectors are functions, not stored state) ──────────

  // ── Element CRUD ────────────────────────────────────────────────────────────
  addElement: (
    type: ElementType,
    parentId?: string | null,
    options?: {
      insertIndex?: number;
      styles?: Partial<TailwindStyles>;
      placement?: "artboard" | "canvas";
      x?: number;
      y?: number;
      width?: number;
      height?: number;
    }
  ) => string;
  addCanvasElement: (
    type: CanvasElement["type"],
    worldX: number,
    worldY: number,
    options?: { width?: number; height?: number }
  ) => string;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  deleteElement: (id: string) => void;
  deleteElements: (ids: string[]) => void;
  duplicateElement: (id: string) => string[];
  duplicateElements: (ids: string[]) => string[];

  // ── Style Updates ──────────────────────────────────────────────────────────
  updateStyles: (id: string, styles: Partial<TailwindStyles>) => void;
  updateResponsiveStyles: (
    id: string,
    device: "tablet" | "mobile",
    styles: Partial<TailwindStyles>
  ) => void;
  clearResponsiveOverride: (
    id: string,
    device: "tablet" | "mobile",
    property: keyof TailwindStyles
  ) => void;

  // ── Hierarchy / Reorder ────────────────────────────────────────────────────
  moveElement: (id: string, direction: "up" | "down") => void;
  moveElements: (ids: string[], direction: "up" | "down") => void;
  reorderElement: (
    draggedId: string,
    targetId: string,
    position: "before" | "after"
  ) => void;
  wrapInContainer: (elementIds: string[]) => string;
  ungroupContainer: (containerId: string) => string[];
  reparentIntoContainer: (
    draggedId: string,
    containerId: string | null,
    insertIndex: number
  ) => void;

  // ── Canvas / Artboard Conversion ───────────────────────────────────────────
  convertToArtboard: (
    elementId: string,
    containerId: string | null,
    insertIndex: number
  ) => void;
  convertToCanvas: (
    elementId: string,
    worldX: number,
    worldY: number,
    width: number,
    height: number
  ) => void;

  // ── Layer Controls ─────────────────────────────────────────────────────────
  toggleVisibility: (elementId: string) => void;
  toggleLock: (elementId: string) => void;
  isElementEffectivelyHidden: (elementId: string) => boolean;

  // ── Pages ──────────────────────────────────────────────────────────────────
  addPage: (name?: string) => string;
  deletePage: (id: string) => void;
  renamePage: (id: string, name: string) => void;
  duplicatePage: (pageId: string) => string;
  updatePage: (pageId: string, updates: Partial<Page>) => void;
  setActivePageId: (id: string) => void;
  setHomepage: (pageId: string) => void;
  reorderPages: (newPageOrder: string[]) => void;
  updatePageStyles: (pageId: string, updates: Partial<PageStyles>) => void;

  // ── Paste ──────────────────────────────────────────────────────────────────
  pasteElement: (
    snapshots: Record<string, Record<string, unknown>>,
    rootId: string,
    selectedId: string | null
  ) => string | null;

  // ── Undo/Redo Placeholders ─────────────────────────────────────────────────
  undo: () => void;
  redo: () => void;
}

// ─── Default initial page ───────────────────────────────────────────────────────

const DEFAULT_PAGE_ID = "page_default";

const defaultPage: Page = {
  id: DEFAULT_PAGE_ID,
  name: "Page",
  order: 0,
  createdBy: "local",
  createdAt: Date.now(),
  isHomepage: true,
};

// ─── Store ──────────────────────────────────────────────────────────────────────

export const useDocumentStore = create<DocumentState>()(
  immer((set, get) => ({
    // ── Initial Data ──────────────────────────────────────────────────────────
    elements: {},
    pages: { [DEFAULT_PAGE_ID]: defaultPage },
    pageStylesMap: {
      [DEFAULT_PAGE_ID]: { ...defaultPageStyles },
    },
    activePageId: DEFAULT_PAGE_ID,

    // ════════════════════════════════════════════════════════════════════════
    // ELEMENT CRUD
    // ════════════════════════════════════════════════════════════════════════

    addElement: (type, parentId, options) => {
      const id = generateId(type);
      const defaults = createDefaultTailwindElement(type as any, id);
      const state = get();
      const pageId = state.activePageId;

      // Compute max zIndex among page elements
      const pageElements = Object.values(state.elements).filter(
        (e) => (e.pageId ?? DEFAULT_PAGE_ID) === pageId
      );
      const maxZ = pageElements.reduce(
        (max, e) => Math.max(max, e.zIndex || 0),
        0
      );

      const isCanvasPlacement = options?.placement === "canvas";

      const newElement: CanvasElement = {
        id,
        type,
        x: options?.x ?? 0,
        y: options?.y ?? 0,
        width: isCanvasPlacement ? (options?.width ?? 200) : undefined,
        height: isCanvasPlacement ? (options?.height ?? 200) : undefined,
        rotation: 0,
        scale: 1,
        zIndex: maxZ + 1,
        content: defaults.content,
        styles: {},
        tailwindStyles: options?.styles
          ? { ...defaults.tailwindStyles, ...options.styles }
          : defaults.tailwindStyles,
        createdBy: "local",
        createdAt: Date.now(),
        pageId,
        parentId: isCanvasPlacement ? null : (parentId || null),
        children: type === "container" ? [] : undefined,
        placement: isCanvasPlacement ? "canvas" : undefined,
        ...(defaults.videoAutoplay !== undefined && {
          videoAutoplay: defaults.videoAutoplay,
        }),
        ...(defaults.videoLoop !== undefined && {
          videoLoop: defaults.videoLoop,
        }),
        ...(defaults.videoControls !== undefined && {
          videoControls: defaults.videoControls,
        }),
        ...(defaults.videoMuted !== undefined && {
          videoMuted: defaults.videoMuted,
        }),
      };

      set((draft) => {
        draft.elements[id] = newElement;

        // Add to parent's children if nested in artboard
        const effectiveParentId = isCanvasPlacement
          ? undefined
          : (parentId ?? undefined);
        if (effectiveParentId) {
          const parent = draft.elements[effectiveParentId];
          if (parent) {
            if (!parent.children) parent.children = [];
            if (
              options?.insertIndex !== undefined &&
              options.insertIndex >= 0 &&
              options.insertIndex <= parent.children.length
            ) {
              parent.children.splice(options.insertIndex, 0, id);
            } else {
              parent.children.push(id);
            }
          }
        } else if (options?.insertIndex !== undefined) {
          // Root-level insertion: reindex all root elements' zIndex values
          const rootEls = Object.values(draft.elements)
            .filter(
              (el) =>
                el &&
                !el.parentId &&
                el.id !== id &&
                (el.pageId ?? DEFAULT_PAGE_ID) === pageId
            )
            .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

          const newOrder = [...rootEls];
          const clampedIndex = Math.min(
            options.insertIndex,
            newOrder.length
          );
          newOrder.splice(clampedIndex, 0, draft.elements[id]);

          newOrder.forEach((el, idx) => {
            if (el?.id && draft.elements[el.id]) {
              draft.elements[el.id].zIndex = idx;
            }
          });
        }
      });

      return id;
    },

    addCanvasElement: (type, worldX, worldY, options) => {
      const defaultSizes: Record<string, { w: number; h: number }> = {
        container: { w: 200, h: 200 },
        rectangle: { w: 100, h: 100 },
        circle: { w: 100, h: 100 },
        star: { w: 100, h: 100 },
        text: { w: 200, h: 40 },
        video: { w: 400, h: 225 },
      };
      const size = defaultSizes[type] ?? { w: 200, h: 200 };
      return get().addElement(type, null, {
        placement: "canvas",
        x: worldX,
        y: worldY,
        width: options?.width ?? size.w,
        height: options?.height ?? size.h,
      });
    },

    updateElement: (id, updates) => {
      set((draft) => {
        const existing = draft.elements[id];
        if (!existing) return;

        Object.entries(updates).forEach(([key, value]) => {
          if (
            (key === "styles" || key === "tailwindStyles") &&
            value &&
            typeof value === "object"
          ) {
            (existing as any)[key] = {
              ...(existing as any)[key],
              ...value,
            };
          } else {
            (existing as any)[key] = value;
          }
        });
      });
    },

    deleteElement: (id) => {
      get().deleteElements([id]);
    },

    deleteElements: (ids) => {
      set((draft) => {
        const topLevel = filterToTopLevel(ids, draft.elements);

        // Sort by depth (deepest first)
        const sorted = [...topLevel].sort(
          (a, b) =>
            getElementDepth(draft.elements, b) -
            getElementDepth(draft.elements, a)
        );

        for (const id of sorted) {
          const element = draft.elements[id];
          if (!element) continue;

          // Remove from parent's children
          if (element.parentId) {
            const parent = draft.elements[element.parentId];
            if (parent?.children) {
              parent.children = parent.children.filter(
                (cid) => cid !== id
              );
            }
          }

          // Recursively delete children
          const deleteRecursive = (elementId: string) => {
            const el = draft.elements[elementId];
            if (el?.children) {
              el.children.forEach((childId) =>
                deleteRecursive(childId)
              );
            }
            delete draft.elements[elementId];
          };
          deleteRecursive(id);
        }
      });
    },

    duplicateElement: (id) => {
      return get().duplicateElements([id]);
    },

    duplicateElements: (ids) => {
      const newIds: string[] = [];

      set((draft) => {
        const topLevel = filterToTopLevel(ids, draft.elements);

        function cloneTree(
          sourceId: string,
          newParentId: string | null
        ): string | null {
          const element = draft.elements[sourceId];
          if (!element) return null;

          const newId = generateId(element.type);
          const newChildren: string[] = [];

          // Recursively clone children
          if (element.children && element.children.length > 0) {
            for (const childId of element.children) {
              const newChildId = cloneTree(childId, newId);
              if (newChildId) newChildren.push(newChildId);
            }
          }

          const newElement: CanvasElement = {
            ...JSON.parse(JSON.stringify(element)),
            id: newId,
            parentId: newParentId ?? element.parentId,
            createdBy: "local",
            createdAt: Date.now(),
            children:
              newChildren.length > 0 ? newChildren : undefined,
          };

          draft.elements[newId] = newElement;
          return newId;
        }

        for (const id of topLevel) {
          const element = draft.elements[id];
          if (!element) continue;
          if (element.type === "component") continue;

          const newId = cloneTree(id, null);
          if (!newId) continue;
          newIds.push(newId);

          // Add to parent's children after original
          if (element.parentId) {
            const parent = draft.elements[element.parentId];
            if (parent?.children) {
              const idx = parent.children.indexOf(id);
              if (idx > -1) {
                parent.children.splice(idx + 1, 0, newId);
              }
            }
          }
        }
      });

      return newIds;
    },

    // ════════════════════════════════════════════════════════════════════════
    // STYLE UPDATES
    // ════════════════════════════════════════════════════════════════════════

    updateStyles: (id, styles) => {
      set((draft) => {
        const el = draft.elements[id];
        if (!el) return;
        el.tailwindStyles = { ...(el.tailwindStyles || {}), ...styles };
      });
    },

    updateResponsiveStyles: (id, device, styles) => {
      set((draft) => {
        const el = draft.elements[id];
        if (!el) return;
        if (!el.responsiveStyles) {
          el.responsiveStyles = { base: {} };
        }
        el.responsiveStyles[device] = {
          ...(el.responsiveStyles[device] || {}),
          ...styles,
        };
      });
    },

    clearResponsiveOverride: (id, device, property) => {
      set((draft) => {
        const el = draft.elements[id];
        if (!el?.responsiveStyles?.[device]) return;
        delete (el.responsiveStyles[device] as any)[property];
      });
    },

    // ════════════════════════════════════════════════════════════════════════
    // HIERARCHY / REORDER
    // ════════════════════════════════════════════════════════════════════════

    moveElement: (id, direction) => {
      get().moveElements([id], direction);
    },

    moveElements: (ids, direction) => {
      set((draft) => {
        const pageId = draft.activePageId;

        // Check all have same parent
        const parents = new Set(
          ids.map((id) => draft.elements[id]?.parentId ?? "root")
        );
        if (parents.size > 1) return;

        const firstElement = draft.elements[ids[0]];
        if (!firstElement) return;

        const parentId = firstElement.parentId;

        if (parentId) {
          const parent = draft.elements[parentId];
          if (!parent?.children) return;

          const children = parent.children;
          const indices = ids
            .map((id) => children.indexOf(id))
            .filter((i) => i !== -1)
            .sort((a, b) => a - b);

          if (indices.length === 0) return;
          if (direction === "up" && indices[0] === 0) return;
          if (
            direction === "down" &&
            indices[indices.length - 1] === children.length - 1
          )
            return;

          if (direction === "up") {
            const swapIdx = indices[0] - 1;
            const swapId = children[swapIdx];
            children.splice(swapIdx, 1);
            children.splice(
              indices[indices.length - 1] - 1 + 1,
              0,
              swapId
            );
          } else {
            const swapIdx = indices[indices.length - 1] + 1;
            const swapId = children[swapIdx];
            children.splice(swapIdx, 1);
            children.splice(indices[0], 0, swapId);
          }
        } else {
          // Root-level elements
          const rootElements = Object.values(draft.elements)
            .filter(
              (el): el is CanvasElement =>
                el !== undefined &&
                !el.parentId &&
                (el.pageId ?? DEFAULT_PAGE_ID) === pageId
            )
            .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

          const indices = ids
            .map((id) => rootElements.findIndex((el) => el.id === id))
            .filter((i) => i !== -1)
            .sort((a, b) => a - b);

          if (indices.length === 0) return;
          if (direction === "up" && indices[0] === 0) return;
          if (
            direction === "down" &&
            indices[indices.length - 1] === rootElements.length - 1
          )
            return;

          const newOrder = [...rootElements];
          if (direction === "up") {
            const swapIdx = indices[0] - 1;
            const swapEl = newOrder[swapIdx];
            newOrder.splice(swapIdx, 1);
            newOrder.splice(
              indices[indices.length - 1] - 1 + 1,
              0,
              swapEl
            );
          } else {
            const swapIdx = indices[indices.length - 1] + 1;
            const swapEl = newOrder[swapIdx];
            newOrder.splice(swapIdx, 1);
            newOrder.splice(indices[0], 0, swapEl);
          }

          newOrder.forEach((el, idx) => {
            if (el?.id && draft.elements[el.id]) {
              draft.elements[el.id].zIndex = idx;
            }
          });
        }
      });
    },

    reorderElement: (draggedId, targetId, position) => {
      set((draft) => {
        const pageId = draft.activePageId;
        const draggedElement = draft.elements[draggedId];
        const targetElement = draft.elements[targetId];
        if (!draggedElement || !targetElement) return;
        if (draggedElement.parentId !== targetElement.parentId) return;

        const parentId = draggedElement.parentId;
        const parent = parentId ? draft.elements[parentId] : null;

        if (parent && parent.children) {
          const children = parent.children;
          const draggedIndex = children.indexOf(draggedId);
          const targetIndex = children.indexOf(targetId);

          if (
            draggedIndex !== -1 &&
            targetIndex !== -1 &&
            draggedIndex !== targetIndex
          ) {
            children.splice(draggedIndex, 1);
            let insertIndex = targetIndex;
            if (draggedIndex < targetIndex) insertIndex--;
            if (position === "after") insertIndex++;
            children.splice(insertIndex, 0, draggedId);
          }
        } else if (!parentId) {
          // Root-level reorder
          const allRootElements = Object.values(draft.elements)
            .filter(
              (el) =>
                el &&
                !el.parentId &&
                (el.pageId ?? DEFAULT_PAGE_ID) === pageId
            )
            .sort((a, b) => (a?.zIndex || 0) - (b?.zIndex || 0));

          const draggedIdx = allRootElements.findIndex(
            (el) => el?.id === draggedId
          );
          const targetIdx = allRootElements.findIndex(
            (el) => el?.id === targetId
          );

          if (
            draggedIdx !== -1 &&
            targetIdx !== -1 &&
            draggedIdx !== targetIdx
          ) {
            const newOrder = [...allRootElements];
            newOrder.splice(draggedIdx, 1);
            let insertIdx = targetIdx;
            if (draggedIdx < targetIdx) insertIdx--;
            if (position === "after") insertIdx++;
            newOrder.splice(insertIdx, 0, draggedElement);

            newOrder.forEach((el, idx) => {
              if (el?.id && draft.elements[el.id]) {
                draft.elements[el.id].zIndex = idx;
              }
            });
          }
        }
      });
    },

    wrapInContainer: (elementIds) => {
      const state = get();
      const elements = state.elements;

      // Validate: all must share same parent
      const parents = new Set(
        elementIds.map((id) => elements[id]?.parentId ?? null)
      );
      if (parents.size > 1) {
        console.warn("Cannot wrap — elements have different parents");
        return "";
      }

      const topLevel = filterToTopLevel(elementIds, elements);
      if (topLevel.length === 0) return "";

      const containerId = generateId("container");

      set((draft) => {
        const firstElement = draft.elements[topLevel[0]];
        if (!firstElement) return;

        const isCanvas = firstElement.placement === "canvas";

        const maxZ = Object.values(draft.elements).reduce(
          (max, e) => Math.max(max, e?.zIndex || 0),
          0
        );

        // For canvas elements, compute bounding box
        let containerX = 0;
        let containerY = 0;
        let containerWidth: number | undefined;
        let containerHeight: number | undefined;
        if (isCanvas) {
          const wrapped = topLevel
            .map((id) => draft.elements[id])
            .filter((e): e is CanvasElement => !!e);
          const minX = Math.min(...wrapped.map((e) => e.x ?? 0));
          const minY = Math.min(...wrapped.map((e) => e.y ?? 0));
          const maxX = Math.max(
            ...wrapped.map((e) => (e.x ?? 0) + (e.width ?? 0))
          );
          const maxY = Math.max(
            ...wrapped.map((e) => (e.y ?? 0) + (e.height ?? 0))
          );
          containerX = minX;
          containerY = minY;
          containerWidth = maxX - minX;
          containerHeight = maxY - minY;
        }

        const container: CanvasElement = {
          id: containerId,
          type: "container",
          x: containerX,
          y: containerY,
          ...(containerWidth != null && { width: containerWidth }),
          ...(containerHeight != null && { height: containerHeight }),
          rotation: 0,
          scale: 1,
          zIndex: maxZ + 1,
          content: "",
          styles: {},
          tailwindStyles: {
            display: "flex",
            flexDirection: "flex-col",
            gap: "gap-4",
          },
          createdBy: "local",
          createdAt: Date.now(),
          pageId: firstElement.pageId ?? DEFAULT_PAGE_ID,
          parentId: firstElement.parentId,
          children: [...topLevel],
          ...(isCanvas && { placement: "canvas" as const }),
        };

        draft.elements[containerId] = container;

        // Update parent's children array
        if (firstElement.parentId) {
          const parent = draft.elements[firstElement.parentId];
          if (parent?.children) {
            const firstIdx = parent.children.indexOf(topLevel[0]);
            parent.children = parent.children.filter(
              (eid) => !topLevel.includes(eid)
            );
            parent.children.splice(firstIdx, 0, containerId);
          }
        }

        // Update wrapped elements' parentId
        topLevel.forEach((eid) => {
          const el = draft.elements[eid];
          if (el) {
            el.parentId = containerId;
            if (isCanvas) {
              el.x = (el.x ?? 0) - containerX;
              el.y = (el.y ?? 0) - containerY;
              el.placement = "artboard";
            }
          }
        });
      });

      return containerId;
    },

    ungroupContainer: (containerId) => {
      let childIds: string[] = [];

      set((draft) => {
        const container = draft.elements[containerId];
        if (!container?.children) return;

        const children = [...container.children];
        childIds = children;
        const parentId = container.parentId;
        const isCanvas = container.placement === "canvas";

        if (parentId) {
          const parent = draft.elements[parentId];
          if (parent?.children) {
            const containerIdx = parent.children.indexOf(containerId);
            parent.children.splice(containerIdx, 1, ...children);

            children.forEach((childId) => {
              const childEl = draft.elements[childId];
              if (childEl) {
                childEl.parentId = parentId;
              }
            });
          }
        } else {
          children.forEach((childId) => {
            const childEl = draft.elements[childId];
            if (childEl) {
              childEl.parentId = null;
              if (isCanvas) {
                childEl.placement = "canvas";
                childEl.x = (childEl.x ?? 0) + (container.x ?? 0);
                childEl.y = (childEl.y ?? 0) + (container.y ?? 0);
              }
            }
          });
        }

        delete draft.elements[containerId];
      });

      return childIds;
    },

    reparentIntoContainer: (draggedId, containerId, insertIndex) => {
      set((draft) => {
        const pageId = draft.activePageId;
        const draggedEl = draft.elements[draggedId];
        if (!draggedEl) return;

        // Remove from old parent's children
        if (draggedEl.parentId) {
          const oldParent = draft.elements[draggedEl.parentId];
          if (oldParent?.children) {
            oldParent.children = oldParent.children.filter(
              (cid) => cid !== draggedId
            );
          }
        }

        if (containerId) {
          const newParent = draft.elements[containerId];
          if (!newParent) return;
          if (!newParent.children) newParent.children = [];
          const idx =
            insertIndex === -1
              ? newParent.children.length
              : Math.min(insertIndex, newParent.children.length);
          newParent.children.splice(idx, 0, draggedId);

          draggedEl.parentId = containerId;
          if (draggedEl.placement === "canvas") {
            draggedEl.placement = undefined;
            draggedEl.x = 0;
            draggedEl.y = 0;
          }
        } else {
          // Move to root level
          const maxZ = Object.values(draft.elements)
            .filter(
              (el) =>
                el &&
                !el.parentId &&
                (el.pageId ?? DEFAULT_PAGE_ID) === pageId
            )
            .reduce((max, el) => Math.max(max, el?.zIndex || 0), -1);
          draggedEl.parentId = null;
          draggedEl.zIndex = maxZ + 1;
          if (draggedEl.placement === "canvas") {
            draggedEl.placement = undefined;
            draggedEl.x = 0;
            draggedEl.y = 0;
          }
        }
      });
    },

    // ════════════════════════════════════════════════════════════════════════
    // CANVAS / ARTBOARD CONVERSION
    // ════════════════════════════════════════════════════════════════════════

    convertToArtboard: (elementId, containerId, insertIndex) => {
      set((draft) => {
        const pageId = draft.activePageId;
        const el = draft.elements[elementId];
        if (!el) return;

        if (containerId) {
          const parent = draft.elements[containerId];
          if (!parent) return;
          if (!parent.children) parent.children = [];
          const idx =
            insertIndex === -1
              ? parent.children.length
              : Math.min(insertIndex, parent.children.length);
          parent.children.splice(idx, 0, elementId);
        }

        // Compute zIndex for root-level insertion
        let zIndex = el.zIndex;
        if (!containerId) {
          const rootEls = Object.values(draft.elements).filter(
            (e) =>
              e &&
              !e.parentId &&
              !e.placement &&
              (e.pageId ?? DEFAULT_PAGE_ID) === pageId
          );
          zIndex =
            rootEls.reduce(
              (max, e) => Math.max(max, e?.zIndex || 0),
              -1
            ) + 1;
        }

        el.placement = undefined;
        el.parentId = containerId;
        el.x = 0;
        el.y = 0;
        el.width = undefined;
        el.height = undefined;
        el.zIndex = zIndex;
      });
    },

    convertToCanvas: (elementId, worldX, worldY, width, height) => {
      set((draft) => {
        const el = draft.elements[elementId];
        if (!el) return;

        // Remove from old parent's children
        if (el.parentId) {
          const oldParent = draft.elements[el.parentId];
          if (oldParent?.children) {
            oldParent.children = oldParent.children.filter(
              (cid) => cid !== elementId
            );
          }
        }

        el.placement = "canvas";
        el.parentId = null;
        el.x = Math.round(worldX);
        el.y = Math.round(worldY);
        el.width = Math.round(width);
        el.height = Math.round(height);
        el.tailwindStyles = {
          ...(el.tailwindStyles || {}),
          width: `w-[${Math.round(width)}px]`,
          height: `h-[${Math.round(height)}px]`,
        };
      });
    },

    // ════════════════════════════════════════════════════════════════════════
    // LAYER CONTROLS
    // ════════════════════════════════════════════════════════════════════════

    toggleVisibility: (elementId) => {
      set((draft) => {
        const el = draft.elements[elementId];
        if (!el) return;
        el.hidden = !el.hidden;
      });
    },

    toggleLock: (elementId) => {
      set((draft) => {
        const el = draft.elements[elementId];
        if (!el) return;
        el.locked = !el.locked;
      });
    },

    isElementEffectivelyHidden: (elementId) => {
      return isEffectivelyHidden(get().elements, elementId);
    },

    // ════════════════════════════════════════════════════════════════════════
    // PAGES
    // ════════════════════════════════════════════════════════════════════════

    addPage: (name) => {
      const state = get();
      const pagesArray = Object.values(state.pages).sort(
        (a, b) => a.order - b.order
      );

      // Auto-increment page name
      let pageName = name;
      if (!pageName) {
        const existingNumbers = pagesArray.map((p) => {
          const match = p.name.match(/^Page\s+(\d+)$/);
          return match ? parseInt(match[1], 10) : 0;
        });
        const nextNum = Math.max(1, ...existingNumbers) + 1;
        pageName = `Page ${nextNum}`;
      }

      const maxOrder = pagesArray.reduce(
        (max, p) => Math.max(max, p.order),
        -1
      );
      const id = generateId("page");
      const existingSlugs = pagesArray
        .filter((p) => p.id !== DEFAULT_PAGE_ID && p.slug)
        .map((p) => p.slug!);
      const slug = ensureUniqueSlug(
        nameToSlug(pageName),
        existingSlugs
      );

      const newPage: Page = {
        id,
        name: pageName,
        slug,
        order: maxOrder + 1,
        createdBy: "local",
        createdAt: Date.now(),
      };

      set((draft) => {
        draft.pages[id] = newPage;
        draft.pageStylesMap[id] = {
          ...defaultPageStyles,
          name: pageName!,
        };
        draft.activePageId = id;
      });

      return id;
    },

    deletePage: (id) => {
      const state = get();
      const pageCount = Object.keys(state.pages).length;
      if (pageCount <= 1) return; // Can't delete last page

      set((draft) => {
        delete draft.pages[id];
        delete draft.pageStylesMap[id];

        // Delete all elements on this page
        Object.keys(draft.elements).forEach((elId) => {
          if (
            (draft.elements[elId].pageId ?? DEFAULT_PAGE_ID) === id
          ) {
            delete draft.elements[elId];
          }
        });

        // If deleting the active page, switch to the first remaining page
        if (draft.activePageId === id) {
          const remaining = Object.values(draft.pages).sort(
            (a, b) => a.order - b.order
          );
          if (remaining.length > 0) {
            draft.activePageId = remaining[0].id;
          }
        }
      });
    },

    renamePage: (id, name) => {
      set((draft) => {
        const page = draft.pages[id];
        if (!page) return;
        page.name = name;

        // Derive slug for non-default pages
        if (id !== DEFAULT_PAGE_ID) {
          const existingSlugs = Object.values(draft.pages)
            .filter(
              (p) =>
                p.id !== DEFAULT_PAGE_ID && p.id !== id && p.slug
            )
            .map((p) => p.slug!);
          page.slug = ensureUniqueSlug(
            nameToSlug(name),
            existingSlugs
          );
        }

        // Also update pageStylesMap name
        const styles = draft.pageStylesMap[id];
        if (styles) {
          styles.name = name;
        }
      });
    },

    duplicatePage: (pageId) => {
      const state = get();
      const sourcePage = state.pages[pageId];
      if (!sourcePage) return "";

      const newPageId = generateId("page");
      const pagesArray = Object.values(state.pages);
      const existingSlugs = pagesArray
        .filter((p) => p.id !== DEFAULT_PAGE_ID && p.slug)
        .map((p) => p.slug!);
      const copySlug = ensureUniqueSlug(
        nameToSlug(sourcePage.name + " copy"),
        existingSlugs
      );

      set((draft) => {
        // 1. Create new page entry
        draft.pages[newPageId] = {
          ...JSON.parse(JSON.stringify(sourcePage)),
          id: newPageId,
          name: sourcePage.name + " copy",
          slug: copySlug,
          order: Object.keys(draft.pages).length,
          createdAt: Date.now(),
        };

        // 2. Copy page styles
        const sourceStyles = draft.pageStylesMap[sourcePage.id];
        if (sourceStyles) {
          draft.pageStylesMap[newPageId] = {
            ...JSON.parse(JSON.stringify(sourceStyles)),
            name: sourcePage.name + " copy",
          };
        }

        // 3. Clone all elements for this page with new IDs
        const oldToNewId = new Map<string, string>();
        const sourceElements: [string, CanvasElement][] = [];
        let counter = 0;

        Object.entries(draft.elements).forEach(([elId, el]) => {
          if (el.pageId === sourcePage.id) {
            const newId = `el_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}_${counter}`;
            oldToNewId.set(elId, newId);
            sourceElements.push([
              elId,
              JSON.parse(JSON.stringify(el)),
            ]);
            counter++;
          }
        });

        // Insert cloned elements with remapped parent/children IDs
        for (const [oldId, el] of sourceElements) {
          const newId = oldToNewId.get(oldId)!;
          draft.elements[newId] = {
            ...el,
            id: newId,
            pageId: newPageId,
            parentId: el.parentId
              ? (oldToNewId.get(el.parentId) ?? null)
              : null,
            children: el.children?.map(
              (childId) => oldToNewId.get(childId) ?? childId
            ),
            createdAt: Date.now(),
          };
        }

        draft.activePageId = newPageId;
      });

      return newPageId;
    },

    updatePage: (pageId, updates) => {
      set((draft) => {
        const page = draft.pages[pageId];
        if (!page) return;
        Object.assign(page, updates);
      });
    },

    setActivePageId: (id) => {
      set((draft) => {
        draft.activePageId = id;
      });
    },

    setHomepage: (pageId) => {
      set((draft) => {
        Object.values(draft.pages).forEach((page) => {
          if (page.isHomepage && page.id !== pageId) {
            page.isHomepage = false;
          }
        });
        const page = draft.pages[pageId];
        if (page) {
          page.isHomepage = true;
        }
      });
    },

    reorderPages: (newPageOrder) => {
      set((draft) => {
        newPageOrder.forEach((pageId, index) => {
          const page = draft.pages[pageId];
          if (page && page.order !== index) {
            page.order = index;
          }
        });
      });
    },

    updatePageStyles: (pageId, updates) => {
      set((draft) => {
        const existing = draft.pageStylesMap[pageId];
        if (existing) {
          Object.assign(existing, updates);
        } else {
          draft.pageStylesMap[pageId] = updates as PageStyles;
        }
      });
    },

    // ════════════════════════════════════════════════════════════════════════
    // PASTE
    // ════════════════════════════════════════════════════════════════════════

    pasteElement: (snapshots, rootId, selectedId) => {
      const sourceEl = snapshots[rootId];
      if (!sourceEl || sourceEl.type === "component") return null;

      let newRootId: string | null = null;

      set((draft) => {
        const pageId = draft.activePageId;
        const selectedEl = selectedId
          ? draft.elements[selectedId]
          : null;

        function cloneTree(
          srcId: string,
          newParentId: string | null
        ): string | null {
          const el = snapshots[srcId];
          if (!el) return null;
          const newId = generateId(el.type as string);
          const newChildren: string[] = [];
          const srcChildren = el.children as string[] | undefined;
          if (srcChildren && srcChildren.length > 0) {
            for (const childId of srcChildren) {
              const cid = cloneTree(childId, newId);
              if (cid) newChildren.push(cid);
            }
          }
          draft.elements[newId] = {
            ...JSON.parse(JSON.stringify(el)),
            id: newId,
            parentId: newParentId,
            pageId: pageId,
            createdBy: "local",
            createdAt: Date.now(),
            children:
              newChildren.length > 0 ? newChildren : undefined,
          } as CanvasElement;
          return newId;
        }

        // Determine placement
        let targetParentId: string | null = null;
        let insertAfterChildId: string | null = null;

        if (selectedEl) {
          if (selectedEl.type === "container") {
            targetParentId = selectedId;
          } else if (selectedEl.parentId) {
            targetParentId = selectedEl.parentId;
            insertAfterChildId = selectedId;
          } else {
            targetParentId = null;
          }
        }

        const newId = cloneTree(rootId, targetParentId);
        if (!newId) return;
        newRootId = newId;

        // Insert into parent's children array
        if (targetParentId) {
          const parent = draft.elements[targetParentId];
          if (parent?.children) {
            if (insertAfterChildId) {
              const idx =
                parent.children.indexOf(insertAfterChildId);
              if (idx > -1) {
                parent.children.splice(idx + 1, 0, newId);
              } else {
                parent.children.push(newId);
              }
            } else {
              parent.children.push(newId);
            }
          }
        }
      });

      return newRootId;
    },

    // ════════════════════════════════════════════════════════════════════════
    // UNDO / REDO (placeholders — will add zundo temporal middleware)
    // ════════════════════════════════════════════════════════════════════════

    undo: () => {
      // TODO: implement with zundo temporal middleware
    },

    redo: () => {
      // TODO: implement with zundo temporal middleware
    },
  }))
);

// ─── Selectors ──────────────────────────────────────────────────────────────────

/** Select elements for the active page only. */
export function selectPageElements(
  state: DocumentState
): Record<string, CanvasElement> {
  const pageId = state.activePageId;
  const result: Record<string, CanvasElement> = {};
  Object.entries(state.elements).forEach(([key, value]) => {
    if ((value.pageId ?? "page_default") === pageId) {
      result[key] = value;
    }
  });
  return result;
}

/** Select sorted pages array. */
export function selectPagesArray(state: DocumentState): Page[] {
  return Object.values(state.pages).sort((a, b) => a.order - b.order);
}

/** Select page styles for active page. */
export function selectActivePageStyles(
  state: DocumentState
): PageStyles {
  return state.pageStylesMap[state.activePageId] ?? defaultPageStyles;
}
