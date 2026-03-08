/**
 * Parse and serialize CSS filter / backdrop-filter values.
 *
 * Supports: blur, brightness, contrast, hue-rotate, invert, saturate, sepia.
 * Each filter function is stored as a separate FilterItem.
 */

export type FilterType =
  | "blur"
  | "brightness"
  | "contrast"
  | "hue-rotate"
  | "invert"
  | "saturate"
  | "sepia";

export type FilterTarget = "layer" | "backdrop";

export interface FilterItem {
  id: string;
  type: FilterType;
  value: number;
  target: FilterTarget;
}

export const FILTER_TYPES: FilterType[] = [
  "blur",
  "brightness",
  "contrast",
  "hue-rotate",
  "invert",
  "saturate",
  "sepia",
];

export interface FilterConfig {
  label: string;
  unit: string;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
}

export const FILTER_CONFIG: Record<FilterType, FilterConfig> = {
  blur:         { label: "Blur",        unit: "px",  defaultValue: 4,   min: 0, max: 50,  step: 1 },
  brightness:   { label: "Brightness",  unit: "%",   defaultValue: 100, min: 0, max: 300, step: 1 },
  contrast:     { label: "Contrast",    unit: "%",   defaultValue: 100, min: 0, max: 200, step: 1 },
  "hue-rotate": { label: "Hue rotate",  unit: "deg", defaultValue: 0,   min: 0, max: 360, step: 1 },
  invert:       { label: "Invert",      unit: "%",   defaultValue: 0,   min: 0, max: 100, step: 1 },
  saturate:     { label: "Saturate",    unit: "%",   defaultValue: 100, min: 0, max: 300, step: 1 },
  sepia:        { label: "Sepia",       unit: "%",   defaultValue: 0,   min: 0, max: 100, step: 1 },
};

let nextId = 1;
function genId(): string {
  return `f${nextId++}`;
}

/** Parse a CSS filter string into individual FilterItem objects */
function parseFilterString(raw: string, target: FilterTarget): FilterItem[] {
  if (!raw || raw === "none") return [];
  const items: FilterItem[] = [];
  // Match filter functions like blur(4px), brightness(120%), etc.
  const re = /(blur|brightness|contrast|hue-rotate|invert|saturate|sepia)\(([^)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    const type = m[1] as FilterType;
    const val = parseFloat(m[2]) || 0;
    items.push({ id: genId(), type, value: val, target });
  }
  return items;
}

/** Parse both filter and backdropFilter computed values into a single array */
export function parseFilters(filter: string, backdropFilter: string): FilterItem[] {
  return [
    ...parseFilterString(filter, "layer"),
    ...parseFilterString(backdropFilter, "backdrop"),
  ];
}

/** Convert a FilterItem to its CSS function string */
function filterToCssFunction(item: FilterItem): string {
  const config = FILTER_CONFIG[item.type];
  return `${item.type}(${item.value}${config.unit})`;
}

/** Convert an array of FilterItems to { filter, backdropFilter } CSS values */
export function filtersToCss(items: FilterItem[]): { filter: string; backdropFilter: string } {
  const layerParts = items.filter((f) => f.target === "layer").map(filterToCssFunction);
  const backdropParts = items.filter((f) => f.target === "backdrop").map(filterToCssFunction);
  return {
    filter: layerParts.length ? layerParts.join(" ") : "none",
    backdropFilter: backdropParts.length ? backdropParts.join(" ") : "none",
  };
}

/** Create a default filter item */
export function defaultFilter(type: FilterType, target: FilterTarget): FilterItem {
  return {
    id: genId(),
    type,
    value: FILTER_CONFIG[type].defaultValue,
    target,
  };
}
