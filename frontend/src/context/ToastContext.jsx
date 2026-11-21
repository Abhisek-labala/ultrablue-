import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

// Global listener set for singleton toast triggers
const toastListeners = new Set();

export const toast = {
  show: (message, type = 'info', title = '') => {
    toastListeners.forEach(listener => listener({ message, type, title }));
  },
  error: (message, title = 'Error') => toast.show(message, 'error', title),
  success: (message, title = 'Success') => toast.show(message, 'success', title),
  warning: (message, title = 'Warning') => toast.show(message, 'warning', title),
  info: (message, title = 'Notice') => toast.show(message, 'info', title)
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      showToast: toast.show,
      toast
    };
  }
  return ctx;
};

const TOAST_THEMES = {
  error: {
    icon: AlertCircle,
    color: '#EF4444',
    border: 'rgba(239, 68, 68, 0.65)',
    glow: 'rgba(239, 68, 68, 0.35)',
    bgBadge: 'rgba(239, 68, 68, 0.18)',
    label: 'Error'
  },
  success: {
    icon: CheckCircle2,
    color: '#10B981',
    border: 'rgba(16, 185, 129, 0.65)',
    glow: 'rgba(16, 185, 129, 0.35)',
    bgBadge: 'rgba(16, 185, 129, 0.18)',
    label: 'Success'
  },
  warning: {
    icon: AlertTriangle,
    color: '#F59E0B',
    border: 'rgba(245, 158, 11, 0.65)',
    glow: 'rgba(245, 158, 11, 0.35)',
    bgBadge: 'rgba(245, 158, 11, 0.18)',
    label: 'Warning'
  },
  info: {
    icon: Info,
    color: '#00C8F5',
    border: 'rgba(0, 200, 245, 0.65)',
    glow: 'rgba(0, 200, 245, 0.35)',
    bgBadge: 'rgba(0, 200, 245, 0.18)',
    label: 'Info'
  }
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', title = '', duration = 4500) => {
    if (!message) return;
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const newToast = { id, message, type, title, duration };

    setToasts(prev => [newToast, ...prev].slice(0, 5)); // Keep max 5 visible toasts

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  useEffect(() => {
    const handler = (data) => {
      addToast(data.message, data.type, data.title);
    };
    toastListeners.add(handler);
    return () => toastListeners.delete(handler);
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ showToast: addToast, toast, removeToast }}>
      {children}

      {/* Modern High-Impact Floating Toaster Container */}
      <div
        className="ub-toaster-viewport"
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 999999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '420px',
          width: 'calc(100vw - 36px)',
          pointerEvents: 'none'
        }}
      >
        <style>{`
          @keyframes toastSlideIn {
            from {
              transform: translateX(105%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          @keyframes toastProgress {
            from { width: 100%; }
            to { width: 0%; }
          }
          .ub-toast-card {
            pointer-events: auto;
            animation: toastSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            transition: all 0.2s ease;
          }
          .ub-toast-card:hover {
            transform: translateY(-2px);
          }
        `}</style>

        {toasts.map(t => {
          const theme = TOAST_THEMES[t.type] || TOAST_THEMES.info;
          const IconComponent = theme.icon;
          const displayTitle = t.title || (t.type === 'error' ? 'Error' : t.type === 'success' ? 'Success' : t.type === 'warning' ? 'Notice' : '');

          return (
            <div
              key={t.id}
              className="ub-toast-card"
              style={{
                background: 'rgba(8, 18, 38, 0.96)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: `1.5px solid ${theme.border}`,
                borderRadius: '12px',
                padding: '12px 14px',
                boxShadow: `0 12px 32px rgba(0, 0, 0, 0.65), 0 0 16px ${theme.glow}`,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                color: '#FFFFFF',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Status Icon Badge */}
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: theme.bgBadge,
                  color: theme.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: `0 0 10px ${theme.glow}`
                }}
              >
                <IconComponent size={18} color={theme.color} />
              </div>

              {/* Message Content */}
              <div style={{ flex: 1, minWidth: 0, paddingRight: '4px' }}>
                {displayTitle && (
                  <strong style={{ fontSize: '13px', fontWeight: 800, color: theme.color, display: 'block', marginBottom: '2px', letterSpacing: '0.01em' }}>
                    {displayTitle}
                  </strong>
                )}
                <div style={{ fontSize: '12.5px', color: '#E2E8F0', lineHeight: 1.4, wordBreak: 'break-word', fontWeight: 500 }}>
                  {t.message}
                </div>
              </div>

              {/* Dismiss Button */}
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'color 0.15s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#FFFFFF'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'; }}
                title="Dismiss notification"
              >
                <X size={16} />
              </button>

              {/* Countdown Progress Bar */}
              {t.duration > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    height: '2.5px',
                    backgroundColor: theme.color,
                    boxShadow: `0 0 6px ${theme.color}`,
                    animation: `toastProgress ${t.duration}ms linear forwards`
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
