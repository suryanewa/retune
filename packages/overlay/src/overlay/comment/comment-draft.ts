import type { Comment, CommentElementTarget } from "../../engine/comment-store";
import type { InspectedElement } from "../../types";

export type CommentDraft = {
  position: { x: number; y: number };
  type: "element" | "area";
  selector?: string;
  anchorOffset?: { x: number; y: number };
  area?: { x: number; y: number; width: number; height: number };
  areaScroll?: { x: number; y: number };
  elementInfo?: Comment["elementInfo"];
  spanMentionCount?: number;
};

export type ContainedCommentElement = {
  tagName: string;
  selector: string;
  componentName: string | null;
  textContent: string | null;
};

export function getMentionName(tagName: string, componentName: string | null): string {
  const rawName = componentName || tagName.toLowerCase();
  return componentName ? rawName : rawName.charAt(0).toUpperCase() + rawName.slice(1);
}

export function getQuickSelector(el: Element): string {
  if (el.id) return "#" + CSS.escape(el.id);
  let base: string;
  const cls = Array.from(el.classList).filter(c => !c.startsWith("_") && !/^[a-z]{1,3}[A-Za-z0-9_]{8,}$/.test(c));
  if (cls.length > 0) {
    base = "." + cls.map(c => CSS.escape(c)).join(".");
  } else {
    base = el.tagName.toLowerCase();
  }
  const parent = el.parentElement;
  if (parent) {
    const siblings = Array.from(parent.children).filter(s => {
      if (s === el) return true;
      if (s.id || el.id) return false;
      if (cls.length > 0) return cls.every(c => s.classList.contains(c));
      return s.tagName === el.tagName;
    });
    if (siblings.length > 1) {
      const idx = Array.from(parent.children).indexOf(el) + 1;
      base += `:nth-child(${idx})`;
    }
  }
  return base;
}

export function getQuickComponentName(el: Element): string | null {
  const key = Object.keys(el).find(k => k.startsWith("__reactFiber$"));
  if (!key) return null;
  let fiber = (el as any)[key]?.return;
  while (fiber) {
    if (typeof fiber.type === "function" || typeof fiber.type === "object") {
      const n = fiber.type?.displayName || fiber.type?.name;
      if (n && n.length > 2 && !n.startsWith("_") && !/^(Fragment|Suspense|StrictMode|Provider|Consumer|Context)/.test(n)) return n;
    }
    fiber = fiber.return;
  }
  return null;
}

export function buildCommentTargetFromInspected(inspected: InspectedElement): CommentElementTarget {
  const source = inspected.sourceFile
    ? `${inspected.sourceFile.fileName}:${inspected.sourceFile.lineNumber}${
      inspected.sourceFile.columnNumber ? `:${inspected.sourceFile.columnNumber}` : ""
    }`
    : undefined;
  return {
    tagName: inspected.tagName.toLowerCase(),
    selector: inspected.selector,
    componentName: inspected.reactComponents.length > 0
      ? inspected.reactComponents[inspected.reactComponents.length - 1]
      : null,
    componentPath: inspected.reactComponents,
    classes: inspected.classes,
    textContent: inspected.textContent,
    source,
    domPath: inspected.domPath || undefined,
  };
}

export function buildElementCommentDraft(element: Element, cursor: { x: number; y: number }, inspected: InspectedElement): CommentDraft {
  const selector = getQuickSelector(element);
  const componentName = getQuickComponentName(element);
  const selectorPath: string[] = [selector];
  let ancestor = element.parentElement;
  for (let i = 0; i < 3 && ancestor && ancestor !== document.body; i++) {
    selectorPath.unshift(getQuickSelector(ancestor));
    ancestor = ancestor.parentElement;
  }
  const rect = element.getBoundingClientRect();
  return {
    position: { x: cursor.x, y: cursor.y },
    type: "element",
    selector: selectorPath.join(" > "),
    anchorOffset: { x: cursor.x - rect.left, y: cursor.y - rect.top },
    spanMentionCount: 1,
    elementInfo: {
      tagName: element.tagName.toLowerCase(),
      componentName,
      componentPath: [],
      classes: Array.from(element.classList),
      textContent: (element.textContent || "").slice(0, 80).trim() || null,
      selectedElements: [buildCommentTargetFromInspected(inspected)],
    },
  };
}

export function buildSelectionCommentDraft(
  targets: InspectedElement[],
  primary: InspectedElement,
  cursor: { x: number; y: number },
): CommentDraft {
  const selectedTargets = targets.map(buildCommentTargetFromInspected);
  const primaryTarget = buildCommentTargetFromInspected(primary);
  const selectorPath: string[] = [getQuickSelector(primary.element)];
  let ancestor = primary.element.parentElement;
  for (let i = 0; i < 3 && ancestor && ancestor !== document.body; i++) {
    selectorPath.unshift(getQuickSelector(ancestor));
    ancestor = ancestor.parentElement;
  }
  const rect = primary.element.getBoundingClientRect();
  return {
    position: { x: cursor.x, y: cursor.y },
    type: "element",
    selector: selectorPath.join(" > "),
    anchorOffset: { x: cursor.x - rect.left, y: cursor.y - rect.top },
    spanMentionCount: selectedTargets.length,
    elementInfo: {
      tagName: primaryTarget.tagName,
      componentName: primaryTarget.componentName,
      componentPath: primaryTarget.componentPath ?? [],
      classes: primaryTarget.classes,
      textContent: primaryTarget.textContent,
      source: primaryTarget.source,
      domPath: primaryTarget.domPath,
      selectedElements: selectedTargets,
    },
  };
}

export function getDraftElementTargets(draft: CommentDraft): CommentElementTarget[] {
  const info = draft.elementInfo;
  if (!info) return [];
  if (info.selectedElements) return info.selectedElements;
  return [{
    tagName: info.tagName,
    selector: draft.selector ?? "",
    componentName: info.componentName,
    componentPath: info.componentPath,
    classes: info.classes,
    textContent: info.textContent,
    source: info.source,
    domPath: info.domPath,
  }];
}

export function scanContainedElements(area: { x: number; y: number; width: number; height: number }): ContainedCommentElement[] {
  const containedElements: ContainedCommentElement[] = [];
  const step = 20;
  const seen = new Set<Element>();
  for (let x = area.x + step / 2; x < area.x + area.width; x += step) {
    for (let y = area.y + step / 2; y < area.y + area.height; y += step) {
      const el = document.elementFromPoint(x, y);
      if (el && !seen.has(el) && !el.closest?.("[data-retune-host]")) {
        seen.add(el);
        containedElements.push({
          tagName: el.tagName.toLowerCase(),
          selector: getQuickSelector(el),
          componentName: getQuickComponentName(el),
          textContent: (el.textContent || "").slice(0, 40).trim() || null,
        });
      }
    }
  }
  return containedElements;
}
