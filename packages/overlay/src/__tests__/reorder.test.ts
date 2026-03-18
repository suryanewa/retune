import { describe, it, expect } from "vitest";
import { extractText, extractTag, findJsxBlock, reorderJsxChildren } from "../mcp/reorder";

describe("extractText", () => {
  it("extracts quoted text from label", () => {
    expect(extractText('<button> "Primary"')).toBe("Primary");
  });

  it("extracts text with spaces", () => {
    expect(extractText('<div> "Card A"')).toBe("Card A");
  });

  it("returns raw label when no quotes", () => {
    expect(extractText("<div>")).toBe("<div>");
  });

  it("handles class-based labels", () => {
    expect(extractText("<div.card.active>")).toBe("<div.card.active>");
  });
});

describe("extractTag", () => {
  it("extracts tag from label", () => {
    expect(extractTag('<section> "Typography"')).toBe("section");
  });

  it("extracts tag from label without text", () => {
    expect(extractTag("<div>")).toBe("div");
  });

  it("extracts tag with class notation", () => {
    expect(extractTag("<div.card>")).toBe("div");
  });

  it("returns null for non-tag labels", () => {
    expect(extractTag("no tag here")).toBeNull();
  });
});

describe("findJsxBlock", () => {
  it("finds a simple single-line element", () => {
    const lines = [
      "<div>",
      "  <span>Hello</span>",
      "</div>",
    ];
    const block = findJsxBlock(lines, "Hello", new Set());
    expect(block).toEqual({ start: 1, end: 1 });
  });

  it("finds a multi-line element with props", () => {
    const lines = [
      "<div>",
      "  <button",
      '    style={{ color: "red" }}',
      "  >",
      "    Click Me",
      "  </button>",
      "</div>",
    ];
    const block = findJsxBlock(lines, "Click Me", new Set());
    expect(block).toEqual({ start: 1, end: 5 });
  });

  it("skips used lines", () => {
    const lines = [
      "<button>First</button>",
      "<button>First</button>",
    ];
    const used = new Set<number>();
    const first = findJsxBlock(lines, "First", used);
    expect(first).toEqual({ start: 0, end: 0 });

    // Mark first as used
    used.add(0);
    const second = findJsxBlock(lines, "First", used);
    expect(second).toEqual({ start: 1, end: 1 });
  });

  it("returns null when text not found", () => {
    const lines = ["<div>Hello</div>"];
    expect(findJsxBlock(lines, "Goodbye", new Set())).toBeNull();
  });

  it("handles nested elements", () => {
    const lines = [
      "<div>",
      "  <section>",
      "    <h3>Title</h3>",
      "    <p>Description</p>",
      "  </section>",
      "</div>",
    ];
    const block = findJsxBlock(lines, "Title", new Set());
    expect(block).toEqual({ start: 2, end: 2 });
  });

  it("handles self-closing tags within a block", () => {
    const lines = [
      "<div>",
      "  <card>",
      "    <img />",
      "    <span>Label</span>",
      "  </card>",
      "</div>",
    ];
    const block = findJsxBlock(lines, "Label", new Set());
    expect(block).toEqual({ start: 3, end: 3 });
  });

  it("uses tag name to find correct parent element", () => {
    const lines = [
      "<main>",
      "  <section>",
      "    <h2>Typography</h2>",
      "    <p>Some content</p>",
      "  </section>",
      "  <section>",
      "    <h2>Layout</h2>",
      "    <p>Other content</p>",
      "  </section>",
      "</main>",
    ];
    // Without tag: finds the <h2> (wrong)
    const withoutTag = findJsxBlock(lines, "Typography", new Set());
    expect(withoutTag).toEqual({ start: 2, end: 2 }); // just the h2

    // With tag "section": finds the whole <section> block (correct)
    const withTag = findJsxBlock(lines, "Typography", new Set(), "section");
    expect(withTag).toEqual({ start: 1, end: 4 }); // entire section
  });

  it("skips wrong tag and finds next match", () => {
    const lines = [
      "<div>",
      "  <h2>Title</h2>",
      "  <section>",
      "    <h2>Title</h2>",
      "    <p>Content</p>",
      "  </section>",
      "</div>",
    ];
    // Looking for a <section> containing "Title" — should skip the standalone <h2>
    const block = findJsxBlock(lines, "Title", new Set(), "section");
    expect(block).toEqual({ start: 2, end: 5 });
  });

  it("finds a block with style object spanning multiple lines", () => {
    const lines = [
      "  <button",
      "    style={{",
      '      padding: "10px 20px",',
      '      background: "#1c1917",',
      "    }}",
      "  >",
      "    Primary",
      "  </button>",
    ];
    const block = findJsxBlock(lines, "Primary", new Set());
    expect(block).toEqual({ start: 0, end: 7 });
  });
});

