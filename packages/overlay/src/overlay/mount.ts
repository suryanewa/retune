/**
 * Shadow DOM host for the Composer overlay.
 *
 * Creates an isolated DOM subtree that cannot be affected by
 * the host page's styles, and whose styles cannot leak out.
 */

const OVERLAY_STYLES = `
  :host {
    all: initial;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    font-size: 13px;
    color: #1a1a1a;
    line-height: 1.4;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── Toolbar ── */
  .composer-toolbar {
    position: fixed;
    z-index: 2147483647;
    pointer-events: auto;
    background: #fff;
    border: 1px solid #e2e2e2;
    border-radius: 10px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04);
    padding: 6px;
    display: flex;
    align-items: center;
    gap: 4px;
    user-select: none;
  }

  .composer-toolbar.top.right { top: 16px; right: 16px; }
  .composer-toolbar.top.left { top: 16px; left: 16px; }
  .composer-toolbar.bottom.right { bottom: 16px; right: 16px; }
  .composer-toolbar.bottom.left { bottom: 16px; left: 16px; }

  .composer-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border: none;
    border-radius: 6px;
    background: transparent;
    cursor: pointer;
    color: #888;
    transition: all 0.12s ease;
  }

  .composer-btn:hover { background: #f0f0f0; color: #333; }
  .composer-btn.active { background: #3b82f6; color: #fff; }
  .composer-btn.active:hover { background: #2563eb; }

  .composer-divider {
    width: 1px;
    height: 18px;
    background: #e5e5e5;
    margin: 0 2px;
  }

  .composer-changes-count {
    font-size: 10px;
    font-weight: 600;
    background: #3b82f6;
    color: #fff;
    min-width: 18px;
    height: 18px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 5px;
  }

  .composer-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 500;
  }
  .composer-badge.connected { background: #dcfce7; color: #166534; }
  .composer-badge.disconnected { background: #f5f5f5; color: #999; }
  .composer-status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin-right: 4px;
  }
  .composer-status-dot.connected { background: #22c55e; }
  .composer-status-dot.disconnected { background: #ccc; }

  /* ── Panel ── */
  .composer-panel {
    position: fixed;
    z-index: 2147483647;
    pointer-events: auto;
    background: #fff;
    border: 1px solid #e2e2e2;
    border-radius: 10px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.04);
    width: 280px;
    max-height: calc(100vh - 80px);
    overflow-y: auto;
    overflow-x: hidden;
  }

  .composer-panel.right { right: 16px; top: 60px; }
  .composer-panel.left { left: 16px; top: 60px; }

  /* Scrollbar */
  .composer-panel::-webkit-scrollbar { width: 4px; }
  .composer-panel::-webkit-scrollbar-track { background: transparent; }
  .composer-panel::-webkit-scrollbar-thumb { background: #ddd; border-radius: 2px; }
  .composer-panel::-webkit-scrollbar-thumb:hover { background: #bbb; }

  /* Panel header */
  .composer-panel-header {
    position: sticky;
    top: 0;
    background: #fff;
    padding: 8px 16px;
    border-bottom: 1px solid #e7e5e4;
    z-index: 1;
  }

  .composer-el-tag {
    font-size: 11px;
    font-weight: 550;
    letter-spacing: 0.055px;
    color: #1c1917;
  }

  .composer-el-component {
    font-size: 11px;
    font-weight: 450;
    letter-spacing: -0.055px;
    color: #3b82f6;
    margin-top: 1px;
  }

  .composer-el-text {
    font-size: 11px;
    font-weight: 450;
    letter-spacing: -0.055px;
    color: #78716c;
    margin-top: 1px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* ── Section structure (matches portfolio editor) ── */
  .composer-section {
    border-bottom: 1px solid #e7e5e4;
    user-select: none;
  }

  .composer-section:last-child { border-bottom: none; }

  .composer-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    height: 32px;
  }

  .composer-section-title {
    font-size: 11px;
    font-weight: 550;
    letter-spacing: 0.055px;
    color: #1c1917;
  }

  .composer-section-body {
    padding-bottom: 12px;
  }

  .composer-section-row {
    padding: 4px 16px;
  }

  /* Row layout: flex with gap for side-by-side fields */
  .composer-row {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }

  /* Props directly in a row get flex: 1 */
  .composer-row > .composer-prop { flex: 1; }

  /* Field: flex-1 column with label above input */
  .composer-field {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .composer-field-label {
    font-size: 9px;
    font-weight: 500;
    letter-spacing: 0.045px;
    color: #78716c;
    line-height: 16px;
  }

  /* Group label: single label above a set of related inputs */
  .composer-group-label {
    font-size: 9px;
    font-weight: 500;
    letter-spacing: 0.045px;
    color: #78716c;
    line-height: 16px;
    padding: 0 16px;
  }

  /* Property cell — matches portfolio NumberInput */
  .composer-prop {
    display: flex;
    align-items: center;
    gap: 0;
    height: 24px;
    padding: 0;
    border-radius: 6px;
    background: #f5f5f4;
    border: none;
    min-width: 0;
    overflow: hidden;
    position: relative;
    transition: background-color 0.15s ease;
  }

  .composer-prop:hover { background: #e7e5e4; }
  .composer-prop:focus-within {
    outline: 1px solid #1c1917;
    outline-offset: -1px;
    background: #f5f5f4;
  }

  .composer-prop-label {
    position: absolute;
    left: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 450;
    letter-spacing: -0.055px;
    color: #78716c;
    flex-shrink: 0;
    user-select: none;
    cursor: ew-resize;
    z-index: 1;
  }

  .composer-prop-input {
    flex: 1;
    min-width: 0;
    width: 100%;
    height: 100%;
    border: none;
    background: transparent;
    font-size: 11px;
    font-weight: 450;
    letter-spacing: -0.055px;
    font-family: inherit;
    color: #1c1917;
    outline: none;
    padding: 0 6px 0 24px;
  }

  .composer-prop-input::selection { background: #bfdbfe; }
  .composer-prop-input:focus { outline: none; }

  /* Color property */
  .composer-prop.color {
    gap: 0;
    padding: 0;
  }

  .composer-color-swatch {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    position: relative;
  }

  .composer-color-swatch-inner {
    width: 14px;
    height: 14px;
    border-radius: 2px;
    position: relative;
    overflow: hidden;
    cursor: pointer;
  }

  /* Checkerboard for transparent colors */
  .composer-color-swatch-inner::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%),
      linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%);
    background-size: 4px 4px;
    background-position: 0 0, 2px 2px;
    z-index: 0;
  }

  .composer-color-swatch-fill {
    position: absolute;
    inset: 0;
    z-index: 1;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
    border-radius: 2px;
  }

  .composer-color-picker {
    position: absolute;
    opacity: 0;
    width: 100%;
    height: 100%;
    cursor: pointer;
  }

  /* Select input */
  .composer-prop-select {
    flex: 1;
    min-width: 0;
    height: 100%;
    border: none;
    background: transparent;
    font-size: 11px;
    font-weight: 450;
    letter-spacing: -0.055px;
    font-family: inherit;
    color: #1c1917;
    outline: none;
    cursor: pointer;
    padding: 0 6px 0 24px;
    -webkit-appearance: none;
    appearance: none;
  }

  /* ── Slider ── */
  .composer-slider {
    position: relative;
    height: 24px;
    border-radius: 6px;
    background: #f5f5f4;
    cursor: ew-resize;
    user-select: none;
    overflow: hidden;
    transition: background-color 0.15s ease;
  }

  .composer-slider:hover { background: #e7e5e4; }
  .composer-slider:focus-visible { outline: 1px solid #1c1917; outline-offset: -1px; }

  .composer-slider-fill {
    position: absolute;
    inset: 0;
    right: auto;
    background: #ebebeb;
    pointer-events: none;
  }

  .composer-slider-indicator {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 1px;
    height: 4px;
    border-radius: 1px;
    background: rgba(0, 0, 0, 0.12);
    pointer-events: none;
  }

  .composer-slider-handle {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 2px;
    height: 16px;
    border-radius: 1px;
    background: #fff;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
    pointer-events: none;
    margin-left: -1px;
  }

  .composer-slider-labels {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 6px;
    pointer-events: none;
    overflow: hidden;
    white-space: nowrap;
  }

  .composer-slider-label {
    font-size: 11px;
    font-weight: 450;
    letter-spacing: -0.055px;
    color: #78716c;
  }

  .composer-slider-value {
    font-size: 11px;
    font-weight: 450;
    letter-spacing: -0.055px;
    font-family: inherit;
    color: #1c1917;
  }
`;

export interface MountResult {
  host: HTMLElement;
  root: ShadowRoot;
  /** Container inside shadow root — use this as the React portal target */
  container: HTMLDivElement;
  sheet: CSSStyleSheet;
}

export function mountOverlay(): MountResult {
  const host = document.createElement("div");
  host.setAttribute("data-composer-host", "");
  host.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 0;
    height: 0;
    z-index: 2147483647;
    pointer-events: none;
  `;

  const root = host.attachShadow({ mode: "open" });

  const sheet = new CSSStyleSheet();
  sheet.replaceSync(OVERLAY_STYLES);
  root.adoptedStyleSheets = [sheet];

  // React createPortal needs a real DOM element, not a ShadowRoot
  const container = document.createElement("div");
  container.setAttribute("data-composer-container", "");
  root.appendChild(container);

  document.body.appendChild(host);

  return { host, root, container, sheet };
}

export function unmountOverlay(host: HTMLElement) {
  host.remove();
}
