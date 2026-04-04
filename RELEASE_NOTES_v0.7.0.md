# v0.7.0

## New

- **Comment system** — annotate elements (click) and areas (drag) with text notes for your AI agent. Markers follow scroll, expand on hover with text preview, shake when you have unsaved changes. Formatted output includes element context, area regions with contained elements. MCP tool: `retune_get_comments`
- **Component props & state** — view and edit React component props and useState hooks directly in the panel. Enum props render as dropdowns, booleans as segmented controls, strings as text inputs. State hooks labeled with actual variable names when manifest is present
- **Manifest system** — `retune.manifest.json` describes your design system's components, props, state hooks, and tokens. Powers accurate token pickers, component variant controls, scope pill labels, and output context. Generated via banner prompt, MCP nudge, or `npx retune setup`
- **Image & video controls** — object-fit, object-position, alt text, loading (lazy/eager) for images. Autoplay, loop, muted, controls for video. Background-size, position, repeat for background images
- **SVG editing** — fill and stroke color pickers with add/remove pattern, stroke width control. Irrelevant HTML sections (border, layout, spacing) hidden for SVG child shapes
- **Aspect ratio lock** — lock toggle in Size section constrains proportions when editing width/height. Images/video lock by default during resize (Shift to unlock). Dotted diagonal line indicator during locked resize
- **Tree view redesign** — Figma-style icons based on computed layout (flex-row, flex-column, grid, block, text, image, component). SVG shapes render as mini path previews. Text elements show content preview as layer name. Descendant highlighting on selection

## Improved

- **Token pickers** — manifest tokens replace scanner results for covered categories, eliminating noise from component classes and miscategorized variables. Color sub-groups render as labeled sections. Class-based active state detection for Tailwind utility tokens
- **Scope pills** — manifest `class_map` classes promoted to semantic (fixes variant classes like `tag-blue` being dropped). Pill labels use manifest prop values for accuracy
- **Output format** — separate sections for CSS changes, prop changes, attribute changes, and SVG attribute changes. Per-element manifest context (component variants, class mappings) included inline. Manifest component list in header
- **Setup command** — `npx retune setup` now extracts design tokens from CSS files and generates a partial manifest automatically. Prints instructions for AI agent to complete with component definitions
- **MCP integration** — new `retune_manifest_loaded` tool lets agents notify the overlay after generating a manifest (instant reload, no polling). Tool responses include manifest generation prompt when manifest is missing
- **Skill** — updated with prop changes, attribute changes, SVG attributes, manifest generation/maintenance guidance
- **Text color hierarchy** — primary 90%, secondary 70%, tertiary 50%. Field labels use tertiary for clearer visual hierarchy
- **Toolbar** — Retune pixel logo with bloom hover animation, collapsed state keeps background on dark mode hover

## Fixed

- **Text input editing** — works correctly in Shadow DOM (focusRef instead of document.activeElement check)
- **Prop changes always recorded** — decoupled from live preview success
- **Manifest loading** — eagerly fetched on mount, survives React StrictMode remounts via ref-to-state sync
- **Manifest banner** — suppressed until first check completes (no flash on load)
- **Component section** — only shows when element has displayable props or state (no empty MailApp section for child elements)
- **Reset reverts DOM** — prop preview class swaps correctly reverted on individual reset and clear-all
- **ColorInput None state** — red diagonal swatch for unset colors (SVG stroke without color assigned)
- **Button group hover** — missing hover state added
- **Native number spinners** — hidden in component grid inputs

## Other

- `dev/` renamed to `playground/`
- 412 tests (up from 404 in v0.6.2)
