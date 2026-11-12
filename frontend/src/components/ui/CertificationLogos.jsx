import React from 'react';
import { COMPANY_INFO } from '../../config/companyInfo';

const BadgeFrame = ({ title, className = '', borderRadius = '7px', padding = '2px 3px', children }) => (
  <span
    className={className}
    title={title}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius,
      padding,
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
 * Official-style ISI Standard Mark badge SVG matching BIS layout:
 * Standard number above, 4:3 rounded-rectangle hooked ISI monogram, and CM/L registration number below.
 */
export const IsiMarkLogo = ({
  height = 56,
  className = '',
  standardText = COMPANY_INFO.isStandard || 'IS 17042 (PART 1): 2020',
  licenseNo = COMPANY_INFO.bisLicense || 'CM/L-5200161078'
}) => {
  const width = Math.round((height * 180) / 156);
  const frameRadius = `${Math.max(8, Math.round(height * 0.14))}px`;

  return (
    <BadgeFrame
      title={`ISI Mark Certified (${standardText} • ${licenseNo})`}
      className={className}
      borderRadius={frameRadius}
      padding="2px"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 180 156"
        width={width}
        height={height}
        role="img"
        aria-label={`ISI Standard Mark ${standardText} ${licenseNo}`}
        style={{ display: 'block' }}
      >
        {/* Top Standard Reference */}
        <text
          x="90"
          y="22.5"
          textAnchor="middle"
          fill="#141414"
          fontSize="11.5"
          fontWeight="800"
          fontFamily="'Inter', 'Arial', system-ui, -apple-system, sans-serif"
          letterSpacing="0.1"
        >
          {standardText}
        </text>

        {/* Outer rounded rectangle border of the ISI mark */}
        <rect
          x="18"
          y="32"
          width="144"
          height="92"
          rx="20"
          fill="none"
          stroke="#141414"
          strokeWidth="9"
        />

        {/* Left letter 'I' */}
        <rect x="48.25" y="43" width="8.5" height="54" fill="#141414" />

        {/* Center stylized 'S' with official BIS upper-right & lower-left hooks */}
        <path
          d="M 38 99 V 100.75 Q 38 108.75 46 108.75 H 103.5 Q 111.5 108.75 111.5 100.75 V 86 Q 111.5 78 103.5 78 H 76.5 Q 68.5 78 68.5 70 V 55.25 Q 68.5 47.25 76.5 47.25 H 134 Q 142 47.25 142 55.25 V 57"
          fill="none"
          stroke="#141414"
          strokeWidth="8.5"
          strokeLinecap="butt"
          strokeLinejoin="round"
        />

        {/* Right letter 'I' */}
        <rect x="123.25" y="59" width="8.5" height="54" fill="#141414" />

        {/* Bottom BIS Registration / License Number */}
        <text
          x="90"
          y="145"
          textAnchor="middle"
          fill="#141414"
          fontSize="13.5"
          fontWeight="800"
          fontFamily="'Inter', 'Arial', system-ui, -apple-system, sans-serif"
          letterSpacing="0.25"
        >
          {licenseNo}
        </text>
      </svg>
    </BadgeFrame>
  );
};

/**
 * Official-style Bureau of Indian Standards (BIS) emblem badge SVG.
 * Uses the BIS triangle mark and official BIS brand colors (#264796 blue & #e31e24 red).
 */
export const BisMarkLogo = ({ height = 56, className = '' }) => {
  const width = Math.round((height * 4) / 3);
  const frameRadius = `${Math.max(8, Math.round(height * 0.14))}px`;
  return (
    <BadgeFrame
      title={`Bureau of Indian Standards (BIS) Licensed • ${COMPANY_INFO.bisLicense || 'CM/L-5200161078'}`}
      className={className}
      borderRadius={frameRadius}
      padding="2px"
    >
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
export const CertificationBadgePair = ({ height = 56, gap = '8px', className = '' }) => (
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
