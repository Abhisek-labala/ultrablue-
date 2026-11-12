import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Send,
  Package,
  PhoneCall,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Film,
  Sparkles,
  X
} from 'lucide-react';
import { CertificationBadgePair } from './CertificationLogos';
import { COMPANY_INFO } from '../../config/companyInfo';

const SLIDE_INTERVAL_MS = 5500;

export const HERO_SLIDES = [
  {
    id: 'refueling-hub',
    image: '/images/hero_unique_1_station.jpg',
    shortLabel: 'Refueling Hub',
    eyebrow: 'BS-VI Commercial Fleet Ecosystem',
    titlePrefix: 'A Complete Refueling Ecosystem for ',
    titleAccent: 'Genuine DEF',
    subtitle: `${COMPANY_INFO.isStandard || 'IS 17042 (PART 1): 2020'} • ${COMPANY_INFO.bisLicense || 'CM/L-5200161078'} • ISO 22241 CERTIFIED`,
    description:
      'Manufactured by Ayush Green Energy with 32.5% ultra-pure AUS 32 aqueous urea and multi-stage de-ionized water. Safeguard SCR catalysts and maximize commercial fleet fuel economy.',
    specChip: 'Automated Fleet Dispensing',
    metricBadge: '50M+ Litres Supplied'
  },
  {
    id: 'qc-laboratory',
    image: '/images/hero_unique_2_lab.jpg',
    shortLabel: 'QC Laboratory',
    eyebrow: 'ISO 22241 Quality Control & Blending',
    titlePrefix: 'Laboratory-Verified Purity. ',
    titleAccent: 'Zero Contamination.',
    subtitle: 'CLOSED-LOOP EDI WATER • < 0.05 PPM TRACE METALS • COA PER BATCH',
    description:
      'Every batch is tested via digital refractometry and spectrophotometry inside our stainless-steel blending facility with serialized CoA traceability from Bhadrak.',
    specChip: 'In-House CoA Lab Testing',
    metricBadge: '99.98% Purity Index'
  },
  {
    id: 'scr-technology',
    image: '/images/hero_unique_3_scr.jpg',
    shortLabel: 'SCR Precision',
    eyebrow: 'Advanced Diesel Emission Control',
    titlePrefix: '32.5% High-Purity Urea for ',
    titleAccent: 'Peak SCR Torque',
    subtitle: 'ZERO CRYSTALLIZATION • 90%+ NOX CONVERSION • BS-VI & EURO-VI SAFE',
    description:
      'Ultra-low biuret and zero calcium formulation eliminates DEF injector clogging, prevents SCR catalyst poisoning, and keeps heavy commercial engines operating at peak efficiency.',
    specChip: 'BS-VI SCR Injector Safe',
    metricBadge: '< 0.05 ppm Metals'
  },
  {
    id: 'bulk-tanker',
    image: '/images/hero_unique_4_tanker.jpg',
    shortLabel: 'Bulk Tanker',
    eyebrow: 'Pan-Eastern Bulk Highway Dispatch',
    titlePrefix: '24-Hour Bulk Tanker & ',
    titleAccent: 'Highway Logistics',
    subtitle: 'DIRECT PLANT DISPATCH • ODISHA • WEST BENGAL • JHARKHAND • BIHAR',
    description:
      'Dedicated stainless-steel bulk tankers and fleet supply corridors delivering uninterrupted genuine AUS 32 directly from our Bhadrak plant to industrial depots.',
    specChip: 'Express Bulk Fleet Delivery',
    metricBadge: '500+ Active Fleets'
  },
  {
    id: 'automated-bottling',
    image: '/images/hero_unique_5_plant.jpg',
    shortLabel: 'Bottling Line',
    eyebrow: 'Automated Bottling & PLC Telemetry',
    titlePrefix: 'Precision-Filled Packs. ',
    titleAccent: 'Tamper-Evident Seal.',
    subtitle: '0.5µ MICRO-FILTRATION • QR BATCH TRACEABLE • 10L & 20L JERRYCANS',
    description:
      'Automated closed-loop filling lines ensure sterile, zero-contact packaging across 10L/20L jerrycans, 210L steel drums, and 1000L IBC totes.',
    specChip: 'Live PLC Purity Telemetry',
    metricBadge: '100% Batch Tested'
  },
  {
    id: 'ultrablue-brand',
    image: '/images/hero_unique_6_brand.jpg',
    shortLabel: 'UltraBlue+',
    eyebrow: 'Powered by Ayush Green Energy',
    titlePrefix: 'Drive Clean. Drive Smart with ',
    titleAccent: 'UltraBlue+ DEF',
    subtitle: `BIS LICENSED ${COMPANY_INFO.bisLicense || 'CM/L-5200161078'} • MADE IN INDIA`,
    description:
      'Factory-direct wholesale distribution, retail dealership partnerships, and dedicated industrial fleet supply backed by 100% batch-tested Certificate of Analysis.',
    specChip: 'Direct Distributorship',
    metricBadge: 'BIS / ISI Certified'
  }
];

