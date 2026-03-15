/**
 * TokenDialog — floating panel for browsing and selecting variables.
 * Shows all available CSS custom properties for a CSS property with search
 * and category grouping.
 *
 * Uses FloatingDialog as the shell (positioning, header, search, close handling).
 * List items use native DOM event listeners because React's event
 * delegation doesn't work inside Shadow DOM portals (see variable-action.tsx).
 */

import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import type { UtilityToken } from "../tokens/types";
import { getTokensForProperty } from "../tokens/resolver";
import { getCategoryForProperty } from "../tokens/categories";
import { FloatingDialog } from "./floating-dialog";
import { Tooltip } from "./tooltip";

export interface TokenDialogProps {
  property: string;
  currentToken?: UtilityToken;
  onSelect: (token: UtilityToken) => void;
  onUnlink?: () => void;
  onClose: () => void;
  anchorRect: { top: number; left: number; width: number; height: number };
}

/** Format a variable name for display: strip var(-- ) wrapper → "spacing-4" */
function formatName(className: string): string {
  if (className.startsWith("var(--") && className.endsWith(")")) {
    return className.slice(6, -1);
  }
  return className;
}

/** Format a variable value for display (first property value, simplified) */
function formatValue(token: UtilityToken): string {
  const vals = Object.values(token.values);
  if (vals.length === 0) return "";
  const val = vals[0];
  return val.length > 20 ? val.slice(0, 20) + "\u2026" : val;
}

/** Get a swatch color if this is a color variable */
function getSwatchColor(token: UtilityToken): string | null {
  for (const [prop, val] of Object.entries(token.values)) {
    if (prop.includes("color") || prop === "background-color" || prop === "fill" || prop === "stroke") {
      return val;
    }
  }
  return null;
}

