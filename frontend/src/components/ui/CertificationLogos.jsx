import React from 'react';

const BadgeFrame = ({ title, className = '', children }) => (
  <span
    className={className}
    title={title}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: '7px',
      padding: '2px 3px',
      boxShadow: '0 2px 6px rgba(15, 23, 42, 0.18)',
      border: '1px solid rgba(15, 23, 42, 0.12)',
      lineHeight: 0,
      flexShrink: 0
    }}
  >
    {children}
  </span>
);

/**
 * Official-style ISI Standard Mark (IS 17042) badge SVG.
 * Uses the 4:3 rounded-rectangle monogram geometry specified by BIS guidelines.
 */
export const IsiMarkLogo = ({ height = 34, className = '' }) => {
  const width = Math.round((height * 4) / 3);
  return (
    <BadgeFrame title="ISI Mark Certified (IS 17042)" className={className}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 64 48"
        width={width}
        height={height}
        role="img"
        aria-label="ISI Standard Mark"
        style={{ display: 'block' }}
      >
        {/* Outer 4:3 rounded rectangle border */}
        <rect
          x="3"
          y="3"
          width="58"
          height="42"
          rx="9"
          fill="none"
          stroke="#0F172A"
          strokeWidth="4.2"
        />

        {/* Left letter 'I' */}
        <rect x="11.5" y="10.5" width="4.4" height="27" rx="0.8" fill="#0F172A" />

        {/* Center stylized letter 'S' */}
        <path
          d="M 41.3 16.5 A 4.0 3.8 0 0 0 37.3 12.7 H 26.7 A 4.0 4.0 0 0 0 22.7 16.7 V 20.0 A 4.0 4.0 0 0 0 26.7 24.0 H 37.3 A 4.0 4.0 0 0 1 41.3 28.0 V 31.3 A 4.0 4.0 0 0 1 37.3 35.3 H 26.7 A 4.0 3.8 0 0 1 22.7 31.5"
          fill="none"
          stroke="#0F172A"
          strokeWidth="4.4"
          strokeLinecap="butt"
          strokeLinejoin="round"
        />

        {/* Right letter 'I' */}
        <rect x="48.1" y="10.5" width="4.4" height="27" rx="0.8" fill="#0F172A" />
      </svg>
    </BadgeFrame>
  );
};

/**
 * Official-style Bureau of Indian Standards (BIS) emblem badge SVG.
 * Uses the BIS triangle mark and official BIS brand colors (#264796 blue & #e31e24 red).
 */
export const BisMarkLogo = ({ height = 34, className = '' }) => {
  const width = Math.round((height * 4) / 3);
  return (
    <BadgeFrame title="Bureau of Indian Standards (BIS) Licensed" className={className}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 64 48"
        width={width}
        height={height}
        role="img"
        aria-label="Bureau of Indian Standards (BIS) Logo"
        style={{ display: 'block' }}
      >
        {/* BIS Standard Triangle Emblem */}
        <polygon
          points="32,4.5 46,27 18,27"
          fill="none"
          stroke="#264796"
          strokeWidth="3.2"
          strokeLinejoin="round"
        />

        {/* Signature BIS Red Center Accent */}
        <circle cx="32" cy="19.2" r="3.4" fill="#e31e24" />

        {/* BIS Wordmark */}
        <text
          x="32"
          y="42"
          textAnchor="middle"
          fill="#264796"
          fontSize="12.5"
          fontWeight="900"
          fontFamily="Inter, system-ui, -apple-system, sans-serif"
          letterSpacing="1.4"
        >
          BIS
        </text>
      </svg>
    </BadgeFrame>
  );
};

/**
 * Side-by-side pair of ISI Standard Mark and BIS emblem badges.
 */
export const CertificationBadgePair = ({ height = 34, gap = '6px', className = '' }) => (
  <div
    className={className}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap,
      flexShrink: 0
    }}
  >
    <IsiMarkLogo height={height} />
    <BisMarkLogo height={height} />
  </div>
);
