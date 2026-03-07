/**
 * ShorthandInput — handles comma/space-separated values for
 * multi-property fields like padding (H/V) and border-radius.
 *
 * Displays a merged value when all props match, or comma-separated
 * individual values when they differ. Supports CSS shorthand input.
 */

import { useState, useRef, type ReactNode } from "react";
import { roundCssValue, inferCssUnit } from "./round-css-value";

export interface ShorthandInputProps {
  label?: ReactNode;
  props: string[];
  values: string[];
  onChange: (prop: string, value: string) => void;
  placeholder?: string;
}

function computeDisplay(values: string[]): string {
  const rounded = values.map((v) => roundCssValue(v || ""));
  if (rounded.every((v) => v === rounded[0])) return rounded[0];
  return rounded.join(", ");
}

export function ShorthandInput({ label, props, values, onChange, placeholder }: ShorthandInputProps) {
  const [localValue, setLocalValue] = useState(() => computeDisplay(values));
  const [prevValues, setPrevValues] = useState(values);

  // Sync from external changes
  if (values.join("\0") !== prevValues.join("\0")) {
    setPrevValues(values);
    setLocalValue(computeDisplay(values));
  }

  // Scrub-to-adjust: drag on label changes all values equally
  const scrubRef = useRef({ startX: 0, startVals: [] as number[], active: false });

  const handleLabelPointerDown = (e: React.PointerEvent) => {
    const nums = values.map((v) => parseFloat(v));
    if (nums.some(isNaN)) return;
    scrubRef.current = { startX: e.clientX, startVals: nums, active: true };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleLabelPointerMove = (e: React.PointerEvent) => {
    if (!scrubRef.current.active) return;
    const delta = Math.round(e.clientX - scrubRef.current.startX);
    const unit = values[0]?.match(/[a-z%]+$/i)?.[0] || "px";
    const newVals = scrubRef.current.startVals.map((v) => `${v + delta}${unit}`);
    setLocalValue(computeDisplay(newVals));
    props.forEach((prop, i) => onChange(prop, newVals[i]));
  };

  const handleLabelPointerUp = () => {
    scrubRef.current.active = false;
  };

  const commitValue = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;

    // Parse: "10" -> all same, "10, 20" or "10 20" -> individual
    const parts = trimmed.includes(",")
      ? trimmed.split(",").map((s) => s.trim()).filter(Boolean)
      : trimmed.split(/\s+/);

    if (parts.length === 1) {
      const resolved = inferCssUnit(parts[0], values[0] || "", props[0]);
      props.forEach((prop) => onChange(prop, resolved));
      setLocalValue(roundCssValue(resolved));
    } else {
      // Map parts to props (cycle if fewer parts than props)
      const resolved = props.map((prop, i) =>
        inferCssUnit(parts[i % parts.length], values[i] || "", prop)
      );
      props.forEach((prop, i) => onChange(prop, resolved[i]));
      setLocalValue(computeDisplay(resolved));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      commitValue(localValue);
      (e.target as HTMLInputElement).blur();
    }
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      const delta = e.key === "ArrowUp" ? step : -step;
      const newVals = values.map((v) => {
        const num = parseFloat(v);
        const base = isNaN(num) ? 0 : num;
        const unit = isNaN(num) ? "px" : (v.match(/[a-z%]+$/i)?.[0] || "px");
        return `${base + delta}${unit}`;
      });
      setLocalValue(computeDisplay(newVals));
      props.forEach((prop, i) => onChange(prop, newVals[i]));
    }
  };

  return (
    <div className="composer-prop">
      {label && (
        <span
          className="composer-prop-label"
          onPointerDown={handleLabelPointerDown}
          onPointerMove={handleLabelPointerMove}
          onPointerUp={handleLabelPointerUp}
        >
          {label}
        </span>
      )}
      <input
        className="composer-prop-input"
        value={localValue}
        placeholder={placeholder}
        onFocus={(e) => e.target.select()}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={() => commitValue(localValue)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
      />
    </div>
  );
}
