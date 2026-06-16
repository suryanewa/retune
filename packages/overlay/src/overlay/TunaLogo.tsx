const TUNA_PATH =
  "M.73,51c4.3-7.9,9.2-14.3,14.2-19.8l.3-.4C7.13,21.9.93,10.9.43,9.3c-.7-2.1.3-4.4,2.4-5.2s4.3.2,5.1,2.2c.4.9,4.7,9.1,12.9,18.7C32.33,12,48.33,2.2,66.33.7c3.2-.5,6.5-.7,9.8-.7h1.8c18.6,0,37.7,7.3,52.7,23.2l3.8,4.4c1.6,2.1,1.6,4.8,0,6.9-13.4,16.8-33,26.5-52.8,27.3-1.6,0-3.1.2-4.7.2-6.8,0-23.2-1-39-10.4-6.1-3.4-11.8-7.7-17.2-13.6l-.1-1c-4.5,4.9-9.2,11.4-13.1,18-.7,1.4-1.9,2.2-3.5,2.2-2,.1-4.3-2-4-4.9l.7-1.3ZM72.73,53.5c1.5.1,2.9.1,4.3.1,13.6,0,26-3.9,36.9-11.4,2.9-2,5.5-4.1,7.9-6.5l5.4-4.8-.4-.3c-10.3-10.7-21.6-16.7-32.9-19.9-5.1-1.5-10.3-2.7-16.3-2.7-5,0-8.8.4-13.9,1.4s-17.6,4.3-37.6,21.5l.1.2v.1h.1c12.3,11.2,25.5,18.8,39.7,21.3,2.2.4,4.4.8,6.7,1Z";

/** Upright Tuna wordmark for the collapsed toolbar button. */
export function TunaLogo({ size = 20 }: { size?: number }) {
  const height = size * (170 / 135.63);
  const width = size * (100 / 135.63);

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 170"
      fill="none"
      aria-hidden="true"
      className="tuna-logo-svg"
    >
      <defs>
        <filter id="tuna-glow-filter" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="18" result="blur" />
        </filter>
      </defs>
      <g className="tuna-logo-head-pivot">
        <g className="tuna-logo-tail-pivot">
          <g transform="translate(19, 152.63) rotate(-90)" className="tuna-logo-group">
            <path
              fill="currentColor"
              d={TUNA_PATH}
              className="tuna-logo-fish-glow"
              filter="url(#tuna-glow-filter)"
            />
            <path fill="currentColor" d={TUNA_PATH} className="tuna-logo-fish" />
          </g>
        </g>
      </g>
    </svg>
  );
}
