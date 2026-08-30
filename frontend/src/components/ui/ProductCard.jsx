import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Check, 
  Info, 
  ArrowRight, 
  Award, 
  Zap, 
  PackageCheck, 
  Tag, 
  PhoneCall, 
  Eye, 
  Sparkles,
  Package
} from 'lucide-react';
import { Button } from './Button';
export const ProductCard = ({
  product,
  isDistributorView = false,
  onOrderClick,
  onInquireClick,
  onQuickViewClick,
  onViewCertification
}) => {
  const packOptions = product?.packOptions || [];

  const [selectedPackIndex, setSelectedPackIndex] = useState(() => {
    const popIdx = packOptions.findIndex(p => p.isPopular);
    return popIdx >= 0 ? popIdx : 0;
  });

  const currentPack = packOptions[selectedPackIndex] || packOptions[0] || { size: 'Standard', sku: product.id, mrp: 0, distributorPrice: 0 };
  const price = isDistributorView ? currentPack.distributorPrice : currentPack.mrp;
  const savings = Math.max(0, currentPack.mrp - currentPack.distributorPrice);
  const marginPercent = Math.round((savings / currentPack.mrp) * 100);

  // Category Color Accent Themes
  const getCategoryGradient = (cat) => {
    const c = (cat || '').toLowerCase();
    if (c.includes('diesel') || c.includes('def')) {
      return 'linear-gradient(135deg, #06142F 0%, #0A2758 100%)';
    }
    if (c.includes('hydraul')) {
      return 'linear-gradient(135deg, #2D1A02 0%, #683E00 100%)';
    }
    if (c.includes('engine')) {
      return 'linear-gradient(135deg, #280909 0%, #5E1414 100%)';
    }
    if (c.includes('gear')) {
      return 'linear-gradient(135deg, #1C0A33 0%, #3D1466 100%)';
    }
    return 'linear-gradient(135deg, #05261E 0%, #0D5240 100%)';
  };

  return (
    <div 
      className="ub-card" 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid var(--border-medium)',
        backgroundColor: 'var(--bg-card)',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 16px 36px rgba(0, 0, 0, 0.15), 0 0 20px rgba(0, 200, 245, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Top Banner Tag */}
      <div 
        style={{
          background: getCategoryGradient(product.category),
          color: '#FFFFFF',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--brand-cyan)' }}>
          {product.category}
        </span>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {product.isiMarked && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewCertification?.();
              }}
              title="Click to view BIS & ISI Certifications"
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '4px', 
                fontSize: '11px', 
                fontWeight: 700, 
                background: 'rgba(0, 200, 245, 0.15)',
                color: '#FFFFFF',
                padding: '2px 8px',
                borderRadius: '50px',
                border: '1px solid rgba(0, 200, 245, 0.35)',
                cursor: 'pointer'
              }}
            >
              <ShieldCheck size={13} color="var(--brand-cyan)" />
              <span>BIS / ISI</span>
            </button>
          )}
        </div>
      </div>

      {/* Product Image Showcase Container */}
      <div 
        style={{
          position: 'relative',
          height: '180px',
          width: '100%',
          backgroundColor: '#040E22',
          overflow: 'hidden',
          cursor: 'pointer'
        }}
        onClick={() => onQuickViewClick?.(product, currentPack)}
      >
        <img 
          src={product.imageUrl || 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80'} 
          alt={product.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.3s ease'
          }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80';
          }}
        />

        {/* Promotional Offer Ribbon */}
        {product.offerTag && (
          <div 
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              backgroundColor: 'rgba(245, 180, 0, 0.95)',
              color: '#06142F',
              fontSize: '10px',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: '6px',
              boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Sparkles size={11} />
            <span>{product.offerTag}</span>
          </div>
        )}

        {/* Quick Specs View Overlay Prompt on Hover */}
        <div 
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            backgroundColor: 'rgba(6, 20, 47, 0.85)',
            color: 'var(--brand-cyan)',
            padding: '4px 10px',
            borderRadius: '50px',
            fontSize: '11px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            border: '1px solid rgba(0, 200, 245, 0.3)'
          }}
        >
          <Eye size={12} />
          <span>Quick Specs</span>
        </div>
      </div>

      {/* Card Content Area */}
      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Product Name */}
        <h3 
          style={{ 
            fontSize: '16px', 
            fontWeight: 700, 
            color: 'var(--text-primary)',
            marginBottom: '6px',
            lineHeight: 1.3,
            cursor: 'pointer'
          }}
          onClick={() => onQuickViewClick?.(product, currentPack)}
        >
          {product.name}
        </h3>

        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.4, height: '34px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {product.description}
        </p>

        {/* Technical Highlights Bar */}
        <div 
          style={{
            backgroundColor: 'var(--bg-app)',
            borderRadius: '8px',
            padding: '8px 10px',
            marginBottom: '14px',
            fontSize: '11px',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '6px',
            border: '1px solid var(--border-medium)'
          }}
        >
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px' }}>Purity Grade</span>
            <strong style={{ color: 'var(--text-primary)' }}>{product.ureaContent || product.viscosityGrade || 'Automotive Grade'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px' }}>Heavy Metals</span>
            <strong style={{ color: '#10B981' }}>{product.metals || '< 0.05 ppm'}</strong>
          </div>
        </div>

        {/* Pack Size Selector */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Select Packaging Size:
            </label>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              {packOptions.length} pack options
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {packOptions.map((pack, idx) => {
              const isSelected = selectedPackIndex === idx;
              return (
                <button
                  key={pack.sku || idx}
                  type="button"
                  onClick={() => setSelectedPackIndex(idx)}
                  style={{
                    padding: '5px 8px',
                    borderRadius: '6px',
                    border: isSelected ? '1.5px solid var(--brand-blue)' : '1px solid var(--border-medium)',
                    backgroundColor: isSelected ? 'var(--brand-blue-light)' : 'var(--bg-app)',
                    color: isSelected ? 'var(--brand-blue)' : 'var(--text-primary)',
                    fontSize: '11px',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {pack.size}
                  {pack.isPopular && (
                    <span style={{ marginLeft: '3px', color: 'var(--brand-gold)', fontWeight: 800 }}>★</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pricing Matrix */}
        <div 
          style={{
            marginTop: 'auto',
            paddingTop: '12px',
            borderTop: '1px dashed var(--border-medium)',
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>
              {isDistributorView ? 'Distributor Special Price (+18% GST):' : 'Suggested Retail Price (MRP):'}
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span 
                style={{ 
                  fontFamily: 'var(--font-family-heading)', 
                  fontSize: '20px', 
                  fontWeight: 800, 
                  color: isDistributorView ? 'var(--brand-blue)' : 'var(--text-primary)' 
                }}
              >
                ₹ {price.toLocaleString('en-IN')}
              </span>
              {isDistributorView && (
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                  ₹ {currentPack.mrp.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>

          {isDistributorView ? (
            <span 
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--status-success-text)',
                backgroundColor: 'var(--status-success-bg)',
                border: '1px solid var(--status-success-border)',
                padding: '2px 6px',
                borderRadius: '50px'
              }}
            >
              {marginPercent}% Margin
            </span>
          ) : (
            <span style={{ fontSize: '10px', color: 'var(--brand-cyan)', fontWeight: 700 }}>
              Direct Factory Rate
            </span>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div 
        style={{ 
          padding: '12px 16px', 
          backgroundColor: 'var(--bg-app)', 
          borderTop: '1px solid var(--border-medium)',
          display: 'flex', 
          gap: '8px' 
        }}
      >
        {isDistributorView ? (
          <Button 
            variant="primary" 
            size="sm" 
            style={{ width: '100%' }}
            icon={PackageCheck}
            onClick={() => onOrderClick?.(product, currentPack)}
          >
            Add to Distributor Order
          </Button>
        ) : (
          <>
            <Button 
              variant="secondary" 
              size="sm" 
              icon={Eye}
              style={{ flex: 1 }}
              onClick={() => onQuickViewClick?.(product, currentPack)}
            >
              View Specs
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              style={{ flex: 1 }}
              icon={ArrowRight}
              iconPosition="right"
              onClick={() => onOrderClick?.(product, currentPack)}
            >
              Order / RFQ
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
