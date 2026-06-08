/** Shared layout for the dimension badge and selection action bar (single select). */

export const SELECTION_CHROME_GAP = 8;
export const DIMENSION_LABEL_HEIGHT = 20;
export const ACTION_BAR_HEIGHT = 36;
export const ACTION_BAR_WIDTH = 100;
export const DIMENSION_LABEL_WIDTH_ESTIMATE = 72;

const DIMENSION_LABEL_FONT =
  "11px InterVariable, Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
const DIMENSION_LABEL_PADDING_X = 12;

/** Match the picker dimension badge text width (padding included). */
export function measureDimensionLabelWidth(text: string): number {
  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.font = DIMENSION_LABEL_FONT;
      return Math.ceil(ctx.measureText(text).width) + DIMENSION_LABEL_PADDING_X;
    }
  }
  return Math.ceil(text.length * 6.8) + DIMENSION_LABEL_PADDING_X;
}

export interface ChromePosition {
  top: number;
  left: number;
  transform: string;
}

export interface SelectionChromeLayout {
  dimension: ChromePosition;
  actionBar: { top: number; left: number };
}

function rowLayout(
  rowTop: number,
  centerX: number,
  labelW: number,
  viewportW: number,
  barW: number,
): SelectionChromeLayout {
  const gap = SELECTION_CHROME_GAP;
  const rowW = labelW + gap + barW;
  const rowLeft = Math.max(
    gap,
    Math.min(centerX - rowW / 2, viewportW - rowW - gap),
  );
  const barCenterX = rowLeft + labelW + gap + barW / 2;
  const dimensionRight = rowLeft + labelW;

  return {
    dimension: {
      top: rowTop + (ACTION_BAR_HEIGHT - DIMENSION_LABEL_HEIGHT) / 2,
      left: dimensionRight,
      transform: "translate(-100%, 0)",
    },
    actionBar: {
      top: rowTop,
      left: barCenterX,
    },
  };
}

/** Compute non-overlapping positions for dimension badge + action bar. */
export function computeSelectionChromeLayout(
  rect: DOMRect,
  viewport: { width: number; height: number },
  labelWidth = DIMENSION_LABEL_WIDTH_ESTIMATE,
  barWidth = ACTION_BAR_WIDTH,
): SelectionChromeLayout {
  const gap = SELECTION_CHROME_GAP;
  const labelH = DIMENSION_LABEL_HEIGHT;
  const barH = ACTION_BAR_HEIGHT;
  const cx = rect.left + rect.width / 2;

  const roomAbove = rect.top - gap;
  const roomBelow = viewport.height - rect.bottom - gap;

  const canDimAbove = roomAbove >= labelH;
  const canBarBelow = roomBelow >= barH;
  const canBarAbove = roomAbove >= barH;
  const canDimBelow = roomBelow >= labelH;

  // Default: dimension above, action bar below.
  if (canDimAbove && canBarBelow) {
    return {
      dimension: { top: rect.top - gap, left: cx, transform: "translate(-50%, -100%)" },
      actionBar: { top: rect.bottom + gap, left: cx },
    };
  }

  // Both would sit above the element — place side by side in a row above.
  if (canDimAbove && !canBarBelow) {
    return rowLayout(rect.top - gap - ACTION_BAR_HEIGHT, cx, labelWidth, viewport.width, barWidth ?? ACTION_BAR_WIDTH);
  }

  // Both would sit below the element — place side by side in a row below.
  if (!canDimAbove && canDimBelow && canBarBelow) {
    return rowLayout(rect.bottom + gap, cx, labelWidth, viewport.width, barWidth ?? ACTION_BAR_WIDTH);
  }

  // Tight on both sides — prefer a row on whichever side has more room.
  if (canDimAbove || canDimBelow) {
    const rowTop = roomBelow >= roomAbove
      ? rect.bottom + gap
      : rect.top - gap - ACTION_BAR_HEIGHT;
    return rowLayout(rowTop, cx, labelWidth, viewport.width, barWidth ?? ACTION_BAR_WIDTH);
  }

  // Last resort: stack with best-effort positions.
  return {
    dimension: { top: rect.top - gap, left: cx, transform: "translate(-50%, -100%)" },
    actionBar: { top: rect.bottom + gap, left: cx },
  };
}
