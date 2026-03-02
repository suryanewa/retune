"use client";

import { ComposerProvider } from "@/app/editor/provider/ComposerProvider";
import { TiptapProvider } from "@/app/editor/components/tiptap/TiptapProvider";
import { EditorCanvas } from "@/app/editor/components/EditorCanvas";
import { LayersPanel } from "@/app/editor/components/LayersPanel";
import { PropertyPanel } from "@/app/editor/components/PropertyPanel";
import { BottomToolbar } from "@/app/editor/components/BottomToolbar";
import { useViewMode } from "@/app/editor/components/context";

function EditorLayout() {
  const viewMode = useViewMode();

  return (
    <div
      className="h-screen flex flex-col overflow-hidden bg-background"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Main editor area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Layers panel (left) - hidden in preview mode */}
        {viewMode === "edit" && <LayersPanel />}

        {/* Canvas area with bottom toolbar */}
        <div className="flex-1 flex flex-col relative min-w-0 overflow-hidden">
          <EditorCanvas />
          {viewMode === "edit" && <BottomToolbar />}
        </div>

        {/* Property panel (right) - hidden in preview mode */}
        {viewMode === "edit" && <PropertyPanel />}
      </div>
    </div>
  );
}

export default function EditorShell() {
  return (
    <ComposerProvider>
      <TiptapProvider>
        <EditorLayout />
      </TiptapProvider>
    </ComposerProvider>
  );
}
