# Cascade-Aware CSS Editing — Research & Design Discussion

## The Problem

When a user selects `<button class="btn btn-primary">` and changes `border-radius`, what should happen?

- `.btn` provides `border-radius`, `padding`, `font-size` (shared by 6 buttons)
- `.btn-primary` provides `background-color`, `color` (shared by 2 buttons)
- A naive "This element" vs "All .btn" toggle doesn't capture this nuance

The core tension: **users think in terms of "this thing I'm looking at" (instance), while CSS operates on "all things matching this selector" (class).**

---

## How Existing Tools Handle This

### Browser DevTools — Rule-Level Editing
Chrome/Firefox DevTools solve this by showing the **full cascade** — every matching CSS rule listed by specificity. Users edit at the rule level, not the element level. They see:
```
.btn-primary { background-color: blue; }    /* components.css:42 */
.btn { border-radius: 8px; padding: 10px; } /* components.css:12 */
```
Editing `border-radius` in the `.btn` rule block naturally scopes the change to all `.btn` elements. This is precise but requires CSS knowledge.

Notable features:
- **Chrome**: Specificity tooltips on hover, overridden properties struck through, Computed pane expands to show all competing rules per property
- **Firefox**: "Inactive CSS" indicators (grays out properties that have no effect, e.g., `justify-content` on a non-flex container), cascade filter funnel (click to show only rules declaring a specific property)
- **CDP API**: `CSS.getMatchedStylesForNode` returns all matched rules with `(a,b,c)` specificity values — the same API that powers DevTools, available programmatically

### Webflow — Color-Coded Property Indicators (Best UX Pattern Found)
Webflow uses **color-coded indicators** per property:
- **Orange** = inherited from a parent class or breakpoint (shows source on click)
- **Blue** = locally set on the current class
- **Pink** = element-level override (not saved to any class)
- **Red strikethrough** = overwritten by a more specific combo class

This gives instant per-property visual feedback about where each value comes from. When you edit on a combo class (`.btn.primary`), inherited properties show orange, your overrides show blue.

### Figma — Component Instance Overrides
Figma's model maps well to CSS:

| Figma Concept | CSS Equivalent |
|---|---|
| Main component | CSS class (`.btn`) |
| Instance override | Inline style or instance-specific class |
| Push overrides to main | Edit the CSS class definition |
| Reset override | Remove inline style, fall back to class |
| Detach instance | Remove the class, keep styles inline |

