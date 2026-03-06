/**
 * ColorInput — color swatch + hex text input.
 * Clicking the swatch opens a floating ColorPicker panel.
 */

import { useState, useRef, useCallback } from "react";
import { cssColorToHex } from "./color-utils";
import { ColorPicker } from "./color-picker";

export interface ColorInputProps {
  prop: string;
  value: string | undefined;
  onChange: (prop: string, value: string) => void;
}

export function ColorInput({ prop, value, onChange }: ColorInputProps) {
  const [localValue, setLocalValue] = useState(value || "");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const swatchRef = useRef<HTMLDivElement>(null);

  // Sync from parent
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setLocalValue(value || "");
  }

  const hexValue = cssColorToHex(localValue);

  const handleSwatchClick = useCallback(() => {
    if (pickerOpen) {
      setPickerOpen(false);
      return;
    }
    const el = swatchRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setAnchorRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    setPickerOpen(true);
  }, [pickerOpen]);

  const handlePickerChange = useCallback((hex: string) => {
    setLocalValue(hex);
    onChange(prop, hex);
  }, [prop, onChange]);

  const handlePickerClose = useCallback(() => {
    setPickerOpen(false);
  }, []);

  return (
    <div className="composer-prop color">
      <div
        ref={swatchRef}
        className="composer-color-swatch"
        onClick={handleSwatchClick}
        style={{ cursor: "pointer" }}
      >
        <div className="composer-color-swatch-inner">
          <div className="composer-color-swatch-fill" style={{ background: localValue }} />
        </div>
      </div>
      <input
        className="composer-prop-input"
        style={{ paddingLeft: 0 }}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={() => onChange(prop, localValue)}
        onKeyDown={(e) => { if (e.key === "Enter") { onChange(prop, localValue); (e.target as HTMLInputElement).blur(); } }}
        spellCheck={false}
      />
      {pickerOpen && anchorRect && (
        <ColorPicker
          value={hexValue}
          onChange={handlePickerChange}
          onClose={handlePickerClose}
          anchorRect={anchorRect}
        />
      )}
    </div>
  );
}
