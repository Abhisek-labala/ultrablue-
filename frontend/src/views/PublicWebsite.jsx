import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  PhoneCall,
  Mail,
  MapPin,
  Send,
  Sparkles,
  Truck,
  Award,
  ChevronRight,
  Package,
  Layers,
  MessageCircle,
  Menu,
  X,
  Droplets,
  Clock,
  ArrowRight,
  Factory,
  Sun,
  Moon,
  Bell,
  Lock,
  ExternalLink,
  Check,
  Fuel,
  Info,
  CheckCircle,
  TrendingUp,
  Cpu,
  RefreshCw,
  Gauge
} from 'lucide-react';
import { Logo } from '../components/ui/Logo';
import { Button } from '../components/ui/Button';
import { ProductCard } from '../components/ui/ProductCard';
import { Input } from '../components/ui/Input';
import { ProductDetailModal } from '../components/ui/ProductDetailModal';
import { CertificationModal } from '../components/ui/CertificationModal';
import { OfferNotificationCenter } from '../components/ui/OfferNotificationCenter';
import { InquiryAPI, ProductAPI, PromotionAPI, ComplianceAPI } from '../services/api';
import { COMPANY_INFO } from '../config/companyInfo';

export const PublicWebsite = ({ onLoginClick, onDistributorLoginClick, onOperatorLoginClick, onAdminLoginClick }) => {
  // Theme Switcher State (Dark / Light Mode)
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

  // Navigation states: 'home' | 'about' | 'products' | 'quotes'
  const [activeNav, setActiveNav] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [activeProductFilter, setActiveProductFilter] = useState('ALL');

  // Dynamic DB Data States
  const [products, setProducts] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Modals States
  const [activeQuickViewProduct, setActiveQuickViewProduct] = useState(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [isOfferDrawerOpen, setIsOfferDrawerOpen] = useState(false);
  const [isAnnouncementDismissed, setIsAnnouncementDismissed] = useState(false);
  const hasAnnouncement = !isAnnouncementDismissed && promotions.length > 0;

  // Form State for Quotation / RFQ
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    location: '',
    packVariant: '20L Smart Bucket',
    quantity: '25 Buckets',
    message: ''
  });

  // Highlight state for quotes section when an item is clicked
  const [quoteHighlighted, setQuoteHighlighted] = useState(false);

  // Packaging variants specified in the client draft:
  // 5L / 10L, 20L Bucket, 210L Barrel, 1000L IBC, Bulk Tanker
  const packagingOptions = [
    {
      id: '5L-10L',
      category: 'CANS',
      name: '5L & 10L Emergency Cans',
      shortName: '5L / 10L Cans',
      image: '/images/def_cans_pack.jpg',
      badge: 'LCV & Emergency',
      capacity: '5 / 10 Litres',
      bestFor: 'Light Commercial Vehicles (LCVs), SUVs, Roadside Emergency Top-ups',
      features: [
        'Spill-proof flexible pouring nozzle included',
        'Tamper-evident child-resistant induction cap',
        'Compact form factor for vehicle cabin / boot storage',
        'UV-stabilized virgin HDPE polymer'
      ],
      defaultQty: '10 Cans'
    },
    {
      id: '20L',
      category: 'BUCKETS',
      name: '20L Smart Bucket',
      shortName: '20L Bucket',
      image: '/images/def_bucket_20l.jpg',
      badge: 'Most Popular • Fleet Choice',
      capacity: '20 Litres',
      bestFor: 'Medium & Heavy Commercial Vehicles (M&HCV), Highway Fleets, Retail',
      features: [
        'Airtight tamper-evident induction heat seal',
        'Integrated flexible retractable pouring spout',
        'Drop-tested reinforced ergonomic steel & polymer handle',
        'Full batch QR code for instant lab purity verification'
      ],
      defaultQty: '25 Buckets'
    },
    {
      id: '210L',
      category: 'BARRELS',
      name: '210L Industrial Barrel / Drum',
      shortName: '210L Barrel',
      image: '/images/def_barrel_210l.jpg',
      badge: 'Depot & Workshop Grade',
      capacity: '210 Litres',
      bestFor: 'Fleet Workshops, Transport Depots, Service Bays, Garages',
      features: [
        'Standard 2" BSP threaded bungs for manual/pneumatic pumps',
        'Heavy-duty virgin polymer with high hoop strength',
        '18-month certified shelf life under depot storage',
        'Zero crystallization guaranteed with sealed delivery'
      ],
      defaultQty: '2 Barrels'
    },
    {
      id: '1000L',
      category: 'IBC',
      name: '1000L IBC Tank Tote & Dispenser',
      shortName: '1000L IBC Tank',
      image: '/images/def_ibc_1000l.jpg',
      badge: 'Lowest Cost per Litre',
      capacity: '1,000 Litres',
      bestFor: 'Large Fleet Terminals, Mining Haulers, Bus Corporation Yards',
      features: [
        'Galvanized tubular steel cage with composite pallet base',
        '2" bottom camlock discharge valve with dust cap',
        'Compatible with dedicated digital flow-meter pump kits',
        'Ayush Green Energy door-to-door swap & refill service'
      ],
      defaultQty: '1 IBC Tank'
    },
    {
      id: 'BULK',
      category: 'BULK',
      name: 'Bulk Road Tanker Supply',
      shortName: 'Bulk Tanker (10 KL - 25 KL)',
      image: '/images/def_bulk_tanker.jpg',
      badge: 'Plant Direct Refill',
      capacity: '10,000 – 25,000 Litres',
      bestFor: 'Underground Fleet Tanks, Mining Captive Pumps, Large Transporters',
      features: [
        'Pharma/chemical grade SS-316 insulated road tankers',
        'Calibrated digital positive-displacement flow meters',
        'Factory sealed valves with certified batch CoA at delivery',
        'Direct dispatch from Bhadrak mother plant within 24 hours'
      ],
      defaultQty: '1 Tanker (10,000L)'
    }
  ];

  // Filter packaging options
  const filteredPackaging = activeProductFilter === 'ALL'
    ? packagingOptions
    : packagingOptions.filter(p => p.category === activeProductFilter);

  // Fetch dynamic products & promotions from DB on mount
  useEffect(() => {
    const fetchDynamicData = async () => {
      try {
        setLoadingData(true);
        const [dbProducts, dbPromos] = await Promise.all([
          ProductAPI.getAll().catch(() => []),
          PromotionAPI.getAll().catch(() => [])
        ]);

        setProducts(dbProducts || []);
        if (dbPromos && Array.isArray(dbPromos)) {
          setPromotions(dbPromos.map(p => ({
            id: p.id,
            title: p.title,
            description: p.description,
            badge: p.badge || 'Live Offer',
            promoCode: p.promo_code || '',
            discountPercent: p.discount_percent ? `${p.discount_percent}% OFF` : (p.offer_tag || 'Special Offer'),
            targetProduct: p.target_product || '',
            validUntil: p.valid_until || p.expiry_date || '',
            isActive: Boolean(p.is_active ?? true)
          })));
        }
      } catch (err) {
        console.error('Error fetching live data:', err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchDynamicData();
  }, []);

  // Scroll spy to update active navigation item between home, about, products, quotes
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['quotes', 'products', 'about', 'home'];
      const scrollPos = window.scrollY + 160;

      for (const secId of sections) {
        const sec = document.getElementById(secId);
        if (sec && sec.offsetTop <= scrollPos) {
          setActiveNav(secId);
          return;
        }
      }
      if (window.scrollY < 200) {
        setActiveNav('home');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock background scroll when mobile fullscreen menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Smooth scroll to target section with sticky header compensation
  const scrollToSection = (sectionId) => {
    let targetId = sectionId;
    if (targetId === 'rfq') targetId = 'quotes';

    setActiveNav(targetId);
    if (targetId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(targetId);
    if (el) {
      const headerOffset = hasAnnouncement ? 120 : 85;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Pre-fill quote form for a specific packaging format
  const handleSelectPackageForQuote = (pack) => {
    setFormData(prev => ({
      ...prev,
      packVariant: pack.shortName,
      quantity: pack.defaultQty,
      message: `Quotation requested for ${pack.name} (${pack.capacity}).`
    }));
    setQuoteHighlighted(true);
    setTimeout(() => setQuoteHighlighted(false), 2000);
    scrollToSection('quotes');
  };

  // Submit quote form to backend InquiryAPI
  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    try {
      await InquiryAPI.create({
        name: formData.name,
        company: formData.company,
        phone: formData.phone,
        email: formData.email,
        location: formData.location,
        packagingNeeded: `UltraBlue+ DEF - ${formData.packVariant}`,
        quantity: formData.quantity,
        message: formData.message
      });
      setInquirySuccess(true);
    } catch (err) {
      alert(err.message || 'Error submitting quote inquiry. Please call +91 9853675971 directly.');
    }
  };

  // Dynamic surface colors based on active theme
  const themeStyles = {
    bgApp: isDark ? '#020817' : '#F8FAFC',
    bgSectionAlt: isDark ? '#06132A' : '#F1F5F9',
    bgCard: isDark ? '#091B3A' : '#FFFFFF',
    bgCardSecondary: isDark ? '#0C234B' : '#F8FAFC',
    textHeading: isDark ? '#F8FAFC' : '#06142F',
    textBody: isDark ? '#CBD5E1' : '#334155',
    textMuted: isDark ? '#94A3B8' : '#64748B',
    borderColor: isDark ? 'rgba(0, 200, 245, 0.22)' : '#E2E8F0',
  };

  return (
    <div style={{ backgroundColor: themeStyles.bgApp, color: themeStyles.textBody, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ========================================================================= */}
      {/* GLOBAL MODERN KEYFRAME ANIMATIONS & UTILITIES                            */}
      {/* ========================================================================= */}
      <style>{`
        @keyframes ripplePulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6); }
          70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        @keyframes cyanGlowPulse {
          0% { box-shadow: 0 0 15px rgba(0, 200, 245, 0.2); }
          50% { box-shadow: 0 0 30px rgba(0, 200, 245, 0.45); }
          100% { box-shadow: 0 0 15px rgba(0, 200, 245, 0.2); }
        }

        @keyframes floatSlow {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }

        @keyframes shimmerSlide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }

        .modern-card-hover {
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease;
        }
        .modern-card-hover:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 143, 224, 0.25) !important;
          border-color: rgba(0, 200, 245, 0.6) !important;
        }

        .img-zoom-hover {
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .modern-card-hover:hover .img-zoom-hover {
          transform: scale(1.05);
        }

        .glow-btn-primary {
          background: linear-gradient(135deg, #008FE0 0%, #00C8F5 100%) !important;
          position: relative;
          overflow: hidden;
          transition: all 0.25s ease !important;
        }
        .glow-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 26px rgba(0, 200, 245, 0.45) !important;
          filter: brightness(1.08);
        }

        .nav-pill-link {
          transition: all 0.2s ease;
        }
        .nav-pill-link:hover {
          color: var(--brand-cyan) !important;
          transform: translateY(-1px);
        }

        .quote-form-glow {
          animation: cyanGlowPulse 1.5s infinite;
        }
      `}</style>

      {/* ========================================================================= */}
      {/* TOP HEADER & NAVIGATION (MODERN ULTRA-TRANSPARENT GLASS PILL)              */}
      {/* ========================================================================= */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pointerEvents: 'none'
        }}
      >
        {/* Optional Flash Announcement Strip if promotions exist */}
        {hasAnnouncement && (
          <div
            className="top-announcement-bar"
            style={{
              width: '100%',
              backgroundColor: '#F59E0B',
              color: '#06142F',
              padding: '6px 20px',
              fontSize: '12px',
              fontWeight: 800,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)',
              pointerEvents: 'auto',
              boxSizing: 'border-box'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto', overflow: 'hidden' }}>
              <span style={{ backgroundColor: '#06142F', color: '#F59E0B', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 900 }}>
                ⚡ FACTORY OFFER
              </span>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {promotions[0]?.title} {promotions[0]?.promoCode ? `• Code: ${promotions[0]?.promoCode}` : ''}
              </span>
              <button
                onClick={() => setIsOfferDrawerOpen(true)}
                style={{
                  backgroundColor: '#06142F',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '50px',
                  padding: '3px 12px',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                View Deals ({promotions.length})
              </button>
            </div>
            <button
              onClick={() => setIsAnnouncementDismissed(true)}
              style={{ background: 'none', border: 'none', color: '#06142F', cursor: 'pointer', fontSize: '18px', fontWeight: 800 }}
              title="Dismiss"
            >
              ×
            </button>
          </div>
        )}

        {/* Floating Pill Header */}
        <header
          className="main-header"
          style={{
            marginTop: hasAnnouncement ? '8px' : '14px',
            width: 'calc(100% - 40px)',
            maxWidth: '1360px',
            backgroundColor: isDark ? 'rgba(6, 18, 42, 0.88)' : 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '50px',
            border: isDark ? '1px solid rgba(0, 200, 245, 0.3)' : '1px solid rgba(226, 232, 240, 0.95)',
            padding: '8px 24px',
            boxShadow: isDark ? '0 16px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(0, 200, 245, 0.12)' : '0 12px 32px rgba(0, 0, 0, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxSizing: 'border-box',
            pointerEvents: 'auto',
            transition: 'all 0.3s ease'
          }}
        >
          {/* Brand Logo */}
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('home');
            }}
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
            title="UltraBlue+ Genuine DEF"
          >
            <Logo size="small" variant={isDark ? "dark" : "light"} />
          </a>

          {/* Desktop Navigation Links: HOME | ABOUT US | PRODUCTS | QUOTES */}
          <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            {[
              { id: 'home', label: 'Home' },
              { id: 'about', label: 'About Us' },
              { id: 'products', label: 'Products' },
              { id: 'quotes', label: 'Quotes' }
            ].map(item => {
              const isActive = activeNav === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection(item.id);
                  }}
                  className="nav-pill-link"
                  style={{
                    color: isActive
                      ? (isDark ? 'var(--brand-cyan)' : 'var(--brand-blue)')
                      : (isDark ? '#E2E8F0' : '#1E293B'),
                    fontSize: '14px',
                    fontWeight: isActive ? 800 : 600,
                    textDecoration: 'none',
                    position: 'relative',
                    padding: '8px 0'
                  }}
                >
                  {item.label}
                  {isActive && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '0px',
                        left: '0',
                        right: '0',
                        height: '3px',
                        background: 'linear-gradient(90deg, var(--brand-blue) 0%, var(--brand-cyan) 100%)',
                        borderRadius: '3px',
                        boxShadow: '0 0 10px rgba(0, 200, 245, 0.8)'
                      }}
                    />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Desktop Actions: Hotline, Portal Login, Theme Toggle */}
          <div className="desktop-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Direct Plant Hotline Pill */}
            <a
              href="tel:+919853675971"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: isDark ? 'var(--brand-cyan)' : 'var(--brand-blue)',
                fontSize: '13px',
                fontWeight: 800,
                textDecoration: 'none',
                padding: '7px 14px',
                borderRadius: '50px',
                backgroundColor: isDark ? 'rgba(0, 200, 245, 0.12)' : 'rgba(0, 143, 224, 0.08)',
                border: isDark ? '1px solid rgba(0, 200, 245, 0.3)' : '1px solid rgba(0, 143, 224, 0.2)'
              }}
              title="Call Plant Hotline"
            >
              <PhoneCall size={14} />
              <span>+91 9853675971</span>
            </a>

            {/* Portal Login Button */}
            <button
              onClick={onLoginClick}
              title="Enterprise Security Login"
              style={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #CBD5E1',
                borderRadius: '50px',
                padding: '7px 16px',
                color: isDark ? '#FFFFFF' : 'var(--brand-navy-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 700,
                transition: 'all 0.2s ease'
              }}
            >
              <Lock size={13} />
              <span>Portal Login</span>
            </button>

            {/* Request Quote Pill Button */}
            <button
              onClick={() => scrollToSection('quotes')}
              className="glow-btn-primary"
              style={{
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '50px',
                padding: '9px 20px',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 18px rgba(0, 143, 224, 0.4)'
              }}
            >
              <span>Get Quote</span>
              <ArrowRight size={14} />
            </button>

            {/* Theme Toggle (Dark/Light) */}
            <button
              onClick={toggleTheme}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              style={{
                background: 'none',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid #CBD5E1',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                color: isDark ? '#F59E0B' : '#06142F',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>

          {/* Mobile Hamburger Menu Toggle */}
          <div className="mobile-controls" style={{ display: 'none', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={toggleTheme}
              style={{
                background: 'none',
                border: 'none',
                color: isDark ? '#F59E0B' : '#06142F',
                cursor: 'pointer',
                padding: '6px'
              }}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open Menu"
              style={{
                background: isDark ? 'rgba(0, 200, 245, 0.15)' : 'rgba(6, 20, 47, 0.08)',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 10px',
                color: isDark ? '#FFFFFF' : '#06142F',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center'
              }}
            >
              <Menu size={22} />
            </button>
          </div>
        </header>
      </div>

      {/* ========================================================================= */}
      {/* FULLSCREEN MOBILE NAVIGATION MENU DRAWER                                 */}
      {/* ========================================================================= */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            width: '100vw',
            height: '100dvh',
            backgroundColor: isDark ? '#020712' : '#040C1D',
            zIndex: 999999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '20px',
            boxSizing: 'border-box'
          }}
        >
          {/* Top Bar with Logo & Close */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Logo size="small" variant="dark" />
            <button
              onClick={() => setMobileMenuOpen(false)}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                width: '42px',
                height: '42px',
                color: '#FFFFFF',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={22} />
            </button>
          </div>

          {/* Simple Navigation Links: Home, About Us, Products, Quotes */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '26px', padding: '24px 8px' }}>
            {[
              { id: 'home', label: 'Home' },
              { id: 'about', label: 'About Us' },
              { id: 'products', label: 'Products' },
              { id: 'quotes', label: 'Quotes' }
            ].map(item => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  setTimeout(() => scrollToSection(item.id), 50);
                }}
                style={{
                  fontSize: '32px',
                  fontWeight: 900,
                  color: activeNav === item.id ? 'var(--brand-cyan)' : '#FFFFFF',
                  textDecoration: 'none',
                  letterSpacing: '-0.02em'
                }}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Bottom Mobile Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <a
              href="tel:+919853675971"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: 'rgba(0, 200, 245, 0.15)',
                border: '1px solid var(--brand-cyan)',
                color: 'var(--brand-cyan)',
                padding: '14px',
                borderRadius: '12px',
                textDecoration: 'none',
                fontWeight: 800,
                fontSize: '15px'
              }}
            >
              <PhoneCall size={18} />
              <span>Call Dispatch: +91 9853675971</span>
            </a>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onLoginClick();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: 'var(--brand-blue)',
                border: 'none',
                color: '#FFFFFF',
                padding: '14px',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '15px',
                cursor: 'pointer'
              }}
            >
              <Lock size={18} />
              <span>Enterprise Portal Login</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Body */}
      <main style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>

        {/* ======================================================================= */}
        {/* SECTION 1: HOME (MODERN ANIMATED HERO BANNER)                           */}
        {/* State-of-the-art modern visual with branded fleet & dispensing network */}
        {/* ======================================================================= */}
        <section
          id="home"
          className="hero-section"
          style={{
            width: '100%',
            background: isDark
              ? 'linear-gradient(135deg, rgba(2, 8, 23, 0.94) 0%, rgba(6, 20, 47, 0.88) 50%, rgba(10, 39, 90, 0.82) 100%), url("/images/hero_def_fleet.jpg") center/cover no-repeat'
              : 'linear-gradient(135deg, rgba(6, 20, 47, 0.88) 0%, rgba(10, 43, 94, 0.82) 50%, rgba(0, 143, 224, 0.75) 100%), url("/images/hero_def_fleet.jpg") center/cover no-repeat',
            color: '#FFFFFF',
            padding: hasAnnouncement ? '150px 36px 76px 36px' : '120px 36px 76px 36px',
            position: 'relative',
            overflow: 'hidden',
            borderBottom: isDark ? '1px solid rgba(0, 200, 245, 0.25)' : 'none'
          }}
        >
          {/* Subtle Dynamic Ambient Lighting Spheres */}
          <div style={{ position: 'absolute', top: '-140px', right: '-100px', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,200,245,0.22) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none', animation: 'floatSlow 8s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', bottom: '-160px', left: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,143,224,0.2) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />

          <div style={{ width: '100%', maxWidth: '1360px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '52px', alignItems: 'center', position: 'relative', zIndex: 2 }}>

            {/* Left Hero Content */}
            <div>

              {/* Official Brand Logo Showcase */}
              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
                <img
                  src="/images/ultrablue_brand_logo.png"
                  alt="UltraBlue+ Diesel Exhaust Fluid"
                  style={{
                    height: 'clamp(44px, 5.5vw, 68px)',
                    width: 'auto',
                    maxWidth: '100%',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 4px 20px rgba(0, 200, 245, 0.45))'
                  }}
                />
              </div>

              {/* Bold Futuristic Headline */}
              <h1
                style={{
                  fontSize: 'clamp(32px, 4.4vw, 54px)',
                  lineHeight: 1.15,
                  fontWeight: 900,
                  color: '#FFFFFF',
                  marginBottom: '16px',
                  fontFamily: 'var(--font-family-heading)',
                  letterSpacing: '-0.025em'
                }}
              >
                A Complete Refueling Ecosystem for Genuine DEF
              </h1>

              {/* Refueling Ecosystem Subtitle with Cyan Glow */}
              <div
                style={{
                  fontSize: 'clamp(16px, 1.8vw, 20px)',
                  color: 'var(--brand-cyan)',
                  fontWeight: 700,
                  marginBottom: '18px',
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase'
                }}
              >
                IS 17042:2018 • ISO 22241 Certified • BS-VI Fleet Grade
              </div>

              {/* High-Impact Description */}
              <p style={{ fontSize: '15px', color: '#E2E8F0', marginBottom: '36px', lineHeight: 1.7, maxWidth: '650px' }}>
                Manufactured by <strong>Ayush Green Energy</strong> with 32.5% ultra-pure AUS 32 aqueous urea and multi-stage de-ionized water. UltraBlue+ guarantees <strong>&lt;0.05 ppm trace metals</strong> to safeguard SCR catalysts, eliminate injector crystallization, and maximize fleet fuel economy.
              </p>

              {/* Call to Action Buttons */}
              <div className="hero-cta-group" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '40px' }}>
                <button
                  onClick={() => scrollToSection('quotes')}
                  className="glow-btn-primary"
                  style={{
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '50px',
                    padding: '15px 32px',
                    fontSize: '15px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: '0 8px 28px rgba(0, 143, 224, 0.5)'
                  }}
                >
                  <Send size={17} />
                  <span>Request Instant Quote</span>
                </button>

                <button
                  onClick={() => scrollToSection('products')}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.35)',
                    color: '#FFFFFF',
                    borderRadius: '50px',
                    padding: '15px 26px',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Package size={17} />
                  <span>View Products & Packs</span>
                </button>

                <a
                  href="tel:+919853675971"
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid var(--brand-cyan)',
                    color: 'var(--brand-cyan)',
                    borderRadius: '50px',
                    padding: '15px 24px',
                    fontSize: '15px',
                    fontWeight: 800,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <PhoneCall size={17} />
                  <span>Call Dispatch</span>
                </a>
              </div>

              {/* Trust Metric Glass Badges */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '14px',
                  paddingTop: '26px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.15)'
                }}
              >
                <div
                  onClick={() => setIsCertModalOpen(true)}
                  style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.14)', cursor: 'pointer', transition: 'all 0.2s ease' }}
                  title="Click to view BIS & ISI Mark Certificate"
                >
                  <div style={{ color: 'var(--brand-cyan)', fontSize: '19px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>IS 17042</span>
                    <ShieldCheck size={17} />
                  </div>
                  <div style={{ color: '#CBD5E1', fontSize: '11px', fontWeight: 600, marginTop: '3px' }}>ISI Mark / BIS Licensed</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.14)' }}>
                  <div style={{ color: '#34D399', fontSize: '19px', fontWeight: 900 }}>&lt; 0.05 ppm</div>
                  <div style={{ color: '#CBD5E1', fontSize: '11px', fontWeight: 600, marginTop: '3px' }}>Zero Crystallization</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.14)' }}>
                  <div style={{ color: 'var(--brand-gold)', fontSize: '19px', fontWeight: 900 }}>32.5%</div>
                  <div style={{ color: '#CBD5E1', fontSize: '11px', fontWeight: 600, marginTop: '3px' }}>Automotive AUS 32</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.14)' }}>
                  <div style={{ color: '#FFFFFF', fontSize: '19px', fontWeight: 900 }}>24-Hour</div>
                  <div style={{ color: '#CBD5E1', fontSize: '11px', fontWeight: 600, marginTop: '3px' }}>Fleet Delivery</div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ======================================================================= */}
        {/* SECTION 2: ABOUT US (MODERN BENTO GRID & CORPORATE NARRATIVE)            */}
        {/* ======================================================================= */}
        <section
          id="about"
          className="content-section"
          style={{
            width: '100%',
            backgroundColor: themeStyles.bgSectionAlt,
            padding: '80px 36px',
            borderBottom: `1px solid ${themeStyles.borderColor}`,
            transition: 'background-color 0.25s ease'
          }}
        >
          <div style={{ width: '100%', maxWidth: '1280px', margin: '0 auto' }}>

            {/* Section Header */}
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <span style={{ color: 'var(--brand-blue)', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'inline-block', padding: '4px 12px', borderRadius: '50px', backgroundColor: isDark ? 'rgba(0, 200, 245, 0.12)' : 'rgba(0, 143, 224, 0.08)', marginBottom: '10px' }}>
                ABOUT AYUSH GREEN ENERGY
              </span>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', color: themeStyles.textHeading, fontWeight: 900, letterSpacing: '-0.025em', marginBottom: '16px' }}>
                Pioneering Genuine DEF & Clean Fleet Mobility
              </h2>
              <div style={{ width: '70px', height: '4px', background: 'linear-gradient(90deg, var(--brand-blue) 0%, var(--brand-cyan) 100%)', margin: '0 auto 22px auto', borderRadius: '2px' }} />
              <p style={{ color: themeStyles.textBody, fontSize: '16px', lineHeight: 1.75, maxWidth: '900px', margin: '0 auto' }}>
                UltraBlue+ is an integral initiative of <strong>Ayush Green Energy</strong>, one of Eastern India's frontline manufacturers committed to powering heavy commercial transport, safeguarding BS-VI diesel engine components, and fostering environmental preservation across India's highways.
              </p>
            </div>

            {/* 4 Core Bento Grid Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '26px', marginBottom: '52px' }}>

              {/* Bento Card 1 */}
              <div
                className="modern-card-hover"
                style={{
                  backgroundColor: themeStyles.bgCard,
                  padding: '32px 26px',
                  borderRadius: '20px',
                  border: `1px solid ${themeStyles.borderColor}`,
                  boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.35)' : '0 8px 24px rgba(0,0,0,0.04)',
                  position: 'relative'
                }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: 'rgba(0, 143, 224, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
                  <Droplets size={24} color="var(--brand-blue)" />
                </div>
                <h3 style={{ fontSize: '19px', fontWeight: 900, color: themeStyles.textHeading, marginBottom: '10px' }}>
                  32.5% Automotive Grade Purity
                </h3>
                <p style={{ fontSize: '14px', color: themeStyles.textMuted, lineHeight: 1.65 }}>
                  Formulated with double-pass reverse osmosis EDI demineralized water and virgin technical urea. Guarantees precise stoichiometric reaction without ammonia slip.
                </p>
                <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--brand-cyan)', fontWeight: 800 }}>
                  <CheckCircle size={14} />
                  <span>AUS 32 / ISO 22241-1</span>
                </div>
              </div>

              {/* Bento Card 2 */}
              <div
                className="modern-card-hover"
                style={{
                  backgroundColor: themeStyles.bgCard,
                  padding: '32px 26px',
                  borderRadius: '20px',
                  border: `1px solid ${themeStyles.borderColor}`,
                  boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.35)' : '0 8px 24px rgba(0,0,0,0.04)',
                  position: 'relative'
                }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
                  <ShieldCheck size={24} color="#10B981" />
                </div>
                <h3 style={{ fontSize: '19px', fontWeight: 900, color: themeStyles.textHeading, marginBottom: '10px' }}>
                  SCR Engine Protection
                </h3>
                <p style={{ fontSize: '14px', color: themeStyles.textMuted, lineHeight: 1.65 }}>
                  Heavy metals &lt;0.05 ppm prevents scaling, injector clogging, and catalyst poisoning. Protects exhaust systems costing ₹1.5L - ₹3.5L per vehicle.
                </p>
                <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#10B981', fontWeight: 800 }}>
                  <CheckCircle size={14} />
                  <span>Zero Crystallization</span>
                </div>
              </div>

              {/* Bento Card 3 */}
              <div
                className="modern-card-hover"
                style={{
                  backgroundColor: themeStyles.bgCard,
                  padding: '32px 26px',
                  borderRadius: '20px',
                  border: `1px solid ${themeStyles.borderColor}`,
                  boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.35)' : '0 8px 24px rgba(0,0,0,0.04)',
                  position: 'relative'
                }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
                  <Award size={24} color="#F59E0B" />
                </div>
                <h3 style={{ fontSize: '19px', fontWeight: 900, color: themeStyles.textHeading, marginBottom: '10px' }}>
                  BIS & ISO 22241 Certified
                </h3>
                <p style={{ fontSize: '14px', color: themeStyles.textMuted, lineHeight: 1.65 }}>
                  Certified under IS 17042:2018 with serialized batch barcodes. Every shipment is accompanied by a laboratory Certificate of Analysis (CoA).
                </p>
                <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#F59E0B', fontWeight: 800 }}>
                  <CheckCircle size={14} />
                  <span>Licensed Bhadrak Plant</span>
                </div>
              </div>

              {/* Bento Card 4 */}
              <div
                className="modern-card-hover"
                style={{
                  backgroundColor: themeStyles.bgCard,
                  padding: '32px 26px',
                  borderRadius: '20px',
                  border: `1px solid ${themeStyles.borderColor}`,
                  boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.35)' : '0 8px 24px rgba(0,0,0,0.04)',
                  position: 'relative'
                }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: 'rgba(0, 200, 245, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
                  <Truck size={24} color="var(--brand-cyan)" />
                </div>
                <h3 style={{ fontSize: '19px', fontWeight: 900, color: themeStyles.textHeading, marginBottom: '10px' }}>
                  Depot-to-Door Logistics
                </h3>
                <p style={{ fontSize: '14px', color: themeStyles.textMuted, lineHeight: 1.65 }}>
                  Direct plant dispatch from Bhadrak across Odisha, West Bengal, Jharkhand, and Bihar with 24-hour delivery commitments for bulk fleets and retail dealers.
                </p>
                <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--brand-cyan)', fontWeight: 800 }}>
                  <CheckCircle size={14} />
                  <span>24-Hour Dispatch Network</span>
                </div>
              </div>

            </div>

            {/* Plant Stats & Credentials Strip */}
            <div
              style={{
                backgroundColor: themeStyles.bgCard,
                borderRadius: '20px',
                border: `1px solid ${themeStyles.borderColor}`,
                padding: '32px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '28px',
                alignItems: 'center',
                boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.3)' : '0 6px 20px rgba(0,0,0,0.04)'
              }}
            >
              <div>
                <span style={{ fontSize: '12px', color: themeStyles.textMuted, textTransform: 'uppercase', fontWeight: 800 }}>Manufacturing Plant</span>
                <strong style={{ fontSize: '19px', color: themeStyles.textHeading, display: 'block', marginTop: '4px', fontWeight: 900 }}>Bhadrak, Odisha</strong>
                <span style={{ fontSize: '12px', color: themeStyles.textMuted }}>At- Charampa, Dist- Bhadrak (756101)</span>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: themeStyles.textMuted, textTransform: 'uppercase', fontWeight: 800 }}>Total Fleet Supply</span>
                <strong style={{ fontSize: '20px', color: 'var(--brand-blue)', display: 'block', marginTop: '4px', fontWeight: 900 }}>50M+ Litres</strong>
                <span style={{ fontSize: '12px', color: themeStyles.textMuted }}>Powering 500+ commercial fleets</span>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: themeStyles.textMuted, textTransform: 'uppercase', fontWeight: 800 }}>Quality Standard</span>
                <strong style={{ fontSize: '19px', color: '#10B981', display: 'block', marginTop: '4px', fontWeight: 900 }}>ISO 22241 / IS 17042</strong>
                <span style={{ fontSize: '12px', color: themeStyles.textMuted }}>BIS Licensed Manufacturing</span>
              </div>
            </div>

          </div>
        </section>

        {/* ======================================================================= */}
        {/* SECTION 3: PRODUCTS & SERVICES (MODERN PACKAGING SHOWCASE)              */}
        {/* 5 Packaging formats with exact branded images & interactive filters    */}
        {/* ======================================================================= */}
        <section
          id="products"
          className="content-section"
          style={{
            width: '100%',
            backgroundColor: themeStyles.bgApp,
            padding: '80px 36px',
            borderBottom: `1px solid ${themeStyles.borderColor}`,
            transition: 'background-color 0.25s ease'
          }}
        >
          <div style={{ width: '100%', maxWidth: '1360px', margin: '0 auto' }}>

            {/* Section Header */}
            <div style={{ textAlign: 'center', marginBottom: '36px' }}>
              <span style={{ color: 'var(--brand-blue)', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'inline-block', padding: '4px 12px', borderRadius: '50px', backgroundColor: isDark ? 'rgba(0, 200, 245, 0.12)' : 'rgba(0, 143, 224, 0.08)', marginBottom: '10px' }}>
                GENUINE DEF PACKAGING & SUPPLY FORMATS
              </span>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', color: themeStyles.textHeading, fontWeight: 900, letterSpacing: '-0.025em', marginBottom: '14px' }}>
                Products & Services
              </h2>
              <p style={{ color: themeStyles.textMuted, fontSize: '15px', maxWidth: '750px', margin: '0 auto' }}>
                Engineered for maximum dispensing convenience, zero contamination, and optimal cost efficiency across commercial transport operations.
              </p>
            </div>

            {/* Interactive Category Filter Pills */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '40px' }}>
              {[
                { id: 'ALL', label: 'All Packaging Formats' },
                { id: 'BUCKETS', label: '20L Smart Buckets' },
                { id: 'CANS', label: '5L & 10L Cans' },
                { id: 'BARRELS', label: '210L Industrial Barrels' },
                { id: 'IBC', label: '1000L IBC Tanks' },
                { id: 'BULK', label: 'Bulk Road Tankers' }
              ].map(tab => {
                const isActive = activeProductFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveProductFilter(tab.id)}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '50px',
                      fontSize: '13px',
                      fontWeight: isActive ? 800 : 600,
                      cursor: 'pointer',
                      border: isActive ? '1px solid var(--brand-blue)' : `1px solid ${themeStyles.borderColor}`,
                      backgroundColor: isActive ? 'var(--brand-blue)' : themeStyles.bgCard,
                      color: isActive ? '#FFFFFF' : themeStyles.textBody,
                      boxShadow: isActive ? '0 4px 14px rgba(0, 143, 224, 0.35)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Packaging Cards Grid with 3D Hover & Image Display */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '28px', marginBottom: '52px' }}>
              {filteredPackaging.map(pack => (
                <div
                  key={pack.id}
                  className="modern-card-hover"
                  style={{
                    backgroundColor: themeStyles.bgCard,
                    borderRadius: '22px',
                    border: pack.id === '20L' ? '2px solid var(--brand-blue)' : `1px solid ${themeStyles.borderColor}`,
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: isDark ? '0 12px 32px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.06)',
                    position: 'relative'
                  }}
                >
                  <div>
                    {/* Top Badge & Category */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                      <span
                        style={{
                          backgroundColor: pack.id === '20L' ? 'var(--brand-blue)' : (isDark ? 'rgba(0, 200, 245, 0.15)' : 'rgba(0, 143, 224, 0.08)'),
                          color: pack.id === '20L' ? '#FFFFFF' : (isDark ? 'var(--brand-cyan)' : 'var(--brand-blue)'),
                          padding: '5px 12px',
                          borderRadius: '50px',
                          fontSize: '11px',
                          fontWeight: 900
                        }}
                      >
                        {pack.badge}
                      </span>
                      <Package size={20} color={pack.id === '20L' ? 'var(--brand-blue)' : 'var(--brand-cyan)'} />
                    </div>

                    {/* Branded Product Image Frame */}
                    <div
                      style={{
                        width: '100%',
                        height: '210px',
                        backgroundColor: isDark ? '#051126' : '#F8FAFC',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '18px',
                        border: `1px solid ${themeStyles.borderColor}`,
                        boxSizing: 'border-box',
                        padding: '12px'
                      }}
                    >
                      <img
                        src={pack.image}
                        alt={pack.name}
                        className="img-zoom-hover"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          borderRadius: '8px'
                        }}
                      />
                    </div>

                    {/* Title & Capacity */}
                    <h3 style={{ fontSize: '20px', fontWeight: 900, color: themeStyles.textHeading, marginBottom: '6px' }}>
                      {pack.name}
                    </h3>
                    <div style={{ fontSize: '13px', color: 'var(--brand-blue)', fontWeight: 800, marginBottom: '14px' }}>
                      Capacity: {pack.capacity}
                    </div>

                    <div style={{ fontSize: '12px', color: themeStyles.textMuted, marginBottom: '16px', lineHeight: 1.5, minHeight: '36px' }}>
                      <strong>Recommended:</strong> {pack.bestFor}
                    </div>

                    {/* Features list */}
                    <div style={{ borderTop: `1px solid ${themeStyles.borderColor}`, paddingTop: '16px', marginBottom: '22px' }}>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '9px' }}>
                        {pack.features.map((feat, idx) => (
                          <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: themeStyles.textBody, lineHeight: 1.45 }}>
                            <Check size={15} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Quote Action Button */}
                  <button
                    onClick={() => handleSelectPackageForQuote(pack)}
                    style={{
                      width: '100%',
                      padding: '13px',
                      borderRadius: '50px',
                      backgroundColor: pack.id === '20L' ? 'var(--brand-blue)' : (isDark ? 'rgba(0, 200, 245, 0.15)' : '#F1F5F9'),
                      color: pack.id === '20L' ? '#FFFFFF' : (isDark ? 'var(--brand-cyan)' : 'var(--brand-navy-primary)'),
                      border: pack.id === '20L' ? 'none' : (isDark ? '1px solid rgba(0, 200, 245, 0.3)' : '1px solid #CBD5E1'),
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: pack.id === '20L' ? '0 6px 20px rgba(0, 143, 224, 0.4)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span>Get Quote for {pack.shortName}</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              ))}
            </div>

            {/* Dynamic Products From Database if Available */}
            {products.length > 0 && (
              <div style={{ marginTop: '40px', borderTop: `1px solid ${themeStyles.borderColor}`, paddingTop: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
                  <h3 style={{ fontSize: '22px', fontWeight: 900, color: themeStyles.textHeading }}>
                    Complete Industrial Product Range
                  </h3>
                  <span style={{ fontSize: '12px', color: themeStyles.textMuted, fontWeight: 700 }}>
                    {products.length} Products Available in Master DB
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '22px' }}>
                  {products.map(prod => (
                    <ProductCard
                      key={prod.id}
                      product={prod}
                      onInquireClick={(p, pk) => {
                        setFormData(prev => ({
                          ...prev,
                          packVariant: `${p.name} (${pk?.size || 'Standard'})`,
                          quantity: pk?.size?.includes('20L') ? '25 Buckets' : '500 Litres'
                        }));
                        scrollToSection('quotes');
                      }}
                      onQuickViewClick={(p) => setActiveQuickViewProduct(p)}
                      onViewCertification={() => setIsCertModalOpen(true)}
                    />
                  ))}
                </div>
              </div>
            )}

          </div>
        </section>

        {/* ======================================================================= */}
        {/* SECTION 4: QUOTES (NEXT-GEN GLASSMORPHIC RFQ FORM & DIRECT CONTACT)     */}
        {/* ======================================================================= */}
        <section
          id="quotes"
          className="content-section"
          style={{
            width: '100%',
            backgroundColor: themeStyles.bgSectionAlt,
            padding: '80px 36px',
            borderBottom: `1px solid ${themeStyles.borderColor}`,
            transition: 'background-color 0.25s ease'
          }}
        >
          <div style={{ width: '100%', maxWidth: '1160px', margin: '0 auto' }}>

            {/* Section Header */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <span style={{ color: 'var(--brand-blue)', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'inline-block', padding: '4px 12px', borderRadius: '50px', backgroundColor: isDark ? 'rgba(0, 200, 245, 0.12)' : 'rgba(0, 143, 224, 0.08)', marginBottom: '10px' }}>
                DIRECT FACTORY WHOLESALE PRICING
              </span>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', color: themeStyles.textHeading, fontWeight: 900, letterSpacing: '-0.025em', marginBottom: '12px' }}>
                Request Wholesale & Fleet Quotation
              </h2>
              <p style={{ color: themeStyles.textMuted, fontSize: '15px', maxWidth: '750px', margin: '0 auto' }}>
                Submit your required packaging variant and estimated volume to receive factory-direct wholesale pricing and dispatch schedules from Ayush Green Energy's Bhadrak plant.
              </p>
            </div>

            {/* Grid: Form on Left, Direct Contact on Right */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: '36px' }}>

              {/* Quotation Form Card with Dynamic Glow on selection */}
              <div
                className={`modern-card-hover ${quoteHighlighted ? 'quote-form-glow' : ''}`}
                style={{
                  backgroundColor: themeStyles.bgCard,
                  padding: '38px 32px',
                  borderRadius: '24px',
                  border: quoteHighlighted ? '2px solid var(--brand-cyan)' : `1px solid ${themeStyles.borderColor}`,
                  boxShadow: isDark ? '0 16px 40px rgba(0,0,0,0.45)' : '0 12px 36px rgba(0,0,0,0.06)'
                }}
              >
                {inquirySuccess ? (
                  <div
                    style={{
                      backgroundColor: 'var(--status-success-bg)',
                      border: '1px solid var(--status-success-border)',
                      borderRadius: '18px',
                      padding: '40px 24px',
                      textAlign: 'center',
                      color: 'var(--status-success-text)'
                    }}
                  >
                    <CheckCircle2 size={52} color="var(--status-success)" style={{ margin: '0 auto 16px auto' }} />
                    <h3 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '8px' }}>Quotation Inquiry Received!</h3>
                    <p style={{ fontSize: '14px', lineHeight: 1.65, maxWidth: '440px', margin: '0 auto' }}>
                      Thank you! Our Bhadrak dispatch desk has received your request for <strong>{formData.packVariant}</strong>. Our commercial manager will contact you within <strong>30 minutes</strong> with customized pricing.
                    </p>
                    <div style={{ marginTop: '26px', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => setInquirySuccess(false)}
                        style={{
                          backgroundColor: 'var(--brand-blue)',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '50px',
                          padding: '11px 22px',
                          fontSize: '13px',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        Submit Another Quote
                      </button>
                      <a
                        href={`https://wa.me/919853675971?text=Hello%20Ayush%20Green%20Energy,%20I%20just%20submitted%20a%20quote%20request%20for%20${encodeURIComponent(formData.packVariant)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          backgroundColor: '#25D366',
                          color: '#FFFFFF',
                          borderRadius: '50px',
                          padding: '11px 22px',
                          fontSize: '13px',
                          fontWeight: 800,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <MessageCircle size={16} />
                        <span>Chat on WhatsApp</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleInquirySubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <Input
                        label="Contact Person Name"
                        placeholder="e.g. Subrat Das"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                      />

                      <Input
                        label="Fleet / Company Name"
                        placeholder="e.g. Kalinga Transport Depot"
                        value={formData.company}
                        onChange={e => setFormData({ ...formData, company: e.target.value })}
                        required
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <Input
                        label="Mobile Number (Call / WhatsApp)"
                        type="tel"
                        placeholder="+91 98536 75971"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        required
                      />

                      <Input
                        label="Delivery Location (City / State)"
                        placeholder="e.g. Bhadrak / Cuttack / Kolkata"
                        value={formData.location}
                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                        required
                      />
                    </div>

                    {/* Packaging Variant Selector Chips */}
                    <div style={{ marginBottom: '18px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: themeStyles.textHeading, marginBottom: '9px' }}>
                        Required Packaging Variant *
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '9px' }}>
                        {[
                          '5L / 10L Cans',
                          '20L Bucket',
                          '210L Barrel',
                          '1000L IBC Tank',
                          'Bulk Tanker'
                        ].map(variant => {
                          const isSelected = formData.packVariant.includes(variant);
                          return (
                            <button
                              key={variant}
                              type="button"
                              onClick={() => setFormData({ ...formData, packVariant: variant })}
                              style={{
                                padding: '10px 12px',
                                borderRadius: '12px',
                                border: isSelected ? '2px solid var(--brand-blue)' : `1px solid ${themeStyles.borderColor}`,
                                backgroundColor: isSelected ? (isDark ? 'rgba(0, 143, 224, 0.28)' : 'rgba(0, 143, 224, 0.12)') : themeStyles.bgCardSecondary,
                                color: isSelected ? 'var(--brand-blue)' : themeStyles.textBody,
                                fontSize: '12px',
                                fontWeight: isSelected ? 900 : 600,
                                cursor: 'pointer',
                                textAlign: 'center',
                                transition: 'all 0.15s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px'
                              }}
                            >
                              {isSelected && <Check size={13} color="var(--brand-blue)" />}
                              <span>{variant}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ marginBottom: '18px' }}>
                      <Input
                        label="Estimated Volume / Quantity"
                        placeholder="e.g. 25 Buckets, 2 Barrels, 1 IBC, or 5000 Litres"
                        value={formData.quantity}
                        onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                        required
                      />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: themeStyles.textHeading, marginBottom: '6px' }}>
                        Additional Notes / Requirements
                      </label>
                      <textarea
                        rows="3"
                        placeholder="Fleet size, dispensing pump requirements, delivery schedule..."
                        value={formData.message}
                        onChange={e => setFormData({ ...formData, message: e.target.value })}
                        style={{
                          width: '100%',
                          backgroundColor: themeStyles.bgCardSecondary,
                          color: themeStyles.textBody,
                          border: `1px solid ${themeStyles.borderColor}`,
                          borderRadius: '12px',
                          padding: '11px 14px',
                          fontSize: '13px',
                          boxSizing: 'border-box',
                          fontFamily: 'inherit',
                          resize: 'vertical'
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      className="glow-btn-primary"
                      style={{
                        width: '100%',
                        padding: '15px',
                        borderRadius: '50px',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '15px',
                        fontWeight: 900,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 6px 22px rgba(0, 143, 224, 0.45)'
                      }}
                    >
                      <Send size={16} />
                      <span>Submit Factory Quote Request</span>
                    </button>
                  </form>
                )}
              </div>

              {/* Direct Plant Connect & Dispatch Desk Card */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

                {/* Fast Dispatch Box */}
                <div
                  className="modern-card-hover"
                  style={{
                    backgroundColor: themeStyles.bgCard,
                    padding: '30px',
                    borderRadius: '22px',
                    border: `1px solid ${themeStyles.borderColor}`,
                    boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.35)' : '0 6px 20px rgba(0,0,0,0.04)'
                  }}
                >
                  <span style={{ fontSize: '11px', color: 'var(--brand-blue)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    FAST FLEET DISPATCH
                  </span>
                  <h3 style={{ fontSize: '21px', fontWeight: 900, color: themeStyles.textHeading, marginTop: '4px', marginBottom: '16px' }}>
                    Need Immediate Delivery?
                  </h3>
                  <p style={{ fontSize: '13px', color: themeStyles.textMuted, lineHeight: 1.65, marginBottom: '22px' }}>
                    Call our commercial dispatch desk directly or message us on WhatsApp for emergency highway top-ups and bulk road tanker schedules.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <a
                      href="tel:+919853675971"
                      className="glow-btn-primary"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        color: '#FFFFFF',
                        padding: '13px 18px',
                        borderRadius: '14px',
                        textDecoration: 'none',
                        fontWeight: 800,
                        fontSize: '14px'
                      }}
                    >
                      <PhoneCall size={18} />
                      <span>Call Plant Desk: +91 9853675971</span>
                    </a>

                    <a
                      href="https://wa.me/919853675971?text=Hello%20Ayush%20Green%20Energy,%20I%20would%20like%20a%20quotation%20for%20UltraBlue%2B%20DEF"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        backgroundColor: '#25D366',
                        color: '#FFFFFF',
                        padding: '13px 18px',
                        borderRadius: '14px',
                        textDecoration: 'none',
                        fontWeight: 800,
                        fontSize: '14px',
                        boxShadow: '0 4px 16px rgba(37, 211, 102, 0.35)',
                        transition: 'transform 0.2s ease'
                      }}
                    >
                      <MessageCircle size={18} />
                      <span>WhatsApp Commercial Desk</span>
                    </a>
                  </div>
                </div>

                {/* Plant Address & Credentials */}
                <div
                  style={{
                    backgroundColor: themeStyles.bgCard,
                    padding: '26px',
                    borderRadius: '22px',
                    border: `1px solid ${themeStyles.borderColor}`
                  }}
                >
                  <strong style={{ fontSize: '15px', color: themeStyles.textHeading, display: 'block', marginBottom: '14px', fontWeight: 900 }}>
                    Ayush Green Energy Mother Plant
                  </strong>

                  <div style={{ fontSize: '13px', color: themeStyles.textMuted, lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <MapPin size={17} color="var(--brand-blue)" style={{ flexShrink: 0, marginTop: '3px' }} />
                      <span>{COMPANY_INFO.plantAddress}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Mail size={17} color="var(--brand-blue)" />
                      <span>{COMPANY_INFO.email}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Clock size={17} color="var(--brand-blue)" />
                      <span>Dispatch Desk: 24 Hours / 7 Days a Week</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </section>

      </main>

      {/* ======================================================================= */}
      {/* GLOBAL FOOTER                                                           */}
      {/* ======================================================================= */}
      <footer
        className="main-footer"
        style={{
          width: '100%',
          backgroundColor: isDark ? '#020712' : '#06142F',
          color: '#FFFFFF',
          padding: '52px 36px 26px 36px',
          borderTop: '3px solid var(--brand-blue)'
        }}
      >
        <div style={{ width: '100%', maxWidth: '1360px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '38px' }}>
          {/* Brand Info */}
          <div>
            <Logo size="small" variant="dark" />
            <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: '16px', lineHeight: 1.65 }}>
              Manufactured & Distributed by <strong>Ayush Green Energy</strong>. Leading Indian producer of ISO 22241-1 certified Diesel Exhaust Fluid and heavy fleet lubricants.
            </p>
          </div>

          {/* Quick Navigation Links */}
          <div>
            <strong style={{ fontSize: '14px', color: '#FFFFFF', display: 'block', marginBottom: '14px', fontWeight: 800 }}>
              Quick Navigation
            </strong>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <a
                href="#home"
                onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}
                style={{ color: '#94A3B8', textDecoration: 'none' }}
              >
                Home
              </a>
              <a
                href="#about"
                onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}
                style={{ color: '#94A3B8', textDecoration: 'none' }}
              >
                About Us
              </a>
              <a
                href="#products"
                onClick={(e) => { e.preventDefault(); scrollToSection('products'); }}
                style={{ color: '#94A3B8', textDecoration: 'none' }}
              >
                Products & Services
              </a>
              <a
                href="#quotes"
                onClick={(e) => { e.preventDefault(); scrollToSection('quotes'); }}
                style={{ color: '#94A3B8', textDecoration: 'none' }}
              >
                Quotes / RFQ
              </a>
              <a
                href="/login"
                onClick={(e) => { e.preventDefault(); onLoginClick(); }}
                style={{ color: 'var(--brand-cyan)', textDecoration: 'none', fontWeight: 800 }}
              >
                Enterprise Portal Login
              </a>
            </div>
          </div>

          {/* Plant & Office */}
          <div>
            <strong style={{ fontSize: '14px', color: '#FFFFFF', display: 'block', marginBottom: '14px', fontWeight: 800 }}>
              Plant & Corporate Office
            </strong>
            <div style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.7 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                <MapPin size={15} color="var(--brand-cyan)" style={{ flexShrink: 0, marginTop: '3px' }} />
                <span>{COMPANY_INFO.plantAddress}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <PhoneCall size={15} color="var(--brand-cyan)" />
                <span>Hotline: <strong style={{ color: '#FFFFFF' }}>{COMPANY_INFO.salesHotline}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={15} color="var(--brand-cyan)" />
                <span>{COMPANY_INFO.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Strip */}
        <div style={{ width: '100%', maxWidth: '1360px', margin: '36px auto 0 auto', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94A3B8', flexWrap: 'wrap', gap: '10px' }}>
          <span>© 2026 UltraBlue+ • Ayush Green Energy. All rights reserved.</span>
          <span>Designed and Developed By <a href="https://nltechsolutions.in" style={{ color: '#FFFFFF', textDecoration: 'none' }}><strong>N&L Tech Solutions</strong></a></span>
          <span>ISO 22241-1 / BIS / ISI Certified • Made in India</span>
        </div>
      </footer>

      {/* ======================================================================= */}
      {/* FLOATING ACTION BUTTONS (WHATSAPP & OFFERS)                              */}
      {/* ======================================================================= */}
      {!mobileMenuOpen && (
        <div
          className="floating-quick-actions"
          style={{
            position: 'fixed',
            bottom: '22px',
            right: '22px',
            zIndex: 999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '10px'
          }}
        >
          {promotions.length > 0 && (
            <button
              onClick={() => setIsOfferDrawerOpen(true)}
              style={{
                backgroundColor: '#F59E0B',
                color: '#06142F',
                borderRadius: '50px',
                height: '40px',
                padding: '0 18px',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 6px 20px rgba(245, 158, 11, 0.45)',
                fontSize: '12px',
                fontWeight: 900
              }}
            >
              <Bell size={16} />
              <span>Flash Offers ({promotions.length})</span>
            </button>
          )}

          <a
            href="https://wa.me/919853675971?text=Hello%20Ayush%20Green%20Energy,%20I%20would%20like%20a%20quotation%20for%20UltraBlue%2B%20DEF"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              backgroundColor: '#25D366',
              color: '#FFFFFF',
              borderRadius: '50px',
              height: '42px',
              padding: '0 18px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 6px 22px rgba(37, 211, 102, 0.4)',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 800,
              transition: 'transform 0.2s ease'
            }}
          >
            <MessageCircle size={18} />
            <span>WhatsApp Dispatch</span>
          </a>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL 1: PRODUCT DETAIL MODAL                                           */}
      {/* ======================================================================= */}
      <ProductDetailModal
        isOpen={Boolean(activeQuickViewProduct)}
        onClose={() => setActiveQuickViewProduct(null)}
        product={activeQuickViewProduct}
        onApplyRfq={(prod, pack) => {
          setFormData(prev => ({
            ...prev,
            packVariant: `${prod.name} (${pack?.size || 'Standard'})`,
            quantity: pack?.size?.includes('20L') ? '25 Buckets' : '500 Litres'
          }));
          scrollToSection('quotes');
        }}
        onViewCertification={() => {
          setActiveQuickViewProduct(null);
          setIsCertModalOpen(true);
        }}
      />

      {/* ======================================================================= */}
      {/* MODAL 2: ISI MARK / BIS / ISO 22241 CERTIFICATION MODAL                 */}
      {/* ======================================================================= */}
      <CertificationModal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
      />

      {/* ======================================================================= */}
      {/* MODAL 3: ACTIVE OFFERS & PROMOTIONS DRAWER                             */}
      {/* ======================================================================= */}
      <OfferNotificationCenter
        isOpen={isOfferDrawerOpen}
        onClose={() => setIsOfferDrawerOpen(false)}
        promotions={promotions}
        onApplyPromo={(promo) => {
          setFormData(prev => ({
            ...prev,
            packVariant: promo.targetProduct || prev.packVariant,
            message: `Applied Promo Code: ${promo.promoCode} (${promo.discountPercent} Offer: ${promo.title})`
          }));
          scrollToSection('quotes');
        }}
      />

      {/* Responsive Stylesheet */}
      <style>{`
        @media (max-width: 900px) {
          .desktop-nav {
            display: none !important;
          }
          .desktop-actions {
            display: none !important;
          }
          .mobile-controls {
            display: flex !important;
          }
          .main-header {
            margin-top: 6px !important;
            width: calc(100% - 20px) !important;
            padding: 6px 14px !important;
          }
          .main-header .ub-logo-container {
            transform: scale(0.68) !important;
            transform-origin: left center !important;
          }
          .hero-section {
            padding: 110px 18px 48px 18px !important;
          }
          .hero-cta-group {
            flex-direction: column !important;
            width: 100% !important;
          }
          .hero-cta-group button,
          .hero-cta-group a {
            width: 100% !important;
            justify-content: center !important;
          }
          .content-section {
            padding: 48px 18px !important;
          }
          .main-footer {
            padding: 36px 18px 20px 18px !important;
          }
        }
      `}</style>

    </div>
  );
};
