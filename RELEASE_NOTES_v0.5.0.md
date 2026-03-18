# v0.5.0

## New

- **CSS variable system** — detects your project's custom properties by scanning which CSS properties actually use them in your stylesheets, not by name guessing
- **Variable picker** — apply, swap, and unlink variables on any property input, gradient stop colors, and section-level for Fill and Shadow
- **Target scoping** — choose how broadly changes apply: base class, compound selector, or specific element. Animated bridge connectors between scope levels
- **Change indicators** — blue dots show which properties changed from their original values, click to reset
- **Built-in skill** — `retune-visual-changes` teaches your AI agent to resolve tokens, classes, and variables when applying changes
- **One-command setup** — `npx retune setup` auto-detects Claude Code and Cursor, configures MCP, installs skill
- **Pseudo-state editing** — toggle between :hover, :focus, and :active states to edit styles in those states

## Improved

- **Gradient editor** — per-stop change tracking, variable picker on stop colors, disabled angle/rotate for radial, padding fixes
- **Font picker** — redesigned with FloatingDialog, system fonts via Local Font Access API, category filter, permission denied handling
- **Color picker** — variables tab for browsing and applying color variables
- **Output format** — target classes breakdown for compound selectors, token/class/variable candidates per property
- Cascade-aware variable detection (raw value overrides correctly clear variable matches)
- Shorthand inputs only show variable indicator when all sides share the same variable
- Scope-aware property display (only shows properties owned by the selected scope)
- Typography variables split into per-property categories (font-size, font-weight, line-height, letter-spacing, font-family)
- FloatingDialog collision detection (minHeight clamped to available viewport space)
- Selector picker with multi-signal class scoring and utility filtering

## Fixed

- Fill mode reset now restores both `backgroundImage` and `backgroundColor`
- Font picker handles denied permission gracefully
- Gradient change tracking uses stable initial state, not reactive styles
- Variable-applied inputs styled consistently (white background, border, unlink on hover)
- Sub-pixel precision preserved in CSS value display
- Pseudo-state values update correctly (kebab/camelCase mismatch fix)

## Other

- License: MIT → PolyForm Shield 1.0.0
- 303 tests (up from ~50 in 0.4.1)
