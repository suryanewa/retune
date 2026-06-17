import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

type CopyIconPose = "normal" | "animate" | "check";

const COPY_ICON_PATHS: Record<CopyIconPose, number[][]> = {
  normal: [
    [4, 14, 4, 4, 14, 4],
    [9, 20, 19, 20, 19, 9],
    [9, 9, 9, 20, 9, 20],
    [9, 9, 19, 9, 19, 9],
  ],
  animate: [
    [3, 13, 3, 3, 13, 3],
    [10, 21, 20, 21, 20, 10],
    [10, 10, 10, 21, 10, 21],
    [10, 10, 20, 10, 20, 10],
  ],
  check: [
    [6, 12, 10, 16, 10, 16],
    [10, 16, 18, 8, 18, 8],
    [10, 16, 10, 16, 10, 16],
    [10, 16, 10, 16, 10, 16],
  ],
};

const COPY_ICON_OPACITY: Record<CopyIconPose, number[]> = {
  normal: [1, 1, 1, 1],
  animate: [1, 1, 1, 1],
  check: [1, 1, 0, 0],
};

function copyIconPath(points: number[]) {
  return `M ${points[0]} ${points[1]} L ${points[2]} ${points[3]} L ${points[4]} ${points[5]}`;
}

function interpolatePoints(from: number[], to: number[], t: number) {
  return from.map((value, index) => value + (to[index] - value) * t);
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function AnimatedCopyIcon({
  copied,
  hovered,
  size = 16,
  strokeWidth = 2,
}: {
  copied: boolean;
  hovered: boolean;
  size?: number;
  strokeWidth?: number;
}) {
  const currentPoseRef = useRef<CopyIconPose>("normal");
  const currentPointsRef = useRef(COPY_ICON_PATHS.normal.map((points) => [...points]));
  const currentOpacityRef = useRef([...COPY_ICON_OPACITY.normal]);
  const animationRef = useRef<number | null>(null);
  const [frame, setFrame] = useState(() => ({
    points: COPY_ICON_PATHS.normal.map((points) => [...points]),
    opacity: [...COPY_ICON_OPACITY.normal],
  }));

  const applyPose = useCallback((pose: CopyIconPose) => {
    const nextPoints = COPY_ICON_PATHS[pose].map((points) => [...points]);
    const nextOpacity = [...COPY_ICON_OPACITY[pose]];
    currentPoseRef.current = pose;
    currentPointsRef.current = nextPoints;
    currentOpacityRef.current = nextOpacity;
    setFrame({
      points: nextPoints.map((points) => [...points]),
      opacity: [...nextOpacity],
    });
  }, []);

  const animateToPose = useCallback((pose: CopyIconPose) => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (currentPoseRef.current === pose || prefersReducedMotion()) {
      applyPose(pose);
      return;
    }

    const fromPoints = currentPointsRef.current.map((points) => [...points]);
    const fromOpacity = [...currentOpacityRef.current];
    const toPoints = COPY_ICON_PATHS[pose];
    const toOpacity = COPY_ICON_OPACITY[pose];
    const duration = pose === "check" ? 220 : 180;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = easeOutCubic(progress);
      const nextPoints = fromPoints.map((points, index) => interpolatePoints(points, toPoints[index], eased));
      const nextOpacity = fromOpacity.map((opacity, index) => opacity + (toOpacity[index] - opacity) * eased);

      currentPointsRef.current = nextPoints.map((points) => [...points]);
      currentOpacityRef.current = [...nextOpacity];
      setFrame({
        points: nextPoints.map((points) => [...points]),
        opacity: [...nextOpacity],
      });

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(tick);
      } else {
        animationRef.current = null;
        currentPoseRef.current = pose;
        currentPointsRef.current = toPoints.map((points) => [...points]);
        currentOpacityRef.current = [...toOpacity];
        setFrame({
          points: toPoints.map((points) => [...points]),
          opacity: [...toOpacity],
        });
      }
    };

    animationRef.current = requestAnimationFrame(tick);
  }, [applyPose]);

  useLayoutEffect(() => {
    animateToPose(copied ? "check" : hovered ? "animate" : "normal");
  }, [animateToPose, copied, hovered]);

  useEffect(() => {
    return () => {
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        flexShrink: 0,
        lineHeight: 0,
        pointerEvents: "none",
      }}
    >
      <svg
        fill="none"
        height={size}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
        viewBox="0 0 24 24"
        width={size}
        xmlns="http://www.w3.org/2000/svg"
      >
        {frame.points.map((points, index) => (
          <path
            key={index}
            d={copyIconPath(points)}
            style={{ opacity: frame.opacity[index] }}
          />
        ))}
      </svg>
    </span>
  );
}
