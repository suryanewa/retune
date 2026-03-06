/**
 * Color conversion utilities — HSV, RGB, Hex.
 * Ported from the portfolio editor's color-picker-dialog/color-utils.ts.
 */

export interface HSVA {
  h: number; // 0-360
  s: number; // 0-100
  v: number; // 0-100
  a: number; // 0-100
}

export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

// ── RGB <-> Hex ─────────────────────────────────────────────────────────

export function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  const full =
    h.length === 3 ? h[0] + h[0] + h[1] + h[1] + h[2] + h[2] : h;
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(full);
  if (!result) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(n))).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// ── RGB <-> HSV ─────────────────────────────────────────────────────────

export function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (d !== 0) {
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: h * 360, s: s * 100, v: v * 100 };
}

export function hsvToRgb(h: number, s: number, v: number): RGB {
  s /= 100;
  v /= 100;

  if (s === 0) {
    const val = Math.round(v * 255);
    return { r: val, g: val, b: val };
  }

  h = h >= 360 ? 0 : h;
  h /= 60;
  const i = Math.floor(h);
  const f = h - i;
  const p = v * (1 - s);
  const q = v * (1 - s * f);
  const t = v * (1 - s * (1 - f));

  let r: number, g: number, b: number;
  switch (i) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    default: r = v; g = p; b = q; break;
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

// ── HSV <-> Hex ─────────────────────────────────────────────────────────

export function hsvToHex(h: number, s: number, v: number): string {
  const { r, g, b } = hsvToRgb(h, s, v);
  return rgbToHex(r, g, b);
}

export function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHsv(r, g, b);
}

// ── HSVA helpers ────────────────────────────────────────────────────────

export function hexToHsva(hex: string, alpha: number = 100): HSVA {
  const { h, s, v } = hexToHsv(hex);
  return { h, s, v, a: alpha };
}

export function hsvaToHex(hsva: HSVA): string {
  return hsvToHex(hsva.h, hsva.s, hsva.v);
}

// ── CSS color string -> hex + alpha ──────────────────────────────────────

export function cssColorToHex(color: string): string {
  const { hex } = parseCssColor(color);
  return hex;
}

/**
 * Parse a CSS color string into hex + opacity (0-100).
 * Supports: #hex, rgb(), rgba(), named colors.
 */
export function parseCssColor(color: string): { hex: string; opacity: number } {
  if (!color) return { hex: "#000000", opacity: 100 };

  // Already hex
  if (color.startsWith("#")) {
    const h = color.replace("#", "");
    const fullHex = h.length === 3
      ? `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`
      : `#${h}`;
    return { hex: fullHex, opacity: 100 };
  }

  // rgba(r, g, b, a)
  const rgbaMatch = color.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/);
  if (rgbaMatch) {
    const hex = rgbToHex(parseInt(rgbaMatch[1]), parseInt(rgbaMatch[2]), parseInt(rgbaMatch[3]));
    const alpha = parseFloat(rgbaMatch[4]);
    return { hex, opacity: Math.round(alpha * 100) };
  }

  // rgb(r, g, b)
  const rgbMatch = color.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
  if (rgbMatch) {
    const hex = rgbToHex(parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3]));
    return { hex, opacity: 100 };
  }

  // transparent
  if (color === "transparent") {
    return { hex: "#000000", opacity: 0 };
  }

  return { hex: "#000000", opacity: 100 };
}

/**
 * Build a CSS rgba() string from hex + opacity (0-100).
 */
export function hexToRgba(hex: string, opacity: number): string {
  const { r, g, b } = hexToRgb(hex);
  if (opacity >= 100) return hex;
  return `rgba(${r}, ${g}, ${b}, ${(opacity / 100).toFixed(2)})`;
}
