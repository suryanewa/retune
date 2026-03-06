/**
 * Element picker: hover to highlight, click to select.
 *
 * Uses a fixed-position overlay with pointer-events:none so
 * elementFromPoint() returns the real element underneath.
 * All event listeners use capture phase to intercept before page handlers.
 *
 * Selection persists until a new element is selected or picker is deactivated.
 * Hover box becomes dashed when a selection exists.
 */

export interface PickerCallbacks {
  onHover: (element: Element, rect: DOMRect) => void;
  onSelect: (element: Element) => void;
  onCancel: () => void;
}

export function createPicker(
  shadowRoot: ShadowRoot,
  callbacks: PickerCallbacks
) {
  // Hover highlight
  const highlight = document.createElement("div");
  highlight.setAttribute("data-composer-highlight", "");
  shadowRoot.appendChild(highlight);

  const label = document.createElement("div");
  label.setAttribute("data-composer-label", "");
  shadowRoot.appendChild(label);

  // Selection highlight (persistent)
  const selection = document.createElement("div");
  selection.setAttribute("data-composer-selection", "");
  shadowRoot.appendChild(selection);

  const selectionLabel = document.createElement("div");
  selectionLabel.setAttribute("data-composer-selection-label", "");
  shadowRoot.appendChild(selectionLabel);

  let active = false;
  let hoveredElement: Element | null = null;
  let selectedElement: Element | null = null;
  let rafId: number | null = null;

  const BASE_HIGHLIGHT = `
    position: fixed;
    pointer-events: none;
    z-index: 2147483646;
    box-sizing: border-box;
    transition: all 0.05s ease;
  `;

  const BASE_LABEL = `
    position: fixed;
    color: white;
    font-size: 11px;
    font-family: ui-monospace, monospace;
    padding: 2px 6px;
    border-radius: 3px;
    pointer-events: none;
    z-index: 2147483646;
    white-space: nowrap;
  `;

  function updateHighlight(el: Element) {
    const rect = el.getBoundingClientRect();
    const dashed = selectedElement !== null && el !== selectedElement;
    const borderStyle = dashed ? "dashed" : "solid";
    highlight.style.cssText = `
      ${BASE_HIGHLIGHT}
      top: ${rect.top}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      border: 2px ${borderStyle} #3b82f6;
      background: rgba(59, 130, 246, 0.08);
    `;

    const labelY = rect.top > 24 ? rect.top - 24 : rect.bottom + 4;
    label.style.cssText = `
      ${BASE_LABEL}
      top: ${labelY}px;
      left: ${rect.left}px;
      background: #3b82f6;
    `;
    label.textContent = formatLabel(el);
  }

  function updateSelection() {
    if (!selectedElement) {
      selection.style.display = "none";
      selectionLabel.style.display = "none";
      return;
    }

    const rect = selectedElement.getBoundingClientRect();
    selection.style.cssText = `
      ${BASE_HIGHLIGHT}
      top: ${rect.top}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      border: 2px solid #3b82f6;
      background: rgba(59, 130, 246, 0.04);
    `;

    const labelY = rect.top > 24 ? rect.top - 24 : rect.bottom + 4;
    selectionLabel.style.cssText = `
      ${BASE_LABEL}
      top: ${labelY}px;
      left: ${rect.left}px;
      background: #3b82f6;
    `;
    selectionLabel.textContent = formatLabel(selectedElement);
  }

  function formatLabel(el: Element): string {
    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : "";
    const cls = el.className && typeof el.className === "string"
      ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".")
      : "";
    const dims = `${Math.round(el.getBoundingClientRect().width)}×${Math.round(el.getBoundingClientRect().height)}`;
    return `${tag}${id}${cls} ${dims}`;
  }

  function hideHighlight() {
    highlight.style.display = "none";
    label.style.display = "none";
  }

  function hideSelection() {
    selection.style.display = "none";
    selectionLabel.style.display = "none";
  }

  // Keep selection box in sync on scroll/resize
  function startTracking() {
    function tick() {
      if (selectedElement) updateSelection();
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
  }

  function stopTracking() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  // Filter out our own overlay elements
  function isOverlayElement(el: Element): boolean {
    return !!el.closest("[data-composer-host]");
  }

  function handleMouseMove(e: MouseEvent) {
    if (!active) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || isOverlayElement(el)) return;
    if (el === hoveredElement) return;

    hoveredElement = el;

    // If hovering the selected element, hide hover highlight (selection box is enough)
    if (el === selectedElement) {
      hideHighlight();
      selectionLabel.style.display = "";
    } else {
      updateHighlight(el);
      // Hide selection label to avoid overlap with hover label
      selectionLabel.style.display = "none";
    }

    callbacks.onHover(el, el.getBoundingClientRect());
  }

  function handleClick(e: MouseEvent) {
    if (!active) return;

    // Ignore clicks that originate from inside the overlay (panel buttons, inputs, dropdowns)
    const path = e.composedPath();
    const host = shadowRoot.host;
    if (path.includes(host)) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || isOverlayElement(el)) return;

    selectedElement = el;
    updateSelection();
    hideHighlight();
    callbacks.onSelect(el);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!active) return;
    if (e.key === "Escape") {
      e.preventDefault();
      callbacks.onCancel();
    }
  }

  function activate() {
    active = true;
    document.body.style.cursor = "crosshair";
    document.addEventListener("mousemove", handleMouseMove, true);
    document.addEventListener("click", handleClick, true);
    document.addEventListener("keydown", handleKeyDown, true);
    startTracking();
  }

  function deactivate() {
    active = false;
    document.body.style.cursor = "";
    hoveredElement = null;
    selectedElement = null;
    hideHighlight();
    hideSelection();
    stopTracking();
    document.removeEventListener("mousemove", handleMouseMove, true);
    document.removeEventListener("click", handleClick, true);
    document.removeEventListener("keydown", handleKeyDown, true);
  }

  function clearSelection() {
    selectedElement = null;
    hideSelection();
  }

  function destroy() {
    deactivate();
    highlight.remove();
    label.remove();
    selection.remove();
    selectionLabel.remove();
  }

  return { activate, deactivate, destroy, hideHighlight, clearSelection };
}
