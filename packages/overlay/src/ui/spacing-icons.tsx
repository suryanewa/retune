/**
 * Spacing icons for padding/margin inputs.
 * 6 variants: horizontal (left+right), vertical (top+bottom),
 * and individual sides (left, right, top, bottom).
 */

interface IconProps {
  size?: number;
}

export function IconSpacingHorizontal({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <line x1="2.75" y1="3.75" x2="2.75" y2="16.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="17.25" y1="16.25" x2="17.25" y2="3.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="7" y="7" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

export function IconSpacingVertical({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <line x1="16.25" y1="2.75" x2="3.75" y2="2.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="3.75" y1="17.25" x2="16.25" y2="17.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="13" y="7" width="6" height="6" rx="1.5" transform="rotate(90 13 7)" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

export function IconSpacingHorizontalLeft({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <line x1="2.75" y1="3.75" x2="2.75" y2="16.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="7" y="7" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

export function IconSpacingHorizontalRight({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <line x1="17.25" y1="16.25" x2="17.25" y2="3.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="7" y="7" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

export function IconSpacingVerticalTop({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <line x1="16.25" y1="2.75" x2="3.75" y2="2.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="13" y="7" width="6" height="6" rx="1.5" transform="rotate(90 13 7)" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

export function IconSpacingVerticalBottom({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <line x1="3.75" y1="17.25" x2="16.25" y2="17.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="13" y="7" width="6" height="6" rx="1.5" transform="rotate(90 13 7)" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}
