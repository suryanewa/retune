/** Convert camelCase CSS property to kebab-case, preserving vendor prefixes */
export function camelToKebab(prop: string): string {
  const kebab = prop.replace(/([A-Z])/g, "-$1").toLowerCase();
  // Vendor prefixes: webkitX -> -webkit-x
  if (kebab.startsWith("webkit-")) return `-${kebab}`;
  if (kebab.startsWith("moz-")) return `-${kebab}`;
  if (kebab.startsWith("ms-")) return `-${kebab}`;
  return kebab;
}

/** Truncate a string, collapsing whitespace */
export function truncate(str: string, len: number): string {
  const cleaned = str.replace(/\s+/g, " ").trim();
  return cleaned.length > len ? cleaned.slice(0, len) + "\u2026" : cleaned;
}
