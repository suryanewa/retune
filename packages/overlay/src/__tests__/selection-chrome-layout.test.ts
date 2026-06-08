import { describe, it, expect } from "vitest";
import {
  ACTION_BAR_WIDTH,
  computeSelectionChromeLayout,
  SELECTION_CHROME_GAP,
} from "../selector/selection-chrome-layout";

function rect(top: number, left: number, width: number, height: number): DOMRect {
  return {
    top,
    left,
    right: left + width,
    bottom: top + height,
    width,
    height,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
}

describe("computeSelectionChromeLayout", () => {
  it("stacks dimension above and action bar below when both fit", () => {
    const layout = computeSelectionChromeLayout(rect(200, 100, 120, 40), { width: 1280, height: 800 });
    expect(layout.dimension.transform).toBe("translate(-50%, -100%)");
    expect(layout.dimension.top).toBe(192);
    expect(layout.actionBar.top).toBe(248);
    expect(layout.actionBar.left).toBe(160);
  });

  it("places dimension and action bar side by side above when bottom is tight", () => {
    const labelW = 90;
    const layout = computeSelectionChromeLayout(
      rect(760, 100, 120, 40),
      { width: 1280, height: 800 },
      labelW,
      ACTION_BAR_WIDTH,
    );
    expect(layout.dimension.transform).toBe("translate(-100%, 0)");
    expect(layout.actionBar.top).toBe(layout.dimension.top - 8);
    const barLeft = layout.actionBar.left - ACTION_BAR_WIDTH / 2;
    expect(barLeft - layout.dimension.left).toBe(SELECTION_CHROME_GAP);
  });

  it("places dimension and action bar side by side below when top is tight", () => {
    const labelW = 90;
    const layout = computeSelectionChromeLayout(
      rect(8, 100, 120, 40),
      { width: 1280, height: 800 },
      labelW,
      ACTION_BAR_WIDTH,
    );
    expect(layout.dimension.transform).toBe("translate(-100%, 0)");
    expect(layout.actionBar.top).toBe(56);
    const barLeft = layout.actionBar.left - ACTION_BAR_WIDTH / 2;
    expect(barLeft - layout.dimension.left).toBe(SELECTION_CHROME_GAP);
  });

  it("uses a side-by-side row when only one vertical side has room", () => {
    const labelW = 90;
    const layout = computeSelectionChromeLayout(
      rect(15, 100, 120, 730),
      { width: 1280, height: 800 },
      labelW,
      ACTION_BAR_WIDTH,
    );
    expect(layout.dimension.transform).toBe("translate(-100%, 0)");
    expect(layout.actionBar.top).toBe(layout.dimension.top - 8);
    const barLeft = layout.actionBar.left - ACTION_BAR_WIDTH / 2;
    expect(barLeft - layout.dimension.left).toBe(SELECTION_CHROME_GAP);
  });
});
