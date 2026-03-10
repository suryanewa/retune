/**
 * Extract computed styles relevant to the element type.
 * Rather than dumping all 300+ computed properties, we extract
 * a curated set based on what's visually meaningful.
 */

import { camelToKebab } from "../utils";

const SPACING_PROPS = [
  "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
  "marginTop", "marginRight", "marginBottom", "marginLeft",
] as const;

const SIZING_PROPS = [
  "width", "height", "minWidth", "maxWidth", "minHeight", "maxHeight",
] as const;

const BORDER_PROPS = [
  "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth",
  "borderTopColor", "borderRightColor", "borderBottomColor", "borderLeftColor",
  "borderTopStyle", "borderRightStyle", "borderBottomStyle", "borderLeftStyle",
  "borderTopLeftRadius", "borderTopRightRadius",
  "borderBottomLeftRadius", "borderBottomRightRadius",
] as const;

const TYPOGRAPHY_PROPS = [
  "fontSize", "fontWeight", "fontFamily", "fontStyle", "lineHeight",
  "letterSpacing", "textAlign", "verticalAlign", "textDecoration", "textTransform",
  "whiteSpace", "wordSpacing", "textIndent",
  "color",
] as const;

const BACKGROUND_PROPS = [
  "backgroundColor", "backgroundImage",
] as const;

const LAYOUT_PROPS = [
  "display", "position",
  "flexDirection", "flexWrap", "alignItems", "justifyContent", "gap", "rowGap", "columnGap",
  "gridTemplateColumns", "gridTemplateRows",
  "top", "right", "bottom", "left",
  "zIndex",
  // Flex child
  "flexGrow", "flexShrink", "flexBasis", "alignSelf", "order",
  // Grid child
  "gridColumn", "gridRow", "justifySelf",
] as const;

const VISUAL_PROPS = [
  "opacity", "overflow", "boxShadow", "textShadow", "transform",
  "filter", "backdropFilter",
] as const;

const TEXT_OVERFLOW_PROPS = [
  "textOverflow", "overflowWrap", "wordBreak",
  "webkitLineClamp", "webkitBoxOrient",
] as const;

const ALL_PROPS = [
  ...SPACING_PROPS,
  ...SIZING_PROPS,
  ...BORDER_PROPS,
  ...TYPOGRAPHY_PROPS,
  ...BACKGROUND_PROPS,
  ...LAYOUT_PROPS,
  ...VISUAL_PROPS,
  ...TEXT_OVERFLOW_PROPS,
] as const;

export type LayoutMode = "block" | "flex" | "grid" | "inline" | "absolute" | "fixed" | "relative" | "sticky";

export type ForcedState = ":hover" | ":focus" | ":active" | null;

/**
 * Find CSS rules that apply to a given element under a specific pseudo-state
 * (e.g. :hover). Returns a map of property → value for all matching rules.
 */
export function getPseudoStateStyles(
  element: Element,
  state: ":hover" | ":focus" | ":active",
): Record<string, string> {
  const styles: Record<string, string> = {};

  for (const sheet of document.styleSheets) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; // cross-origin sheet
    }

    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      if (!(rule instanceof CSSStyleRule)) continue;
      const sel = rule.selectorText;
      if (!sel.includes(state)) continue;

      // Strip the pseudo-state to get the base selector, then check if element matches
      const baseSel = sel.replace(new RegExp(state.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "g"), "").replace(/\s+/g, " ").trim();
      if (!baseSel) continue;

      try {
        if (!element.matches(baseSel)) continue;
      } catch {
        continue; // invalid selector
      }

      // Collect properties from this rule
      for (let j = 0; j < rule.style.length; j++) {
        const prop = rule.style[j];
        styles[prop] = rule.style.getPropertyValue(prop);
      }
    }
  }

  return styles;
}

export type StyleSource = {
  /** The CSS selector that sets this property (e.g. ".btn", ".btn-primary") */
  selector: string;
  /** The value declared in the stylesheet rule */
  value: string;
};

/**
 * For each CSS property on an element, find which stylesheet selector sets it.
 * Returns a map of camelCase property → StyleSource.
 * Later rules / higher specificity wins (simplified: last-match-wins like browsers).
 */
