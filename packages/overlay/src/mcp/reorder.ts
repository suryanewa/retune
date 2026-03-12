/**
 * JSX block finding and reordering logic.
 *
 * Finds JSX children in source code by text content matching,
 * then reorders the blocks to match the desired order.
 */

/** Extract text from a label like '<button> "Primary"' → "Primary" */
export function extractText(label: string): string {
  const match = label.match(/"(.+)"/);
  return match ? match[1] : label;
}

/** Extract tag name from a label like '<section> "Typography"' → "section" */
export function extractTag(label: string): string | null {
  const match = label.match(/^<(\w+)/);
  return match ? match[1] : null;
}

export interface JsxBlock {
  start: number;
  end: number;
}

/**
 * Find a JSX block by searching for text content, then walking
 * backwards to the opening tag and forwards to the closing tag.
 *
 * If `tag` is provided, validates that the found block starts with
 * the correct tag (e.g., finds `<section>` not `<h2>` when looking
 * for a section that contains "Typography").
 *
 * Returns the line range { start, end } (0-indexed) or null if not found.
 */
export function findJsxBlock(
  lines: string[],
  text: string,
  usedLines: Set<number>,
  tag?: string | null
): JsxBlock | null {
  // Try each occurrence of the text in the file
  let searchFrom = 0;

  while (searchFrom < lines.length) {
    // Find the next line containing this text (not already used)
    let textLine = -1;
    for (let i = searchFrom; i < lines.length; i++) {
      if (usedLines.has(i)) continue;
      if (lines[i].includes(text)) {
        textLine = i;
        break;
      }
    }
    if (textLine === -1) return null;

    // Walk backwards to find opening tag, potentially climbing to parent
    // if a specific tag is required
    let start = textLine;
    let depth = 0;
    let foundTag = false;
    for (let i = textLine; i >= 0; i--) {
      const line = lines[i].trim();
      const closeTags = (line.match(/<\//g) || []).length;
      const selfClosing = (line.match(/\/>/g) || []).length;
      const openTags = (line.match(/<[a-zA-Z]/g) || []).length;

      depth += closeTags - openTags + selfClosing;

      if (openTags > 0 && depth <= 0) {
        if (tag) {
          const tagMatch = line.match(/^<(\w+)/);
          if (tagMatch && tagMatch[1] === tag) {
            start = i;
            foundTag = true;
            break;
          }
          // Wrong tag — keep climbing
        } else {
          start = i;
          foundTag = true;
          break;
        }
      }
    }

    if (tag && !foundTag) {
      // Couldn't find the right parent tag — try next text occurrence
      searchFrom = textLine + 1;
      continue;
    }

    // Walk forward from start to find closing tag
    let end = textLine;
    depth = 0;
    for (let i = start; i < lines.length; i++) {
      const line = lines[i].trim();
      const openTags = (line.match(/<[a-zA-Z]/g) || []).length;
      const closeTags = (line.match(/<\//g) || []).length;
      const selfClosing = (line.match(/\/>/g) || []).length;

      depth += openTags - closeTags - selfClosing;

      if (depth <= 0 && i >= textLine) {
        end = i;
        break;
      }
    }

    // Check none of these lines are already used
    let overlap = false;
    for (let i = start; i <= end; i++) {
      if (usedLines.has(i)) { overlap = true; break; }
    }
    if (overlap) {
      searchFrom = textLine + 1;
      continue;
    }

    return { start, end };
  }

  return null;
}

/**
 * Reorder JSX children in source code.
 *
 * Finds each child's JSX block by text content, then rearranges
 * them to match the new order.
 *
 * Returns the rewritten file content, or null if any child couldn't be found
 * (with an error message explaining what went wrong).
 */
export function reorderJsxChildren(
  content: string,
  originalOrder: string[],
  newOrder: string[]
): { content: string } | { error: string } {
  const lines = content.split("\n");
  const childBlocks = new Map<string, JsxBlock>();
  const usedLines = new Set<number>();

  for (const label of originalOrder) {
    const text = extractText(label);
    const tag = extractTag(label);
    const block = findJsxBlock(lines, text, usedLines, tag);
    if (!block) {
      return { error: `Could not find "${text}" in source` };
    }
    for (let i = block.start; i <= block.end; i++) usedLines.add(i);
    childBlocks.set(label, block);
  }

  if (childBlocks.size !== originalOrder.length) {
    return {
      error: `Could only find ${childBlocks.size}/${originalOrder.length} children`,
    };
  }

  // Extract code blocks in original order
  const codeBlocks = new Map<string, string[]>();
  for (const [label, range] of childBlocks) {
    codeBlocks.set(label, lines.slice(range.start, range.end + 1));
  }

  // Find the overall range
  const allStarts = [...childBlocks.values()].map((r) => r.start);
  const allEnds = [...childBlocks.values()].map((r) => r.end);
  const rangeStart = Math.min(...allStarts);
  const rangeEnd = Math.max(...allEnds);

  // Reconstruct: before + reordered children + after
  const before = lines.slice(0, rangeStart);
  const after = lines.slice(rangeEnd + 1);
  const reordered = newOrder.flatMap((label) => codeBlocks.get(label)!);

  return { content: [...before, ...reordered, ...after].join("\n") };
}
