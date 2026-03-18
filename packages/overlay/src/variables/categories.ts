import type { VariableCategory } from "./types";

/** Map CSS properties to token categories */
const PROPERTY_CATEGORY: Record<string, VariableCategory> = {
  // Spacing
  "padding": "spacing", "padding-top": "spacing", "padding-right": "spacing",
  "padding-bottom": "spacing", "padding-left": "spacing",
  "padding-inline": "spacing", "padding-inline-start": "spacing", "padding-inline-end": "spacing",
  "padding-block": "spacing", "padding-block-start": "spacing", "padding-block-end": "spacing",
  "margin": "spacing", "margin-top": "spacing", "margin-right": "spacing",
  "margin-bottom": "spacing", "margin-left": "spacing",
  "margin-inline": "spacing", "margin-inline-start": "spacing", "margin-inline-end": "spacing",
  "margin-block": "spacing", "margin-block-start": "spacing", "margin-block-end": "spacing",
  "gap": "spacing", "row-gap": "spacing", "column-gap": "spacing",

  // Sizing
  "width": "sizing", "height": "sizing",
  "min-width": "sizing", "max-width": "sizing",
  "min-height": "sizing", "max-height": "sizing",
  "inline-size": "sizing", "block-size": "sizing",
  "min-inline-size": "sizing", "max-inline-size": "sizing",
  "min-block-size": "sizing", "max-block-size": "sizing",

  // Colors
  "color": "colors", "background-color": "colors",
  "border-color": "colors",
  "border-top-color": "colors", "border-right-color": "colors",
  "border-bottom-color": "colors", "border-left-color": "colors",
  "border-inline-start-color": "colors", "border-inline-end-color": "colors",
  "border-block-start-color": "colors", "border-block-end-color": "colors",
  "outline-color": "colors",
  "text-decoration-color": "colors", "accent-color": "colors", "caret-color": "colors",
  "fill": "colors", "stroke": "colors",

  // Typography (per-property categories)
  "font-size": "font-size",
  "font-weight": "font-weight",
  "line-height": "line-height",
  "letter-spacing": "letter-spacing",
  "font-family": "font-family",

  // Border radius
  "border-radius": "border-radius",
  "border-top-left-radius": "border-radius", "border-top-right-radius": "border-radius",
  "border-bottom-left-radius": "border-radius", "border-bottom-right-radius": "border-radius",
  "border-start-start-radius": "border-radius", "border-start-end-radius": "border-radius",
  "border-end-start-radius": "border-radius", "border-end-end-radius": "border-radius",

  // Border width
  "border-width": "border-width",
  "border-top-width": "border-width", "border-right-width": "border-width",
  "border-bottom-width": "border-width", "border-left-width": "border-width",
  "border-inline-start-width": "border-width", "border-inline-end-width": "border-width",
  "border-block-start-width": "border-width", "border-block-end-width": "border-width",

  // Box shadow
  "box-shadow": "box-shadow",

  // Opacity
  "opacity": "opacity",

  // Layout
  "display": "layout", "flex-direction": "layout",
  "align-items": "layout", "justify-content": "layout",
  "flex-wrap": "layout", "position": "layout",
};

/** Get the token category for a CSS property, or null if not categorized */
export function getCategoryForProperty(prop: string): VariableCategory | null {
  return PROPERTY_CATEGORY[prop] ?? null;
}

/** Get all CSS properties that belong to a category */
export function getPropertiesForCategory(category: VariableCategory): string[] {
  return Object.entries(PROPERTY_CATEGORY)
    .filter(([, cat]) => cat === category)
    .map(([prop]) => prop);
}

/** Get the category for a camelCase property name (converts to kebab-case first) */
export function getCategoryForCamelProp(prop: string): VariableCategory | null {
  const kebab = prop.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
  return getCategoryForProperty(kebab);
}
