import React from 'react';

/**
 * UltraBlue+ Official Brand Logo Component
 * Faithfully matches the brand identity:
 * - Fluid Droplet with inner crystal glow
 * - "ULTRA" in beveled metallic silver-white
 * - "BLUE" in electric blue gradient
 * - "+" in warm amber gold
 * - "DIESEL EXHAUST FLUID" subtitle with industrial rule lines
 */
export const Logo = ({ size = 'medium', variant = 'dark', subtitle = true, className = '', useImage = true }) => {
  const heights = {
    small: '32px',
    medium: '44px',
    large: '58px'
  };
  const imgHeight = heights[size] || '44px';
  const isLightBg = variant === 'light';

  return (
    <div
      className={`ub-logo-container ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        userSelect: 'none',
        lineHeight: 1
      }}
    >
      <img
        src="/images/ultrablue_brand_logo.png"
        alt="UltraBlue+ Diesel Exhaust Fluid"
        style={{
          height: imgHeight,
          width: 'auto',
          maxWidth: '100%',
          objectFit: 'contain',
          filter: isLightBg
            ? 'drop-shadow(0 2px 8px rgba(0, 40, 100, 0.15))'
            : 'drop-shadow(0 2px 12px rgba(0, 180, 255, 0.3))',
          display: 'block'
        }}
        onError={(e) => {
          // If image fails, revert to inline fallback text
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
};
