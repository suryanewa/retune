"use client";

import dynamic from "next/dynamic";

const EditorShell = dynamic(() => import("./editor-shell"), { ssr: false });

export default function Home() {
  return <EditorShell />;
}
