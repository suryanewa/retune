/** Convert camelCase CSS property to kebab-case, preserving vendor prefixes */
export function camelToKebab(prop: string): string {
  // Handle vendor prefixes before converting: webkitFilter -> WebkitFilter -> -webkit-filter
  if (prop.startsWith("webkit") || prop.startsWith("moz") || prop.startsWith("ms")) {
    return "-" + prop.replace(/([A-Z])/g, "-$1").toLowerCase();
  }
  return prop.replace(/([A-Z])/g, "-$1").toLowerCase();
}

/** Truncate a string, collapsing whitespace */
export function truncate(str: string, len: number): string {
  const cleaned = str.replace(/\s+/g, " ").trim();
  return cleaned.length > len ? cleaned.slice(0, len) + "\u2026" : cleaned;
}
