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
export const Logo = ({ size = 'medium', variant = 'dark', subtitle = true, className = '' }) => {
  const scale = size === 'small' ? 0.75 : size === 'large' ? 1.35 : 1.0;
  const isLightBg = variant === 'light';

  return (
    <div 
      className={`ub-logo-container ${className}`}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        userSelect: 'none',
        transform: `scale(${scale})`,
        transformOrigin: 'left center',
        lineHeight: 1
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Crystal Fluid Droplet Icon */}
        <svg width="34" height="42" viewBox="0 0 100 125" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 2px 8px rgba(0, 174, 239, 0.45))' }}>
          <defs>
            <linearGradient id="dropletGrad" x1="10%" y1="0%" x2="90%" y2="100%">
              <stop offset="0%" stopColor="#00C8F5" />
              <stop offset="45%" stopColor="#008FE0" />
              <stop offset="100%" stopColor="#06142F" />
            </linearGradient>
            <linearGradient id="dropletHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
              <stop offset="60%" stopColor="#00C8F5" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#008FE0" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="dropletGlint" cx="50%" cy="65%" r="35%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#00C8F5" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#008FE0" stopOpacity="0" />
            </radialGradient>
          </defs>
          
          {/* Outer Droplet Shell */}
          <path 
            d="M50 8 C32 45, 12 65, 12 85 C12 105, 29 118, 50 118 C71 118, 88 105, 88 85 C88 65, 68 45, 50 8 Z" 
            fill="url(#dropletGrad)" 
            stroke="#00C8F5" 
            strokeWidth="2.5"
          />
          
          {/* Inner Highlight Curvature */}
          <path 
            d="M50 16 C38 48, 22 68, 22 84 C22 100, 34 110, 50 110 C40 106, 30 94, 30 82 C30 68, 44 48, 50 16 Z" 
            fill="url(#dropletHighlight)"
          />

          {/* Central Star Glint */}
          <circle cx="50" cy="85" r="16" fill="url(#dropletGlint)" />
          <path d="M50 72 L52 83 L63 85 L52 87 L50 98 L48 87 L37 85 L48 83 Z" fill="#FFFFFF" opacity="0.9" />
        </svg>

        {/* Wordmark: ULTRA (Metallic) + BLUE (Electric) + '+' (Gold 3D) */}
        <div style={{ display: 'flex', alignItems: 'baseline', letterSpacing: '-0.02em', fontStyle: 'italic' }}>
          <span 
            style={{ 
              fontFamily: "'Outfit', 'Arial Black', sans-serif",
              fontWeight: 900,
              fontSize: '30px',
              color: isLightBg ? '#06142F' : '#FFFFFF',
              textShadow: isLightBg ? '0 1px 2px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.6)',
              letterSpacing: '0.01em'
            }}
          >
            ULTRA
          </span>
          <span 
            style={{ 
              fontFamily: "'Outfit', 'Arial Black', sans-serif",
              fontWeight: 900,
              fontSize: '30px',
              background: 'linear-gradient(180deg, #00C8F5 0%, #008FE0 55%, #005A9C 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 1px 2px rgba(0, 143, 224, 0.4))',
              marginLeft: '2px'
            }}
          >
            BLUE
          </span>
          <span 
            style={{ 
              fontFamily: "'Outfit', 'Arial Black', sans-serif",
              fontWeight: 900,
              fontSize: '32px',
              color: '#F5B400',
              textShadow: '0 2px 6px rgba(245, 180, 0, 0.45)',
              marginLeft: '2px',
              display: 'inline-block',
              transform: 'translateY(-1px)'
            }}
          >
            +
          </span>
        </div>
      </div>

      {/* Subtitle Rule */}
      {subtitle && (
        <div 
          className="ub-logo-subtitle"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            width: '100%', 
            marginTop: '3px',
            paddingLeft: '40px',
            gap: '8px'
          }}
        >
          <div style={{ height: '1px', flex: 1, background: isLightBg ? '#CBD5E1' : 'rgba(255,255,255,0.25)' }} />
          <span 
            style={{ 
              fontFamily: "'Inter', sans-serif",
              fontSize: '8px', 
              fontWeight: 700, 
              letterSpacing: '0.22em',
              color: isLightBg ? '#5F6B7A' : '#D9E0E8',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap'
            }}
          >
            DIESEL EXHAUST FLUID
          </span>
          <div style={{ height: '1px', flex: 1, background: isLightBg ? '#CBD5E1' : 'rgba(255,255,255,0.25)' }} />
        </div>
      )}
    </div>
  );
};
