"use client";

import * as React from "react";
import {
  useEditorMutations,
  useCreationTool,
  useDevice,
} from "./context";
import { cn } from "@/lib/utils";
import {
  DesktopSmall,
  TabletSmall,
  MobileSmall,
  Move,
  FlexFrame,
  Rectangle,
  Ellipse,
  Star,
  Text,
  Comment,
  Image,
  Video,
  RectangleSmall,
  EllipseSmall,
  StarSmall,
  ImageSmall,
  VideoSmall,
} from "@/components/icons/editor";
import {
  ChevronDown16,
} from "@/components/icons/editor-16";
import { DropdownMenu, type DropdownMenuOption } from "./ui/dropdown-menu";
import type { CreationTool } from "@/lib/playground/editor-types";

// ─── Shape tools (grouped behind one button with dropdown) ─────────────

type ShapeTool = "rectangle" | "circle" | "star" | "image" | "video";

const SHAPE_TOOLS: { tool: ShapeTool; label: string; shortcut?: string; icon: React.ComponentType<{ className?: string }>; menuIcon: React.ComponentType<{ className?: string }> }[] = [
  { tool: "rectangle", label: "Rectangle", shortcut: "R", icon: Rectangle, menuIcon: RectangleSmall },
  { tool: "circle", label: "Circle", shortcut: "O", icon: Ellipse, menuIcon: EllipseSmall },
  { tool: "star", label: "Star", icon: Star, menuIcon: StarSmall },
  { tool: "image", label: "Image", icon: Image, menuIcon: ImageSmall },
  { tool: "video", label: "Video", icon: Video, menuIcon: VideoSmall },
];

// ─── Device options ────────────────────────────────────────────────────

const DEVICE_OPTIONS = [
  { value: "desktop" as const, icon: DesktopSmall },
  { value: "tablet" as const, icon: TabletSmall },
  { value: "mobile" as const, icon: MobileSmall },
];

// ─── Helpers ───────────────────────────────────────────────────────────

function isDrawableShapeTool(tool: CreationTool): boolean {
  return tool === "rectangle" || tool === "circle" || tool === "star" || tool === "image" || tool === "video";
}

const btnClass = (active: boolean) =>
  cn(
    "h-8 w-8 flex items-center justify-center",
    active
      ? "bg-blue-500 text-white"
      : "hover:bg-stone-100 text-stone-600 dark:text-stone-400 dark:hover:bg-stone-800"
  );

// ─── Component ─────────────────────────────────────────────────────────

