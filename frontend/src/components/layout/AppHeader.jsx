import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  Search, 
  User, 
  ChevronDown, 
  AlertTriangle, 
  Building, 
  LogOut, 
  Globe, 
  ShieldCheck,
  ExternalLink,
  Sun,
  Moon
} from 'lucide-react';

export const AppHeader = ({
  title = 'Dashboard',
  breadcrumbs = ['UltraBlue+', 'Management'],
  currentRole = 'admin',
  authUser = null,
  onLogout,
  onViewPublicWebsite,
  notifications = [],
  onNotificationClick
}) => {
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Theme state: dark | light
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('ub_theme');
    if (saved) return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const isDark = theme === 'dark';

  useEffect(() => {
    localStorage.setItem('ub_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifMenu(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name) => {
    if (!name) return 'UB';
    const cleanName = name.replace(/^(Dr\.|Mr\.|Mrs\.|Ms\.)\s+/i, '').trim();
    const parts = cleanName.split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return cleanName.substring(0, 2).toUpperCase();
  };

  const displayName = authUser?.name || (
    currentRole === 'admin' ? 'Administrator' :
    currentRole === 'operator' || currentRole === 'android_pos' ? 'Sales Operator' :
    'Distributor Partner'
  );

  const displayEmail = authUser?.email || (
    currentRole === 'admin' ? 'admin@ultrablueplus.com' :
    currentRole === 'operator' || currentRole === 'android_pos' ? 'operator@ultrablueplus.com' :
    'distributor@ultrablueplus.com'
  );

  const displayOrg = authUser?.title || authUser?.organization || (
    currentRole === 'admin' ? 'Ayush Green Energy' :
    currentRole === 'operator' || currentRole === 'android_pos' ? 'Sales Terminal Desk' :
    'Authorized B2B Partner'
  );

  const initials = getInitials(displayName);

  return (
    <header
      style={{
        height: 'var(--header-height)',
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-light)',
        padding: '0 var(--space-6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        gap: 'var(--space-4)'
      }}
    >
      {/* Left: Breadcrumbs & Title */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <span>{crumb}</span>
              {idx < breadcrumbs.length - 1 && <span>/</span>}
            </React.Fragment>
          ))}
        </div>
        <h1 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: 'var(--brand-navy-primary)', margin: 0, lineHeight: 1.2 }}>
          {title}
        </h1>
      </div>

      {/* Center: Global Search */}
      <div style={{ flex: 1, maxWidth: '420px', position: 'relative' }}>
        <Search
          size={16}
          style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
        />
        <input
          type="text"
          placeholder="Global search: SKU, Batch No, Invoice, Customer phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="ub-input"
          style={{
            paddingLeft: '36px',
            fontSize: 'var(--font-size-xs)',
            height: '38px',
            backgroundColor: 'var(--bg-surface-secondary)',
            borderRadius: 'var(--radius-pill)'
          }}
        />
      </div>

      {/* Right: Theme Toggle, Notifications & Dynamic Profile Dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        {/* Dark / Light Mode Switcher Button */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '50px',
            border: isDark ? '1px solid rgba(0, 200, 245, 0.3)' : '1px solid var(--border-medium)',
            backgroundColor: isDark ? 'rgba(0, 200, 245, 0.12)' : 'var(--bg-surface)',
            color: isDark ? 'var(--brand-cyan)' : 'var(--brand-navy-primary)',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 700,
            transition: 'all 0.2s ease'
          }}
        >
          {isDark ? (
            <>
              <Sun size={14} color="var(--brand-gold)" />
              <span>Light</span>
            </>
          ) : (
            <>
              <Moon size={14} color="var(--brand-blue)" />
              <span>Dark</span>
            </>
          )}
        </button>

        {/* Notification Bell */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            aria-label="View notifications"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-light)',
              backgroundColor: 'var(--bg-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              color: 'var(--text-secondary)'
            }}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  backgroundColor: 'var(--brand-red)',
                  color: '#FFFFFF',
                  fontSize: '10px',
                  fontWeight: 700,
                  borderRadius: '10px',
                  padding: '1px 5px',
                  minWidth: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div
              className="ub-card"
              style={{
                position: 'absolute',
                top: '120%',
                right: 0,
                width: '340px',
                boxShadow: 'var(--shadow-xl)',
                zIndex: 200,
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'var(--brand-navy-primary)',
                  color: '#FFFFFF',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Bell size={14} color="var(--brand-cyan)" />
                  <strong style={{ fontSize: 'var(--font-size-sm)' }}>Live Notifications</strong>
                </div>
                <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '10px' }}>
                  {unreadCount} new
                </span>
              </div>

              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      onNotificationClick?.(n);
                      setShowNotifMenu(false);
                    }}
                    style={{
                      padding: '10px 14px',
                      borderBottom: '1px solid var(--border-light)',
                      backgroundColor: n.unread ? 'var(--brand-blue-light)' : 'transparent',
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-xs)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      {n.type === 'CRITICAL_STOCK' && <AlertTriangle size={13} color="var(--status-danger)" />}
                      {n.type === 'DISTRIBUTOR_SIGNUP' && <Building size={13} color="var(--brand-gold)" />}
                      <strong style={{ color: 'var(--brand-navy-primary)' }}>{n.title}</strong>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', margin: '2px 0 4px 0', lineHeight: 1.3 }}>
                      {n.message}
                    </p>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dynamic User Profile Badge with Interactive Sign Out Dropdown */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              border: '1px solid var(--border-light)',
              backgroundColor: showProfileMenu ? 'var(--bg-surface-secondary)' : 'transparent',
              borderRadius: '50px',
              padding: '4px 12px 4px 4px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                backgroundColor: 'var(--brand-navy-surface)',
                color: 'var(--brand-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '12px',
                border: '2px solid rgba(0, 200, 245, 0.4)'
              }}
            >
              {initials}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--brand-navy-primary)' }}>
                {displayName}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                {displayOrg}
              </span>
            </div>
            <ChevronDown size={14} color="var(--text-muted)" style={{ transform: showProfileMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {/* Profile Dropdown Menu with Sign Out */}
          {showProfileMenu && (
            <div
              className="ub-card"
              style={{
                position: 'absolute',
                top: '115%',
                right: 0,
                width: '260px',
                padding: '8px',
                boxShadow: 'var(--shadow-xl)',
                zIndex: 200,
                backgroundColor: 'var(--bg-surface)',
                borderRadius: '12px',
                border: '1px solid var(--border-medium)'
              }}
            >
              {/* User Identity Info */}
              <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <ShieldCheck size={14} color="var(--brand-cyan)" />
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--brand-blue)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {currentRole.toUpperCase()} SESSION
                  </span>
                </div>
                <strong style={{ fontSize: '13px', color: 'var(--brand-navy-primary)', display: 'block' }}>
                  {displayName}
                </strong>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', wordBreak: 'break-all' }}>
                  {displayEmail}
                </span>
              </div>

              {/* Action Links */}
              <div style={{ padding: '6px 0' }}>
                {onViewPublicWebsite && (
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onViewPublicWebsite();
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      textAlign: 'left'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-surface-secondary)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Globe size={14} color="var(--brand-blue)" />
                    <span>View Public Website</span>
                  </button>
                )}

                {onLogout && (
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout();
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: 'rgba(239, 68, 68, 0.08)',
                      color: '#EF4444',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      textAlign: 'left',
                      marginTop: '4px'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.16)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)'}
                  >
                    <LogOut size={14} color="#EF4444" />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
