import React from 'react';
import { 
  X, 
  Check, 
  PhoneCall, 
  MessageCircle, 
  ArrowRight,
  Package,
  Layers
} from 'lucide-react';
import { Button } from './Button';
import { COMPANY_INFO } from '../../config/companyInfo';

export const ProductDetailModal = ({
  isOpen,
  onClose,
  product,
  onApplyRfq
}) => {
  if (!isOpen || !product) return null;

  const mrp = parseFloat(product.mrp) || (product.packOptions?.[0]?.mrp ? parseFloat(product.packOptions[0].mrp) : 0);
  const wholesalePrice = parseFloat(product.distributorPrice) || (product.packOptions?.[0]?.distributorPrice ? parseFloat(product.packOptions[0].distributorPrice) : 0);
  const savings = Math.max(0, mrp - wholesalePrice);
  const savingsPercent = mrp > 0 ? Math.round((savings / mrp) * 100) : 0;
  const features = Array.isArray(product.features) ? product.features : [];

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(3, 10, 24, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
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
          maxWidth: '780px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#071530',
          borderRadius: '18px',
          border: '1px solid rgba(0, 200, 245, 0.25)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 200, 245, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          padding: 0
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div 
          style={{
            background: 'linear-gradient(135deg, #06142F 0%, #0A2758 100%)',
            color: '#FFFFFF',
            padding: '16px 22px',
            borderTopLeftRadius: '18px',
            borderTopRightRadius: '18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
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
              {product.category || 'DEF'}
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
            aria-label="Close"
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
        <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Main Grid: Left Image & Right Database Details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '22px', alignItems: 'start' }}>
            
            {/* Left: Product Image */}
            <div>
              <div 
                style={{
                  width: '100%',
                  height: '240px',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  backgroundColor: '#040E22',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '14px',
                  boxSizing: 'border-box'
                }}
              >
                <img 
                  src={product.imageUrl || '/images/def_bucket_20l.jpg'} 
                  alt={product.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain'
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/def_bucket_20l.jpg';
                  }}
                />
              </div>

              {/* Quick Specs Pill */}
              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <span style={{ fontSize: '12px', color: '#94A3B8' }}>Packaging Capacity:</span>
                <strong style={{ fontSize: '13px', color: 'var(--brand-cyan)' }}>{product.capacity || 'Standard'}</strong>
              </div>
            </div>

            {/* Right: Product Details & Live Pricing */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#FFFFFF', margin: '0 0 6px 0', lineHeight: 1.25 }}>
                  {product.name}
                </h2>
                <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.5, margin: 0 }}>
                  {product.bestFor || product.description}
                </p>
              </div>

              {/* Live DB Pricing Box */}
              <div 
                style={{
                  backgroundColor: 'rgba(4, 14, 34, 0.8)',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid rgba(0, 200, 245, 0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>
                    Wholesale Fleet Rate:
                  </span>
                  {savings > 0 && (
                    <span 
                      style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        color: '#10B981',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        padding: '2px 8px',
                        borderRadius: '50px',
                        fontSize: '11px',
                        fontWeight: 700
                      }}
                    >
                      Save ₹{savings.toLocaleString('en-IN')} ({savingsPercent}%)
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                  <span 
                    style={{ 
                      fontSize: '28px', 
                      fontWeight: 900, 
                      color: 'var(--brand-cyan)',
                      letterSpacing: '-0.02em'
                    }}
                  >
                    ₹ {wholesalePrice > 0 ? wholesalePrice.toLocaleString('en-IN') : mrp.toLocaleString('en-IN')}
                  </span>
                  {mrp > 0 && wholesalePrice > 0 && mrp !== wholesalePrice && (
                    <span style={{ fontSize: '14px', color: '#64748B', textDecoration: 'line-through' }}>
                      ₹ {mrp.toLocaleString('en-IN')} MRP
                    </span>
                  )}
                </div>

                {product.defaultQty && (
                  <div style={{ fontSize: '12px', color: '#94A3B8', display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed rgba(255, 255, 255, 0.1)', paddingTop: '8px', marginTop: '4px' }}>
                    <span>Standard Order Batch:</span>
                    <strong style={{ color: '#F1F5F9' }}>{product.defaultQty}</strong>
                  </div>
                )}
              </div>

              {/* Quick Communication Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <a
                  href={`tel:${COMPANY_INFO.salesHotline}`}
                  style={{ textDecoration: 'none' }}
                >
                  <Button 
                    variant="secondary" 
                    size="md" 
                    icon={PhoneCall}
                    style={{ width: '100%', fontSize: '12px' }}
                  >
                    Call Dispatch
                  </Button>
                </a>

                <a
                  href={`https://wa.me/919853675971?text=${encodeURIComponent(`Hello Ayush Green Energy, I am inquiring for ${product.name} (${product.capacity || ''}). Please send quotation.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <Button 
                    variant="primary" 
                    size="md" 
                    icon={MessageCircle}
                    style={{ width: '100%', backgroundColor: '#25D366', borderColor: '#25D366', fontSize: '12px' }}
                  >
                    WhatsApp
                  </Button>
                </a>
              </div>
            </div>
          </div>

          {/* Key Product Features (From DB) */}
          {features.length > 0 && (
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#F1F5F9', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Product Features:
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '9px' }}>
                {features.map((feat, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#CBD5E1', lineHeight: 1.4 }}>
                    <Check size={15} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
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
            backgroundColor: 'rgba(4, 14, 34, 0.95)',
            padding: '14px 22px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            borderBottomLeftRadius: '18px',
            borderBottomRightRadius: '18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <span style={{ fontSize: '12px', color: '#64748B' }}>
            Ayush Green Energy • Genuine Factory Supply
          </span>

          <Button
            variant="primary"
            size="md"
            icon={ArrowRight}
            iconPosition="right"
            onClick={() => {
              onClose();
              onApplyRfq?.(product);
            }}
          >
            Request Quotation
          </Button>
        </div>
      </div>
    </div>
  );
};
