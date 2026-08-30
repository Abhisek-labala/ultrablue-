import React from 'react';
import { AlertCircle, RotateCcw, Inbox, Search, CheckCircle } from 'lucide-react';
import { Button } from './Button';

export const SkeletonLoader = ({ type = 'card', count = 3 }) => {
  if (type === 'table') {
    return (
      <div className="ub-card" style={{ padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <div className="animate-pulse" style={{ height: '36px', width: '220px', background: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-sm)' }} />
          <div className="animate-pulse" style={{ height: '36px', width: '120px', background: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-sm)' }} />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse" style={{ display: 'flex', gap: 'var(--space-4)', padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
            <div style={{ height: '18px', width: '30%', background: 'var(--bg-surface-secondary)', borderRadius: '4px' }} />
            <div style={{ height: '18px', width: '20%', background: 'var(--bg-surface-secondary)', borderRadius: '4px' }} />
            <div style={{ height: '18px', width: '25%', background: 'var(--bg-surface-secondary)', borderRadius: '4px' }} />
            <div style={{ height: '18px', width: '15%', background: 'var(--bg-surface-secondary)', borderRadius: '4px' }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))`, gap: 'var(--space-4)' }}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="ub-card animate-pulse" style={{ padding: 'var(--space-5)', height: '220px' }}>
          <div style={{ height: '20px', width: '50%', background: 'var(--bg-surface-secondary)', borderRadius: '4px', marginBottom: '16px' }} />
          <div style={{ height: '36px', width: '70%', background: 'var(--bg-surface-secondary)', borderRadius: '6px', marginBottom: '12px' }} />
          <div style={{ height: '14px', width: '90%', background: 'var(--bg-surface-secondary)', borderRadius: '4px', marginBottom: '8px' }} />
          <div style={{ height: '14px', width: '60%', background: 'var(--bg-surface-secondary)', borderRadius: '4px' }} />
        </div>
      ))}
    </div>
  );
};

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No Data Found',
  description = 'There are no active records matching your current filter criteria.',
  actionLabel,
  onActionClick,
  className = ''
}) => {
  return (
    <div 
      className={`ub-card ${className}`}
      style={{
        padding: 'var(--space-12) var(--space-6)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-surface)'
      }}
    >
      <div 
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: 'var(--bg-surface-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          marginBottom: 'var(--space-4)'
        }}
      >
        <Icon size={32} />
      </div>

      <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--brand-navy-primary)', marginBottom: 'var(--space-2)' }}>
        {title}
      </h3>

      <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', maxWidth: '440px', marginBottom: actionLabel ? 'var(--space-5)' : 0 }}>
        {description}
      </p>

      {actionLabel && (
        <Button variant="primary" size="sm" onClick={onActionClick}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export const ErrorBanner = ({
  title = 'Connection or Processing Error',
  message = 'Unable to synchronize inventory levels from PostgreSQL server. Please verify your connection.',
  onRetry
}) => {
  return (
    <div 
      style={{
        backgroundColor: 'var(--status-danger-bg)',
        border: '1px solid var(--status-danger-border)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-4) var(--space-5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-5)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <AlertCircle size={22} color="var(--status-danger)" style={{ flexShrink: 0 }} />
        <div>
          <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--status-danger-text)' }}>
            {title}
          </h4>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--status-danger-text)', opacity: 0.9 }}>
            {message}
          </p>
        </div>
      </div>

      {onRetry && (
        <Button variant="danger" size="sm" icon={RotateCcw} onClick={onRetry}>
          Retry Sync
        </Button>
      )}
    </div>
  );
};
