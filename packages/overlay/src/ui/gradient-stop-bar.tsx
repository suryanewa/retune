/**
 * GradientStopBar — interactive gradient bar with draggable color stops.
 *
 * - Displays the gradient as a horizontal bar
 * - Stop indicators sit above the bar with carets pointing down
 * - Drag stops to reposition, click bar to add a new stop
 * - Selected stop indicator is highlighted blue
 */

import { useCallback, useRef, useEffect } from "react";
import type { GradientStop } from "./gradient-utils";
import { interpolateColor } from "./gradient-utils";

export interface GradientStopBarProps {
  stops: GradientStop[];
  selectedIndex: number;
  onSelectStop: (index: number) => void;
  onStopPositionChange: (index: number, position: number) => void;
  onAddStop: (position: number, color: string) => void;
  gradientCss: string;
}

export function GradientStopBar({
  stops,
  selectedIndex,
  onSelectStop,
  onStopPositionChange,
  onAddStop,
  gradientCss,
}: GradientStopBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const draggingIndexRef = useRef<number | null>(null);
  const onStopPositionChangeRef = useRef(onStopPositionChange);
  onStopPositionChangeRef.current = onStopPositionChange;

  const getPosition = useCallback((clientX: number) => {
    const rect = barRef.current!.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }, []);

  useEffect(() => {
    const root = barRef.current?.getRootNode() as ShadowRoot | Document;
    if (!root) return;

    const handleMove = (e: PointerEvent) => {
      if (draggingIndexRef.current === null) return;
      onStopPositionChangeRef.current(draggingIndexRef.current, getPosition(e.clientX));
    };
    const handleUp = () => {
      if (draggingIndexRef.current === null) return;
      isDraggingRef.current = false;
      draggingIndexRef.current = null;
    };

    root.addEventListener("pointermove", handleMove as EventListener);
    root.addEventListener("pointerup", handleUp as EventListener);
    // Also listen on document for events that escape shadow DOM
    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerup", handleUp);
    return () => {
      root.removeEventListener("pointermove", handleMove as EventListener);
      root.removeEventListener("pointerup", handleUp as EventListener);
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", handleUp);
    };
  }, [getPosition]);

  const handleHandlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, index: number) => {
      e.stopPropagation();
      e.preventDefault();
      isDraggingRef.current = true;
      draggingIndexRef.current = index;
      onSelectStop(index);
    },
    [onSelectStop],
  );

  const handleBarClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isDraggingRef.current) return;
      const position = getPosition(e.clientX);
      const color = interpolateColor(stops, position);
      onAddStop(position, color);
    },
    [stops, onAddStop, getPosition],
  );

  return (
    <div className="composer-gradient-bar-wrap" onClick={handleBarClick}>
      {/* Gradient bar */}
      <div ref={barRef} className="composer-gradient-bar">
        {/* Checkerboard */}
        <div className="composer-gradient-bar-checker" />
        {/* Gradient overlay */}
        <div className="composer-gradient-bar-fill" style={{ backgroundImage: gradientCss }} />
      </div>

      {/* Stop indicators */}
      {stops.map((stop, index) => (
        <div
          key={index}
          className="composer-gradient-stop-handle"
          style={{ left: `${stop.position * 100}%` }}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => handleHandlePointerDown(e, index)}
        >
          <div className="composer-gradient-stop-indicator">
            <div
              className="composer-gradient-stop-chit"
              style={{
                backgroundColor: selectedIndex === index ? "#0d99ff" : "white",
              }}
            >
              <div
                className="composer-gradient-stop-chit-color"
                style={{ backgroundColor: stop.color }}
              />
            </div>
            <div
              className="composer-gradient-stop-caret"
              style={{
                backgroundColor: selectedIndex === index ? "#0d99ff" : "white",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