export const HeroCarouselSection = ({
  isDark,
  hasAnnouncement,
  onOpenCertModal,
  onScrollToSection
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const totalSlides = HERO_SLIDES.length;
  const currentSlide = HERO_SLIDES[activeIndex];
  const autoPlayActive = !isPaused && !isHovered && !isVideoModalOpen;

  const goToNext = useCallback(() => {
    setActiveIndex(prev => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const goToPrev = useCallback(() => {
    setActiveIndex(prev => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  useEffect(() => {
    if (!autoPlayActive) return;
    const timer = setInterval(goToNext, SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [autoPlayActive, goToNext, activeIndex]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight') goToNext();
    if (e.key === 'ArrowLeft') goToPrev();
  };

  return (
    <section
      id="home"
      className="hero-section"
      onKeyDown={handleKeyDown}
      style={{
        width: '100%',
        backgroundColor: '#030B1D',
        color: '#FFFFFF',
        padding: hasAnnouncement ? '144px 36px 72px 36px' : '114px 36px 72px 36px',
        position: 'relative',
        overflow: 'hidden',
        borderBottom: isDark ? '1px solid rgba(0, 200, 245, 0.25)' : '1px solid rgba(0, 143, 224, 0.22)'
      }}
    >
      {/* Dynamic Ambient Crossfade Backdrop Layers */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        {HERO_SLIDES.map((slide, idx) => {
          const isActive = idx === activeIndex;
          return (
            <img
              key={slide.id}
              src={slide.image}
              alt=""
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: isActive ? 0.34 : 0,
                transform: isActive ? 'scale(1.04)' : 'scale(1.0)',
                transition: 'opacity 0.9s cubic-bezier(0.22, 1, 0.36, 1), transform 6s ease-out',
                filter: 'saturate(1.15)'
              }}
            />
          );
        })}

        {/* Luxury Multi-Stop Navy Scrim */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: isDark
              ? 'linear-gradient(112deg, rgba(2, 8, 23, 0.96) 0%, rgba(5, 18, 44, 0.88) 52%, rgba(4, 15, 38, 0.78) 100%)'
              : 'linear-gradient(112deg, rgba(4, 15, 38, 0.94) 0%, rgba(8, 30, 72, 0.86) 52%, rgba(0, 92, 165, 0.72) 100%)'
          }}
        />

        {/* Subtle Precision Engineering Grid Overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(0, 200, 245, 0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 200, 245, 0.045) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse at 70% 45%, black 25%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 70% 45%, black 25%, transparent 80%)'
          }}
        />

        {/* Dynamic Atmospheric Glow Orbs */}
        <div
          style={{
            position: 'absolute',
            top: '-140px',
            right: '-80px',
            width: '560px',
            height: '560px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,200,245,0.22) 0%, rgba(0,0,0,0) 70%)',
            animation: 'floatSlow 8s ease-in-out infinite'
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-180px',
            left: '-120px',
            width: '520px',
            height: '520px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,143,224,0.2) 0%, rgba(0,0,0,0) 70%)'
          }}
        />
      </div>

      {/* Main Split-Stage Hero Grid */}
      <div
        className="hero-split-grid"
        style={{
          width: '100%',
          maxWidth: '1360px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.06fr) minmax(0, 0.94fr)',
          gap: '44px',
          alignItems: 'center',
          position: 'relative',
          zIndex: 2
        }}
      >
        {/* LEFT COLUMN: Brand Identity, Dynamic Slide Copy & Actions */}
        <div>
          {/* Official Brand Logo + BIS / ISI Certification Showcase */}
          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <img
              src="/images/ultrablue_brand_logo.png"
              alt="UltraBlue+ Diesel Exhaust Fluid"
              style={{
                height: 'clamp(44px, 5.2vw, 66px)',
                width: 'auto',
                maxWidth: '100%',
                objectFit: 'contain',
                filter: 'drop-shadow(0 4px 20px rgba(0, 200, 245, 0.45))'
              }}
            />
            <div
              onClick={onOpenCertModal}
              title="Click to view BIS & ISI Mark Certificate"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '6px 10px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, border-color 0.2s ease'
              }}
            >
              <CertificationBadgePair height={58} gap="8px" />
            </div>
          </div>

          {/* Dynamic Active Slide Chapter Pill */}
          <div
            key={`pill-${currentSlide.id}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '50px',
              background: 'rgba(0, 200, 245, 0.12)',
              border: '1px solid rgba(0, 200, 245, 0.35)',
              color: '#E0F2FE',
              fontSize: '11.5px',
              fontWeight: 800,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              marginBottom: '14px',
              animation: 'heroFadeUp 0.45s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                boxShadow: '0 0 8px #10B981',
                animation: 'ripplePulse 2s infinite'
              }}
            />
            <span style={{ color: '#38BDF8' }}>
              {String(activeIndex + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
            </span>
            <span style={{ opacity: 0.45 }}>•</span>
            <span>{currentSlide.eyebrow}</span>
          </div>

          {/* Animated Headline + Subtitle + Description per Carousel Slide */}
          <div key={`copy-${currentSlide.id}`} style={{ animation: 'heroFadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <h1
              style={{
                fontSize: 'clamp(30px, 4.1vw, 50px)',
                lineHeight: 1.13,
                fontWeight: 900,
                color: '#FFFFFF',
                marginBottom: '14px',
                fontFamily: 'var(--font-family-heading)',
                letterSpacing: '-0.025em'
              }}
            >
              {currentSlide.titlePrefix}
              <span
                style={{
                  background: 'linear-gradient(90deg, #38BDF8 0%, #00C8F5 55%, #67E8F9 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                {currentSlide.titleAccent}
              </span>
            </h1>

            <div
              style={{
                fontSize: 'clamp(13px, 1.45vw, 16px)',
                color: 'var(--brand-cyan)',
                fontWeight: 800,
                marginBottom: '14px',
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}
            >
              {currentSlide.subtitle}
            </div>

            <p style={{ fontSize: '15px', color: '#E2E8F0', marginBottom: '28px', lineHeight: 1.68, maxWidth: '610px', minHeight: '52px' }}>
              {currentSlide.description}
            </p>
          </div>

          {/* Call to Action Buttons */}
          <div className="hero-cta-group" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '30px' }}>
            <button
              onClick={() => onScrollToSection('quotes')}
              className="glow-btn-primary"
              style={{
                color: '#FFFFFF',
                border: 'none',
                padding: '14px 28px',
                borderRadius: '50px',
                fontSize: '14.5px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 8px 25px rgba(0, 200, 245, 0.45)'
              }}
            >
              <Send size={17} />
              <span>Request Instant Quote</span>
            </button>

            <button
              onClick={() => onScrollToSection('products')}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(12px)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                padding: '14px 24px',
                borderRadius: '50px',
                fontSize: '14.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            >
              <Package size={17} />
              <span>View Products & Packs</span>
            </button>

            <a
              href={`tel:${COMPANY_INFO.salesHotline.replace(/[^0-9+]/g, '')}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: '#E0F2FE',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '14px',
                padding: '14px 20px',
                borderRadius: '50px',
                border: '1px solid rgba(0, 200, 245, 0.45)',
                background: 'rgba(0, 200, 245, 0.08)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0, 200, 245, 0.18)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0, 200, 245, 0.08)')}
            >
              <PhoneCall size={16} color="var(--brand-cyan)" />
              <span>Call Dispatch</span>
            </a>
          </div>

          {/* Trust Metric Glass Badges */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(125px, 1fr))',
              gap: '12px',
              paddingTop: '22px',
              borderTop: '1px solid rgba(255, 255, 255, 0.15)'
            }}
          >
            <div
              onClick={onOpenCertModal}
              style={{
                background: 'rgba(255,255,255,0.07)',
                backdropFilter: 'blur(12px)',
                padding: '12px 14px',
                borderRadius: '14px',
                border: '1px solid rgba(255,255,255,0.14)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              title="Click to view BIS & ISI Mark Certificate"
            >
              <div style={{ color: 'var(--brand-cyan)', fontSize: '18px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span>IS 17042</span>
                <ShieldCheck size={16} />
              </div>
              <div style={{ color: '#CBD5E1', fontSize: '10.5px', fontWeight: 600, marginTop: '3px' }}>
                {COMPANY_INFO.bisLicense || 'CM/L-5200161078'} • BIS
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)', padding: '12px 14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.14)' }}>
              <div style={{ color: '#34D399', fontSize: '18px', fontWeight: 900 }}>&lt; 0.05 ppm</div>
              <div style={{ color: '#CBD5E1', fontSize: '10.5px', fontWeight: 600, marginTop: '3px' }}>Zero Crystallization</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)', padding: '12px 14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.14)' }}>
              <div style={{ color: 'var(--brand-gold)', fontSize: '18px', fontWeight: 900 }}>32.5%</div>
              <div style={{ color: '#CBD5E1', fontSize: '10.5px', fontWeight: 600, marginTop: '3px' }}>Automotive AUS 32</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)', padding: '12px 14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.14)' }}>
              <div style={{ color: '#FFFFFF', fontSize: '18px', fontWeight: 900 }}>24-Hour</div>
              <div style={{ color: '#CBD5E1', fontSize: '10.5px', fontWeight: 600, marginTop: '3px' }}>Fleet Delivery</div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Cinema Showcase Frame + Telemetry HUD + Filmstrip Dock */}
        <div
          className="hero-showcase-card"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            position: 'relative',
            borderRadius: '24px',
            padding: '14px',
            background: 'linear-gradient(155deg, rgba(15, 35, 75, 0.86) 0%, rgba(4, 14, 34, 0.92) 100%)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            border: '1px solid rgba(0, 200, 245, 0.3)',
            boxShadow: '0 28px 70px rgba(0, 0, 0, 0.55), 0 0 42px rgba(0, 200, 245, 0.16)'
          }}
        >
          {/* Top Showcase HUD Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              padding: '2px 4px 12px 4px',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '50px',
                  backgroundColor: 'rgba(0, 200, 245, 0.14)',
                  border: '1px solid rgba(0, 200, 245, 0.35)',
                  color: '#38BDF8',
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.04em'
                }}
              >
                <Sparkles size={12} />
                <span>SCENE {String(activeIndex + 1).padStart(2, '0')}</span>
              </span>
              <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#E2E8F0' }}>
                {currentSlide.shortLabel}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setIsVideoModalOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '50px',
                  border: '1px solid rgba(245, 180, 0, 0.45)',
                  background: 'rgba(245, 180, 0, 0.14)',
                  color: '#FDE68A',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245, 180, 0, 0.25)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(245, 180, 0, 0.14)')}
              >
                <Film size={13} />
                <span>Watch Brand Film</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPaused(prev => !prev)}
                aria-label={isPaused ? 'Resume slideshow' : 'Pause slideshow'}
                title={isPaused ? 'Resume auto-play' : 'Pause auto-play'}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: '1px solid rgba(255, 255, 255, 0.22)',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                {isPaused ? <Play size={12} /> : <Pause size={12} />}
              </button>
            </div>
          </div>

          {/* 16:9 Main Carousel Viewport */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '16 / 9',
              borderRadius: '16px',
              overflow: 'hidden',
              backgroundColor: '#020817',
              border: '1px solid rgba(255, 255, 255, 0.14)'
            }}
          >
            {HERO_SLIDES.map((slide, idx) => {
              const isActive = idx === activeIndex;
              return (
                <img
                  key={slide.id}
                  src={slide.image}
                  alt={slide.eyebrow}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: isActive ? 1 : 0,
                    transform: isActive ? 'scale(1.0)' : 'scale(1.06)',
                    transition: 'opacity 0.75s cubic-bezier(0.22, 1, 0.36, 1), transform 5.5s ease-out',
                    pointerEvents: 'none'
                  }}
                />
              );
            })}

            {/* Subtle Bottom Gradient Vignette for Floating Spec Chips */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(2,8,23,0.08) 0%, rgba(2,8,23,0) 45%, rgba(2,8,23,0.78) 100%)',
                pointerEvents: 'none'
              }}
            />

            {/* Prev / Next Navigation Arrows */}
            <button
              type="button"
              onClick={goToPrev}
              aria-label="Previous slide"
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                background: 'rgba(4, 15, 38, 0.65)',
                backdropFilter: 'blur(8px)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 3,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(0, 200, 245, 0.85)';
                e.currentTarget.style.borderColor = '#00C8F5';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(4, 15, 38, 0.65)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
              }}
            >
              <ChevronLeft size={19} />
            </button>

            <button
              type="button"
              onClick={goToNext}
              aria-label="Next slide"
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                background: 'rgba(4, 15, 38, 0.65)',
                backdropFilter: 'blur(8px)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 3,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(0, 200, 245, 0.85)';
                e.currentTarget.style.borderColor = '#00C8F5';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(4, 15, 38, 0.65)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
              }}
            >
              <ChevronRight size={19} />
            </button>

            {/* Bottom Floating Spec Chips */}
            <div
              style={{
                position: 'absolute',
                left: '14px',
                right: '14px',
                bottom: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
                zIndex: 2,
                pointerEvents: 'none'
              }}
            >
              <span
                style={{
                  background: 'rgba(4, 15, 38, 0.78)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(0, 200, 245, 0.4)',
                  color: '#E0F2FE',
                  padding: '5px 11px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 700
                }}
              >
                {currentSlide.specChip}
              </span>
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.22)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(52, 211, 153, 0.5)',
                  color: '#A7F3D0',
                  padding: '5px 11px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 800
                }}
              >
                ✓ {currentSlide.metricBadge}
              </span>
            </div>

            {/* Animated Slide Timer Progress Bar */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: '3px',
                backgroundColor: 'rgba(255, 255, 255, 0.14)',
                zIndex: 4
              }}
            >
              <div
                key={`prog-${activeIndex}-${autoPlayActive}`}
                style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #008FE0 0%, #00C8F5 60%, #67E8F9 100%)',
                  width: '0%',
                  animation: autoPlayActive ? `heroProgress ${SLIDE_INTERVAL_MS}ms linear forwards` : 'none'
                }}
              />
            </div>
          </div>

          {/* Interactive 6-Slide Thumbnail Filmstrip Dock */}
          <div
            className="hero-filmstrip"
            style={{
              marginTop: '12px',
              display: 'grid',
              gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
              gap: '8px'
            }}
          >
            {HERO_SLIDES.map((slide, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  title={slide.eyebrow}
                  style={{
                    padding: 0,
                    border: isActive ? '2px solid #00C8F5' : '1px solid rgba(255, 255, 255, 0.16)',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    backgroundColor: '#030B1D',
                    cursor: 'pointer',
                    position: 'relative',
                    transform: isActive ? 'translateY(-2px)' : 'none',
                    boxShadow: isActive ? '0 6px 16px rgba(0, 200, 245, 0.35)' : 'none',
                    opacity: isActive ? 1 : 0.62,
                    transition: 'all 0.22s ease'
                  }}
                  onMouseEnter={e => {
                    if (!isActive) e.currentTarget.style.opacity = '0.92';
                  }}
                  onMouseLeave={e => {
                    if (!isActive) e.currentTarget.style.opacity = '0.62';
                  }}
                >
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9' }}>
                    <img
                      src={slide.image}
                      alt={slide.shortLabel}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: isActive
                          ? 'linear-gradient(180deg, transparent 35%, rgba(0, 24, 58, 0.85) 100%)'
                          : 'linear-gradient(180deg, rgba(2,8,23,0.15) 0%, rgba(2,8,23,0.8) 100%)'
                      }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        left: '4px',
                        right: '4px',
                        bottom: '3px',
                        fontSize: '9.5px',
                        fontWeight: 800,
                        color: isActive ? '#38BDF8' : '#E2E8F0',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        textAlign: 'center',
                        letterSpacing: '0.01em'
                      }}
                    >
                      {slide.shortLabel}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Brand Film Video Theater Modal */}
      {isVideoModalOpen && (
        <div
          onClick={() => setIsVideoModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(2, 8, 23, 0.88)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '920px',
              backgroundColor: '#06142F',
              borderRadius: '20px',
              border: '1px solid rgba(0, 200, 245, 0.38)',
              boxShadow: '0 24px 70px rgba(0, 0, 0, 0.7)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255, 255, 255, 0.12)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Film size={18} color="#00C8F5" />
                <strong style={{ fontSize: '14px', color: '#FFFFFF' }}>
                  UltraBlue+ DEF • Ayush Green Energy Brand Film
                </strong>
              </div>
              <button
                type="button"
                onClick={() => setIsVideoModalOpen(false)}
                aria-label="Close video player"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={17} />
              </button>
            </div>
            <div style={{ padding: '14px', backgroundColor: '#020817' }}>
              <video
                src="/videos/ultrablue_brand_film.mp4"
                controls
                autoPlay
                playsInline
                style={{
                  width: '100%',
                  maxHeight: '72vh',
                  borderRadius: '12px',
                  display: 'block',
                  backgroundColor: '#000000'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Scoped Keyframes & Responsive Grid Rules */}
      <style>{`
        @keyframes heroFadeUp {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroProgress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        @media (max-width: 1024px) {
          .hero-split-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
        }
        @media (max-width: 640px) {
          .hero-filmstrip {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
        }
      `}</style>
    </section>
  );
};