export function getStyleSources(element: Element): Record<string, StyleSource> {
  const sources: Record<string, StyleSource> = {};

  for (const sheet of document.styleSheets) {
    let rules: CSSRuleList;
    try { rules = sheet.cssRules; } catch { continue; }

    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      if (!(rule instanceof CSSStyleRule)) continue;
      const sel = rule.selectorText;
      // Skip pseudo-state rules
      if (sel.includes(":hover") || sel.includes(":focus") || sel.includes(":active")) continue;

      try { if (!element.matches(sel)) continue; } catch { continue; }

      for (let j = 0; j < rule.style.length; j++) {
        const prop = rule.style[j]; // kebab-case
        const camel = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        sources[camel] = {
          selector: sel,
          value: rule.style.getPropertyValue(prop),
        };
      }
    }
  }

  return sources;
}

/**
 * Get styles scoped to a specific selector. Only returns property values
 * from stylesheet rules whose selector contains the given scopeSelector
 * (e.g. scoping to ".toc-link" includes ".toc-link" and ".sidebar .toc-link"
 * but excludes ".toc-link.active" since that's a more specific variant).
 *
 * For properties not set by any matching rule, falls back to computed style.
 */
export function getScopedStyles(
  element: Element,
  scopeSelector: string,
): Record<string, string> {
  // Collect values from rules that belong to this scope
  const scopedValues: Record<string, string> = {};

  // Extract the class names from the scope selector (e.g. ".toc-link" → ["toc-link"])
  const scopeClasses = scopeSelector.match(/\.[a-zA-Z0-9_-]+/g) || [];

  for (const sheet of document.styleSheets) {
    let rules: CSSRuleList;
    try { rules = sheet.cssRules; } catch { continue; }

    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      if (!(rule instanceof CSSStyleRule)) continue;
      const sel = rule.selectorText;
      // Skip pseudo-state rules
      if (sel.includes(":hover") || sel.includes(":focus") || sel.includes(":active")) continue;

      try { if (!element.matches(sel)) continue; } catch { continue; }

      // Check if this rule's selector belongs to the scope.
      // A rule belongs if its selector contains exactly the scope's classes
      // but no additional classes beyond the scope (regardless of whether the element has them).
      const ruleClasses = sel.match(/\.[a-zA-Z0-9_-]+/g) || [];
      const hasScopeClass = scopeClasses.every((sc) => ruleClasses.includes(sc));
      // Reject rules that require classes beyond the scope
      // (e.g. ".toc-link.active" has ".active" which isn't in ".toc-link" scope)
      const extraClasses = ruleClasses.filter((rc) => !scopeClasses.includes(rc));

      if (!hasScopeClass || extraClasses.length > 0) continue;

      for (let j = 0; j < rule.style.length; j++) {
        const prop = rule.style[j];
        const camel = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        let value = rule.style.getPropertyValue(prop);
        if (value === "normal" && NORMAL_TO_ZERO.has(camel)) {
          value = "0px";
        }
        scopedValues[camel] = value;
      }
    }
  }

  // For properties not in any scoped rule, fall back to computed
  const computed = window.getComputedStyle(element);
  const styles: Record<string, string> = {};

  for (const prop of ALL_PROPS) {
    if (scopedValues[prop] !== undefined) {
      styles[prop] = scopedValues[prop];
    } else {
      let value = computed.getPropertyValue(camelToKebab(prop));
      if (value) {
        if (value === "normal" && NORMAL_TO_ZERO.has(prop)) {
          value = "0px";
        }
        styles[prop] = value;
      }
    }
  }

  return styles;
}

// Properties where "normal" should be resolved to "0px" for usability
const NORMAL_TO_ZERO = new Set(["gap", "rowGap", "columnGap"]);

export function getRelevantStyles(element: Element): Record<string, string> {
  const computed = window.getComputedStyle(element);
  const styles: Record<string, string> = {};

  for (const prop of ALL_PROPS) {
    let value = computed.getPropertyValue(camelToKebab(prop));
    if (value) {
      if (value === "normal" && NORMAL_TO_ZERO.has(prop)) {
        value = "0px";
      }
      styles[prop] = value;
    }
  }

  return styles;
}

export function detectLayoutMode(element: Element): LayoutMode {
  const computed = window.getComputedStyle(element);
  const display = computed.display;
  const position = computed.position;

  if (position === "fixed") return "fixed";
  if (position === "absolute") return "absolute";
  if (position === "sticky") return "sticky";
  if (position === "relative") return "relative";
  if (display.includes("flex")) return "flex";
  if (display.includes("grid")) return "grid";
  if (display.includes("inline")) return "inline";
  return "block";
}


