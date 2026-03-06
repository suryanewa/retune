/**
 * Gradient types, CSS parsing, and CSS generation utilities.
 */

import { hexToRgb, rgbToHex, parseCssColor, hexToRgba } from "./color-utils";

// ── Types ──────────────────────────────────────────────────────────────

export interface GradientStop {
  color: string;     // hex e.g. "#ff0000"
  position: number;  // 0–1
  opacity?: number;  // 0–100, defaults to 100
}

export interface GradientFill {
  type: "linear" | "radial" | "conic";
  stops: GradientStop[];
  angle: number; // degrees
}

export type FillMode = "solid" | "linear" | "radial" | "conic";

// ── Defaults ───────────────────────────────────────────────────────────

export function defaultGradient(): GradientFill {
  return {
    type: "linear",
    angle: 180,
    stops: [
      { color: "#ffffff", position: 0, opacity: 100 },
      { color: "#000000", position: 1, opacity: 100 },
    ],
  };
}

// ── CSS Generation ─────────────────────────────────────────────────────

export function gradientToCss(gradient: GradientFill): string {
  if (gradient.stops.length < 2) return "none";

  const sorted = [...gradient.stops].sort((a, b) => a.position - b.position);
  const stopsCss = sorted
    .map((s) => {
      const alpha = (s.opacity ?? 100) / 100;
      const color = alpha < 1 ? hexToRgba(s.color, Math.round(alpha * 100)) : s.color;
      return `${color} ${Math.round(s.position * 100)}%`;
    })
    .join(", ");

  switch (gradient.type) {
    case "linear":
      return `linear-gradient(${gradient.angle}deg, ${stopsCss})`;
    case "radial":
      return `radial-gradient(circle, ${stopsCss})`;
    case "conic":
      return `conic-gradient(from ${gradient.angle}deg, ${stopsCss})`;
  }
}

/** Always left-to-right for stop bar preview. */
export function gradientBarCss(stops: GradientStop[]): string {
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  const stopsCss = sorted
    .map((s) => {
      const alpha = (s.opacity ?? 100) / 100;
      const color = alpha < 1 ? hexToRgba(s.color, Math.round(alpha * 100)) : s.color;
      return `${color} ${Math.round(s.position * 100)}%`;
    })
    .join(", ");
  return `linear-gradient(to right, ${stopsCss})`;
}

// ── CSS Parsing ────────────────────────────────────────────────────────

/**
 * Parse a CSS gradient string into a GradientFill.
 * Handles linear-gradient, radial-gradient, conic-gradient.
 */
export function parseCssGradient(css: string): GradientFill | null {
  if (!css || css === "none") return null;

  const linearMatch = css.match(/^linear-gradient\((.+)\)$/);
  const radialMatch = css.match(/^radial-gradient\((.+)\)$/);
  const conicMatch = css.match(/^conic-gradient\((.+)\)$/);

  let type: GradientFill["type"] = "linear";
  let angle = 180;
  let stopsStr = "";

  if (linearMatch) {
    type = "linear";
    const inner = linearMatch[1];
    // Check for angle: "180deg, ..." or "to right, ..."
    const angleMatch = inner.match(/^(\d+(?:\.\d+)?)deg\s*,\s*(.+)$/);
    if (angleMatch) {
      angle = parseFloat(angleMatch[1]);
      stopsStr = angleMatch[2];
    } else {
      const dirMatch = inner.match(/^to\s+([\w\s]+)\s*,\s*(.+)$/);
      if (dirMatch) {
        angle = directionToAngle(dirMatch[1].trim());
        stopsStr = dirMatch[2];
      } else {
        stopsStr = inner;
      }
    }
  } else if (radialMatch) {
    type = "radial";
    const inner = radialMatch[1];
    // Skip shape prefix like "circle, " or "ellipse at center, "
    const shapeMatch = inner.match(/^(?:circle|ellipse)(?:\s+[^,]*)?\s*,\s*(.+)$/);
    stopsStr = shapeMatch ? shapeMatch[1] : inner;
  } else if (conicMatch) {
    type = "conic";
    const inner = conicMatch[1];
    const fromMatch = inner.match(/^from\s+(\d+(?:\.\d+)?)deg\s*,\s*(.+)$/);
    if (fromMatch) {
      angle = parseFloat(fromMatch[1]);
      stopsStr = fromMatch[2];
    } else {
      stopsStr = inner;
    }
  } else {
    return null;
  }

  const stops = parseStopsString(stopsStr);
  if (stops.length < 2) return null;

  return { type, angle, stops };
}

function parseStopsString(str: string): GradientStop[] {
  const stops: GradientStop[] = [];
  // Split on commas that aren't inside parentheses
  const parts = splitGradientStops(str);

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) continue;

    // Match "color position%" pattern
    const posMatch = part.match(/^(.+?)\s+(\d+(?:\.\d+)?)%$/);
    let colorStr: string;
    let position: number;

    if (posMatch) {
      colorStr = posMatch[1].trim();
      position = parseFloat(posMatch[2]) / 100;
    } else {
      colorStr = part;
      // Auto-distribute position
      position = parts.length > 1 ? i / (parts.length - 1) : 0;
    }

    const { hex, opacity } = parseCssColor(colorStr);
    stops.push({ color: hex, position, opacity });
  }

  return stops;
}

function splitGradientStops(str: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";

  for (const ch of str) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;

    if (ch === "," && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current);
  return parts;
}

function directionToAngle(dir: string): number {
  const map: Record<string, number> = {
    "top": 0,
    "top right": 45,
    "right": 90,
    "bottom right": 135,
    "bottom": 180,
    "bottom left": 225,
    "left": 270,
    "top left": 315,
  };
  return map[dir] ?? 180;
}

// ── Color interpolation ────────────────────────────────────────────────

export function interpolateColor(stops: GradientStop[], position: number): string {
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  let left = sorted[0];
  let right = sorted[sorted.length - 1];

  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].position <= position && sorted[i + 1].position >= position) {
      left = sorted[i];
      right = sorted[i + 1];
      break;
    }
  }

  const range = right.position - left.position;
  const t = range === 0 ? 0 : (position - left.position) / range;
  const lRgb = hexToRgb(left.color);
  const rRgb = hexToRgb(right.color);

  return rgbToHex(
    Math.round(lRgb.r + (rRgb.r - lRgb.r) * t),
    Math.round(lRgb.g + (rRgb.g - lRgb.g) * t),
    Math.round(lRgb.b + (rRgb.b - lRgb.b) * t),
  );
}

// ── Fill mode detection ────────────────────────────────────────────────

export function detectFillMode(backgroundColor: string | undefined, backgroundImage: string | undefined): FillMode {
  if (backgroundImage && backgroundImage !== "none") {
    const gradient = parseCssGradient(backgroundImage);
    if (gradient) return gradient.type;
  }
  return "solid";
}
