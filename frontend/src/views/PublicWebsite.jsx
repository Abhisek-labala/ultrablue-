import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  PhoneCall,
  Mail,
  MapPin,
  Download,
  Send,
  Sparkles,
  Truck,
  Award,
  ChevronRight,
  Filter,
  Check,
  Building,
  Calculator,
  ChevronDown,
  ChevronUp,
  FileText,
  Search,
  Package,
  Layers,
  HelpCircle,
  MessageCircle,
  Menu,
  X,
  ExternalLink,
  Shield,
  Gauge,
  Droplets,
  Clock,
  ArrowRight,
  UserCheck,
  Factory,
  Sun,
  Moon,
  Smartphone,
  Lock,
  Bell,
  Tag,
  Eye,
  Percent
} from 'lucide-react';
import { Logo } from '../components/ui/Logo';
import { Button } from '../components/ui/Button';
import { ProductCard } from '../components/ui/ProductCard';
import { Input, Select } from '../components/ui/Input';
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

  const [activeNav, setActiveNav] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedPackFilter, setSelectedPackFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(0);
  const [selectedPackagingTab, setSelectedPackagingTab] = useState('20L');

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

  // Fetch dynamic products & promotions from DB on mount
  useEffect(() => {
    const fetchDynamicData = async () => {
      try {
        setLoadingData(true);
        const [dbProducts, dbPromos, dbCerts] = await Promise.all([
          ProductAPI.getAll().catch(() => []),
          PromotionAPI.getAll().catch(() => []),
          ComplianceAPI.getBatchCertificates().catch(() => [])
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
        if (dbCerts && Array.isArray(dbCerts) && dbCerts.length > 0) {
          setBatchCertificates(dbCerts);
          const latest = dbCerts[0];
          setBatchQuery(latest.batch_no || '');
          setBatchResult({
            certNo: latest.cert_no,
            batchNo: latest.batch_no,
            mfgDate: latest.date || 'Active Production',
            expDate: 'Standard 18 Months',
            ureaPercent: latest.purity || '32.5%',
            density: latest.density || '1.089 g/cm³',
            refractiveIndex: '1.3824',
            traceMetals: '< 0.05 ppm',
            status: latest.status ? `${latest.status} (ISO 22241-1)` : 'PASSED (ISO 22241-1)',
            testedBy: latest.chemist ? `${latest.chemist} (${latest.location || 'Central QA Lab'})` : (latest.location || 'Quality Assurance Lab'),
            waterConductivity: '< 0.1 µS/cm'
          });
        }
      } catch (err) {
        console.error('Error fetching live data:', err);
        setProducts([]);
        setPromotions([]);
      } finally {
        setLoadingData(false);
      }
    };

    fetchDynamicData();
  }, []);

  // Scroll spy to update active navigation item
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'products', 'calculator', 'packaging', 'specs', 'infrastructure', 'batch-verifier', 'rfq'];
      const scrollPos = window.scrollY + 160;

      for (let i = sections.length - 1; i >= 0; i--) {
        const sec = document.getElementById(sections[i]);
        if (sec && sec.offsetTop <= scrollPos) {
          setActiveNav(sections[i]);
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

  // Interactive scrollToSection with sticky header compensation
  const scrollToSection = (sectionId) => {
    setActiveNav(sectionId);
    if (sectionId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(sectionId);
    if (el) {
      const headerOffset = hasAnnouncement ? 125 : 85;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Dynamic Batch Verifier State
  const [batchQuery, setBatchQuery] = useState('');
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchNotFound, setBatchNotFound] = useState(false);
  const [batchResult, setBatchResult] = useState(null);
  const [batchCertificates, setBatchCertificates] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    location: '',
    product: 'UltraBlue+ Diesel Exhaust Fluid (DEF)',
    quantity: '500 Litres',
    message: ''
  });

  // Interactive Fleet DEF Calculator
  const [truckCount, setTruckCount] = useState(15);
  const [monthlyKmPerTruck, setMonthlyKmPerTruck] = useState(6500);

  // DEF consumption calculation: ~4.5% of diesel consumption (approx. 1.5 Litres DEF per 100 km)
  const totalMonthlyKm = truckCount * monthlyKmPerTruck;
  const estimatedDefLitres = Math.round((totalMonthlyKm / 100) * 1.5);
  const recommendedBuckets = Math.ceil(estimatedDefLitres / 20);
  const recommendedIBC = (estimatedDefLitres / 1000).toFixed(1);
  const estimatedAnnualSavings = Math.round(truckCount * 28500); // Saved SCR downtime & pump wear

  // Dynamically compute unique categories from database products
  const dynamicCategories = ['ALL', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];
  const packagingSizes = [
    { id: 'ALL', label: 'All Packaging' },
    { id: '5L', label: '5L Cans' },
    { id: '20L', label: '20L Buckets' },
    { id: '26L', label: '26L Fleet' },
    { id: '210L', label: '210L Drums' },
    { id: '1000L', label: '1000L IBC' },
    { id: 'BULK', label: 'Bulk Tanker' }
  ];

  // Dynamic Product Filter
  const filteredProducts = products.filter(p => {
    if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
    if (selectedPackFilter !== 'ALL') {
      const hasPack = (p.packOptions || []).some(pk => (pk.size || '').toLowerCase().includes(selectedPackFilter.toLowerCase()));
      if (!hasPack) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = (p.name || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.oemApprovals || '').toLowerCase().includes(q) ||
        (p.viscosityGrade || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const packagingFormats = [
    {
      id: '20L',
      name: '20L Smart Bucket',
      tagline: 'Spill-Proof Pouring Spout',
      capacity: '20 Litres',
      bestFor: 'Long-haul trucks, Single fleets, Retail',
      features: ['Tamper-evident induction seal', 'Flexible pouring spout included', 'UV stabilized HDPE bucket', 'Easy-stack ergonomic design'],
      badge: 'Most Popular'
    },
    {
      id: '26L',
      name: '26L Fleet Pack',
      tagline: 'Heavy Duty Multi-Axle Refill',
      capacity: '26 Litres',
      bestFor: 'Tipper fleets, Mining haulers, Buses',
      features: ['Extra capacity for 2,000+ km range', 'Drop-tested reinforced handle', 'Built-in rapid vent breather', 'Barcode batch traceable'],
      badge: 'Fleet Choice'
    },
    {
      id: '210L',
      name: '210L Industrial Drum',
      tagline: 'High Volume Depot Barrel',
      capacity: '210 Litres',
      bestFor: 'Transport depots, Service stations',
      features: ['Standard 2" BSP threaded bung', 'Compatible with rotary pumps', 'Heavy virgin polymer body', '18-month shelf stability'],
      badge: 'Depot Grade'
    },
    {
      id: '1000L',
      name: '1000L IBC Tote',
      tagline: 'Dedicated Yard Dispensing Station',
      capacity: '1,000 Litres',
      bestFor: 'Large fleet terminals, Mining sites',
      features: ['2" bottom camlock valve', 'Galvanized steel cage pallet', 'Flow meter pump compatible', 'Refill & exchange service'],
      badge: 'Lowest Cost/Litre'
    },
    {
      id: 'TANKER',
      name: 'Bulk SS-316 Tanker',
      tagline: 'Direct Underground Storage Supply',
      capacity: '10,000 to 25,000 Litres',
      bestFor: 'State Depots, Fuel Stations, OEMs',
      features: ['SS-316 insulated tankers', 'Digital calibrated flow meter', 'Batch test certificate with delivery', 'Factory-direct pricing'],
      badge: 'Bulk Direct'
    }
  ];

  const faqs = [
    {
      q: 'Why is ISO 22241-1 certified DEF essential for BS-VI & Euro-VI commercial vehicles?',
      a: 'BS-VI commercial vehicles use Selective Catalytic Reduction (SCR) systems where DEF is injected into the hot exhaust stream. Substandard DEF made with tap water contains calcium, magnesium, and heavy metals (>0.2 ppm) that instantly crystallize and poison expensive SCR catalyst units (costing ₹1.5L - ₹3.5L per truck). UltraBlue+ is manufactured with closed-loop double-pass EDI water guaranteeing <0.05 ppm metals.'
    },
    {
      q: 'What is the recommended DEF consumption rate in commercial vehicles?',
      a: 'On average, BS-VI heavy commercial vehicles (Tata, Ashok Leyland, BharatBenz, Eicher, Volvo) consume DEF at a rate of 4% to 5% of their diesel consumption. This translates to roughly 1.5 to 1.8 Litres of UltraBlue+ DEF per 100 kilometers under normal highway payload.'
    },
    {
      q: 'What is the shelf life of UltraBlue+ DEF and how should it be stored in Indian conditions?',
      a: 'UltraBlue+ has a certified shelf life of 18 months when stored out of direct sunlight between -11°C and +30°C. Our containers are manufactured from UV-stabilized virgin polymer with airtight induction sealing to prevent evaporation or ammonia crystallization.'
    },
    {
      q: 'Do you offer bulk tanker supply directly to mining terminals or transport depots?',
      a: 'Yes. Ayush Green Energy operates a dedicated fleet of stainless steel (SS-316) road tankers (10 KL to 25 KL capacity) equipped with calibrated digital flow meters for direct delivery across Odisha, West Bengal, Jharkhand, and neighboring states within 24 hours.'
    },
    {
      q: 'How can fleet managers verify the quality and purity of a purchased batch?',
      a: 'Every UltraBlue+ bucket, drum, and IBC tote features a unique serialized batch barcode. Fleet managers can use the instant Batch Verifier tool on this website to view the laboratory Certificate of Analysis (CoA) including urea concentration, refractive index, density, and trace metals.'
    }
  ];

  const testimonials = [
    {
      quote: "Switching our 45-truck fleet to UltraBlue+ IBC totes reduced our SCR dosing fault codes to zero. Their Bhadrak plant delivers refill tankers reliably within 24 hours.",
      author: "Rajesh Mohapatra",
      title: "Fleet Operations Director",
      company: "Kalinga Logistics & Mining Transport",
      location: "Jajpur Road, Odisha",
      metrics: "45 Trucks • Zero SCR Failures"
    },
    {
      quote: "UltraBlue+ DEF has the highest purity we have tested. The built-in pouring spout on their 20L buckets prevents driver spillage and container contamination.",
      author: "Subhasis Nayak",
      title: "Chief Workshop Manager",
      company: "Eastern Commercial Motors (Authorized Service)",
      location: "Cuttack / Bhubaneswar",
      metrics: "500+ Monthly Bucket Refills"
    },
    {
      quote: "We use UltraBlue+ HydroMax H-68 and DEF for our heavy earthmovers in mining areas. Outstanding performance under severe dust and extreme operating temperatures.",
      author: "Anand Verma",
      title: "Plant Equipment Superintendent",
      company: "Pragati Earthmovers & Mining Infra",
      location: "Keonjhar Mining Belt",
      metrics: "20,000L Bulk Tanker Deliveries"
    }
  ];

  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    try {
      await InquiryAPI.create({
        name: formData.name,
        company: formData.company,
        phone: formData.phone,
        email: formData.email,
        location: formData.location,
        packagingNeeded: formData.product,
        quantity: formData.quantity,
        message: formData.message
      });
      setInquirySuccess(true);
      setFormData({
        name: '',
        company: '',
        phone: '',
        email: '',
        location: '',
        product: 'UltraBlue+ Diesel Exhaust Fluid (DEF)',
        quantity: '500 Litres',
        message: ''
      });
    } catch (err) {
      alert(err.message || 'Error submitting inquiry.');
    }
  };

  const handleVerifyBatch = async (e) => {
    if (e) e.preventDefault();
    const query = batchQuery.trim().toUpperCase();
    if (!query) {
      setBatchResult(null);
      setBatchNotFound(false);
      return;
    }
    setBatchLoading(true);
    setBatchNotFound(false);
    try {
      let certs = batchCertificates;
      if (!certs || certs.length === 0) {
        certs = await ComplianceAPI.getBatchCertificates();
        setBatchCertificates(certs || []);
      }
      const match = (certs || []).find(c =>
        (c.batch_no && c.batch_no.toUpperCase().includes(query)) ||
        (c.cert_no && c.cert_no.toUpperCase().includes(query))
      );
      if (match) {
        setBatchResult({
          certNo: match.cert_no,
          batchNo: match.batch_no,
          mfgDate: match.date || 'Active Production',
          expDate: 'Standard 18 Months',
          ureaPercent: match.purity || '32.5%',
          density: match.density || '1.089 g/cm³',
          refractiveIndex: '1.3824',
          traceMetals: '< 0.05 ppm',
          status: match.status ? `${match.status} (ISO 22241-1)` : 'PASSED (ISO 22241-1)',
          testedBy: match.chemist ? `${match.chemist} (${match.location || 'Central QA Lab'})` : (match.location || 'Quality Assurance Lab'),
          waterConductivity: '< 0.1 µS/cm'
        });
        setBatchNotFound(false);
      } else {
        setBatchResult(null);
        setBatchNotFound(true);
      }
    } catch (err) {
      console.error('Error verifying batch:', err);
      setBatchResult(null);
      setBatchNotFound(true);
    } finally {
      setBatchLoading(false);
    }
  };

  // Dynamic surface colors based on active theme
  const themeStyles = {
    bgApp: isDark ? '#030A18' : '#F8FAFC',
    bgSectionAlt: isDark ? '#061226' : '#F1F5F9',
    bgCard: isDark ? '#071530' : '#FFFFFF',
    bgCardSecondary: isDark ? '#0D2048' : '#F8FAFC',
    textHeading: isDark ? '#F8FAFC' : '#06142F',
    textBody: isDark ? '#CBD5E1' : '#334155',
    textMuted: isDark ? '#94A3B8' : '#64748B',
    borderColor: isDark ? '#1F3E7A' : '#E2E8F0',
    borderLight: isDark ? '#152C58' : '#F1F5F9',
    tableHeaderBg: isDark ? '#0D2048' : '#F8FAFC'
  };

  return (
    <div
      className={isDark ? 'theme-dark' : 'theme-light'}
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        width: '100%',
        backgroundColor: themeStyles.bgApp,
        color: themeStyles.textBody,
        fontFamily: 'var(--font-family-body)',
        transition: 'background-color 0.25s ease, color 0.25s ease',
        overflowX: 'hidden',
        position: 'relative'
      }}
    >
      {/* Top Floating / Fixed Header Navigation Stack */}
      <div
        className="top-header-stack"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          width: '100%',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pointerEvents: 'none'
        }}
      >
        {/* Top Live Promotional Offers Ticker */}
        {hasAnnouncement && (
          <div
            className="top-announcement-bar"
            style={{
              width: '100%',
              backgroundColor: '#F59E0B',
              backgroundImage: 'linear-gradient(90deg, #D97706 0%, #F59E0B 50%, #B45309 100%)',
              color: '#06142F',
              padding: '6px 16px',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)',
              pointerEvents: 'auto',
              boxSizing: 'border-box',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap', overflow: 'hidden', margin: '0 auto', maxWidth: '100%' }}>
              <span style={{ backgroundColor: '#06142F', color: '#F59E0B', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 800, whiteSpace: 'nowrap', flexShrink: 0 }}>
                ⚡ LIVE OFFER
              </span>
              <span className="announcement-text-full" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {promotions[0]?.title} {promotions[0]?.promoCode ? `• Code: ` : ''}{promotions[0]?.promoCode && <strong>{promotions[0]?.promoCode}</strong>}
              </span>
              <span className="announcement-text-short" style={{ display: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {promotions[0]?.promoCode ? `Use Code: ${promotions[0]?.promoCode}` : (promotions[0]?.title || 'Live Promotional Offer')}
              </span>
              <button
                onClick={() => setIsOfferDrawerOpen(true)}
                className="announcement-view-btn"
                style={{
                  backgroundColor: '#06142F',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '50px',
                  padding: '2px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                View Deals ({promotions.length})
              </button>
            </div>

            <button
              onClick={() => setIsAnnouncementDismissed(true)}
              style={{ background: 'none', border: 'none', color: '#06142F', cursor: 'pointer', fontSize: '18px', fontWeight: 800, padding: '0 4px', lineHeight: 1, flexShrink: 0, marginLeft: '6px' }}
              title="Dismiss announcement"
            >
              ×
            </button>
          </div>
        )}

        {/* Floating Fixed Pill Main Header (Permanently pinned on scroll - Cordelia style) */}
        <header
          className="main-header"
          style={{
            marginTop: hasAnnouncement ? '10px' : '16px',
            width: 'calc(100% - 40px)',
            maxWidth: '1360px',
            backgroundColor: isDark ? 'rgba(7, 21, 48, 0.92)' : 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: '50px',
            border: isDark ? '1px solid rgba(0, 200, 245, 0.25)' : '1px solid rgba(226, 232, 240, 0.9)',
            padding: '8px 24px',
            boxShadow: isDark ? '0 12px 36px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 200, 245, 0.1)' : '0 10px 30px rgba(0, 0, 0, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transition: 'margin-top 0.25s ease, all 0.25s ease',
            boxSizing: 'border-box',
            pointerEvents: 'auto'
          }}
        >
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            style={{ textDecoration: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
            title="UltraBlue+ Home"
          >
            <Logo size="small" variant={isDark ? "dark" : "light"} />
          </a>

          {/* Desktop Navigation Links */}
          <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {[
              { id: 'home', label: 'Home' },
              { id: 'products', label: 'Products' },
              { id: 'calculator', label: 'Fleet Calculator' },
              { id: 'packaging', label: 'Packaging' },
              { id: 'specs', label: 'Lab Specs' },
              { id: 'infrastructure', label: 'Plant' },
              { id: 'batch-verifier', label: 'Verify CoA' }
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
                  style={{
                    color: isActive
                      ? (isDark ? 'var(--brand-cyan)' : 'var(--brand-blue)')
                      : (isDark ? '#E2E8F0' : '#1E293B'),
                    fontSize: '13px',
                    fontWeight: isActive ? 700 : 500,
                    textDecoration: 'none',
                    transition: 'color 0.2s ease',
                    position: 'relative'
                  }}
                >
                  {item.label}
                  {isActive && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '-6px',
                        left: '0',
                        right: '0',
                        height: '2px',
                        backgroundColor: isDark ? 'var(--brand-cyan)' : 'var(--brand-blue)',
                        borderRadius: '2px'
                      }}
                    />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Desktop Right Side CTA, Login & Theme Toggle */}
          <div className="desktop-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Push Notification Offers Bell */}

            {/* Portal Login Button */}
            <button
              onClick={onLoginClick}
              title="Portal Login (Distributor / Sales Operator / Admin)"
              style={{
                backgroundColor: isDark ? 'rgba(0, 200, 245, 0.12)' : '#F8FAFC',
                border: isDark ? '1px solid rgba(0, 200, 245, 0.35)' : '1px solid #CBD5E1',
                borderRadius: '50px',
                padding: '7px 16px',
                color: isDark ? 'var(--brand-cyan)' : 'var(--brand-navy-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 700,
                transition: 'all 0.2s ease',
                boxShadow: isDark ? '0 0 14px rgba(0, 200, 245, 0.15)' : 'none'
              }}
            >
              <Lock size={13} />
              <span>Login</span>
            </button>

            {/* Dark/Light Mode Switcher Button */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
              style={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(6, 20, 47, 0.05)',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #CBD5E1',
                borderRadius: '50px',
                padding: '7px 14px',
                color: isDark ? '#FFFFFF' : 'var(--brand-navy-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
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

            {/* Cordelia-style Pill Request Quote Button */}
            <a
              href="#rfq"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '7px 20px',
                borderRadius: '50px',
                border: '2px solid var(--brand-blue)',
                backgroundColor: 'transparent',
                color: isDark ? 'var(--brand-cyan)' : 'var(--brand-blue)',
                fontSize: '13px',
                fontWeight: 700,
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                boxShadow: isDark ? '0 0 16px rgba(0, 200, 245, 0.15)' : 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--brand-blue)';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = isDark ? 'var(--brand-cyan)' : 'var(--brand-blue)';
              }}
            >
              Request Quote
            </a>
          </div>

          {/* Mobile Right Controls (Offers Bell, Theme Toggle & Menu Button) */}
          <div
            className="mobile-controls"
            style={{
              display: 'none',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0
            }}
          >
            {/* Mobile Offers Bell */}
            <button
              onClick={() => setIsOfferDrawerOpen(true)}
              title="View Deals"
              aria-label="View Active Offers"
              style={{
                background: 'rgba(245, 180, 0, 0.14)',
                border: '1px solid rgba(245, 180, 0, 0.45)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                minWidth: '32px',
                minHeight: '32px',
                padding: 0,
                margin: 0,
                color: 'var(--brand-gold)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                flexShrink: 0,
                boxSizing: 'border-box'
              }}
            >
              <Bell size={15} />
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  fontSize: '9px',
                  fontWeight: 800,
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.4)'
                }}
              >
                {promotions.length}
              </span>
            </button>

            {/* Mobile Theme Toggle */}
            <button
              onClick={toggleTheme}
              title="Toggle Theme"
              aria-label="Toggle Theme"
              style={{
                background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(6, 20, 47, 0.06)',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #CBD5E1',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                minWidth: '32px',
                minHeight: '32px',
                padding: 0,
                margin: 0,
                color: isDark ? 'var(--brand-cyan)' : '#06142F',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxSizing: 'border-box'
              }}
            >
              {isDark ? <Sun size={15} color="var(--brand-gold)" /> : <Moon size={15} color="var(--brand-blue)" />}
            </button>

            {/* Mobile Hamburger Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open Navigation Menu"
              style={{
                background: 'var(--brand-blue)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                minWidth: '32px',
                minHeight: '32px',
                padding: 0,
                margin: 0,
                color: '#FFFFFF',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0, 143, 224, 0.4)',
                flexShrink: 0,
                boxSizing: 'border-box'
              }}
            >
              <Menu size={16} />
            </button>
          </div>
        </header>
      </div>

      {/* Full-Screen Immersive Mobile Navigation Overlay (Cordelia-style) */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            height: '100dvh',
            backgroundColor: isDark ? '#020712' : '#040C1D',
            zIndex: 999999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '16px 20px',
            animation: 'fadeIn 0.2s ease-out',
            overflow: 'hidden',
            overscrollBehavior: 'contain',
            boxSizing: 'border-box'
          }}
        >
          {/* Top Pill Header Bar with Logo and Close 'X' Button */}
          <div
            style={{
              backgroundColor: isDark ? 'rgba(13, 32, 72, 0.98)' : '#FFFFFF',
              borderRadius: '16px',
              padding: '10px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
              border: isDark ? '1px solid #1F3E7A' : '1px solid #E2E8F0',
              width: '100%',
              flexShrink: 0,
              boxSizing: 'border-box'
            }}
          >
            <Logo size="small" variant={isDark ? "dark" : "light"} />

            <button
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close Menu"
              style={{
                background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(6, 20, 47, 0.06)',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #CBD5E1',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                color: isDark ? '#FFFFFF' : '#06142F',
                cursor: 'pointer',
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box'
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Middle: Large Bold Typography Navigation Links (Scaled to fit without scrolling) */}
          <nav
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 'clamp(8px, 1.8vh, 16px)',
              flex: 1,
              padding: '12px 6px',
              overflowY: 'auto'
            }}
          >
            {[
              { id: 'home', label: 'Home' },
              { id: 'products', label: 'Products' },
              { id: 'calculator', label: 'Fleet Calculator' },
              { id: 'packaging', label: 'Packaging' },
              { id: 'specs', label: 'Lab Specs' },
              { id: 'infrastructure', label: 'Plant Infrastructure' },
              { id: 'batch-verifier', label: 'Verify Batch CoA' }
            ].map((item) => {
              const isActive = activeNav === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    setTimeout(() => scrollToSection(item.id), 50);
                  }}
                  style={{
                    fontSize: 'clamp(22px, 3.6vh, 32px)',
                    fontWeight: isActive ? 800 : 600,
                    color: isActive
                      ? 'var(--brand-cyan)'
                      : (item.id === 'batch-verifier' ? 'var(--brand-cyan)' : 'rgba(255, 255, 255, 0.85)'),
                    textDecoration: 'none',
                    letterSpacing: '-0.02em',
                    fontFamily: 'var(--font-family-heading)',
                    transition: 'color 0.15s',
                    lineHeight: 1.15,
                    display: 'block'
                  }}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Bottom Controls: Partner Logins + Full Width Action Button */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', flexShrink: 0, boxSizing: 'border-box' }}>
            {/* Partner Quick Switch Pills */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                padding: '8px 12px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '11px',
                color: '#94A3B8'
              }}
            >
              <button
                onClick={() => { setMobileMenuOpen(false); onDistributorLoginClick(); }}
                style={{ background: 'none', border: 'none', color: 'var(--brand-cyan)', cursor: 'pointer', fontWeight: 600, fontSize: '11px' }}
              >
                Distributor Portal
              </button>
              <span>•</span>
              <button
                onClick={() => { setMobileMenuOpen(false); onOperatorLoginClick(); }}
                style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', fontWeight: 500, fontSize: '11px' }}
              >
                Sales POS
              </button>
              <span>•</span>
              <a
                href="tel:+919853675971"
                style={{ color: 'var(--brand-gold)', textDecoration: 'none', fontWeight: 600, fontSize: '11px' }}
              >
                Hotline: +91 9853675971
              </a>
            </div>

            {/* Portal Login Button */}
            <button
              onClick={() => { setMobileMenuOpen(false); onLoginClick(); }}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '50px',
                border: '1px solid rgba(0, 200, 245, 0.4)',
                backgroundColor: 'rgba(0, 200, 245, 0.12)',
                color: 'var(--brand-cyan)',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxSizing: 'border-box'
              }}
            >
              <Lock size={15} />
              <span>Portal Login</span>
            </button>

            {/* Full Width Big CTA Button */}
            <a
              href="#rfq"
              onClick={(e) => {
                e.preventDefault();
                setMobileMenuOpen(false);
                setTimeout(() => scrollToSection('rfq'), 50);
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'center',
                backgroundColor: 'var(--brand-blue)',
                color: '#FFFFFF',
                padding: '13px 20px',
                borderRadius: '50px',
                fontSize: '15px',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 8px 24px rgba(0, 143, 224, 0.4)',
                letterSpacing: '0.01em',
                boxSizing: 'border-box'
              }}
            >
              Request Factory RFQ
            </a>
          </div>
        </div>
      )}

      {/* Main Content Body */}
      <main style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>

        {/* SECTION 1: HERO SECTION */}
        <section
          id="home"
          className="hero-section"
          style={{
            width: '100%',
            background: isDark
              ? 'radial-gradient(ellipse at top right, #0B2559 0%, #06142F 50%, #020A1C 100%)'
              : 'linear-gradient(135deg, #06142F 0%, #0A2B5E 55%, #008FE0 100%)',
            color: '#FFFFFF',
            padding: hasAnnouncement ? '146px 36px 64px 36px' : '112px 36px 64px 36px',
            position: 'relative',
            overflow: 'hidden',
            borderBottom: isDark ? '1px solid rgba(0, 200, 245, 0.2)' : 'none',
            transition: 'padding 0.25s ease'
          }}
        >
          <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,200,245,0.15) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />

          <div style={{ width: '100%', maxWidth: '1360px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px', alignItems: 'center', position: 'relative', zIndex: 2 }}>

            {/* Left Hero Column */}
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                  backgroundColor: 'rgba(0, 200, 245, 0.15)',
                  border: '1px solid rgba(0, 200, 245, 0.4)',
                  color: 'var(--brand-cyan)',
                  padding: '6px 12px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: 700,
                  marginBottom: '16px',
                  maxWidth: '100%'
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block', boxShadow: '0 0 8px #10B981' }} />
                <span>ISO 22241-1 Certified • BS-VI Fleet Grade</span>
                <button
                  onClick={() => setIsCertModalOpen(true)}
                  style={{
                    backgroundColor: 'rgba(0, 200, 245, 0.2)',
                    border: '1px solid var(--brand-cyan)',
                    color: '#FFFFFF',
                    borderRadius: '50px',
                    padding: '2px 8px',
                    fontSize: '10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginLeft: '4px'
                  }}
                >
                  Verify BIS License
                </button>
              </div>

              <h1
                className="hero-title"
                style={{
                  fontSize: 'clamp(28px, 4vw, 46px)',
                  lineHeight: 1.18,
                  fontWeight: 800,
                  color: '#FFFFFF',
                  marginBottom: '18px',
                  fontFamily: 'var(--font-family-heading)',
                  letterSpacing: '-0.02em'
                }}
              >
                High-Purity Genuine DEF & Industrial Lubricants for Fleets
              </h1>

              <p style={{ fontSize: '15px', color: '#E2E8F0', marginBottom: '28px', lineHeight: 1.6, maxWidth: '640px' }}>
                Manufactured by <strong>Ayush Green Energy</strong> with closed-loop de-ionized water blending. UltraBlue+ guarantees <strong>&lt;0.2 ppm trace metals</strong> to safeguard SCR injectors, eliminate nozzle crystallization, and prevent catalyst poisoning across commercial transport fleets.
              </p>

              <div className="hero-cta-group" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '32px' }}>
                <a href="#rfq" className="hero-btn-link">
                  <Button size="md" variant="primary" icon={Send} style={{ width: '100%' }}>
                    Request Factory RFQ
                  </Button>
                </a>
                <a href="#calculator" className="hero-btn-link">
                  <Button size="md" variant="gold" icon={Calculator} style={{ width: '100%' }}>
                    Fleet DEF Calculator
                  </Button>
                </a>
                <a href="tel:+919853675971" className="hero-btn-link">
                  <Button size="md" variant="secondary" icon={PhoneCall} style={{ width: '100%' }}>
                    Call Plant Dispatch
                  </Button>
                </a>
              </div>

              {/* Trust Metric Badges */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: '10px',
                  paddingTop: '20px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.15)'
                }}
              >
                <div
                  onClick={() => setIsCertModalOpen(true)}
                  style={{ background: 'rgba(255,255,255,0.08)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer' }}
                  title="Click to view BIS & ISI Mark Certificate"
                >
                  <div style={{ color: 'var(--brand-cyan)', fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-family-heading)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>IS 17042</span>
                    <ShieldCheck size={14} />
                  </div>
                  <div style={{ color: '#E2E8F0', fontSize: '11px', fontWeight: 500 }}>ISI Mark / BIS</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.08)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)' }}>
                  <div style={{ color: '#34D399', fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-family-heading)' }}>&lt; 0.05 ppm</div>
                  <div style={{ color: '#E2E8F0', fontSize: '11px', fontWeight: 500 }}>Heavy Metals</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.08)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)' }}>
                  <div style={{ color: 'var(--brand-gold)', fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-family-heading)' }}>10,000 L/h</div>
                  <div style={{ color: '#E2E8F0', fontSize: '11px', fontWeight: 500 }}>RO/EDI Capacity</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.08)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)' }}>
                  <div style={{ color: '#FFFFFF', fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-family-heading)' }}>24-Hour</div>
                  <div style={{ color: '#E2E8F0', fontSize: '11px', fontWeight: 500 }}>Tanker Delivery</div>
                </div>
              </div>
            </div>

            {/* Right Hero Column: Plant Quality & Live Telemetry Hub Card */}
            <div
              style={{
                backgroundColor: isDark ? 'rgba(7, 21, 48, 0.92)' : 'rgba(6, 20, 47, 0.95)',
                backdropFilter: 'blur(16px)',
                borderRadius: '20px',
                border: '1px solid rgba(0, 200, 245, 0.35)',
                padding: '28px',
                boxShadow: '0 20px 48px rgba(0, 0, 0, 0.45)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}
            >
              {/* Card Header: Live Dispatch Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block', boxShadow: '0 0 10px #10B981' }} />
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Plant Operations Active
                  </span>
                </div>
                <span style={{ fontSize: '10px', backgroundColor: 'rgba(0, 200, 245, 0.15)', color: 'var(--brand-cyan)', border: '1px solid rgba(0, 200, 245, 0.3)', padding: '3px 10px', borderRadius: '50px', fontWeight: 700 }}>
                  24/7 Dispatch
                </span>
              </div>

              {/* Plant Specs Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div style={{ backgroundColor: 'rgba(2, 10, 28, 0.55)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--brand-cyan)', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>AUS 32 Purity</span>
                  <strong style={{ fontSize: '16px', color: '#FFFFFF', display: 'block', marginTop: '2px' }}>32.5% ± 0.3%</strong>
                  <span style={{ fontSize: '10px', color: '#94A3B8' }}>Technical Grade Urea</span>
                </div>

                <div style={{ backgroundColor: 'rgba(2, 10, 28, 0.55)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <span style={{ fontSize: '11px', color: '#34D399', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>EDI Water Base</span>
                  <strong style={{ fontSize: '16px', color: '#FFFFFF', display: 'block', marginTop: '2px' }}>&lt; 0.08 µS/cm</strong>
                  <span style={{ fontSize: '10px', color: '#94A3B8' }}>Double-Pass Demin</span>
                </div>

                <div style={{ backgroundColor: 'rgba(2, 10, 28, 0.55)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--brand-gold)', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Daily Capacity</span>
                  <strong style={{ fontSize: '16px', color: '#FFFFFF', display: 'block', marginTop: '2px' }}>100,000 L / Day</strong>
                  <span style={{ fontSize: '10px', color: '#94A3B8' }}>Bhadrak Mother Plant</span>
                </div>

                <div style={{ backgroundColor: 'rgba(2, 10, 28, 0.55)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--brand-cyan)', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Tanker Fleet</span>
                  <strong style={{ fontSize: '16px', color: '#FFFFFF', display: 'block', marginTop: '2px' }}>10 KL – 25 KL</strong>
                  <span style={{ fontSize: '10px', color: '#94A3B8' }}>SS-316 Insulated</span>
                </div>
              </div>

              {/* Verified OEM Standards Pill Row */}
              <div style={{ backgroundColor: 'rgba(0, 200, 245, 0.08)', borderRadius: '10px', padding: '10px 14px', border: '1px solid rgba(0, 200, 245, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#CBD5E1' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={14} color="var(--brand-cyan)" />
                  <span>ISO 22241-1 / IS 17042:2018</span>
                </span>
                <span style={{ color: 'var(--brand-gold)', fontWeight: 700 }}>BIS Licensed</span>
              </div>

              {/* Hero Action Trigger */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <a
                  href="#products"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection('products');
                  }}
                  style={{
                    flex: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    backgroundColor: 'var(--brand-blue)',
                    color: '#FFFFFF',
                    padding: '11px 16px',
                    borderRadius: '50px',
                    fontSize: '13px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    boxShadow: '0 6px 20px rgba(0, 143, 224, 0.4)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Package size={15} />
                  <span>Explore Products</span>
                </a>

                <button
                  type="button"
                  onClick={() => setIsCertModalOpen(true)}
                  style={{
                    padding: '11px 16px',
                    borderRadius: '50px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Award size={15} color="var(--brand-gold)" />
                  <span>BIS License</span>
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#94A3B8', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
                <span>✓ Tamper-Sealed</span>
                <span>✓ Serialized Batch QR</span>
                <span>✓ Zero Contamination</span>
              </div>
            </div>

          </div>
        </section>

        {/* SECTION 2: PRODUCTS & FACTORY PRICING (DYNAMIC POSTGRESQL DB) */}
        <section
          id="products"
          className="content-section"
          style={{
            width: '100%',
            backgroundColor: themeStyles.bgApp,
            padding: '64px 36px',
            borderBottom: `1px solid ${themeStyles.borderColor}`,
            transition: 'background-color 0.25s ease'
          }}
        >
          <div style={{ width: '100%', maxWidth: '1360px', margin: '0 auto' }}>

            {/* Header & Title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--brand-blue)', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <Sparkles size={14} color="var(--brand-cyan)" />
                  <span>Certified Fleet Fluids & Heavy Lubricants Catalog</span>
                </div>
                <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 32px)', color: themeStyles.textHeading, fontWeight: 800, marginTop: '4px', lineHeight: 1.2 }}>
                  Genuine Products, Factory Prices & Active Offers
                </h2>
                <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: themeStyles.textMuted, maxWidth: '650px' }}>
                  Explore laboratory-verified DEF solutions, hydraulic oils, and high-performance lubricants. Direct dispatch from our Bhadrak production plant.
                </p>
              </div>

              {/* Instant Search Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', maxWidth: '340px' }}>
                <div style={{ position: 'relative', width: '100%' }}>
                  <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search DEF, Hydraulic, 15W40, Tata..."
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 36px',
                      borderRadius: '50px',
                      border: `1px solid ${themeStyles.borderColor}`,
                      backgroundColor: themeStyles.bgCard,
                      color: themeStyles.textHeading,
                      fontSize: '12px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        fontWeight: 700
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Filter Navigation Bar (Categories + Pack Sizes) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', backgroundColor: themeStyles.bgCard, padding: '16px 20px', borderRadius: '16px', border: `1px solid ${themeStyles.borderColor}` }}>

              {/* Row 1: Product Category Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: themeStyles.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '80px' }}>
                  Category:
                </span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', flex: 1 }}>
                  {dynamicCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '50px',
                        fontSize: '12px',
                        fontWeight: selectedCategory === cat ? 700 : 500,
                        border: selectedCategory === cat ? '1.5px solid var(--brand-blue)' : `1px solid ${themeStyles.borderColor}`,
                        backgroundColor: selectedCategory === cat ? (isDark ? 'rgba(0, 143, 224, 0.2)' : 'var(--brand-blue-light)') : 'transparent',
                        color: selectedCategory === cat ? 'var(--brand-cyan)' : themeStyles.textBody,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {cat === 'ALL' ? '🌟 All Products' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 2: Packaging Format Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', borderTop: `1px dashed ${themeStyles.borderLight}`, paddingTop: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: themeStyles.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '80px' }}>
                  Pack Size:
                </span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', flex: 1 }}>
                  {packagingSizes.map(pk => (
                    <button
                      key={pk.id}
                      onClick={() => setSelectedPackFilter(pk.id)}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: selectedPackFilter === pk.id ? 700 : 500,
                        border: selectedPackFilter === pk.id ? '1px solid var(--brand-gold)' : `1px solid ${themeStyles.borderColor}`,
                        backgroundColor: selectedPackFilter === pk.id ? 'rgba(245, 180, 0, 0.15)' : 'transparent',
                        color: selectedPackFilter === pk.id ? 'var(--brand-gold)' : themeStyles.textMuted,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {pk.label}
                    </button>
                  ))}
                </div>

                <div style={{ fontSize: '11px', color: themeStyles.textMuted, marginLeft: 'auto' }}>
                  Showing <strong>{filteredProducts.length}</strong> of <strong>{products.length}</strong> products
                </div>
              </div>
            </div>

            {/* Certifications Quick Highlight Banner */}
            <div
              style={{
                backgroundColor: isDark ? 'rgba(6, 20, 47, 0.6)' : '#EFF6FF',
                border: isDark ? '1px solid rgba(0, 200, 245, 0.3)' : '1px solid #BFDBFE',
                borderRadius: '12px',
                padding: '12px 18px',
                marginBottom: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--brand-cyan)', fontSize: '12px', fontWeight: 800 }}>
                  <ShieldCheck size={18} />
                  <span>ISI Mark (IS 17042:2018)</span>
                </div>
                <span style={{ color: themeStyles.textMuted }}>•</span>
                <span style={{ fontSize: '12px', color: themeStyles.textBody }}>
                  BIS License: <strong>CM/L-84001923</strong>
                </span>
                <span style={{ color: themeStyles.textMuted }}>•</span>
                <span style={{ fontSize: '12px', color: themeStyles.textBody }}>
                  Purity: <strong>32.5% Pure Urea &lt;0.05 ppm Heavy Metals</strong>
                </span>
              </div>

              <Button
                variant="secondary"
                size="sm"
                icon={Award}
                onClick={() => setIsCertModalOpen(true)}
              >
                Inspect Official BIS Certificate
              </Button>
            </div>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px', backgroundColor: themeStyles.bgCard, borderRadius: '16px', border: `1px solid ${themeStyles.borderColor}` }}>
                <Package size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px auto' }} />
                <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', color: themeStyles.textHeading }}>No products match your filter criteria</h4>
                <p style={{ margin: 0, fontSize: '12px', color: themeStyles.textMuted }}>Try clearing search keywords or selecting "All Products".</p>
                <button
                  onClick={() => { setSelectedCategory('ALL'); setSelectedPackFilter('ALL'); setSearchQuery(''); }}
                  style={{ marginTop: '14px', padding: '8px 16px', borderRadius: '50px', backgroundColor: 'var(--brand-blue)', color: '#FFFFFF', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                {filteredProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isDistributorView={false}
                    onQuickViewClick={(prod) => setActiveQuickViewProduct(prod)}
                    onViewCertification={() => setIsCertModalOpen(true)}
                    onOrderClick={(prod, pack) => {
                      setFormData(prev => ({
                        ...prev,
                        product: `${prod.name} (${pack?.size || 'Standard'})`,
                        quantity: pack?.size?.includes('20L') ? '20 Buckets' : '500 Litres'
                      }));
                      const el = document.getElementById('rfq');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    onInquireClick={(prod, pack) => {
                      setFormData(prev => ({
                        ...prev,
                        product: `${prod.name} (${pack?.size || 'Standard'})`
                      }));
                      const el = document.getElementById('rfq');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* SECTION 3: FLEET DEF SAVINGS CALCULATOR */}
        <section
          id="calculator"
          className="content-section"
          style={{
            width: '100%',
            backgroundColor: themeStyles.bgSectionAlt,
            padding: '64px 36px',
            borderBottom: `1px solid ${themeStyles.borderColor}`,
            transition: 'background-color 0.25s ease'
          }}
        >
          <div style={{ width: '100%', maxWidth: '1360px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--brand-blue)', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Calculator size={16} />
                <span>Fleet Volume & Savings Planner</span>
              </div>
              <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 32px)', color: themeStyles.textHeading, marginTop: '6px', fontWeight: 800 }}>
                Calculate Monthly DEF Requirement & Savings for Your Fleet
              </h2>
              <p style={{ color: themeStyles.textMuted, fontSize: '14px', maxWidth: '720px', margin: '6px auto 0 auto' }}>
                Estimate exact liters required per month, optimal packaging combinations, and estimated downtime prevention savings.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px', alignItems: 'stretch' }}>
              {/* Sliders Box */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: themeStyles.bgCard, padding: '28px', borderRadius: '16px', border: `1px solid ${themeStyles.borderColor}`, boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.04)' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600, color: themeStyles.textHeading, fontSize: '14px' }}>Active BS-VI / Euro-VI Trucks:</span>
                    <strong style={{ color: 'var(--brand-blue)', fontSize: '18px', fontWeight: 800 }}>{truckCount} Trucks</strong>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="150"
                    value={truckCount}
                    onChange={e => setTruckCount(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--brand-blue)', height: '6px', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: themeStyles.textMuted, marginTop: '4px' }}>
                    <span>1 Truck</span>
                    <span>75 Trucks</span>
                    <span>150 Trucks</span>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600, color: themeStyles.textHeading, fontSize: '14px' }}>Avg Monthly Run per Vehicle:</span>
                    <strong style={{ color: 'var(--brand-blue)', fontSize: '18px', fontWeight: 800 }}>{monthlyKmPerTruck.toLocaleString()} km</strong>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="15000"
                    step="500"
                    value={monthlyKmPerTruck}
                    onChange={e => setMonthlyKmPerTruck(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--brand-blue)', height: '6px', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: themeStyles.textMuted, marginTop: '4px' }}>
                    <span>1,000 km</span>
                    <span>7,500 km</span>
                    <span>15,000 km</span>
                  </div>
                </div>

                <div style={{ padding: '14px', backgroundColor: themeStyles.bgCardSecondary, borderRadius: '10px', border: `1px solid ${themeStyles.borderColor}`, fontSize: '12px', color: themeStyles.textBody }}>
                  💡 <strong>Calculation Basis:</strong> 1.5 Litres DEF per 100 km (~4.5% ratio to diesel) under standard highway and mining transport loads.
                </div>
              </div>

              {/* Calculation Results Card */}
              <div style={{ backgroundColor: isDark ? '#0B1E40' : 'var(--brand-navy-primary)', color: '#FFFFFF', padding: '28px', borderRadius: '16px', border: `1px solid ${themeStyles.borderColor}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 12px 32px rgba(0,0,0,0.2)' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--brand-cyan)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Estimated Monthly Requirement:
                  </span>
                  <div style={{ fontSize: 'clamp(32px, 4vw, 40px)', fontWeight: 800, color: '#FFFFFF', margin: '4px 0 16px 0', fontFamily: 'var(--font-family-heading)' }}>
                    {estimatedDefLitres.toLocaleString()} <span style={{ fontSize: '18px', fontWeight: 500 }}>Litres / Month</span>
                  </div>

                  <div style={{ fontSize: '13px', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px', color: '#E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Package size={16} color="var(--brand-cyan)" />
                      <span>📦 <strong>{recommendedBuckets} x 20L Buckets</strong> per Month</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Building size={16} color="var(--brand-gold)" />
                      <span>🏭 <strong>{recommendedIBC} x 1000L IBC Totes</strong> (Recommended Bulk Rate)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Award size={16} color="#34D399" />
                      <span>🛡️ Est. <strong>₹{estimatedAnnualSavings.toLocaleString()}/yr</strong> Saved in Prevented Dosing Failures</span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="gold"
                  size="md"
                  style={{ width: '100%', marginTop: '20px' }}
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      quantity: `${estimatedDefLitres.toLocaleString()} Litres / Month (${truckCount} Trucks @ ${monthlyKmPerTruck.toLocaleString()} km/mo)`
                    }));
                    const el = document.getElementById('rfq');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Apply Volume to Bulk Quotation Form →
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: PACKAGING FORMATS & LOGISTICS */}
        <section
          id="packaging"
          className="content-section"
          style={{
            width: '100%',
            backgroundColor: themeStyles.bgApp,
            padding: '64px 36px',
            borderBottom: `1px solid ${themeStyles.borderColor}`,
            transition: 'background-color 0.25s ease'
          }}
        >
          <div style={{ width: '100%', maxWidth: '1360px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--brand-blue)', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Package size={16} />
                <span>Factory Packaging & Tanker Logistics</span>
              </div>
              <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 32px)', color: themeStyles.textHeading, marginTop: '6px', fontWeight: 800 }}>
                Industrial Packaging Configurations for Every Fleet Scale
              </h2>
              <p style={{ color: themeStyles.textMuted, fontSize: '14px', maxWidth: '720px', margin: '6px auto 0 auto' }}>
                From highway 20L smart buckets to 25,000L bulk road tankers — factory-sealed with tamper-evident induction caps, flexible pouring spouts, and digital serialized batch barcodes.
              </p>
            </div>

            {/* Packaging Format Selector Pills */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
              <div style={{ display: 'flex', gap: '6px', backgroundColor: themeStyles.bgCard, padding: '6px', borderRadius: '50px', border: `1px solid ${themeStyles.borderColor}`, flexWrap: 'wrap', justifyContent: 'center' }}>
                {packagingFormats.map(p => {
                  const isSelected = selectedPackagingTab === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPackagingTab(p.id)}
                      style={{
                        padding: '8px 20px',
                        borderRadius: '50px',
                        border: 'none',
                        backgroundColor: isSelected ? 'var(--brand-blue)' : 'transparent',
                        color: isSelected ? '#FFFFFF' : themeStyles.textMuted,
                        fontSize: '13px',
                        fontWeight: isSelected ? 800 : 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected ? '0 4px 12px rgba(0, 143, 224, 0.4)' : 'none'
                      }}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Packaging Feature Box */}
            {(() => {
              const item = packagingFormats.find(p => p.id === selectedPackagingTab) || packagingFormats[0];
              return (
                <div
                  style={{
                    backgroundColor: themeStyles.bgCard,
                    borderRadius: '18px',
                    padding: '32px',
                    border: `1px solid ${themeStyles.borderColor}`,
                    boxShadow: isDark ? '0 12px 36px rgba(0,0,0,0.3)' : '0 8px 24px rgba(0,0,0,0.06)',
                    maxWidth: '1000px',
                    margin: '0 auto'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h3 style={{ color: themeStyles.textHeading, fontSize: '22px', fontWeight: 800, margin: 0 }}>{item.name}</h3>
                      <p style={{ color: 'var(--brand-blue)', fontSize: '14px', margin: '4px 0 0 0', fontWeight: 600 }}>
                        {item.tagline} • Capacity: {item.capacity}
                      </p>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--brand-gold)', backgroundColor: 'rgba(245, 180, 0, 0.15)', border: '1px solid rgba(245, 180, 0, 0.3)', padding: '4px 12px', borderRadius: '50px', fontWeight: 800 }}>
                      {item.badge}
                    </span>
                  </div>

                  <div style={{ fontSize: '13px', color: themeStyles.textBody, marginBottom: '20px', padding: '12px 16px', backgroundColor: themeStyles.bgCardSecondary, borderRadius: '10px', border: `1px solid ${themeStyles.borderColor}` }}>
                    <strong style={{ color: themeStyles.textHeading }}>Best Recommended For:</strong> {item.bestFor}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                    {item.features.map((f, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: themeStyles.textBody, backgroundColor: themeStyles.bgCardSecondary, padding: '10px 14px', borderRadius: '8px', border: `1px solid ${themeStyles.borderLight}` }}>
                        <Check size={16} color="var(--brand-cyan)" style={{ flexShrink: 0 }} />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${themeStyles.borderColor}`, paddingTop: '20px' }}>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: themeStyles.textMuted }}>
                      <span>✓ 100% Induction Sealed</span>
                      <span>✓ Serialized Batch QA</span>
                      <span>✓ ISO 22241-1 Certified</span>
                    </div>

                    <Button
                      variant="gold"
                      size="md"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, product: `UltraBlue+ DEF (${item.name})` }));
                        const el = document.getElementById('rfq');
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      Request Factory Quote for {item.name} →
                    </Button>
                  </div>
                </div>
              );
            })()}

            {/* Quick 5-Packaging Comparison Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px', marginTop: '28px' }}>
              {packagingFormats.map(p => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPackagingTab(p.id)}
                  style={{
                    backgroundColor: selectedPackagingTab === p.id ? (isDark ? 'rgba(0, 143, 224, 0.15)' : 'var(--brand-blue-light)') : themeStyles.bgCard,
                    border: selectedPackagingTab === p.id ? '2px solid var(--brand-blue)' : `1px solid ${themeStyles.borderColor}`,
                    borderRadius: '12px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '11px', color: 'var(--brand-gold)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>{p.id}</div>
                  <strong style={{ fontSize: '14px', color: themeStyles.textHeading, display: 'block', marginBottom: '4px' }}>{p.name}</strong>
                  <span style={{ fontSize: '11px', color: themeStyles.textMuted }}>{p.capacity}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 5: TECHNICAL SPECS BENCHMARK */}
        <section
          id="specs"
          className="content-section"
          style={{
            width: '100%',
            backgroundColor: themeStyles.bgSectionAlt,
            padding: '64px 36px',
            borderBottom: `1px solid ${themeStyles.borderColor}`,
            transition: 'background-color 0.25s ease'
          }}
        >
          <div style={{ width: '100%', maxWidth: '1360px', margin: '0 auto' }}>
            <div style={{ marginBottom: '28px' }}>
              <span style={{ color: 'var(--brand-blue)', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Laboratory Standards & Tolerance
              </span>
              <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 32px)', color: themeStyles.textHeading, fontWeight: 800, marginTop: '4px' }}>
                UltraBlue+ ISO 22241-1 Specification Benchmark
              </h2>
            </div>

            <div style={{ overflowX: 'auto', backgroundColor: themeStyles.bgCard, borderRadius: '14px', border: `1px solid ${themeStyles.borderColor}` }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: themeStyles.tableHeaderBg, borderBottom: `2px solid ${themeStyles.borderColor}` }}>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: themeStyles.textHeading }}>Test Parameter</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: themeStyles.textHeading }}>ISO 22241 Standard</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: 'var(--brand-blue)' }}>UltraBlue+ Guaranteed Purity</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: themeStyles.textHeading }}>Impact on SCR Engine</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: `1px solid ${themeStyles.borderColor}` }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: themeStyles.textHeading }}>Urea Content (%)</td>
                    <td style={{ padding: '14px 16px', color: themeStyles.textBody }}>31.8% – 33.2%</td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: isDark ? '#34D399' : '#065F46' }}>32.5% ± 0.3% (Precision Blended)</td>
                    <td style={{ padding: '14px 16px', color: themeStyles.textMuted }}>Ensures complete NOx reduction efficiency</td>
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${themeStyles.borderColor}` }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: themeStyles.textHeading }}>Insolubles & Matter</td>
                    <td style={{ padding: '14px 16px', color: themeStyles.textBody }}>≤ 20 mg/kg</td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: isDark ? '#34D399' : '#065F46' }}>&lt; 5 mg/kg (Triple Micro-Filtered)</td>
                    <td style={{ padding: '14px 16px', color: themeStyles.textMuted }}>Prevents dosing nozzle clogging</td>
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${themeStyles.borderColor}` }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: themeStyles.textHeading }}>Heavy Metals (Cu, Zn, Fe, Cr)</td>
                    <td style={{ padding: '14px 16px', color: themeStyles.textBody }}>≤ 0.2 mg/kg each</td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: isDark ? '#34D399' : '#065F46' }}>&lt; 0.05 mg/kg (Zero Contamination)</td>
                    <td style={{ padding: '14px 16px', color: themeStyles.textMuted }}>Prevents precious metal catalyst poisoning</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: themeStyles.textHeading }}>Shelf Life & Stability</td>
                    <td style={{ padding: '14px 16px', color: themeStyles.textBody }}>12 Months @ &lt; 25°C</td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: isDark ? '#34D399' : '#065F46' }}>18 Months Stabilized</td>
                    <td style={{ padding: '14px 16px', color: themeStyles.textMuted }}>Extended depot and retail shelf stability</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SECTION 6: PLANT INFRASTRUCTURE & PROCESS */}
        <section
          id="infrastructure"
          className="content-section"
          style={{
            width: '100%',
            backgroundColor: themeStyles.bgApp,
            padding: '64px 36px',
            borderBottom: `1px solid ${themeStyles.borderColor}`,
            transition: 'background-color 0.25s ease'
          }}
        >
          <div style={{ width: '100%', maxWidth: '1360px', margin: '0 auto' }}>
            <div style={{ marginBottom: '28px' }}>
              <span style={{ color: 'var(--brand-blue)', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Manufacturing Excellence
              </span>
              <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 32px)', color: themeStyles.textHeading, fontWeight: 800, marginTop: '4px' }}>
                Ayush Green Energy • Bhadrak Plant Facility
              </h2>
              <p style={{ color: themeStyles.textMuted, fontSize: '14px', marginTop: '4px' }}>
                State-of-the-art closed-loop facility engineered strictly per ISO 22241 standards to deliver defect-free DEF batches.
              </p>
            </div>

            {/* 4-Stage Step Process Flow */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              <div style={{ backgroundColor: themeStyles.bgCard, padding: '24px', borderRadius: '14px', border: `1px solid ${themeStyles.borderColor}` }}>
                <div style={{ fontSize: '11px', color: 'var(--brand-blue)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>Step 01</div>
                <h3 style={{ fontSize: '16px', color: themeStyles.textHeading, fontWeight: 700, marginBottom: '8px' }}>
                  Double-Pass RO + EDI
                </h3>
                <p style={{ fontSize: '12px', color: themeStyles.textMuted, lineHeight: 1.5 }}>
                  Produces ultra-pure water with conductivity &lt;0.1 µS/cm, completely removing calcium, magnesium, and chlorides.
                </p>
              </div>

              <div style={{ backgroundColor: themeStyles.bgCard, padding: '24px', borderRadius: '14px', border: `1px solid ${themeStyles.borderColor}` }}>
                <div style={{ fontSize: '11px', color: 'var(--brand-blue)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>Step 02</div>
                <h3 style={{ fontSize: '16px', color: themeStyles.textHeading, fontWeight: 700, marginBottom: '8px' }}>
                  Automotive Prilled Urea Blending
                </h3>
                <p style={{ fontSize: '12px', color: themeStyles.textMuted, lineHeight: 1.5 }}>
                  Closed stainless-steel SS-316 blending reactor ensures precise 32.5% ratio without atmospheric dust exposure.
                </p>
              </div>

              <div style={{ backgroundColor: themeStyles.bgCard, padding: '24px', borderRadius: '14px', border: `1px solid ${themeStyles.borderColor}` }}>
                <div style={{ fontSize: '11px', color: 'var(--brand-blue)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>Step 03</div>
                <h3 style={{ fontSize: '16px', color: themeStyles.textHeading, fontWeight: 700, marginBottom: '8px' }}>
                  0.5µ Micro-Filtration
                </h3>
                <p style={{ fontSize: '12px', color: themeStyles.textMuted, lineHeight: 1.5 }}>
                  Multi-stage cartridge filtration and magnetic separation eliminate any micro-particulates &gt;0.5 micron.
                </p>
              </div>

              <div style={{ backgroundColor: themeStyles.bgCard, padding: '24px', borderRadius: '14px', border: `1px solid ${themeStyles.borderColor}` }}>
                <div style={{ fontSize: '11px', color: 'var(--brand-blue)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>Step 04</div>
                <h3 style={{ fontSize: '16px', color: themeStyles.textHeading, fontWeight: 700, marginBottom: '8px' }}>
                  Automated Clean Filling
                </h3>
                <p style={{ fontSize: '12px', color: themeStyles.textMuted, lineHeight: 1.5 }}>
                  Induction-sealed packaging and dedicated SS-316 road tankers for contamination-free transport across Eastern India.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 7: BATCH COA VERIFIER */}
        <section
          id="batch-verifier"
          className="content-section"
          style={{
            width: '100%',
            backgroundColor: isDark ? '#040E22' : '#06142F',
            color: '#FFFFFF',
            padding: '64px 36px',
            borderBottom: '1px solid rgba(0, 200, 245, 0.25)'
          }}
        >
          <div style={{ width: '100%', maxWidth: '1360px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--brand-cyan)', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>
                <FileText size={16} />
                <span>Quality Transparency & Traceability</span>
              </div>
              <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 32px)', color: '#FFFFFF', marginTop: '6px', fontWeight: 800 }}>
                Instant Batch Certificate of Analysis (CoA) Verifier
              </h2>
              <p style={{ color: '#94A3B8', fontSize: '14px', maxWidth: '680px', margin: '6px auto 0 auto' }}>
                Enter any batch number printed on your UltraBlue+ bucket, drum, or tanker invoice to view real-time laboratory QC test results.
              </p>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleVerifyBatch} style={{ display: 'flex', gap: '10px', maxWidth: '560px', margin: '0 auto 28px auto', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '220px' }}>
                <input
                  type="text"
                  className="ub-input"
                  value={batchQuery}
                  onChange={e => setBatchQuery(e.target.value)}
                  placeholder={batchCertificates[0]?.batch_no || "e.g. UB-26H-991"}
                  style={{ width: '100%', backgroundColor: '#020A1C', color: '#FFFFFF', borderColor: '#1F3E7A', padding: '10px 14px', fontSize: '14px' }}
                />
              </div>
              <Button type="submit" variant="primary" icon={Search} size="md" disabled={batchLoading}>
                {batchLoading ? 'Verifying...' : 'Verify Batch'}
              </Button>
            </form>

            {/* Batch Not Found Feedback */}
            {batchNotFound && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '12px', padding: '16px 20px', maxWidth: '650px', margin: '0 auto 24px auto', textAlign: 'center', color: '#FCA5A5', fontSize: '13px', lineHeight: 1.5 }}>
                ⚠️ No laboratory quality certificate found matching batch code "<strong>{batchQuery}</strong>". Please check the batch stamp on your container or carton label.
              </div>
            )}

            {/* Batch QC Certificate Display Box */}
            {batchResult && (
              <div style={{ backgroundColor: 'rgba(2, 10, 28, 0.6)', borderRadius: '14px', padding: '24px', border: '1px solid rgba(0, 200, 245, 0.25)', maxWidth: '1100px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '14px', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--brand-cyan)', fontWeight: 700, textTransform: 'uppercase' }}>
                      {batchResult.certNo ? `Batch Certificate: ${batchResult.certNo}` : 'Verified Batch:'}
                    </span>
                    <h3 style={{ color: '#FFFFFF', fontSize: '20px', fontWeight: 800 }}>{batchResult.batchNo}</h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34D399', border: '1px solid #10B981', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
                      ✓ {batchResult.status}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', fontSize: '13px' }}>
                  <div>
                    <span style={{ color: '#94A3B8', fontSize: '11px', display: 'block' }}>Urea Concentration:</span>
                    <strong style={{ color: '#34D399', fontSize: '16px' }}>{batchResult.ureaPercent}</strong>
                    <span style={{ color: '#64748B', fontSize: '10px', display: 'block' }}>Target: 32.5% ± 0.3%</span>
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8', fontSize: '11px', display: 'block' }}>Density @ 20°C:</span>
                    <strong style={{ color: '#FFFFFF', fontSize: '16px' }}>{batchResult.density}</strong>
                    <span style={{ color: '#64748B', fontSize: '10px', display: 'block' }}>Std: 1.087 – 1.093</span>
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8', fontSize: '11px', display: 'block' }}>Refractive Index:</span>
                    <strong style={{ color: '#FFFFFF', fontSize: '16px' }}>{batchResult.refractiveIndex}</strong>
                    <span style={{ color: '#64748B', fontSize: '10px', display: 'block' }}>Std: 1.3814 – 1.3843</span>
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8', fontSize: '11px', display: 'block' }}>Heavy Metals:</span>
                    <strong style={{ color: '#34D399', fontSize: '16px' }}>{batchResult.traceMetals}</strong>
                    <span style={{ color: '#64748B', fontSize: '10px', display: 'block' }}>Max Limit: &lt; 0.20 ppm</span>
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8', fontSize: '11px', display: 'block' }}>Water Conductivity:</span>
                    <strong style={{ color: 'var(--brand-cyan)', fontSize: '16px' }}>{batchResult.waterConductivity}</strong>
                    <span style={{ color: '#64748B', fontSize: '10px', display: 'block' }}>Ultra-Pure EDI Standard</span>
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8', fontSize: '11px', display: 'block' }}>Manufacturing Date:</span>
                    <strong style={{ color: '#FFFFFF', fontSize: '14px' }}>{batchResult.mfgDate}</strong>
                    <span style={{ color: '#64748B', fontSize: '10px', display: 'block' }}>Exp: {batchResult.expDate}</span>
                  </div>
                </div>

                <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#94A3B8', flexWrap: 'wrap', gap: '8px' }}>
                  <span>Tested by: <strong style={{ color: '#CBD5E1' }}>{batchResult.testedBy}</strong></span>
                  <button
                    onClick={() => alert(`Certificate of Analysis (CoA) for batch ${batchResult.batchNo} verified and generated. ISO 22241-1 Compliant.`)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--brand-cyan)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, fontSize: '11px' }}
                  >
                    <Download size={13} />
                    <span>Download Digital CoA PDF</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 8: FLEET TESTIMONIALS */}
        <section
          className="content-section"
          style={{
            width: '100%',
            backgroundColor: themeStyles.bgSectionAlt,
            padding: '64px 36px',
            borderBottom: `1px solid ${themeStyles.borderColor}`,
            transition: 'background-color 0.25s ease'
          }}
        >
          <div style={{ width: '100%', maxWidth: '1360px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <span style={{ color: 'var(--brand-blue)', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Proven Fleet Reliability
              </span>
              <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 32px)', color: themeStyles.textHeading, fontWeight: 800, marginTop: '4px' }}>
                Trusted by 25,000+ Heavy Commercial Vehicles
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              {testimonials.map((t, idx) => (
                <div key={idx} style={{ backgroundColor: themeStyles.bgCard, padding: '28px', borderRadius: '14px', border: `1px solid ${themeStyles.borderColor}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <p style={{ fontSize: '13px', color: themeStyles.textBody, fontStyle: 'italic', lineHeight: 1.6, marginBottom: '20px' }}>
                    "{t.quote}"
                  </p>
                  <div>
                    <strong style={{ color: themeStyles.textHeading, fontSize: '14px', display: 'block' }}>{t.author}</strong>
                    <span style={{ fontSize: '12px', color: themeStyles.textMuted, display: 'block' }}>{t.title} • {t.company}</span>
                    <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--brand-blue)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={14} />
                      <span>{t.metrics}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 9: FAQS */}
        <section
          className="content-section"
          style={{
            width: '100%',
            backgroundColor: themeStyles.bgApp,
            padding: '64px 36px',
            borderBottom: `1px solid ${themeStyles.borderColor}`,
            transition: 'background-color 0.25s ease'
          }}
        >
          <div style={{ width: '100%', maxWidth: '1360px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <span style={{ color: 'var(--brand-blue)', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Got Questions?
              </span>
              <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 32px)', color: themeStyles.textHeading, fontWeight: 800, marginTop: '4px' }}>
                Frequently Asked Questions
              </h2>
            </div>

            <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {faqs.map((f, index) => (
                <div
                  key={index}
                  style={{
                    border: `1px solid ${themeStyles.borderColor}`,
                    borderRadius: '10px',
                    overflow: 'hidden',
                    backgroundColor: activeFaq === index ? themeStyles.bgCardSecondary : themeStyles.bgCard,
                    transition: 'background-color 0.2s ease'
                  }}
                >
                  <button
                    onClick={() => setActiveFaq(activeFaq === index ? -1 : index)}
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <span style={{ fontSize: '14px', fontWeight: 700, color: themeStyles.textHeading }}>{f.q}</span>
                    {activeFaq === index ? <ChevronUp size={18} color="var(--brand-blue)" /> : <ChevronDown size={18} color={themeStyles.textMuted} />}
                  </button>

                  {activeFaq === index && (
                    <div style={{ padding: '0 20px 16px 20px', fontSize: '13px', color: themeStyles.textMuted, lineHeight: 1.6 }}>
                      {f.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 9: WHOLESALE RFQ FORM */}
        <section
          id="rfq"
          className="content-section"
          style={{
            width: '100%',
            backgroundColor: themeStyles.bgSectionAlt,
            padding: '64px 36px',
            borderBottom: `1px solid ${themeStyles.borderColor}`,
            transition: 'background-color 0.25s ease'
          }}
        >
          <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
            <div
              className="ub-card"
              style={{
                padding: '36px 28px',
                border: '2px solid var(--brand-blue)',
                backgroundColor: themeStyles.bgCard,
                borderRadius: '18px',
                boxShadow: isDark ? '0 12px 36px rgba(0, 143, 224, 0.2)' : '0 12px 36px rgba(0, 143, 224, 0.08)',
                transition: 'background-color 0.25s ease'
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <span style={{ color: 'var(--brand-blue)', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Direct Factory Wholesale Pricing
                </span>
                <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 30px)', color: themeStyles.textHeading, marginBottom: '8px', fontWeight: 800 }}>
                  Request Wholesale & Fleet Quotation
                </h2>
                <p style={{ color: themeStyles.textMuted, fontSize: '14px' }}>
                  Submit your required packaging format or monthly volume to receive factory-direct wholesale pricing from Ayush Green Energy's Bhadrak plant.
                </p>
              </div>

              {inquirySuccess ? (
                <div
                  style={{
                    backgroundColor: 'var(--status-success-bg)',
                    border: '1px solid var(--status-success-border)',
                    borderRadius: '12px',
                    padding: '28px',
                    textAlign: 'center',
                    color: 'var(--status-success-text)'
                  }}
                >
                  <CheckCircle2 size={42} color="var(--status-success)" style={{ margin: '0 auto 12px auto' }} />
                  <h3 style={{ fontSize: '20px', fontWeight: 800 }}>Inquiry Received by Bhadrak Dispatch Desk!</h3>
                  <p style={{ fontSize: '14px', marginTop: '6px' }}>
                    Your quotation request has been prioritized. Our dispatch manager will contact you within <strong>30 minutes</strong> with customized fleet pricing.
                  </p>
                  <Button
                    variant="primary"
                    size="md"
                    style={{ marginTop: '16px' }}
                    onClick={() => setInquirySuccess(false)}
                  >
                    Submit Another Inquiry
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleInquirySubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                    <Input
                      label="Contact Person Name"
                      placeholder="e.g. Subrat Das"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                    <Input
                      label="Fleet / Company Name"
                      placeholder="e.g. Tata Authorized Service Depot"
                      value={formData.company}
                      onChange={e => setFormData({ ...formData, company: e.target.value })}
                      required
                    />
                    <Input
                      label="Mobile Number (for SMS & Call)"
                      type="tel"
                      placeholder="+91 97760 33412"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                    <Input
                      label="Delivery City / Location"
                      placeholder="e.g. Cuttack / Bhadrak / Kolkata"
                      value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                      required
                    />
                    <Select
                      label="Product Required"
                      value={formData.product}
                      onChange={e => setFormData({ ...formData, product: e.target.value })}
                      options={[
                        { value: 'UltraBlue+ Diesel Exhaust Fluid (DEF)', label: 'UltraBlue+ Diesel Exhaust Fluid (DEF)' },
                        { value: 'HydroMax H-68 Hydraulic Oil', label: 'HydroMax H-68 Hydraulic Oil' },
                        { value: 'TurboGuard 15W-40 Heavy Diesel Oil', label: 'TurboGuard 15W-40 Heavy Diesel Oil' }
                      ]}
                    />
                    <Input
                      label="Estimated Packaging / Volume"
                      value={formData.quantity}
                      onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                      required
                    />
                  </div>

                  <div style={{ marginTop: '16px' }}>
                    <label className="ub-label" style={{ color: themeStyles.textHeading }}>Additional Requirements / Notes</label>
                    <textarea
                      rows="3"
                      className="ub-textarea"
                      placeholder="Tell us about your fleet size, dispensing pump requirements, or monthly delivery schedule..."
                      value={formData.message}
                      onChange={e => setFormData({ ...formData, message: e.target.value })}
                      style={{ backgroundColor: themeStyles.bgCardSecondary, color: themeStyles.textBody, borderColor: themeStyles.borderColor }}
                    />
                  </div>

                  <div style={{ marginTop: '24px', textAlign: 'center' }}>
                    <Button type="submit" size="lg" variant="primary" icon={Send} style={{ minWidth: '240px' }}>
                      Submit Bulk Quote Inquiry
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>

      </main>

      {/* Global Footer */}
      <footer
        className="main-footer"
        style={{
          width: '100%',
          backgroundColor: isDark ? '#020712' : '#06142F',
          color: '#FFFFFF',
          padding: '48px 36px 24px 36px',
          borderTop: '3px solid var(--brand-blue)'
        }}
      >
        <div style={{ width: '100%', maxWidth: '1360px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '36px' }}>
          <div>
            <Logo size="small" variant="dark" />
            <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: '14px', lineHeight: 1.6 }}>
              Manufactured & Distributed by <strong>Ayush Green Energy</strong>. Leading Indian producer of ISO 22241-1 certified Diesel Exhaust Fluid and heavy fleet lubricants.
            </p>
          </div>

          <div>
            <strong style={{ fontSize: '14px', color: '#FFFFFF', display: 'block', marginBottom: '14px' }}>
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

        <div style={{ width: '100%', maxWidth: '1360px', margin: '32px auto 0 auto', paddingTop: '18px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94A3B8', flexWrap: 'wrap', gap: '10px' }}>
          <span>© 2026 UltraBlue+ • Ayush Green Energy. All rights reserved.</span>
          <span>Designed and Developed By <a href="https://nltechsolutions.in" style={{ color: '#FFFFFF', textDecoration: 'none' }}><strong>N&L Tech Solutions</strong></a></span>
          <span>ISO 22241-1 / BIS / ISI Certified • Made in India</span>
        </div>
      </footer>

      {/* Floating Quick Connect Action Button & Notifications Trigger */}
      {
        !mobileMenuOpen && (
          <div
            className="floating-quick-actions"
            style={{
              position: 'fixed',
              bottom: '20px',
              right: '20px',
              zIndex: 999,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '8px'
            }}
          >
            <button
              onClick={() => setIsOfferDrawerOpen(true)}
              style={{
                backgroundColor: '#F59E0B',
                color: '#06142F',
                borderRadius: '50px',
                height: '38px',
                padding: '0 16px',
                minWidth: '168px',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 6px 20px rgba(245, 158, 11, 0.4)',
                fontSize: '12px',
                fontWeight: 800,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                boxSizing: 'border-box'
              }}
            >
              <Bell size={16} />
              <span>Flash Offers ({promotions.length})</span>
            </button>

            <a
              href="https://wa.me/919853675971?text=Hello%20Ayush%20Green%20Energy,%20I%20would%20like%20a%20quotation%20for%20UltraBlue%2B%20DEF"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: '#25D366',
                color: '#FFFFFF',
                borderRadius: '50px',
                height: '38px',
                padding: '0 16px',
                minWidth: '168px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 6px 20px rgba(37, 211, 102, 0.35)',
                textDecoration: 'none',
                fontSize: '12px',
                fontWeight: 700,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                boxSizing: 'border-box'
              }}
            >
              <MessageCircle size={16} />
              <span>WhatsApp Dispatch</span>
            </a>
          </div>
        )
      }

      {/* ========================================================================= */}
      {/* MODAL 1: PRODUCT DETAIL & TECHNICAL SPECIFICATIONS MODAL */}
      {/* ========================================================================= */}
      <ProductDetailModal
        isOpen={Boolean(activeQuickViewProduct)}
        onClose={() => setActiveQuickViewProduct(null)}
        product={activeQuickViewProduct}
        onApplyRfq={(prod, pack) => {
          setFormData(prev => ({
            ...prev,
            product: `${prod.name} (${pack?.size || 'Standard'})`,
            quantity: pack?.size?.includes('20L') ? '20 Buckets' : '500 Litres'
          }));
          const el = document.getElementById('rfq');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        onViewCertification={() => {
          setActiveQuickViewProduct(null);
          setIsCertModalOpen(true);
        }}
      />

      {/* ========================================================================= */}
      {/* MODAL 2: ISI MARK / BIS / ISO 22241 CERTIFICATIONS INSPECTION MODAL */}
      {/* ========================================================================= */}
      <CertificationModal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
      />

      {/* ========================================================================= */}
      {/* MODAL 3: PUSH NOTIFICATIONS & ACTIVE OFFERS DRAWER */}
      {/* ========================================================================= */}
      <OfferNotificationCenter
        isOpen={isOfferDrawerOpen}
        onClose={() => setIsOfferDrawerOpen(false)}
        promotions={promotions}
        onApplyPromo={(promo) => {
          setFormData(prev => ({
            ...prev,
            product: promo.targetProduct || prev.product,
            message: `Applied Promo Code: ${promo.promoCode} (${promo.discountPercent} Offer: ${promo.title})`
          }));
          const el = document.getElementById('rfq');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Comprehensive Mobile CSS Overhauls */}
      <style>{`
        @media (max-width: 900px) {
          .announcement-text-full {
            display: none !important;
          }
          .announcement-text-short {
            display: inline !important;
            font-size: 11px !important;
          }
          .announcement-view-btn {
            font-size: 10px !important;
            padding: 2px 8px !important;
          }
          .top-announcement-bar {
            padding: 5px 12px !important;
            font-size: 11px !important;
          }
          .top-utility-bar {
            display: none !important;
          }
          .desktop-nav {
            display: none !important;
          }
          .desktop-actions {
            display: none !important;
          }
          .mobile-controls {
            display: flex !important;
            align-items: center !important;
          }
          .main-header .ub-logo-container {
            transform: scale(0.60) !important;
            transform-origin: left center !important;
          }
          .main-header {
            margin-top: 6px !important;
            width: calc(100% - 16px) !important;
            padding: 5px 12px !important;
            border-radius: 50px !important;
          }
          .hero-section {
            padding: 120px 16px 36px 16px !important;
          }
          .hero-cta-group {
            flex-direction: column !important;
            width: 100% !important;
            gap: 10px !important;
          }
          .hero-btn-link {
            width: 100% !important;
          }
          .content-section {
            padding: 44px 16px !important;
          }
          .main-footer {
            padding: 36px 16px 20px 16px !important;
          }
          .floating-quick-actions {
            bottom: 14px !important;
            right: 14px !important;
            gap: 6px !important;
          }
          .floating-quick-actions button,
          .floating-quick-actions a {
            height: 35px !important;
            padding: 0 12px !important;
            min-width: 148px !important;
            font-size: 11px !important;
          }
        }
        @media (max-width: 380px) {
          .main-header .ub-logo-container {
            transform: scale(0.54) !important;
          }
          .floating-quick-actions button,
          .floating-quick-actions a {
            height: 32px !important;
            padding: 0 10px !important;
            min-width: 136px !important;
            font-size: 10px !important;
          }
        }
      `}</style>
    </div >
  );
};