describe("reorderJsxChildren", () => {
  const threeButtons = `<div>
  <button style={{ background: "black" }}>
    Primary
  </button>
  <button style={{ background: "transparent" }}>
    Ghost
  </button>
  <button style={{ background: "white" }}>
    Secondary
  </button>
</div>`;

  it("swaps two elements", () => {
    const result = reorderJsxChildren(
      threeButtons,
      ['<button> "Primary"', '<button> "Ghost"', '<button> "Secondary"'],
      ['<button> "Primary"', '<button> "Secondary"', '<button> "Ghost"']
    );
    expect("content" in result).toBe(true);
    if (!("content" in result)) return;

    // Primary still first, Secondary now second, Ghost now third
    const primaryIdx = result.content.indexOf("Primary");
    const secondaryIdx = result.content.indexOf("Secondary");
    const ghostIdx = result.content.indexOf("Ghost");
    expect(primaryIdx).toBeLessThan(secondaryIdx);
    expect(secondaryIdx).toBeLessThan(ghostIdx);

    // Styles travel with their elements
    const whiteIdx = result.content.indexOf("white");
    const transparentIdx = result.content.indexOf("transparent");
    // white (Secondary's style) before transparent (Ghost's style)
    expect(whiteIdx).toBeLessThan(transparentIdx);
  });

  it("moves last element to first", () => {
    const result = reorderJsxChildren(
      threeButtons,
      ['<button> "Primary"', '<button> "Ghost"', '<button> "Secondary"'],
      ['<button> "Secondary"', '<button> "Primary"', '<button> "Ghost"']
    );
    expect("content" in result).toBe(true);
    if (!("content" in result)) return;

    const secondaryIdx = result.content.indexOf("Secondary");
    const primaryIdx = result.content.indexOf("Primary");
    const ghostIdx = result.content.indexOf("Ghost");
    expect(secondaryIdx).toBeLessThan(primaryIdx);
    expect(primaryIdx).toBeLessThan(ghostIdx);
  });

  it("preserves content before and after the children", () => {
    const source = `import React from "react";

export function Page() {
  return (
    <main>
      <h1>Title</h1>
      <div>
        <span>Alpha</span>
        <span>Beta</span>
      </div>
      <footer>End</footer>
    </main>
  );
}`;

    const result = reorderJsxChildren(
      source,
      ['<span> "Alpha"', '<span> "Beta"'],
      ['<span> "Beta"', '<span> "Alpha"']
    );
    expect("content" in result).toBe(true);
    if (!("content" in result)) return;

    // Import and function declaration preserved
    expect(result.content).toContain('import React from "react"');
    expect(result.content).toContain("export function Page()");
    // Footer preserved
    expect(result.content).toContain("<footer>End</footer>");
    // Beta now before Alpha
    const betaIdx = result.content.indexOf("Beta");
    const alphaIdx = result.content.indexOf("Alpha");
    expect(betaIdx).toBeLessThan(alphaIdx);
  });

  it("preserves file length (no lines added or removed)", () => {
    const result = reorderJsxChildren(
      threeButtons,
      ['<button> "Primary"', '<button> "Ghost"', '<button> "Secondary"'],
      ['<button> "Ghost"', '<button> "Secondary"', '<button> "Primary"']
    );
    expect("content" in result).toBe(true);
    if (!("content" in result)) return;

    expect(result.content.split("\n").length).toBe(threeButtons.split("\n").length);
  });

  it("keeps styles with their element (structural, not style swap)", () => {
    const source = `<div>
  <button style={{ background: "#1c1917", color: "#fff" }}>
    Dark
  </button>
  <button style={{ background: "#fff", border: "1px solid #ccc" }}>
    Light
  </button>
</div>`;

    const result = reorderJsxChildren(
      source,
      ['<button> "Dark"', '<button> "Light"'],
      ['<button> "Light"', '<button> "Dark"']
    );
    expect("content" in result).toBe(true);
    if (!("content" in result)) return;

    // Light button (with white bg + border) should now be first
    const lightIdx = result.content.indexOf("Light");
    const darkIdx = result.content.indexOf("Dark");
    expect(lightIdx).toBeLessThan(darkIdx);

    // Styles travel with their elements — border stays with Light
    const borderIdx = result.content.indexOf("border");
    const darkBgIdx = result.content.indexOf("#1c1917");
    expect(borderIdx).toBeLessThan(darkBgIdx);
  });

  it("returns error when text not found", () => {
    const source = `<div>
  <span>Hello</span>
  <span>World</span>
</div>`;
    const result = reorderJsxChildren(
      source,
      ['<span> "Hello"', '<span> "Missing"'],
      ['<span> "Missing"', '<span> "Hello"']
    );
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toContain("Missing");
    }
  });

  it("handles elements with multi-line style objects", () => {
    const source = `<div style={{ display: "flex", gap: 12 }}>
  <button
    style={{
      padding: "10px 20px",
      borderRadius: 8,
      background: "#1c1917",
      color: "#fff",
    }}
  >
    Primary
  </button>
  <button
    style={{
      padding: "10px 20px",
      borderRadius: 8,
      background: "transparent",
      textDecoration: "underline",
    }}
  >
    Ghost
  </button>
</div>`;

    const result = reorderJsxChildren(
      source,
      ['<button> "Primary"', '<button> "Ghost"'],
      ['<button> "Ghost"', '<button> "Primary"']
    );
    expect("content" in result).toBe(true);
    if (!("content" in result)) return;

    // Ghost (transparent) should come first now
    const ghostIdx = result.content.indexOf("transparent");
    const primaryIdx = result.content.indexOf("#1c1917");
    expect(ghostIdx).toBeLessThan(primaryIdx);

    // Both elements fully preserved
    expect(result.content).toContain("textDecoration");
    expect(result.content).toContain('color: "#fff"');
    expect(result.content.split("\n").length).toBe(source.split("\n").length);
  });

  it("handles same order (no-op)", () => {
    const result = reorderJsxChildren(
      threeButtons,
      ['<button> "Primary"', '<button> "Ghost"', '<button> "Secondary"'],
      ['<button> "Primary"', '<button> "Ghost"', '<button> "Secondary"']
    );
    expect("content" in result).toBe(true);
    if (!("content" in result)) return;
    expect(result.content).toBe(threeButtons);
  });

  it("handles elements with nested children", () => {
    const source = `<div>
  <section>
    <h3>Card A</h3>
    <p>Description A</p>
  </section>
  <section>
    <h3>Card B</h3>
    <p>Description B</p>
  </section>
</div>`;

    const result = reorderJsxChildren(
      source,
      ['<h3> "Card A"', '<h3> "Card B"'],
      ['<h3> "Card B"', '<h3> "Card A"']
    );
    // This finds the h3 blocks, not the sections
    expect("content" in result).toBe(true);
    if (!("content" in result)) return;

    const cardBIdx = result.content.indexOf("Card B");
    const cardAIdx = result.content.indexOf("Card A");
    expect(cardBIdx).toBeLessThan(cardAIdx);
  });

  it("reorders sections by tag, not inner h2 text (regression)", () => {
    const source = `<main>
  <section>
    <h2>Typography</h2>
    <p>Text content here</p>
  </section>
  <section>
    <h2>Layout</h2>
    <div>Grid stuff</div>
  </section>
  <section>
    <h2>Buttons</h2>
    <button>Click</button>
  </section>
</main>`;

    const result = reorderJsxChildren(
      source,
      ['<section> "Typography"', '<section> "Layout"', '<section> "Buttons"'],
      ['<section> "Layout"', '<section> "Typography"', '<section> "Buttons"']
    );
    expect("content" in result).toBe(true);
    if (!("content" in result)) return;

    // Layout section should come first now
    const layoutIdx = result.content.indexOf("Layout");
    const typoIdx = result.content.indexOf("Typography");
    const buttonsIdx = result.content.indexOf("Buttons");
    expect(layoutIdx).toBeLessThan(typoIdx);
    expect(typoIdx).toBeLessThan(buttonsIdx);

    // Each section should be intact (not just the h2)
    expect(result.content).toContain("Text content here");
    expect(result.content).toContain("Grid stuff");
    expect(result.content).toContain("<button>Click</button>");

    // File length preserved
    expect(result.content.split("\n").length).toBe(source.split("\n").length);
  });
});
