/**
 * Shadow DOM host for the Composer overlay.
 *
 * Creates an isolated DOM subtree that cannot be affected by
 * the host page's styles, and whose styles cannot leak out.
 */

import overlayStyles from './overlay-css';

export interface MountResult {
  host: HTMLElement;
  root: ShadowRoot;
  /** Container inside shadow root — use this as the React portal target */
  container: HTMLDivElement;
  sheet: CSSStyleSheet;
}

export function mountOverlay(): MountResult {
  // Load Inter font if not already present
  if (!document.querySelector('link[data-composer-font]')) {
    const preconnect = document.createElement("link");
    preconnect.rel = "preconnect";
    preconnect.href = "https://rsms.me/";
    document.head.appendChild(preconnect);

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://rsms.me/inter/inter.css";
    link.setAttribute("data-composer-font", "");
    document.head.appendChild(link);
  }

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
  sheet.replaceSync(overlayStyles);
  root.adoptedStyleSheets = [sheet];

  // React createPortal needs a real DOM element, not a ShadowRoot
  const container = document.createElement("div");
  container.setAttribute("data-composer-container", "");
  root.appendChild(container);

  document.documentElement.appendChild(host);

  return { host, root, container, sheet };
}

export function unmountOverlay(host: HTMLElement) {
  host.remove();
}
