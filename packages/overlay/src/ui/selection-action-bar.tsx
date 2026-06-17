import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { IconWrench } from "./IconWrench";
import { IconCrossMedium } from "./icons";
import { AnimatedCopyIcon } from "./AnimatedCopyIcon";
import { SELECTION_ACTION_ICON_SIZES, toolbarIconStroke } from "./toolbar-icon-metrics";
import { Tooltip } from "./tooltip";
import { computeSelectionChromeLayout, type SelectionChromeLayout } from "../selector/selection-chrome-layout";

function IconComment({ size = 18, strokeWidth = 1.25 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path
        d="M3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10C17 13.866 13.866 17 10 17H4C3.44772 17 3 16.5523 3 16V10Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
      />
    </svg>
  );
}

export interface SelectionActionBarProps {
  anchorElements: Element[];
  /** Measured width of the dimension badge — keeps row layout in sync with the picker. */
  dimensionLabelWidth?: number;
  editMode: boolean;
  copied: boolean;
  onComment: () => void;
  onCopy: () => void;
  onToggleEdit?: () => void;
  onDeselect: () => void;
  onChromeLayout?: (layout: SelectionChromeLayout) => void;
  onDelete?: () => void;
}

function getAnchorRect(elements: Element[]) {
  const rects = elements.map((el) => el.getBoundingClientRect());
  const top = Math.min(...rects.map((r) => r.top));
  const left = Math.min(...rects.map((r) => r.left));
  const right = Math.max(...rects.map((r) => r.right));
  const bottom = Math.max(...rects.map((r) => r.bottom));
  return { top, left, right, bottom, centerX: (left + right) / 2 };
}

export function SelectionActionBar({
  anchorElements,
  dimensionLabelWidth,
  editMode,
  copied,
  onComment,
  onCopy,
  onToggleEdit,
  onDeselect,
  onChromeLayout,
  onDelete,
}: SelectionActionBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [copyHovered, setCopyHovered] = useState(false);
  const [selectionFill, setSelectionFill] = useState({ left: 0, width: 28, visible: false });

  const updateSelectionFill = useCallback((button: HTMLButtonElement | null) => {
    const bar = barRef.current;
    if (!bar || !button) {
      setSelectionFill((current) => ({ ...current, visible: false }));
      return;
    }

    const barRect = bar.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    setSelectionFill({
      left: buttonRect.left - barRect.left,
      width: buttonRect.width,
      visible: true,
    });
  }, []);

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest(".tuna-selection-action-btn");
    updateSelectionFill(button instanceof HTMLButtonElement ? button : null);
  }, [updateSelectionFill]);

  const handlePointerLeave = useCallback(() => {
    const activeButton = barRef.current?.querySelector<HTMLButtonElement>(".tuna-selection-action-btn.active") ?? null;
    updateSelectionFill(activeButton);
  }, [updateSelectionFill]);

  useEffect(() => {
    if (anchorElements.length === 0) {
      setPos(null);
      return;
    }

    const gap = 8;
    const multiSelect = anchorElements.length > 1;

    function update() {
      const anchor = getAnchorRect(anchorElements);

      if (multiSelect) {
        setPos({ top: anchor.bottom + gap, left: anchor.centerX });
        return;
      }

      const el = anchorElements[0];
      const rect = el.getBoundingClientRect();
      const barWidth = barRef.current?.offsetWidth;
      const layout = computeSelectionChromeLayout(
        rect,
        { width: window.innerWidth, height: window.innerHeight },
        dimensionLabelWidth,
        barWidth,
      );
      setPos(layout.actionBar);
      onChromeLayout?.(layout);
    }

    update();
    document.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    const observer = new ResizeObserver(update);
    for (const el of anchorElements) observer.observe(el);
    if (barRef.current) observer.observe(barRef.current);
    return () => {
      document.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      observer.disconnect();
    };
  }, [anchorElements, dimensionLabelWidth, onChromeLayout]);

  useLayoutEffect(() => {
    const activeButton = barRef.current?.querySelector<HTMLButtonElement>(".tuna-selection-action-btn.active") ?? null;
    updateSelectionFill(activeButton);
  }, [editMode, onDelete, pos, updateSelectionFill]);

  if (anchorElements.length === 0 || !pos) return null;

  return (
    <div
      ref={barRef}
      className="tuna-selection-action-bar"
      style={{ top: pos.top, left: pos.left }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <span
        className={`tuna-selection-action-fill${selectionFill.visible ? " visible" : ""}`}
        style={{
          transform: `translate3d(${selectionFill.left}px, 0, 0)`,
          width: `${selectionFill.width}px`,
        }}
        aria-hidden="true"
      />
      <Tooltip content="Comment" shortcut="C" side="top">
        <button type="button" className="tuna-selection-action-btn" aria-label="Comment on selection" onClick={onComment}>
          <span className="tuna-selection-action-icon">
            <IconComment size={SELECTION_ACTION_ICON_SIZES.comment} strokeWidth={toolbarIconStroke(SELECTION_ACTION_ICON_SIZES.comment, 20)} />
          </span>
        </button>
      </Tooltip>
      <Tooltip content="Copy" shortcut="⌘C" side="top">
        <button
          type="button"
          className="tuna-selection-action-btn"
          aria-label={copied ? "Copied selection context" : "Copy selection context"}
          onClick={onCopy}
          onMouseEnter={() => setCopyHovered(true)}
          onMouseLeave={() => setCopyHovered(false)}
          onPointerLeave={() => setCopyHovered(false)}
        >
          <span className="tuna-selection-action-icon">
            <AnimatedCopyIcon copied={copied} hovered={copyHovered} size={SELECTION_ACTION_ICON_SIZES.copy} strokeWidth={toolbarIconStroke(SELECTION_ACTION_ICON_SIZES.copy)} />
          </span>
        </button>
      </Tooltip>
      {onToggleEdit && (
        <Tooltip content={editMode ? "Exit tune mode" : "Tune"} shortcut="T" side="top">
          <button
            type="button"
            className={`tuna-selection-action-btn${editMode ? " active" : ""}`}
            aria-label={editMode ? "Exit tune mode" : "Tune selection"}
            aria-pressed={editMode}
            onClick={onToggleEdit}
          >
            <span className="tuna-selection-action-icon">
              <IconWrench size={SELECTION_ACTION_ICON_SIZES.edit} strokeWidth={toolbarIconStroke(SELECTION_ACTION_ICON_SIZES.edit)} />
            </span>
          </button>
        </Tooltip>
      )}
      <div className="tuna-selection-action-divider" aria-hidden />
      {onDelete && (
        <Tooltip content="Delete selection" shortcut="Delete" side="top">
          <button
            type="button"
            className="tuna-selection-action-btn"
            aria-label="Delete selection"
            onClick={onDelete}
          >
            <span className="tuna-selection-action-icon">
              <svg width={SELECTION_ACTION_ICON_SIZES.delete} height={SELECTION_ACTION_ICON_SIZES.delete} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={toolbarIconStroke(SELECTION_ACTION_ICON_SIZES.delete)} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </span>
          </button>
        </Tooltip>
      )}
      <Tooltip content="Deselect all" shortcut="Shift+Esc" side="top">
        <button type="button" className="tuna-selection-action-btn" aria-label="Deselect all" onClick={onDeselect}>
          <span className="tuna-selection-action-icon">
            <IconCrossMedium size={SELECTION_ACTION_ICON_SIZES.deselect} strokeWidth={toolbarIconStroke(SELECTION_ACTION_ICON_SIZES.deselect)} />
          </span>
        </button>
      </Tooltip>
    </div>
  );
}
