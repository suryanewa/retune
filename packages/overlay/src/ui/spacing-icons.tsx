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

export function IconGapHorizontal({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M3.75 16.25L5 16.25C5.55228 16.25 6 15.8023 6 15.25L6 4.75C6 4.19771 5.55228 3.75 5 3.75L3.75 3.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M16.25 16.25L15 16.25C14.4477 16.25 14 15.8023 14 15.25L14 4.75C14 4.19772 14.4477 3.75 15 3.75L16.25 3.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M10 6.5V13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export function IconGapVertical({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M3.75 3.75L3.75 5C3.75 5.55228 4.19772 6 4.75 6L15.25 6C15.8023 6 16.25 5.55228 16.25 5L16.25 3.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M3.75 16.25L3.75 15C3.75 14.4477 4.19772 14 4.75 14L15.25 14C15.8023 14 16.25 14.4477 16.25 15L16.25 16.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M13.5 10L6.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
