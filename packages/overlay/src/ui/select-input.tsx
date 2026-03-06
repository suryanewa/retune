/**
 * SelectInput — dropdown select with a label prefix.
 * Uses the DropdownMenu for a consistent dark-themed dropdown.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { DropdownMenu, type DropdownMenuOption } from "./dropdown-menu";

export interface SelectInputProps {
  label?: string;
  prop: string;
  value: string | undefined;
  options: string[];
  onChange: (prop: string, value: string) => void;
}

export function SelectInput({ label, prop, value, options, onChange }: SelectInputProps) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const openDropdown = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const estimatedHeight = options.length * 28 + 12;
    const spaceBelow = window.innerHeight - rect.bottom - 4;
    const flipUp = spaceBelow < estimatedHeight && rect.top > spaceBelow;
    const top = flipUp ? rect.top - estimatedHeight - 4 : rect.bottom + 4;
    setDropdownPos({ top: Math.max(4, top), left: rect.left, width: rect.width });
    setOpen(true);
    setHighlightedIndex(-1);
  }, [options.length]);

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setHighlightedIndex(-1);
    setDropdownPos(null);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: PointerEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const path = e.composedPath();
      if (!path.includes(container)) {
        closeDropdown();
      }
    };
    const root = containerRef.current?.getRootNode() as ShadowRoot | Document;
    root.addEventListener("pointerdown", handlePointerDown as EventListener);
    return () => root.removeEventListener("pointerdown", handlePointerDown as EventListener);
  }, [open, closeDropdown]);

  const menuOptions: DropdownMenuOption[] = options.map((opt) => ({
    value: opt,
    label: opt,
  }));

  const handleSelect = (option: DropdownMenuOption) => {
    onChange(prop, option.value);
    closeDropdown();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (open && highlightedIndex >= 0) {
        handleSelect(menuOptions[highlightedIndex]);
      } else {
        open ? closeDropdown() : openDropdown();
      }
    } else if (e.key === "Escape") {
      closeDropdown();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (open) {
        setHighlightedIndex((prev) => prev < options.length - 1 ? prev + 1 : prev);
      } else {
        openDropdown();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (open) {
        setHighlightedIndex((prev) => prev > 0 ? prev - 1 : prev);
      }
    }
  };

  return (
    <div className="composer-select" ref={containerRef}>
      <button
        type="button"
        className="composer-select-button"
        onClick={() => { open ? closeDropdown() : openDropdown(); }}
        onKeyDown={handleKeyDown}
      >
        {label && <span className="composer-select-label">{label}</span>}
        <span className="composer-select-value" style={label ? undefined : { paddingLeft: 8 }}>{value || ""}</span>
        <span className="composer-select-chevron">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2.5 4L5 6.5L7.5 4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      {open && dropdownPos && (
        <div
          className="composer-select-dropdown-anchor"
          style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}
        >
          <DropdownMenu
            options={menuOptions}
            value={value}
            highlightedIndex={highlightedIndex}
            onSelect={handleSelect}
            onHighlight={setHighlightedIndex}
            showCheckmark
          />
        </div>
      )}
    </div>
  );
}
