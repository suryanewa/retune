/**
 * Parse and serialize CSS box-shadow values.
 *
 * Format: [inset] <offset-x> <offset-y> [blur] [spread] <color>
 * Computed values always use rgb/rgba colors and px units.
 */

export interface ShadowValue {
  inset: boolean;
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
  color: string;
}

/**
 * Parse a single computed box-shadow layer.
 * Computed form is always: `rgba(r, g, b, a) Xpx Ypx Bpx Spx` or with `inset`.
 */
export function parseShadow(raw: string): ShadowValue | null {
  if (!raw || raw === "none") return null;

  const trimmed = raw.trim();
  const inset = trimmed.startsWith("inset");
  let rest = inset ? trimmed.slice(5).trim() : trimmed;

  // Extract color — could be rgb(), rgba(), hsl(), hsla(), or named/hex
  let color = "rgba(0, 0, 0, 1)";

  // Match rgb/rgba/hsl/hsla at start or end
  const colorFnMatch = rest.match(/(?:rgba?|hsla?)\([^)]+\)/);
  if (colorFnMatch) {
    color = colorFnMatch[0];
    rest = rest.replace(color, "").trim();
  } else {
    // Hex or named color — try at start
    const hexMatch = rest.match(/^(#[0-9a-fA-F]{3,8})\s/);
    if (hexMatch) {
      color = hexMatch[1];
      rest = rest.slice(hexMatch[0].length).trim();
    } else {
      // Try hex/named at end
      const endMatch = rest.match(/\s+(#[0-9a-fA-F]{3,8}|[a-zA-Z]+)$/);
      if (endMatch) {
        color = endMatch[1];
        rest = rest.slice(0, -endMatch[0].length).trim();
      }
    }
  }

  // Remaining should be numeric values (px)
  const nums = rest.match(/-?[\d.]+/g);
  if (!nums || nums.length < 2) return null;

  return {
    inset,
    offsetX: parseFloat(nums[0]) || 0,
    offsetY: parseFloat(nums[1]) || 0,
    blur: parseFloat(nums[2]) || 0,
    spread: parseFloat(nums[3]) || 0,
    color,
  };
}

/**
 * Parse a full box-shadow string (may have multiple layers).
 * We only support editing the first layer for simplicity.
 */
export function parseBoxShadow(raw: string): ShadowValue | null {
  if (!raw || raw === "none") return null;

  // Split on commas that are NOT inside parentheses
  let depth = 0;
  let start = 0;
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === "(") depth++;
    else if (raw[i] === ")") depth--;
    else if (raw[i] === "," && depth === 0) {
      // Take first layer only
      return parseShadow(raw.slice(start, i));
    }
  }
  return parseShadow(raw.slice(start));
}

/** Serialize a ShadowValue back to CSS */
export function shadowToCss(s: ShadowValue): string {
  const parts: string[] = [];
  if (s.inset) parts.push("inset");
  parts.push(`${s.offsetX}px`);
  parts.push(`${s.offsetY}px`);
  parts.push(`${s.blur}px`);
  parts.push(`${s.spread}px`);
  parts.push(s.color);
  return parts.join(" ");
}

/** Create a default shadow value */
export function defaultShadow(): ShadowValue {
  return {
    inset: false,
    offsetX: 0,
    offsetY: 4,
    blur: 8,
    spread: 0,
    color: "rgba(0, 0, 0, 0.15)",
  };
}
