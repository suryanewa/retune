export const TOOLBAR_ICON_STROKE_PX = 1.25;

export const TOOLBAR_ICON_SIZES = {
  select: 22.5,
  draw: 23,
  edit: 21.5,
  comment: 23.5,
  copy: 24,
  reset: 22.5,
  settings: 20.5,
  close: 22.5,
} as const;

export const SELECTION_ACTION_ICON_SIZES = {
  comment: 21.15,
  copy: 21.6,
  edit: 19.35,
  delete: 19.8,
  deselect: 20.25,
} as const;

export function toolbarIconStroke(size: number, viewBox = 24) {
  return Number(((TOOLBAR_ICON_STROKE_PX * viewBox) / size).toFixed(3));
}
