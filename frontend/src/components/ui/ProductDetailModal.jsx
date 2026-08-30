import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  PhoneCall, 
  Mail, 
  MessageCircle, 
  Download, 
  FileText, 
  Tag, 
  Package, 
  Layers, 
  Award, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Button } from './Button';
import { COMPANY_INFO } from '../../config/companyInfo';

export const ProductDetailModal = ({
  isOpen,
  onClose,
  product,
  onApplyRfq,
  onViewCertification
}) => {
  if (!isOpen || !product) return null;

  const [selectedPackIndex, setSelectedPackIndex] = useState(0);
  const packOptions = product.packOptions || [
    { size: '20L Bucket', sku: `UB-${product.id || 'PROD'}-20L`, mrp: 1250, distributorPrice: 950, isPopular: true }
  ];
  const currentPack = packOptions[selectedPackIndex] || packOptions[0];
  const savings = Math.max(0, currentPack.mrp - currentPack.distributorPrice);
  const savingsPct = Math.round((savings / currentPack.mrp) * 100);

  const handleTdsDownload = () => {
    const tdsText = `=====================================================
ULTRABLUE+ TECHNICAL DATA SHEET (TDS)
Ayush Green Energy • Bhadrak Plant Facility
=====================================================
PRODUCT: ${product.name}
CATEGORY: ${product.category}
ISO/BIS COMPLIANCE: ${product.isoStandard || 'ISO 22241-1'}
ISI MARK NUMBER: ${product.isiNumber || 'IS 17042:2018'}
BIS LICENCE NO: ${product.bisLicence || 'CM/L-84001923'}

TECHNICAL PARAMETERS:
- Grade / Viscosity: ${product.viscosityGrade || 'AUS 32'}
- Purity / Urea %: ${product.ureaContent || '32.5% ± 0.7%'}
- Density @ 20°C: ${product.density || '1.090 g/cm³'}
- Heavy Trace Metals: ${product.metals || '< 0.05 ppm'}
- Insolubles: ${product.insolubles || '≤ 5 mg/kg'}
- Flash Point: ${product.flashPoint || 'Non-Flammable'}

OEM COMPATIBILITY & APPROVALS:
${product.oemApprovals || 'Tata Motors, Ashok Leyland, BharatBenz, JCB, Cummins, Volvo Commercial'}

KEY HIGHLIGHTS:
${(product.features || []).map(f => `- ${f}`).join('\n')}

MANUFACTURER:
Ayush Green Energy
Plot No. 42, Industrial Growth Centre, Bhadrak, Odisha - 756100
Hotline: ${COMPANY_INFO.salesHotline} | Email: ${COMPANY_INFO.email}
=====================================================`;

    const blob = new Blob([tdsText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${product.name.replace(/[^a-zA-Z0-9]/g, '_')}_Technical_Data_Sheet.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(3, 10, 24, 0.82)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <div 
        className="ub-card"
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '92vh',
          overflowY: 'auto',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '20px',
          border: '1px solid var(--border-medium)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 200, 245, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          padding: 0
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div 
          style={{
            background: 'linear-gradient(135deg, #06142F 0%, #0A2758 60%, #008FE0 100%)',
            color: '#FFFFFF',
            padding: '18px 24px',
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span 
              style={{ 
                fontSize: '11px', 
                fontWeight: 800, 
                letterSpacing: '0.08em', 
                textTransform: 'uppercase', 
                color: 'var(--brand-cyan)',
                backgroundColor: 'rgba(0, 200, 245, 0.15)',
                padding: '4px 10px',
                borderRadius: '50px',
                border: '1px solid rgba(0, 200, 245, 0.3)'
              }}
            >
              {product.category}
            </span>
            {product.badge && (
              <span 
                style={{ 
                  fontSize: '11px', 
                  fontWeight: 700, 
                  color: 'var(--brand-gold)',
                  backgroundColor: 'rgba(245, 180, 0, 0.15)',
                  padding: '4px 10px',
                  borderRadius: '50px',
                  border: '1px solid rgba(245, 180, 0, 0.3)'
                }}
              >
                ★ {product.badge}
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            aria-label="Close Modal"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          
          {/* Main Top Showcase Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', alignItems: 'start' }}>
            
            {/* Left Column: Product Image & Certifications */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div 
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '240px',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  backgroundColor: '#051026',
                  border: '1px solid var(--border-medium)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <img 
                  src={product.imageUrl || 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80'} 
                  alt={product.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.4s ease'
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80';
                  }}
                />
                <div 
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(to top, rgba(3, 10, 24, 0.9) 0%, transparent 100%)',
                    padding: '12px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end'
                  }}
                >
                  <span style={{ fontSize: '11px', color: '#CBD5E1', fontWeight: 600 }}>
                    Ayush Green Energy • Genuine Factory Blended
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--brand-cyan)', fontWeight: 700 }}>
                    100% Sealed
                  </span>
                </div>
              </div>

              {/* Offer Callout Banner */}
              {product.offerTag && (
                <div 
                  style={{
                    backgroundColor: 'rgba(245, 180, 0, 0.12)',
                    border: '1px solid rgba(245, 180, 0, 0.4)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <Tag size={16} color="var(--brand-gold)" />
                  <div>
                    <strong style={{ fontSize: '12px', color: 'var(--brand-gold)', display: 'block' }}>
                      {product.offerTag}
                    </strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Direct wholesale factory discount for fleet bookings
                    </span>
                  </div>
                </div>
              )}

              {/* Verified Quality Badges */}
              <div 
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px'
                }}
              >
                <div 
                  onClick={onViewCertification}
                  style={{
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <ShieldCheck size={18} color="var(--brand-cyan)" />
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>ISI Standard</span>
                    <strong style={{ fontSize: '11px', color: 'var(--text-primary)' }}>{product.isiNumber || 'IS 17042:2018'}</strong>
                  </div>
                </div>

                <div 
                  onClick={onViewCertification}
                  style={{
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <Award size={18} color="#10B981" />
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>BIS License</span>
                    <strong style={{ fontSize: '11px', color: 'var(--text-primary)' }}>{product.bisLicence || 'CM/L-84001923'}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Title, Pack Selection, Live Pricing */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0', lineHeight: 1.25 }}>
                  {product.name}
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  {product.description}
                </p>
              </div>

              {/* Pack Size Selector */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                  Available Packaging Options:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {packOptions.map((pack, idx) => {
                    const isSelected = selectedPackIndex === idx;
                    return (
                      <button
                        key={pack.sku || idx}
                        type="button"
                        onClick={() => setSelectedPackIndex(idx)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid var(--brand-blue)' : '1px solid var(--border-medium)',
                          backgroundColor: isSelected ? 'var(--brand-blue-light)' : 'var(--bg-app)',
                          color: isSelected ? 'var(--brand-blue)' : 'var(--text-primary)',
                          fontSize: '12px',
                          fontWeight: isSelected ? 700 : 500,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Package size={13} />
                        <span>{pack.size}</span>
                        {pack.isPopular && (
                          <span style={{ color: 'var(--brand-gold)', fontWeight: 800 }}>★</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pricing Matrix Box */}
              <div 
                style={{
                  backgroundColor: 'var(--bg-app)',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid var(--border-medium)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>
                      Fleet / Distributor Rate (+18% GST):
                    </span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                      <span 
                        style={{ 
                          fontSize: '28px', 
                          fontWeight: 800, 
                          color: 'var(--brand-blue)',
                          fontFamily: 'var(--font-family-heading)'
                        }}
                      >
                        ₹ {currentPack.distributorPrice.toLocaleString('en-IN')}
                      </span>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                        ₹ {currentPack.mrp.toLocaleString('en-IN')} MRP
                      </span>
                    </div>
                  </div>

                  {savings > 0 && (
                    <span 
                      style={{
                        backgroundColor: 'var(--status-success-bg)',
                        color: 'var(--status-success-text)',
                        border: '1px solid var(--status-success-border)',
                        padding: '4px 10px',
                        borderRadius: '50px',
                        fontSize: '12px',
                        fontWeight: 700
                      }}
                    >
                      Save ₹{savings.toLocaleString('en-IN')} ({savingsPct}%)
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-medium)', paddingTop: '8px' }}>
                  <span>SKU: <strong>{currentPack.sku}</strong></span>
                  <span>HSN: <strong>{product.hsnCode || '31021000'}</strong></span>
                  <span>GST: <strong>18% Input Credit</strong></span>
                </div>
              </div>

              {/* Direct General User Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                <a
                  href={`tel:${COMPANY_INFO.salesHotline}`}
                  style={{ textDecoration: 'none' }}
                >
                  <Button 
                    variant="secondary" 
                    size="md" 
                    icon={PhoneCall}
                    style={{ width: '100%' }}
                  >
                    Call Plant Dispatch
                  </Button>
                </a>

                <a
                  href={`https://wa.me/919853675971?text=${encodeURIComponent(`Hello Ayush Green Energy, I am inquiring for ${product.name} (${currentPack.size}) at ₹${currentPack.distributorPrice}. Please send quotation.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <Button 
                    variant="primary" 
                    size="md" 
                    icon={MessageCircle}
                    style={{ width: '100%', backgroundColor: '#25D366', borderColor: '#25D366' }}
                  >
                    WhatsApp Quote
                  </Button>
                </a>
              </div>
            </div>
          </div>

          {/* Technical Specifications Matrix */}
          <div 
            style={{
              backgroundColor: 'var(--bg-app)',
              borderRadius: '14px',
              padding: '18px',
              border: '1px solid var(--border-medium)'
            }}
          >
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={16} color="var(--brand-cyan)" />
              <span>Certified Technical Laboratory Specifications</span>
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '12px' }}>
              <div style={{ padding: '8px 10px', backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>Purity / Active Content:</span>
                <strong style={{ color: '#10B981', fontSize: '13px' }}>{product.ureaContent || 'Automotive Grade'}</strong>
              </div>
              <div style={{ padding: '8px 10px', backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>Density @ 20°C:</span>
                <strong style={{ color: 'var(--text-primary)', fontSize: '13px' }}>{product.density || '1.090 g/cm³'}</strong>
              </div>
              <div style={{ padding: '8px 10px', backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>Heavy Metal Limit:</span>
                <strong style={{ color: '#10B981', fontSize: '13px' }}>{product.metals || '< 0.05 ppm'}</strong>
              </div>
              <div style={{ padding: '8px 10px', backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>Viscosity / Grade:</span>
                <strong style={{ color: 'var(--text-primary)', fontSize: '13px' }}>{product.viscosityGrade || 'ISO VG / AUS 32'}</strong>
              </div>
              <div style={{ padding: '8px 10px', backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>Flash Point:</span>
                <strong style={{ color: 'var(--text-primary)', fontSize: '13px' }}>{product.flashPoint || 'Non-Flammable'}</strong>
              </div>
              <div style={{ padding: '8px 10px', backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>Insolubles:</span>
                <strong style={{ color: '#10B981', fontSize: '13px' }}>{product.insolubles || '≤ 5 mg/kg'}</strong>
              </div>
            </div>

            {/* OEM Recommendations */}
            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-light)', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Recommended Commercial Fleet & Heavy Machinery OEMs:
              </span>
              <strong style={{ color: 'var(--text-primary)' }}>
                {product.oemApprovals || 'Tata Motors, Ashok Leyland, BharatBenz, Volvo Commercial, JCB, Cummins'}
              </strong>
            </div>
          </div>

          {/* Key Product Features Bullet Points */}
          {product.features && product.features.length > 0 && (
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                Key Engineering Advantages:
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '8px' }}>
                {product.features.map((feat, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <CheckCircle2 size={15} color="var(--brand-cyan)" style={{ flexShrink: 0 }} />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div 
          style={{
            backgroundColor: 'var(--bg-app)',
            padding: '16px 24px',
            borderTop: '1px solid var(--border-medium)',
            borderBottomLeftRadius: '20px',
            borderBottomRightRadius: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="secondary"
              size="sm"
              icon={Download}
              onClick={handleTdsDownload}
            >
              Download Tech Sheet (TDS)
            </Button>

            <a 
              href={`mailto:${COMPANY_INFO.email}?subject=${encodeURIComponent(`Inquiry for ${product.name}`)}&body=${encodeURIComponent(`Hello Ayush Green Energy Team,\n\nI would like to inquire about bulk ordering for ${product.name} (${currentPack.size}).\n\nPlease send us the wholesale price quote and delivery timeline.`)}`}
              style={{ textDecoration: 'none' }}
            >
              <Button
                variant="secondary"
                size="sm"
                icon={Mail}
              >
                Email Inquiry
              </Button>
            </a>
          </div>

          <Button
            variant="gold"
            size="md"
            icon={ArrowRight}
            iconPosition="right"
            onClick={() => {
              onClose();
              onApplyRfq?.(product, currentPack);
            }}
          >
            Apply to Bulk RFQ Form
          </Button>
        </div>
      </div>
    </div>
  );
};
