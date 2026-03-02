import type { CanvasElement } from '@/lib/playground/store';
import { useDocumentStore } from '@/app/editor/store/document-store';

export function useElement(id: string): CanvasElement | undefined {
  return useDocumentStore((state) => state.elements[id]);
}