Key Figma UX patterns:
- **Per-property override detection** — overridden properties appear in a reset menu
- **"Push overrides to main component"** — promotes local changes to the shared definition
- **Visual indicators** are implicit (reset menu shows what's overridden), though the community has requested more explicit per-property indicators

### Sketch — Hover-to-Highlight Blast Radius
When hovering over a shared style property in the overrides panel, Sketch **highlights all affected elements on the canvas**. This helps users understand blast radius before committing.

### Other Visual Editors

- **VisBug** (Google Chrome Labs): Applies all changes as inline styles (`element.style`). No cascade awareness — deliberately trades sophistication for simplicity.
- **CSS Hero** (WordPress): Offers "selector context" via right-click — edit globally, this element only, this template, or this page. Uses automatic selector detection with an "Alternatives" menu. Scope applies to the entire session, not per-property.
- **Builder.io**: Inline-style-first approach. Sidesteps the cascade problem by avoiding shared CSS rules entirely.
- **Plasmic**: Uses a variant system rather than CSS classes. Styles are scoped per-component with CSS inheritance blocked at component boundaries.
- **Pinegrow**: The most sophisticated rule-level editor found — shows all active CSS rules for the selected element, users expand any rule to edit properties in place. Essentially a visual wrapper around DevTools Styles pane with file write-back.

### Pinegrow — Match Count Indicator (Most Actionable Pattern)
Pinegrow shows all active CSS rules for the selected element (like DevTools), with a crucial UX addition: a **match count indicator** next to each selector showing how many other elements on the page would be affected. Green icon = matches current element, number = total matches. This directly answers "if I change this rule, what else changes?"

### No Tool Fully Solves This

No existing tool does fully automatic per-property scope resolution. The closest is Webflow's combo class system, but even that requires manual class switching. Pinegrow comes close with rule-level editing + match counts, but is developer-focused. **This is our opportunity.**

### Design Principle (Emerged Across All Tools)
> **Default to the safest scope (local/specific), make it trivially easy to promote to broader scope, and always show the user what scope they are editing.**
>
> Every tool researched follows this principle — local changes are easy and safe; global changes require explicit intent.

### Summary of UX Patterns

| Pattern | Where Used | Relevance |
|---|---|---|
| Color-coded per-property indicators | Webflow | High — shows source at a glance |
| Rule-level editing (full cascade) | Browser DevTools | Medium — too technical for target users |
| Push local to shared | Figma | Medium — useful post-edit action |
| Hover-to-highlight affected elements | Sketch | High — blast radius preview |
| Scope selection at edit time | None (our opportunity) | High — front-loads the decision |
| Inactive CSS indicators | Firefox DevTools | Medium — prevents editing properties that have no effect |
| Selector context menu | CSS Hero | Low — too coarse (session-level, not per-property) |

---

## What We Already Have (Technical Assessment)

### `findStyleSources()` — Strong Foundation
Our existing `findStyleSources` function (in `style-source.ts`) already walks `document.styleSheets` and returns per-property cascade data:
- Which CSS selector provides each property
- Which stylesheet file it comes from
- Whether it's inline, stylesheet, or user-agent
- Whether `!important` is used

**This is currently only used at output time** (read-only annotation in the changes table). It's never consulted during editing.

### `LivePreviewEngine` — Already Per-Property Ready
`applyChange(selector, property, value)` already takes a separate selector per call. Calling `.applyChange('.btn', 'border-radius', '8px')` and `.applyChange('.btn-primary', 'background-color', 'blue')` for the same element already works correctly.

**No structural changes needed** in LivePreviewEngine.

### `ChangeTracker` — Needs Restructuring
The tracker is keyed by a single `selector` per `TrackedElement`. All properties share the same selector. For per-property scoping, it would need:
- A property-to-selector mapping (instead of one selector for all properties)
- An element identity concept separate from the CSS selector
- Modified `getPendingChanges` to group by target selector

### `getSharedSelector()` — No Property Awareness
Currently picks a single "best" shared selector for the whole element. Has no knowledge of which class provides which property.

### Key Gaps
1. **No specificity calculation** — `findStyleSources` sort only differentiates inline/important, not `(a,b,c)` specificity. Two stylesheet rules at equal importance are left in arbitrary order.
2. **No per-property selector in editing pipeline** — editing always uses one selector for all properties
3. **No class extraction from compound selectors** — `.card > .btn-primary:hover` isn't mapped back to `.btn-primary`
4. **No shorthand/longhand cascade awareness** — `padding: 16px` and `padding-left: 8px` treated independently
5. **No `@layer` / `@container` / `@supports` support** — only `@media` rules are recursed into
6. **No `:is()` / `:where()` / `:has()` specificity adjustments**

---

## Proposed Approaches

### Option A: Automatic Per-Property Scope (Smart Default)

When the user edits a property, automatically determine the right selector:

1. Call `findStyleSources(element, [property])` to find the winning rule
2. Use that rule's selector for the preview change
3. Show a subtle indicator: "Affects 6 elements via `.btn`"

**Pros:** Zero friction, just works
**Cons:** Users may not realize their change affects other elements. Potentially surprising.

### Option B: Per-Property Scope with Visual Indicators

Show the source of each property value in the panel (inspired by Webflow):

```
border-radius  [8px]     ← .btn (6 elements)
background     [#3b82f6] ← .btn-primary (2 elements)
padding        [10px]    ← .btn (6 elements)
color          [#fff]    ← .btn-primary (2 elements)
```

When editing, default to the source selector but allow override:
- Click the source indicator to switch scope (this element only / all matching)
- Highlight affected elements on hover

**Pros:** Transparent, educational, powerful
**Cons:** More complex UI, information density in an already dense panel

### Option C: Scope Selection at Edit Time (Confirmation)

When the user starts editing a shared property, show a brief confirmation:
- "Change `border-radius` for all `.btn` elements (6)?" [Yes / Just this one]
- Remember the choice for subsequent edits on the same property

**Pros:** Explicit, prevents accidents
**Cons:** Interrupts flow, annoying for power users

### Option D: Hybrid — Smart Default + Override

Default behavior:
1. **Automatically use the winning rule's selector** (smart per-property scope)
2. Show a **subtle source tag** next to each property value (e.g., `.btn` in a small chip)
3. On the source tag: show element count on hover, click to override scope

Override options:
- "This element only" — switches to unique element selector
- "All [selector]" — keeps the auto-detected selector (already active)
- "Custom selector" — power user option

This is essentially Option A + lightweight indicators from Option B.

---

## Recommendation: Option D (Hybrid)

This gives us the best balance:

1. **Zero friction by default** — changes automatically scope to the right CSS rule
2. **Transparency** — small source tags show where each value comes from
3. **Override capability** — users can narrow scope to "this element only" when needed
4. **Blast radius awareness** — hover on source tag shows count + highlights affected elements

### Implementation Phases

**Phase 1: Per-property source detection (wiring up what we have)**
- Call `findStyleSources` when selecting an element
- Store the winning selector per property
- Use it in `handlePropertyChange` instead of the global scope toggle
- Replace the current binary scope toggle with per-property source tags

**Phase 2: Visual indicators**
- Small source tag/chip next to property values showing the owning selector
- Hover: show element count
- Click: scope override menu (this element / all matching)

**Phase 3: Blast radius preview**
- Hover on source tag highlights all affected elements on canvas
- Animate the highlight to draw attention

**Phase 4: Output improvements**
- Group changes by target selector in formatted output
- Include affected element count per group
- Distinguish "modify existing rule" vs "create new override"

---

## Open Questions

1. **What happens when a property has no CSS rule source?** (inherited from parent, browser default, or inline style) — Default to element-specific selector?

2. **How do we handle the case where the user WANTS to change all buttons' background, across `.btn-primary`, `.btn-secondary`, etc.?** The per-property approach would only change `.btn-primary`. Do we need a "promote to parent class" action?

3. **Should we show the full cascade for a property?** (like DevTools) Or just the winning rule? More info = more power but more complexity.

4. **How does this interact with the AI agent output?** The agent needs to know: "modify `.btn` rule in `styles.css` line 42" vs "add a new rule for this specific element."

5. **Performance of `findStyleSources` on every selection?** Walking all stylesheets could be slow on large pages. May need caching or lazy evaluation.

6. **Should scope choices persist across selections?** If I set "this element only" for border-radius on button A, should it remember that preference for button B?

7. **New property heuristic**: When adding a brand-new property that isn't declared in any existing rule, which selector should we target? Options: the most specific class, the class that already owns the most properties in the same category (layout vs visual), or always default to element-specific.

8. **Tailwind/utility-first projects**: In utility-first CSS, the per-property scope problem mostly disappears (one class = one property). Should we detect the styling approach and simplify the UX accordingly?

---

## CSS Architecture Considerations

Different CSS methodologies imply different "ownership" models:

| Methodology | Ownership Model | Implication for Auto-Routing |
|---|---|---|
| **OOCSS** | Structure classes vs skin classes | Route layout edits to structure class, visual edits to skin class |
| **BEM** | Block owns base styles, Modifier owns variants | Detect `--modifier` naming, route variant properties to modifier |
| **SMACSS** | Five categories: Base, Layout, Module, State, Theme | Route by category (State = `is-` prefixed classes, Theme = colors) |
| **Tailwind** | One class = one property | No ambiguity — add/remove/modify utility classes |
| **CSS Modules** | Scoped by default, no sharing | Always element-level (hashed class names) |

For our heuristic auto-routing, OOCSS's "structure vs skin" separation is the most directly applicable. We could categorize properties into domains (layout, typography, color/visual, effects) and route edits to the class that "owns" that domain.
