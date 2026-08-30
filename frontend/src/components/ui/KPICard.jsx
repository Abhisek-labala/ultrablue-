import React from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';

export const KPICard = ({
  title,
  value,
  delta,
  isPositive = true,
  subtext,
  icon: Icon,
  iconBg = 'var(--brand-blue-light)',
  iconColor = 'var(--brand-blue)',
  goldAccent = false,
  onClick,
  className = ''
}) => {
  return (
    <div 
      className={`ub-kpi-card ub-card ${className}`}
      onClick={onClick}
      style={{
        padding: 'var(--space-5)',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        borderLeft: goldAccent ? '3px solid var(--brand-gold)' : undefined
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {title}
        </span>
        {Icon && (
          <div 
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              background: iconBg,
              color: iconColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Icon size={20} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
        <span 
          style={{ 
            fontFamily: 'var(--font-family-heading)', 
            fontSize: 'var(--font-size-2xl)', 
            fontWeight: 800, 
            color: 'var(--brand-navy-primary)' 
          }}
        >
          {value}
        </span>
        {delta && (
          <span 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 700,
              color: isPositive ? 'var(--status-success-text)' : 'var(--status-danger-text)',
              backgroundColor: isPositive ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
              padding: '2px 6px',
              borderRadius: 'var(--radius-xs)',
              gap: '2px'
            }}
          >
            {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {delta}
          </span>
        )}
      </div>

      {subtext && (
        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
          {subtext}
        </div>
      )}
    </div>
  );
};
