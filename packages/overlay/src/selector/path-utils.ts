export interface DrawPoint {
  x: number;
  y: number;
}

const DRAW_SIMPLIFY_TOLERANCE = 2.5;
const DRAW_CLOSE_DISTANCE = 4;
const DRAW_CLOSE_TENSION = 0.35;
const DRAW_POINT_PRECISION = 2;

function formatCoord(value: number): string {
  return Number(value.toFixed(DRAW_POINT_PRECISION)).toString();
}

function formatPoint(point: DrawPoint): string {
  return `${formatCoord(point.x)} ${formatCoord(point.y)}`;
}

function distance(a: DrawPoint, b: DrawPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function pointLineDistance(point: DrawPoint, start: DrawPoint, end: DrawPoint): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return distance(point, start);

  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lenSq));
  return distance(point, { x: start.x + t * dx, y: start.y + t * dy });
}

function simplifySection(points: DrawPoint[], firstIndex: number, lastIndex: number, tolerance: number, keep: boolean[]) {
  let maxDistance = 0;
  let maxIndex = firstIndex;

  for (let i = firstIndex + 1; i < lastIndex; i++) {
    const d = pointLineDistance(points[i], points[firstIndex], points[lastIndex]);
    if (d > maxDistance) {
      maxDistance = d;
      maxIndex = i;
    }
  }

  if (maxDistance <= tolerance) return;

  keep[maxIndex] = true;
  simplifySection(points, firstIndex, maxIndex, tolerance, keep);
  simplifySection(points, maxIndex, lastIndex, tolerance, keep);
}

export function simplifyPolyline(points: DrawPoint[], tolerance = DRAW_SIMPLIFY_TOLERANCE): DrawPoint[] {
  if (points.length <= 2) return [...points];

  const keep = new Array<boolean>(points.length).fill(false);
  keep[0] = true;
  keep[points.length - 1] = true;
  simplifySection(points, 0, points.length - 1, tolerance, keep);
  return points.filter((_, index) => keep[index]);
}

export function buildOpenPath(points: DrawPoint[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${formatPoint(points[0])}`;
  if (points.length === 2) return `M ${formatPoint(points[0])} L ${formatPoint(points[1])}`;

  const first = points[0];
  let pathStr = `M ${formatPoint(first)}`;
  for (let i = 1; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    pathStr += ` Q ${formatPoint(p1)} ${formatCoord(midX)} ${formatCoord(midY)}`;
  }
  const last = points[points.length - 1];
  pathStr += ` L ${formatPoint(last)}`;
  return pathStr;
}

function tangentControl(from: DrawPoint, toward: DrawPoint, scale: number): DrawPoint {
  const dx = from.x - toward.x;
  const dy = from.y - toward.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return from;
  return {
    x: from.x + (dx / len) * scale,
    y: from.y + (dy / len) * scale,
  };
}

export function buildClosedPath(points: DrawPoint[]): string {
  if (points.length === 0) return "";
  if (points.length < 3) return buildOpenPath(points);

  const first = points[0];
  const last = points[points.length - 1];
  const basePath = buildOpenPath(points);
  const closeDistance = distance(first, last);
  if (closeDistance <= DRAW_CLOSE_DISTANCE) {
    return `${basePath} Z`;
  }

  const penultimate = points[points.length - 2];
  const second = points[1];
  const controlScale = closeDistance * DRAW_CLOSE_TENSION;
  const c1 = tangentControl(last, penultimate, controlScale);
  const c2 = tangentControl(first, second, controlScale);
  return `${basePath} C ${formatPoint(c1)} ${formatPoint(c2)} ${formatPoint(first)}`;
}

export function finalizeDrawPoints(rawPoints: DrawPoint[], tolerance = DRAW_SIMPLIFY_TOLERANCE): DrawPoint[] {
  if (rawPoints.length <= 2) return [...rawPoints];

  const deduped: DrawPoint[] = [];
  for (const point of rawPoints) {
    const previous = deduped[deduped.length - 1];
    if (!previous || distance(previous, point) > 0.5) {
      deduped.push(point);
    }
  }

  if (deduped.length <= 2) return deduped;
  return simplifyPolyline(deduped, tolerance);
}