export function BottomToolbar() {
  const { setDevice, setCreationTool } = useEditorMutations();
  const creationTool = useCreationTool();
  const device = useDevice();

  // Track which shape was last selected so it persists in the toolbar
  const [activeShape, setActiveShape] = React.useState<ShapeTool>("rectangle");
  const [shapeMenuOpen, setShapeMenuOpen] = React.useState(false);
  const shapeMenuRef = React.useRef<HTMLDivElement>(null);
  const shapeBtnRef = React.useRef<HTMLDivElement>(null);

  // Keep activeShape in sync when user switches tool via keyboard shortcut
  React.useEffect(() => {
    if (isDrawableShapeTool(creationTool)) {
      setActiveShape(creationTool as ShapeTool);
    }
  }, [creationTool]);

  // Close shape menu on click outside
  React.useEffect(() => {
    if (!shapeMenuOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        shapeMenuRef.current && !shapeMenuRef.current.contains(target) &&
        shapeBtnRef.current && !shapeBtnRef.current.contains(target)
      ) {
        setShapeMenuOpen(false);
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener("pointerdown", handlePointerDown);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [shapeMenuOpen]);

  const visibleShapeTools = SHAPE_TOOLS;
  const shapeMenuOptions: DropdownMenuOption[] = visibleShapeTools.map(s => ({
    value: s.tool, label: s.label, icon: s.menuIcon, shortcut: s.shortcut,
  }));
  const ActiveShapeIcon = visibleShapeTools.find(s => s.tool === activeShape)?.icon ?? Rectangle;
  const shapeActive = isDrawableShapeTool(creationTool);

  const handleShapeSelect = (option: DropdownMenuOption) => {
    const tool = option.value as ShapeTool;
    setActiveShape(tool);
    setShapeMenuOpen(false);
    setCreationTool(tool);
  };

  return (
    <div data-editor-panel className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div
        className="flex items-center bg-white/95 backdrop-blur-sm dark:bg-stone-900/95"
        style={{
          borderRadius: 14,
          boxShadow: "0px 0px 0.5px rgba(0,0,0,0.3), 0px 1px 3px rgba(0,0,0,0.15)",
        }}
      >
        {/* Tool Selection Buttons */}
        <div className="flex items-center gap-2 p-2">
          {/* Select */}
          <button
            type="button"
            title="Select (V)"
            onClick={(e) => { setCreationTool("select"); (e.currentTarget as HTMLElement).blur(); }}
            className={btnClass(creationTool === "select")}
            style={{ borderRadius: 6 }}
          >
            <Move className="w-6 h-6" />
          </button>

          {/* Frame */}
          <button
            type="button"
            title="Frame (F)"
            onClick={(e) => { setCreationTool("frame"); (e.currentTarget as HTMLElement).blur(); }}
            className={btnClass(creationTool === "frame")}
            style={{ borderRadius: 6 }}
          >
            <FlexFrame className="w-6 h-6" />
          </button>

          {/* Shape (grouped with dropdown) */}
          <div ref={shapeBtnRef} className="relative flex items-center gap-px">
            <button
              type="button"
              title={SHAPE_TOOLS.find(s => s.tool === activeShape)?.label}
              onClick={(e) => {
                setCreationTool(activeShape);
                (e.currentTarget as HTMLElement).blur();
              }}
              style={{ borderRadius: 6 }}
              className={cn(
                "h-8 w-8 flex items-center justify-center",
                shapeActive
                  ? "bg-blue-500 text-white"
                  : "hover:bg-stone-100 text-stone-600 dark:text-stone-400 dark:hover:bg-stone-800"
              )}
            >
              <ActiveShapeIcon className="w-6 h-6" />
            </button>
            <button
              type="button"
              title="More shapes"
              onClick={() => setShapeMenuOpen(!shapeMenuOpen)}
              style={{ borderRadius: 6 }}
              className="h-8 w-4 flex items-center justify-center hover:bg-stone-100 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300"
            >
              <ChevronDown16 className="w-4 h-4" />
            </button>

            {/* Shape dropdown */}
            {shapeMenuOpen && (
              <div
                ref={shapeMenuRef}
                className="absolute bottom-full left-0 mb-2"
                style={{ zIndex: 60 }}
              >
                <DropdownMenu
                  options={shapeMenuOptions}
                  value={activeShape}
                  onSelect={handleShapeSelect}
                  showCheckmark
                  iconClassName="w-6 h-6"
                  minWidth={200}
                />
              </div>
            )}

          </div>

          {/* Text */}
          <button
            type="button"
            title="Text (T)"
            onClick={(e) => { setCreationTool("text"); (e.currentTarget as HTMLElement).blur(); }}
            className={btnClass(creationTool === "text")}
            style={{ borderRadius: 6 }}
          >
            <Text className="w-6 h-6" />
          </button>

          {/* Comment */}
          <button
            type="button"
            title="Comment (C)"
            onClick={(e) => { setCreationTool("comment"); (e.currentTarget as HTMLElement).blur(); }}
            className={btnClass(creationTool === "comment")}
            style={{ borderRadius: 6 }}
          >
            <Comment className="w-6 h-6" />
          </button>

        </div>

        {/* Mode Toggle */}
        <div className="flex items-center p-2 border-l border-stone-200 dark:border-stone-700">
          <div
            className="inline-flex items-center bg-stone-100 dark:bg-stone-800"
            style={{ borderRadius: 6, padding: 2, gap: 2 }}
          >
            {DEVICE_OPTIONS.map((opt) => {
              const isActive = device === opt.value;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  type="button"
                  title={opt.value}
                  onClick={(e) => { setDevice(opt.value); (e.currentTarget as HTMLElement).blur(); }}
                  className={cn(
                    "flex items-center justify-center",
                    isActive
                      ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
                      : "text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
                  )}
                  style={{ width: 28, height: 28, borderRadius: 4 }}
                >
                  <Icon className="w-6 h-6" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
