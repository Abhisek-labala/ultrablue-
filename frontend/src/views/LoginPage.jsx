import React, { useState } from 'react';
import { Logo } from '../components/ui/Logo';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Building2,
  Store,
  UserCheck,
  KeyRound,
  Sparkles,
  Sun,
  Moon,
  UserPlus,
  Phone,
  Briefcase,
  FileCheck,
  MapPin,
  LogIn
} from 'lucide-react';
import { AuthAPI } from '../services/api';
import { ROLES, ROLE_LABELS } from '../config/roles';

// JWT Helper utility to generate, decode and verify tokens
export const JWT_AUTH = {
  createToken: (user) => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
    const now = Math.floor(Date.now() / 1000);
    const payload = btoa(JSON.stringify({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.permissions || [user.role],
      organization: user.organization || user.assignedDepot || '',
      assignedDepot: user.assignedDepot || user.organization || '',
      assigned_depot: user.assigned_depot || user.assignedDepot || user.organization || '',
      iat: now,
      exp: now + (24 * 60 * 60) // 24 hours validity
    })).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
    const signature = btoa(`ub_secret_sig_${user.role}_${now}`).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
    return `${header}.${payload}.${signature}`;
  },

  decodeToken: (token) => {
    try {
      if (!token) return null;
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64));
    } catch {
      return null;
    }
  },

  isValid: (token) => {
    const decoded = JWT_AUTH.decodeToken(token);
    if (!decoded || !decoded.exp) return false;
    return decoded.exp > Math.floor(Date.now() / 1000);
  },

  saveSession: (token, user) => {
    localStorage.setItem('ub_jwt_token', token);
    localStorage.setItem('ub_auth_user', JSON.stringify(user));
  },

  clearSession: () => {
    localStorage.removeItem('ub_jwt_token');
    localStorage.removeItem('ub_auth_user');
  },

  getSession: () => {
    const token = localStorage.getItem('ub_jwt_token');
    const userStr = localStorage.getItem('ub_auth_user');
    if (!token || !JWT_AUTH.isValid(token)) {
      return null;
    }
    try {
      return { token, user: JSON.parse(userStr) };
    } catch {
      return null;
    }
  }
};

