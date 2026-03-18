import { describe, it, expect } from "vitest";
import {
  getCategoryForProperty,
  getPropertiesForCategory,
  getCategoryForCamelProp,
} from "../variables/categories";

describe("getCategoryForProperty", () => {
  it("maps padding properties to spacing", () => {
    expect(getCategoryForProperty("padding")).toBe("spacing");
    expect(getCategoryForProperty("padding-top")).toBe("spacing");
    expect(getCategoryForProperty("padding-left")).toBe("spacing");
  });

  it("maps margin properties to spacing", () => {
    expect(getCategoryForProperty("margin")).toBe("spacing");
    expect(getCategoryForProperty("margin-bottom")).toBe("spacing");
  });

  it("maps gap properties to spacing", () => {
    expect(getCategoryForProperty("gap")).toBe("spacing");
    expect(getCategoryForProperty("row-gap")).toBe("spacing");
    expect(getCategoryForProperty("column-gap")).toBe("spacing");
  });

  it("maps sizing properties", () => {
    expect(getCategoryForProperty("width")).toBe("sizing");
    expect(getCategoryForProperty("height")).toBe("sizing");
    expect(getCategoryForProperty("min-width")).toBe("sizing");
    expect(getCategoryForProperty("max-height")).toBe("sizing");
  });

  it("maps color properties", () => {
    expect(getCategoryForProperty("color")).toBe("colors");
    expect(getCategoryForProperty("background-color")).toBe("colors");
    expect(getCategoryForProperty("border-color")).toBe("colors");
    expect(getCategoryForProperty("outline-color")).toBe("colors");
    expect(getCategoryForProperty("fill")).toBe("colors");
    expect(getCategoryForProperty("stroke")).toBe("colors");
    expect(getCategoryForProperty("text-decoration-color")).toBe("colors");
    expect(getCategoryForProperty("accent-color")).toBe("colors");
    expect(getCategoryForProperty("caret-color")).toBe("colors");
  });

  it("maps typography properties to per-property categories", () => {
    expect(getCategoryForProperty("font-size")).toBe("font-size");
    expect(getCategoryForProperty("font-weight")).toBe("font-weight");
    expect(getCategoryForProperty("line-height")).toBe("line-height");
    expect(getCategoryForProperty("letter-spacing")).toBe("letter-spacing");
    expect(getCategoryForProperty("font-family")).toBe("font-family");
  });

  it("maps border-radius properties", () => {
    expect(getCategoryForProperty("border-radius")).toBe("border-radius");
    expect(getCategoryForProperty("border-top-left-radius")).toBe("border-radius");
    expect(getCategoryForProperty("border-start-start-radius")).toBe("border-radius");
    expect(getCategoryForProperty("border-end-end-radius")).toBe("border-radius");
  });

  it("maps border-width properties", () => {
    expect(getCategoryForProperty("border-width")).toBe("border-width");
    expect(getCategoryForProperty("border-top-width")).toBe("border-width");
    expect(getCategoryForProperty("border-inline-start-width")).toBe("border-width");
  });

  it("maps box-shadow property", () => {
    expect(getCategoryForProperty("box-shadow")).toBe("box-shadow");
  });

  it("maps opacity property", () => {
    expect(getCategoryForProperty("opacity")).toBe("opacity");
  });

  it("maps layout properties", () => {
    expect(getCategoryForProperty("display")).toBe("layout");
    expect(getCategoryForProperty("flex-direction")).toBe("layout");
    expect(getCategoryForProperty("align-items")).toBe("layout");
    expect(getCategoryForProperty("justify-content")).toBe("layout");
  });

  it("maps logical properties to their physical counterpart categories", () => {
    // Spacing logical properties
    expect(getCategoryForProperty("padding-inline")).toBe("spacing");
    expect(getCategoryForProperty("padding-inline-start")).toBe("spacing");
    expect(getCategoryForProperty("padding-inline-end")).toBe("spacing");
    expect(getCategoryForProperty("padding-block")).toBe("spacing");
    expect(getCategoryForProperty("padding-block-start")).toBe("spacing");
    expect(getCategoryForProperty("padding-block-end")).toBe("spacing");
    expect(getCategoryForProperty("margin-inline")).toBe("spacing");
    expect(getCategoryForProperty("margin-inline-start")).toBe("spacing");
    expect(getCategoryForProperty("margin-block-end")).toBe("spacing");

    // Sizing logical properties
    expect(getCategoryForProperty("inline-size")).toBe("sizing");
    expect(getCategoryForProperty("block-size")).toBe("sizing");
    expect(getCategoryForProperty("min-inline-size")).toBe("sizing");
    expect(getCategoryForProperty("max-inline-size")).toBe("sizing");
    expect(getCategoryForProperty("min-block-size")).toBe("sizing");
    expect(getCategoryForProperty("max-block-size")).toBe("sizing");

    // Border-radius logical properties
    expect(getCategoryForProperty("border-start-start-radius")).toBe("border-radius");
    expect(getCategoryForProperty("border-start-end-radius")).toBe("border-radius");
    expect(getCategoryForProperty("border-end-start-radius")).toBe("border-radius");
    expect(getCategoryForProperty("border-end-end-radius")).toBe("border-radius");

    // Border-width logical properties
    expect(getCategoryForProperty("border-inline-start-width")).toBe("border-width");
    expect(getCategoryForProperty("border-inline-end-width")).toBe("border-width");
    expect(getCategoryForProperty("border-block-start-width")).toBe("border-width");
    expect(getCategoryForProperty("border-block-end-width")).toBe("border-width");

    // Border-color logical properties
    expect(getCategoryForProperty("border-inline-start-color")).toBe("colors");
    expect(getCategoryForProperty("border-inline-end-color")).toBe("colors");
    expect(getCategoryForProperty("border-block-start-color")).toBe("colors");
    expect(getCategoryForProperty("border-block-end-color")).toBe("colors");
  });

  it("returns null for unknown properties", () => {
    expect(getCategoryForProperty("transform")).toBeNull();
    expect(getCategoryForProperty("animation")).toBeNull();
    expect(getCategoryForProperty("")).toBeNull();
  });
});

describe("getPropertiesForCategory", () => {
  it("returns spacing properties", () => {
    const props = getPropertiesForCategory("spacing");
    expect(props).toContain("padding");
    expect(props).toContain("margin");
    expect(props).toContain("gap");
    expect(props).not.toContain("width");
  });

  it("returns color properties", () => {
    const props = getPropertiesForCategory("colors");
    expect(props).toContain("color");
    expect(props).toContain("background-color");
    expect(props).toContain("fill");
    expect(props).toContain("stroke");
    expect(props).not.toContain("width");
  });

  it("returns empty array for non-existent category", () => {
    expect(getPropertiesForCategory("nonexistent" as any)).toEqual([]);
  });
});

describe("getCategoryForCamelProp", () => {
  it("converts camelCase to kebab-case and looks up", () => {
    expect(getCategoryForCamelProp("paddingTop")).toBe("spacing");
    expect(getCategoryForCamelProp("fontSize")).toBe("font-size");
    expect(getCategoryForCamelProp("backgroundColor")).toBe("colors");
    expect(getCategoryForCamelProp("borderRadius")).toBe("border-radius");
  });

  it("handles already-kebab properties", () => {
    // No uppercase letters means no conversion needed
    expect(getCategoryForCamelProp("gap")).toBe("spacing");
    expect(getCategoryForCamelProp("opacity")).toBe("opacity");
  });

  it("returns null for unknown camelCase props", () => {
    expect(getCategoryForCamelProp("transform")).toBeNull();
  });
});
