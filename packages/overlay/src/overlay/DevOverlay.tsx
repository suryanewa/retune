"use client";

/**
 * DevOverlay — the main React component users add to their app.
 *
 * Usage:
 *   import { DevOverlay } from "@composer/overlay";
 *   // In your layout:
 *   {process.env.NODE_ENV === "development" && <DevOverlay />}
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import type { ComposerConfig, InspectedElement } from "../types";
import { mountOverlay, unmountOverlay } from "./mount";
import { createPicker } from "../selector/picker";
import { LivePreviewEngine } from "../engine/live-preview";
import { ChangeTracker } from "../engine/change-tracker";
import { formatChanges, type Fidelity } from "../engine/output";
import { BridgeClient } from "../bridge/ws-client";
import { inspectElement, matchesHotkey } from "../ui/helpers";
import { PropertyPanel } from "./PropertyPanel";

const DEFAULT_CONFIG: Required<ComposerConfig> = {
  port: 9223,
  hotkey: "alt+d",
  fidelity: "standard",
  position: "top-right",
};

export function DevOverlay(props: ComposerConfig = {}) {
  const config = { ...DEFAULT_CONFIG, ...props };

  const [active, setActive] = useState(false);
  const [selectedElement, setSelectedElement] = useState<InspectedElement | null>(null);
  const [changeCount, setChangeCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const [fidelity] = useState<Fidelity>(config.fidelity);
  const [portalTarget, setPortalTarget] = useState<HTMLDivElement | null>(null);

  const mountRef = useRef<ReturnType<typeof mountOverlay> | null>(null);
  const pickerRef = useRef<ReturnType<typeof createPicker> | null>(null);
  const previewRef = useRef<LivePreviewEngine | null>(null);
  const trackerRef = useRef<ChangeTracker | null>(null);
  const bridgeRef = useRef<BridgeClient | null>(null);

  // Initialize on mount
  useEffect(() => {
    const mount = mountOverlay();
    mountRef.current = mount;
    setPortalTarget(mount.container);

    const preview = new LivePreviewEngine();
    previewRef.current = preview;

    const tracker = new ChangeTracker();
    trackerRef.current = tracker;

    const bridge = new BridgeClient(config.port);
    bridgeRef.current = bridge;

    bridge.onRequest(async (method, params) => {
      switch (method) {
        case "getSelection":
          return selectedElement;
        case "getPendingChanges":
          return tracker.getPendingChanges();
        case "getFormattedChanges":
          return formatChanges(tracker.getPendingChanges(), params?.fidelity || fidelity);
        default:
          throw new Error(`Unknown method: ${method}`);
      }
    });

    bridge.connect();

    const statusInterval = setInterval(() => {
      setConnected(bridge.connected);
    }, 1000);

    const picker = createPicker(mount.root, {
      onHover: () => {},
      onSelect: (element) => {
        const inspected = inspectElement(element);
        setSelectedElement(inspected);
        tracker.track(
          inspected.selector,
          inspected.tagName,
          inspected.textContent,
          inspected.classes,
          inspected.reactComponents,
          inspected.computedStyles
        );
      },
      onCancel: () => {
        setActive(false);
      },
    });
    pickerRef.current = picker;

    return () => {
      clearInterval(statusInterval);
      picker.destroy();
      preview.destroy();
      bridge.disconnect();
      unmountOverlay(mount.host);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Toggle picker when active state changes
  useEffect(() => {
    const picker = pickerRef.current;
    const preview = previewRef.current;
    if (!picker || !preview) return;

    if (active) {
      picker.activate();
      preview.attach();
    } else {
      picker.deactivate();
      setSelectedElement(null);
    }
  }, [active]);

  // Hotkey listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (matchesHotkey(e, config.hotkey)) {
        e.preventDefault();
        setActive((a) => !a);
      }
      if (active && (e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if (active && (e.metaKey || e.ctrlKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      }
    }
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [active, config.hotkey]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePropertyChange = useCallback((property: string, value: string) => {
    if (!selectedElement || !previewRef.current || !trackerRef.current) return;
    previewRef.current.applyChange(selectedElement.selector, property, value);
    trackerRef.current.recordChange(selectedElement.selector, property, value);
    setChangeCount(trackerRef.current.getPendingChanges().reduce(
      (sum, c) => sum + c.changes.length, 0
    ));
  }, [selectedElement]);

  const handleUndo = useCallback(() => {
    const tracker = trackerRef.current;
    const preview = previewRef.current;
    if (!tracker || !preview) return;
    const entry = tracker.popUndo();
    if (entry) {
      if (entry.value) preview.applyChange(entry.selector, entry.property, entry.value);
      else preview.removeChange(entry.selector, entry.property);
      setChangeCount(tracker.getPendingChanges().reduce((s, c) => s + c.changes.length, 0));
    }
  }, []);

  const handleRedo = useCallback(() => {
    const tracker = trackerRef.current;
    const preview = previewRef.current;
    if (!tracker || !preview) return;
    const entry = tracker.popRedo();
    if (entry) {
      preview.applyChange(entry.selector, entry.property, entry.value);
      setChangeCount(tracker.getPendingChanges().reduce((s, c) => s + c.changes.length, 0));
    }
  }, []);

  const handleCopy = useCallback(() => {
    const tracker = trackerRef.current;
    if (!tracker) return;
    navigator.clipboard.writeText(formatChanges(tracker.getPendingChanges(), fidelity));
  }, [fidelity]);

  const handleSend = useCallback(async () => {
    const tracker = trackerRef.current;
    const bridge = bridgeRef.current;
    if (!tracker || !bridge) return;
    const changes = tracker.getPendingChanges();
    if (changes.length === 0) return;
    try { await bridge.sendChanges(changes); } catch { handleCopy(); }
  }, [handleCopy]);

  const handleClear = useCallback(() => {
    previewRef.current?.clearAll();
    trackerRef.current?.clear();
    setSelectedElement(null);
    setChangeCount(0);
  }, []);

  if (!portalTarget) return null;

  return createPortal(
    <>
      {/* Floating toolbar */}
      <div className={`composer-toolbar ${config.position.replace("-", " ")}`}>
        <button
          className={`composer-btn ${active ? "active" : ""}`}
          onClick={() => setActive(!active)}
          title={`Toggle edit mode (${config.hotkey})`}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M11.5 1.5L14.5 4.5L5 14H2V11L11.5 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {changeCount > 0 && (
          <>
            <div className="composer-divider" />
            <div className="composer-changes-count">{changeCount}</div>
            <button className="composer-btn" onClick={handleCopy} title="Copy changes">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M11 5V3.5A1.5 1.5 0 009.5 2h-6A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
            <button className="composer-btn" onClick={handleSend} title="Send to AI">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M14 2L7 14L5.5 8.5L2 7L14 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </button>
            <button className="composer-btn" onClick={handleClear} title="Clear">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M4 4L12 12M4 12L12 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </>
        )}

        <div className="composer-divider" />
        <div className={`composer-badge ${connected ? "connected" : "disconnected"}`}>
          <div className={`composer-status-dot ${connected ? "connected" : "disconnected"}`} />
          {connected ? "MCP" : "offline"}
        </div>
      </div>

      {/* Property panel */}
      {active && selectedElement && (
        <PropertyPanel
          element={selectedElement}
          position={config.position.includes("right") ? "right" : "left"}
          onPropertyChange={handlePropertyChange}
        />
      )}
    </>,
    portalTarget
  );
}