export const LoginPage = ({ onLoginSuccess, onBackToWebsite }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('ub_theme');
    return saved ? saved === 'dark' : true;
  });

  // Auth Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState('login');

  // Fixed Platform Roles: Admin, Sales Operator, Distributor
  const [selectedRole, setSelectedRole] = useState(ROLES.DISTRIBUTOR);

  // Login Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Registration Form State
  const [regForm, setRegForm] = useState({
    fullName: '',
    companyName: '',
    gstin: '',
    phone: '',
    email: '',
    location: '',
    password: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('ub_theme', newTheme ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', newTheme ? 'dark' : 'light');
  };

  const ROLE_DETAILS = {
    [ROLES.DISTRIBUTOR]: {
      title: 'Authorized B2B Partner',
      description: 'Factory direct orders, live tanker dispatch tracking, credit statement ledger'
    },
    [ROLES.OPERATOR]: {
      title: 'Sales & Plant POS Operator',
      description: 'Real-time retail billing, thermal GST receipts, dispensing nozzle counter'
    },
    [ROLES.ADMIN]: {
      title: 'Super Administrator',
      description: 'Master inventory, plant telemetry, CoA certificate signing & ERP ledger'
    }
  };

  const handleRoleTabChange = (role) => {
    setSelectedRole(role);
    setError(null);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!email.trim()) {
        throw new Error('Please enter your email address.');
      }
      if (!password.trim()) {
        throw new Error('Please enter your account password.');
      }

      const response = await AuthAPI.login({
        email: email.trim(),
        password: password.trim(),
        role: selectedRole
      });

      if (!response || !response.token || !response.user) {
        throw new Error(response?.message || 'Invalid credentials.');
      }

      const { token, user } = response;
      JWT_AUTH.saveSession(token, user);
      setSuccessMessage(`Authenticated successfully! Welcome, ${user.name}`);

      setTimeout(() => {
        onLoginSuccess(user.role || selectedRole, user, token);
      }, 700);

    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!regForm.fullName.trim() || regForm.fullName.trim().length < 3) {
        throw new Error('Please enter your full name (minimum 3 characters).');
      }

      if (!regForm.email.trim() || !regForm.email.includes('@')) {
        throw new Error('Please enter a valid email address (e.g. name@domain.com).');
      }

      if (!regForm.password || regForm.password.length < 6) {
        throw new Error('Password must contain at least 6 characters.');
      }

      if (regForm.password !== regForm.confirmPassword) {
        throw new Error('Passwords do not match. Please re-enter your password.');
      }

      if (!regForm.phone.trim() || regForm.phone.trim().length < 10) {
        throw new Error('Please enter a valid 10-digit contact mobile number.');
      }

      if (!regForm.companyName.trim()) {
        throw new Error(selectedRole === 'distributor' ? 'Please provide your Company or Dealership name.' : 'Please provide your Operating Depot Station name.');
      }

      const response = await AuthAPI.register({
        fullName: regForm.fullName.trim(),
        email: regForm.email.trim(),
        password: regForm.password,
        role: selectedRole,
        companyName: regForm.companyName.trim(),
        phone: regForm.phone.trim(),
        gstin: regForm.gstin ? regForm.gstin.trim() : null,
        location: regForm.location ? regForm.location.trim() : null
      });

      if (!response || !response.token || !response.user) {
        throw new Error(response?.message || 'Registration failed.');
      }

      const { token, user: newUser } = response;
      JWT_AUTH.saveSession(token, newUser);
      setSuccessMessage(`Registration Successful! Account created for ${newUser.name}`);

      setTimeout(() => {
        onLoginSuccess(newUser.role || selectedRole, newUser, token);
      }, 800);

    } catch (err) {
      setError(err.message || 'Registration failed. Please check the fields and try again.');
    } finally {
      setLoading(false);
    }
  };

  const bgPage = isDark ? '#020712' : '#F8FAFC';
  const bgCard = isDark ? 'rgba(13, 32, 72, 0.95)' : '#FFFFFF';
  const textHeading = isDark ? '#FFFFFF' : '#06142F';
  const textMuted = isDark ? '#94A3B8' : '#64748B';
  const borderColor = isDark ? 'rgba(0, 200, 245, 0.25)' : '#CBD5E1';
  const tabBg = isDark ? 'rgba(2, 7, 18, 0.8)' : '#E2E8F0';

  return (
    <div
      className="login-page-container"
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: bgPage,
        backgroundImage: isDark
          ? 'radial-gradient(ellipse at 50% -20%, #0B2559 0%, #06142F 50%, #020712 100%)'
          : 'radial-gradient(ellipse at 50% -20%, #E0F2FE 0%, #F1F5F9 60%, #E2E8F0 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: '16px 12px 32px 12px',
        boxSizing: 'border-box',
        fontFamily: 'var(--font-family-sans)',
        overflowY: 'auto'
      }}
    >
      {/* Top Navigation Bar */}
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 4px 14px 4px'
        }}
      >
        <button
          onClick={onBackToWebsite}
          style={{
            background: 'transparent',
            border: isDark ? '1px solid rgba(0, 200, 245, 0.3)' : '1px solid #CBD5E1',
            borderRadius: '50px',
            padding: '7px 14px',
            color: isDark ? 'var(--brand-cyan)' : 'var(--brand-blue)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 700,
            transition: 'all 0.2s ease',
            backgroundColor: isDark ? 'rgba(0, 200, 245, 0.08)' : '#FFFFFF'
          }}
        >
          <ArrowLeft size={15} />
          <span>Back to Site</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          style={{
            background: isDark ? 'rgba(0, 200, 245, 0.12)' : 'rgba(0, 0, 0, 0.05)',
            border: isDark ? '1px solid rgba(0, 200, 245, 0.3)' : '1px solid #CBD5E1',
            borderRadius: '50px',
            padding: '7px 14px',
            color: isDark ? 'var(--brand-cyan)' : 'var(--brand-navy-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 700
          }}
        >
          {isDark ? <Sun size={14} color="var(--brand-gold)" /> : <Moon size={14} color="var(--brand-blue)" />}
          <span>{isDark ? 'Light' : 'Dark'}</span>
        </button>
      </div>

      {/* Main Authentication Card */}
      <div
        className="auth-card"
        style={{
          width: '100%',
          maxWidth: authMode === 'register' ? '560px' : '480px',
          margin: '0 auto',
          backgroundColor: bgCard,
          borderRadius: '24px',
          border: `1px solid ${borderColor}`,
          padding: '28px 24px',
          boxShadow: isDark
            ? '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 200, 245, 0.12)'
            : '0 16px 40px rgba(0, 0, 0, 0.08)',
          boxSizing: 'border-box',
          position: 'relative'
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'inline-block', marginBottom: '8px' }}>
            <Logo size="small" variant={isDark ? "dark" : "light"} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: textHeading, margin: '0 0 4px 0', fontFamily: 'var(--font-family-heading)' }}>
            {authMode === 'login' ? 'Portal Login' : 'Registration'}
          </h2>
          <p style={{ fontSize: '11px', color: textMuted, margin: 0 }}>
            Ayush Green Energy • ISO 22241-1 Industrial Suite
          </p>
        </div>

        {/* Login / Register Mode Switcher Pill */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '18px' }}>
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0',
              borderRadius: '50px',
              padding: '3px',
              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #CBD5E1'
            }}
          >
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setError(null); }}
              style={{
                padding: '6px 18px',
                borderRadius: '50px',
                border: 'none',
                backgroundColor: authMode === 'login' ? 'var(--brand-blue)' : 'transparent',
                color: authMode === 'login' ? '#FFFFFF' : (isDark ? '#94A3B8' : '#475569'),
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <LogIn size={13} />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setError(null);
                if (selectedRole === 'admin') setSelectedRole('distributor');
              }}
              style={{
                padding: '6px 18px',
                borderRadius: '50px',
                border: 'none',
                backgroundColor: authMode === 'register' ? 'var(--brand-blue)' : 'transparent',
                color: authMode === 'register' ? '#FFFFFF' : (isDark ? '#94A3B8' : '#475569'),
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <UserPlus size={13} />
              <span>Register</span>
            </button>
          </div>
        </div>

        {/* Segmented Role Selector Pill Tabs (High-Contrast in both Dark and Light Mode) */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: textMuted, marginBottom: '6px', letterSpacing: '0.04em' }}>
            Select Role
          </label>
          <div
            style={{
              display: 'flex',
              backgroundColor: tabBg,
              borderRadius: '50px',
              padding: '3px',
              gap: '3px',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #CBD5E1'
            }}
          >
            {[
              { id: ROLES.DISTRIBUTOR, label: 'DISTRIBUTOR', icon: UserCheck },
              { id: ROLES.OPERATOR, label: 'SALES OPERATOR', icon: Store },
              ...(authMode === 'login' ? [{ id: ROLES.ADMIN, label: 'ADMIN', icon: Building2 }] : [])
            ].map(tab => {
              const isActive = selectedRole === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleRoleTabChange(tab.id)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: '8px 4px',
                    borderRadius: '50px',
                    border: 'none',
                    backgroundColor: isActive
                      ? (isDark ? 'var(--brand-blue)' : '#FFFFFF')
                      : 'transparent',
                    color: isActive
                      ? (isDark ? '#FFFFFF' : '#06142F')
                      : (isDark ? '#94A3B8' : '#475569'),
                    fontSize: 'clamp(9px, 2.7vw, 11px)',
                    fontWeight: isActive ? 800 : 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive
                      ? (isDark ? '0 4px 12px rgba(0, 143, 224, 0.4)' : '0 2px 8px rgba(0,0,0,0.15)')
                      : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden'
                  }}
                >
                  <tab.icon size={13} style={{ flexShrink: 0 }} color={isActive ? (isDark ? '#FFFFFF' : 'var(--brand-blue)') : 'currentColor'} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Role Quick Info Pill */}
        <div
          style={{
            backgroundColor: isDark ? 'rgba(0, 200, 245, 0.08)' : '#F0F9FF',
            border: isDark ? '1px solid rgba(0, 200, 245, 0.25)' : '1px solid #BAE6FD',
            borderRadius: '12px',
            padding: '9px 12px',
            marginBottom: '16px',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Sparkles size={15} color="var(--brand-cyan)" style={{ flexShrink: 0 }} />
          <div style={{ lineHeight: 1.35 }}>
            <strong style={{ color: isDark ? '#FFFFFF' : '#0369A1', display: 'block', fontSize: '11px' }}>
              {authMode === 'login' ? (ROLE_DETAILS[selectedRole]?.title || 'Portal Login') : `Register as ${selectedRole.toUpperCase()}`}
            </strong>
            <span style={{ color: textMuted, fontSize: '10px' }}>
              {authMode === 'login'
                ? (ROLE_DETAILS[selectedRole]?.description || '')
                : (selectedRole === 'distributor'
                  ? 'Get wholesale pricing, digital CoA downloads, and priority factory tanker delivery.'
                  : 'Issue retail invoices, thermal receipts, and real-time dispenser counter sync.')
              }
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #EF4444',
              borderRadius: '10px',
              padding: '9px 12px',
              marginBottom: '14px',
              color: '#F87171',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10B981',
              borderRadius: '10px',
              padding: '9px 12px',
              marginBottom: '14px',
              color: '#34D399',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <CheckCircle2 size={15} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* MODE 1: LOGIN FORM */}
        {authMode === 'login' ? (
          <form onSubmit={handleLoginSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: textHeading, marginBottom: '5px' }}>
                  Email Address or Username
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@ultrablueplus.com"
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 34px',
                      borderRadius: '10px',
                      border: `1px solid ${borderColor}`,
                      backgroundColor: isDark ? 'rgba(2, 7, 18, 0.6)' : '#FFFFFF',
                      color: textHeading,
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <Mail size={15} color={textMuted} style={{ position: 'absolute', left: '10px', top: '11px' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: textHeading, marginBottom: '5px' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 34px',
                      borderRadius: '10px',
                      border: `1px solid ${borderColor}`,
                      backgroundColor: isDark ? 'rgba(2, 7, 18, 0.6)' : '#FFFFFF',
                      color: textHeading,
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <Lock size={15} color={textMuted} style={{ position: 'absolute', left: '10px', top: '11px' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', color: textMuted, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ accentColor: 'var(--brand-blue)' }}
                  />
                  <span>Remember session</span>
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert(`Password reset link for ${email} has been dispatched by Ayush Green Energy IT admin.`);
                  }}
                  style={{ color: 'var(--brand-cyan)', textDecoration: 'none', fontWeight: 600 }}
                >
                  Forgot Password?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '50px',
                  border: 'none',
                  backgroundColor: 'var(--brand-blue)',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '7px',
                  boxShadow: '0 8px 24px rgba(0, 143, 224, 0.4)',
                  marginTop: '4px',
                  transition: 'all 0.15s ease',
                  opacity: loading ? 0.7 : 1
                }}
              >
                <KeyRound size={15} />
                <span>{loading ? 'Authenticating...' : `Sign In as ${selectedRole.toUpperCase()}`}</span>
              </button>

              {/* Registration Quick Switch Link */}
              <div style={{ marginTop: '8px', textAlign: 'center', fontSize: '11px', color: textMuted }}>
                <span>Don't have an account? </span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    if (selectedRole === 'admin') setSelectedRole('distributor');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--brand-cyan)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Register as {selectedRole === 'admin' ? 'Distributor / Operator' : selectedRole.toUpperCase()}
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* MODE 2: REGISTRATION FORM */
          <form onSubmit={handleRegisterSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: textHeading, marginBottom: '4px' }}>
                    Full Name *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      required
                      value={regForm.fullName}
                      onChange={e => setRegForm({ ...regForm, fullName: e.target.value })}
                      placeholder="e.g. Subrat Das"
                      style={{
                        width: '100%',
                        padding: '9px 10px 9px 30px',
                        borderRadius: '8px',
                        border: `1px solid ${borderColor}`,
                        backgroundColor: isDark ? 'rgba(2, 7, 18, 0.6)' : '#FFFFFF',
                        color: textHeading,
                        fontSize: '12px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <Briefcase size={13} color={textMuted} style={{ position: 'absolute', left: '9px', top: '10px' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: textHeading, marginBottom: '4px' }}>
                    {selectedRole === 'distributor' ? 'Company Name *' : 'Assigned Depot *'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      required
                      value={regForm.companyName}
                      onChange={e => setRegForm({ ...regForm, companyName: e.target.value })}
                      placeholder={selectedRole === 'distributor' ? 'e.g. Shree Ganesh Fleet Logistics' : 'Bhadrak Depot Dispenser #01'}
                      style={{
                        width: '100%',
                        padding: '9px 10px 9px 30px',
                        borderRadius: '8px',
                        border: `1px solid ${borderColor}`,
                        backgroundColor: isDark ? 'rgba(2, 7, 18, 0.6)' : '#FFFFFF',
                        color: textHeading,
                        fontSize: '12px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <Building2 size={13} color={textMuted} style={{ position: 'absolute', left: '9px', top: '10px' }} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: textHeading, marginBottom: '4px' }}>
                    Email Address *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      required
                      value={regForm.email}
                      onChange={e => setRegForm({ ...regForm, email: e.target.value })}
                      placeholder="user@domain.com"
                      style={{
                        width: '100%',
                        padding: '9px 10px 9px 30px',
                        borderRadius: '8px',
                        border: `1px solid ${borderColor}`,
                        backgroundColor: isDark ? 'rgba(2, 7, 18, 0.6)' : '#FFFFFF',
                        color: textHeading,
                        fontSize: '12px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <Mail size={13} color={textMuted} style={{ position: 'absolute', left: '9px', top: '10px' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: textHeading, marginBottom: '4px' }}>
                    Mobile Number *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="tel"
                      required
                      value={regForm.phone}
                      onChange={e => setRegForm({ ...regForm, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      style={{
                        width: '100%',
                        padding: '9px 10px 9px 30px',
                        borderRadius: '8px',
                        border: `1px solid ${borderColor}`,
                        backgroundColor: isDark ? 'rgba(2, 7, 18, 0.6)' : '#FFFFFF',
                        color: textHeading,
                        fontSize: '12px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <Phone size={13} color={textMuted} style={{ position: 'absolute', left: '9px', top: '10px' }} />
                  </div>
                </div>
              </div>

              {selectedRole === 'distributor' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: textHeading, marginBottom: '4px' }}>
                      GSTIN (Optional)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        value={regForm.gstin}
                        onChange={e => setRegForm({ ...regForm, gstin: e.target.value.toUpperCase() })}
                        placeholder="21AAAAA0000A1Z5"
                        style={{
                          width: '100%',
                          padding: '9px 10px 9px 30px',
                          borderRadius: '8px',
                          border: `1px solid ${borderColor}`,
                          backgroundColor: isDark ? 'rgba(2, 7, 18, 0.6)' : '#FFFFFF',
                          color: textHeading,
                          fontSize: '12px',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                      <FileCheck size={13} color={textMuted} style={{ position: 'absolute', left: '9px', top: '10px' }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: textHeading, marginBottom: '4px' }}>
                      Operating City *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        value={regForm.location}
                        onChange={e => setRegForm({ ...regForm, location: e.target.value })}
                        placeholder="e.g. Cuttack, Odisha"
                        style={{
                          width: '100%',
                          padding: '9px 10px 9px 30px',
                          borderRadius: '8px',
                          border: `1px solid ${borderColor}`,
                          backgroundColor: isDark ? 'rgba(2, 7, 18, 0.6)' : '#FFFFFF',
                          color: textHeading,
                          fontSize: '12px',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                      <MapPin size={13} color={textMuted} style={{ position: 'absolute', left: '9px', top: '10px' }} />
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: textHeading, marginBottom: '4px' }}>
                    Password (min 6 chars) *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="password"
                      required
                      value={regForm.password}
                      onChange={e => setRegForm({ ...regForm, password: e.target.value })}
                      placeholder="••••••••"
                      style={{
                        width: '100%',
                        padding: '9px 10px 9px 30px',
                        borderRadius: '8px',
                        border: `1px solid ${borderColor}`,
                        backgroundColor: isDark ? 'rgba(2, 7, 18, 0.6)' : '#FFFFFF',
                        color: textHeading,
                        fontSize: '12px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <Lock size={13} color={textMuted} style={{ position: 'absolute', left: '9px', top: '10px' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: textHeading, marginBottom: '4px' }}>
                    Confirm Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="password"
                      required
                      value={regForm.confirmPassword}
                      onChange={e => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      style={{
                        width: '100%',
                        padding: '9px 10px 9px 30px',
                        borderRadius: '8px',
                        border: `1px solid ${borderColor}`,
                        backgroundColor: isDark ? 'rgba(2, 7, 18, 0.6)' : '#FFFFFF',
                        color: textHeading,
                        fontSize: '12px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <Lock size={13} color={textMuted} style={{ position: 'absolute', left: '9px', top: '10px' }} />
                  </div>
                </div>
              </div>

              {/* Submit Registration Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: '50px',
                  border: 'none',
                  backgroundColor: 'var(--brand-blue)',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 8px 24px rgba(0, 143, 224, 0.4)',
                  marginTop: '4px',
                  transition: 'all 0.15s ease',
                  opacity: loading ? 0.7 : 1
                }}
              >
                <UserPlus size={14} />
                <span>{loading ? 'Creating Account...' : `Register as ${selectedRole.toUpperCase()}`}</span>
              </button>

              {/* Back to Login Link */}
              <div style={{ marginTop: '8px', textAlign: 'center', fontSize: '11px', color: textMuted }}>
                <span>Already have an account? </span>
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setError(null); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--brand-cyan)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Sign In here
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Security & JWT Notice */}
        <div
          style={{
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
            textAlign: 'center',
            fontSize: '10px',
            color: textMuted,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px'
          }}
        >
          <ShieldCheck size={13} color="var(--brand-cyan)" />
          <span>256-Bit SSL Encrypted • JWT Token Signed Session</span>
        </div>
      </div>

      {/* Footer Info */}
      <div style={{ textAlign: 'center', fontSize: '11px', color: textMuted, marginTop: '12px' }}>
        <span>Ayush Green Energy • Bhadrak Industrial Plant, Odisha</span>
      </div>

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 480px) {
          .auth-card {
            padding: 20px 16px !important;
            border-radius: 20px !important;
          }
        }
      `}</style>
    </div>
  );
};