export function TokenDialog({ property, currentToken, onSelect, onUnlink, onClose, anchorRect }: TokenDialogProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const allTokens = useMemo(() => getTokensForProperty(property), [property]);
  const category = getCategoryForProperty(property.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`));
  const isColor = category === "colors";

  const filtered = useMemo(() => {
    if (!search) return allTokens;
    const q = search.toLowerCase();
    return allTokens.filter(t =>
      t.className.toLowerCase().includes(q) ||
      Object.values(t.values).some(v => v.toLowerCase().includes(q))
    );
  }, [allTokens, search]);

  // Reset highlight when the filtered list changes (e.g. new search query)
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [filtered]);

  // Auto-scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex < 0) return;
    const list = listRef.current;
    if (!list) return;
    const item = list.querySelector(`[data-token-index="${highlightedIndex}"]`);
    if (item) {
      item.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  // Store refs for native handlers
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const filteredRef = useRef(filtered);
  filteredRef.current = filtered;

  // Keyboard navigation handler for the search input
  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const count = filteredRef.current.length;
    if (count === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1) % count);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(prev => (prev <= 0 ? count - 1 : prev - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      setHighlightedIndex(curr => {
        if (curr >= 0 && curr < count) {
          const token = filteredRef.current[curr];
          if (token) {
            onSelectRef.current(token);
            onCloseRef.current();
          }
        }
        return curr;
      });
    }
  }, []);

  // Native click handler for list items (React delegation doesn't work in Shadow DOM)
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const handleClick = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      const item = target.closest<HTMLElement>("[data-token-index]");
      if (!item) return;
      e.preventDefault();
      e.stopPropagation();
      const idx = parseInt(item.dataset.tokenIndex!, 10);
      const token = filteredRef.current[idx];
      if (token) {
        onSelectRef.current(token);
        onCloseRef.current();
      }
    };
    list.addEventListener("pointerdown", handleClick);
    return () => list.removeEventListener("pointerdown", handleClick);
  }, []);

  const handleHeaderAction = useCallback((action: string) => {
    if (action === "unlink") {
      onUnlink?.();
    }
  }, [onUnlink]);

  const isUnlinkDisabled = !currentToken;

  const unlinkButton = (
    <Tooltip content={currentToken ? "Unlink variable" : "No variable linked"} side="bottom" delay={300}>
      <button
        type="button"
        className="retune-floating-dialog-close"
        data-dialog-action={isUnlinkDisabled ? undefined : "unlink"}
        style={isUnlinkDisabled ? { opacity: 0.3, cursor: "default" } : undefined}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12.3533 14.646C12.5485 14.8412 12.5484 15.1578 12.3533 15.3531L11.3534 16.353C10.3297 17.3765 8.67028 17.3766 7.64665 16.353C6.62317 15.3294 6.62317 13.6699 7.64665 12.6462L8.64654 11.6463C8.84181 11.4512 9.15844 11.4511 9.35364 11.6463C9.54883 11.8415 9.54874 12.1582 9.35364 12.3534L8.35375 13.3533C7.7208 13.9865 7.7208 15.0128 8.35375 15.6459C8.98687 16.279 10.0132 16.2789 10.6463 15.6459L11.6462 14.646C11.8414 14.451 12.1581 14.4511 12.3533 14.646ZM8.0002 9.00021C8.27634 9.00021 8.50015 9.22401 8.50015 9.50015C8.49994 9.77612 8.27622 10.0001 8.0002 10.0001H6.50036C6.22434 10.0001 6.00061 9.77612 6.00041 9.50015C6.00041 9.22401 6.22422 9.00021 6.50036 9.00021H8.0002ZM14.5002 15.5002C14.7763 15.5002 15.0001 15.724 15.0001 16.0001V17.5C15 17.776 14.7763 17.9999 14.5002 17.9999C14.2241 17.9999 14.0004 17.776 14.0002 17.5V16.0001C14.0002 15.724 14.2241 15.5002 14.5002 15.5002ZM9.50073 5.99984C9.77664 6.00011 10.0007 6.22381 10.0007 6.49978V7.99962C10.0007 8.2756 9.77664 8.4993 9.50073 8.49957C9.22459 8.49957 9.00078 8.27576 9.00078 7.99962V6.49978C9.00078 6.22364 9.22459 5.99984 9.50073 5.99984ZM17.5006 13.9997C17.7765 13.9998 18.0004 14.2237 18.0005 14.4996C18.0005 14.7757 17.7766 14.9994 17.5006 14.9996H16.0007C15.7246 14.9996 15.5008 14.7758 15.5008 14.4996C15.5009 14.2235 15.7246 13.9997 16.0007 13.9997H17.5006ZM16.3543 7.64676C17.3774 8.67043 17.3776 10.33 16.3543 11.3535L15.3544 12.3534C15.1592 12.5486 14.8426 12.5484 14.6473 12.3534C14.452 12.1582 14.452 11.8416 14.6473 11.6463L15.6472 10.6464C16.28 10.0134 16.2798 8.98702 15.6472 8.35387C15.0141 7.72075 13.9871 7.72018 13.3539 8.35317L12.354 9.35307C12.1588 9.54825 11.8422 9.54808 11.6469 9.35307C11.4519 9.15779 11.4517 8.84114 11.6469 8.64596L12.6468 7.64607C13.6705 6.62254 15.3306 6.62312 16.3543 7.64676Z" fill="rgba(0,0,0,0.9)" />
        </svg>
      </button>
    </Tooltip>
  );

  return (
    <FloatingDialog
      title="Variables"
      onClose={onClose}
      anchorRect={anchorRect}
      search={{ value: search, onChange: setSearch, placeholder: "Search", onKeyDown: handleSearchKeyDown }}
      headerActions={unlinkButton}
      onHeaderAction={handleHeaderAction}
      minHeight={300}
    >
      <div ref={listRef} className="retune-token-dialog-list">
        {filtered.length === 0 && (
          <div className="retune-token-dialog-empty">No variables found</div>
        )}
        {filtered.map((token, i) => {
          const isActive = currentToken?.className === token.className;
          const isHighlighted = i === highlightedIndex;
          return (
            <div
              key={token.className}
              className={`retune-token-dialog-item${isActive ? " retune-token-dialog-item-active" : ""}${isHighlighted ? " retune-token-dialog-item-highlighted" : ""}`}
              data-token-index={i}
            >
              {isColor && (
                <span
                  className="retune-token-dialog-swatch"
                  style={{ backgroundColor: getSwatchColor(token) || "transparent" }}
                />
              )}
              <span className="retune-token-dialog-name">{formatName(token.className)}</span>
              <span className="retune-token-dialog-value">{formatValue(token)}</span>
            </div>
          );
        })}
      </div>
    </FloatingDialog>
  );
}
