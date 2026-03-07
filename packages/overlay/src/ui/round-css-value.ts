/**
 * Round numeric portions of a CSS value to whole numbers.
 * e.g. "203.328125px" → "203px", "auto" → "auto", "16px" → "16px"
 */
export function roundCssValue(val: string): string {
  return val.replace(/-?\d+\.\d+/g, (match) => {
    return String(Math.round(parseFloat(match)));
  });
}

const UNITLESS_PROPS = new Set([
  "opacity", "z-index", "zIndex", "line-height", "lineHeight",
  "font-weight", "fontWeight", "flex-grow", "flexGrow",
  "flex-shrink", "flexShrink", "order", "orphans", "widows",
  "columns", "column-count", "columnCount", "tab-size", "tabSize",
]);

const UNIT_RE = /[a-z%]+$/i;
const BARE_NUMBER_RE = /^-?\d+(\.\d+)?$/;

const VALID_CSS_UNITS = new Set([
  "px", "em", "rem", "%", "vh", "vw", "vmin", "vmax",
  "ch", "ex", "cap", "ic", "lh", "rlh",
  "svh", "svw", "lvh", "lvw", "dvh", "dvw",
  "cm", "mm", "in", "pt", "pc", "q",
  "deg", "rad", "grad", "turn", "s", "ms", "fr",
]);

/**
 * If the user typed a bare number, infer the unit from the previous value.
 * Explicit units (50%, 2em) and keywords (auto) pass through unchanged.
 * Unitless CSS properties never get a unit appended.
 * Defaults to px when previous value has no valid CSS unit.
 */
export function inferCssUnit(input: string, prevValue: string, prop: string): string {
  const trimmed = input.trim();
  if (!BARE_NUMBER_RE.test(trimmed)) return trimmed;
  if (UNITLESS_PROPS.has(prop)) return trimmed;

  const unitMatch = prevValue.match(UNIT_RE);
  if (unitMatch && VALID_CSS_UNITS.has(unitMatch[0].toLowerCase())) {
    return trimmed + unitMatch[0];
  }

  return trimmed + "px";
}
