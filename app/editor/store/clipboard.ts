import type { CanvasElement } from "@/lib/playground/store";

/**
 * Module-level element clipboard.
 *
 * Stores deep snapshots of element data so paste works even after a cut
 * (which deletes originals from the store).
 */
export const elementClipboard = {
  /** Root element IDs (keys into snapshots) */
  rootIds: [] as string[],
  /** Flat map of all snapshotted elements (roots + descendants) keyed by original ID */
  snapshots: {} as Record<string, Record<string, unknown>>,
};
