import { describe, expect, it } from "vitest";
import {
  buildClosedPath,
  buildOpenPath,
  finalizeDrawPoints,
  simplifyPolyline,
  type DrawPoint,
} from "../selector/path-utils";

describe("path utils", () => {
  it("builds open paths from points", () => {
    expect(buildOpenPath([
      { x: 0, y: 0 },
      { x: 10, y: 5 },
      { x: 20, y: 0 },
    ])).toBe("M 0 0 Q 10 5 15 2.5 L 20 0");
  });

  it("simplifies mostly collinear points while preserving corners", () => {
    const points: DrawPoint[] = [
      { x: 0, y: 0 },
      { x: 5, y: 0.1 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 10.1, y: 15 },
      { x: 10, y: 20 },
    ];

    expect(simplifyPolyline(points, 1)).toEqual([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 20 },
    ]);
  });

  it("closes far endpoints with a cubic segment", () => {
    const path = buildClosedPath([
      { x: 0, y: 0 },
      { x: 20, y: 10 },
      { x: 40, y: 0 },
    ]);

    expect(path).toContain(" C ");
    expect(path.endsWith("Z")).toBe(false);
  });

  it("uses a normal close command for nearly closed loops", () => {
    const path = buildClosedPath([
      { x: 0, y: 0 },
      { x: 20, y: 10 },
      { x: 1, y: 1 },
    ]);

    expect(path.endsWith(" Z")).toBe(true);
  });

  it("dedupes and simplifies finalized points while keeping endpoints", () => {
    const result = finalizeDrawPoints([
      { x: 0, y: 0 },
      { x: 0.2, y: 0.2 },
      { x: 10, y: 0 },
      { x: 20, y: 0 },
      { x: 20, y: 10 },
    ], 1);

    expect(result[0]).toEqual({ x: 0, y: 0 });
    expect(result[result.length - 1]).toEqual({ x: 20, y: 10 });
    expect(result.length).toBeLessThan(5);
  });
});
