/**
 * Detects whether a selected element is in a reorderable container
 * (flex or grid) and identifies its siblings.
 *
 * Also determines whether children are rendered from a .map() call
 * (array-driven) or are static JSX — this determines the reorder strategy.
 */

import type { ReorderableContainer, ReorderChild } from "../types";
import { getSelector, getReactComponentHierarchy, getReactSource } from "../selector/identifier";

/** Get the React fiber for a DOM element */
function getFiber(element: Element): any | null {
  const key = Object.keys(element).find((k) => k.startsWith("__reactFiber$"));
  return key ? (element as any)[key] : null;
}

/** Get only the element's own direct text, not children's text */
function getDirectText(el: Element): string {
  const parts: string[] = [];
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) parts.push(text);
    }
  }
  // If no direct text, try first child's direct text (e.g. heading inside a card)
  if (parts.length === 0 && el.children.length > 0) {
    const first = el.children[0];
    for (const node of first.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text) { parts.push(text); break; }
      }
    }
  }
  return parts.join(" ").slice(0, 40);
}

/** Get a brief label for a child element (for identification in output) */
function getChildLabel(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const text = getDirectText(el);
  const cls = el.className && typeof el.className === "string"
    ? el.className.trim().split(/\s+/).slice(0, 2).join(".")
    : "";

  if (text) return `<${tag}> "${text}"`;
  if (cls) return `<${tag}.${cls}>`;
  return `<${tag}>`;
}

/** Get the React component name for an element's nearest component fiber */
function getDirectComponentName(element: Element): string | null {
  const fiber = getFiber(element);
  if (!fiber) return null;

  let current = fiber.return;
  while (current) {
    if (typeof current.type === "function" || typeof current.type === "object") {
      const name =
        current.type?.displayName ||
        current.type?.name ||
        current.elementType?.displayName ||
        current.elementType?.name;
      if (name && name.length > 2 && !name.startsWith("_")) return name;
    }
    current = current.return;
  }
  return null;
}

/**
 * Detect if children come from a .map() call (array-driven) or are static JSX.
 *
 * Heuristic:
 * - If most children share the same _debugSource line number, they're from .map()
 * - If children have different source line numbers, they're static JSX
 * - If most children have explicit (non-null) keys, that's a .map() signal
 */
function detectChildrenType(container: Element): "array" | "static" {
  const children = Array.from(container.children);
  if (children.length < 2) return "static";

  const fibers = children.map(getFiber).filter(Boolean);
  if (fibers.length === 0) return "static";

  // Check source line numbers
  const sourceLines = new Map<string, number>();
  let withKeys = 0;

  for (const fiber of fibers) {
    // Check _debugSource
    const src = fiber._debugSource;
    if (src) {
      const key = `${src.fileName}:${src.lineNumber}`;
      sourceLines.set(key, (sourceLines.get(key) || 0) + 1);
    }
    // Check if explicit key exists
    if (fiber.key !== null) withKeys++;
  }

  // If most children share the same source location, it's array-driven
  const maxShared = Math.max(...sourceLines.values(), 0);
  if (maxShared >= fibers.length * 0.7) return "array";

  // If most children have explicit keys but different source lines, still array
  if (withKeys >= fibers.length * 0.7 && sourceLines.size <= 2) return "array";

  return "static";
}

/**
 * Check if an element is in a reorderable container and return container info.
 * Returns null if the element's parent is not a flex/grid container or has < 2 children.
 */
export function detectReorderableContainer(element: Element): ReorderableContainer | null {
  const parent = element.parentElement;
  if (!parent) return null;

  const computed = getComputedStyle(parent);
  const display = computed.display;

  let layout: "flex" | "grid";
  if (display === "flex" || display === "inline-flex") {
    layout = "flex";
  } else if (display === "grid" || display === "inline-grid") {
    layout = "grid";
  } else {
    return null;
  }

  // Need at least 2 children to reorder
  const domChildren = Array.from(parent.children).filter(
    (child) => {
      // Skip invisible elements (display: none, etc.)
      const cs = getComputedStyle(child);
      return cs.display !== "none" && cs.visibility !== "hidden";
    }
  );
  if (domChildren.length < 2) return null;

  const childrenType = detectChildrenType(parent);

  const children: ReorderChild[] = domChildren.map((child, index) => ({
    element: child,
    index,
    label: getChildLabel(child),
    sourceFile: getReactSource(child),
    componentName: getDirectComponentName(child),
  }));

  return {
    container: parent,
    layout,
    childrenType,
    children,
    sourceFile: getReactSource(parent),
  };
}
