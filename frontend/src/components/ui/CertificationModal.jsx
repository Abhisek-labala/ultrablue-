import React from 'react';
import { 
  X, 
  ShieldCheck, 
  Award, 
  CheckCircle2, 
  Download, 
  FileCheck, 
  ExternalLink,
  QrCode,
  Building,
  Check
} from 'lucide-react';
import { Button } from './Button';
import { COMPANY_INFO } from '../../config/companyInfo';

export const CertificationModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(3, 10, 24, 0.84)',
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
          maxWidth: '840px',
          maxHeight: '92vh',
          overflowY: 'auto',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '20px',
          border: '1px solid var(--border-medium)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 200, 245, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          padding: 0
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          style={{
            background: 'linear-gradient(135deg, #06142F 0%, #0B2559 60%, #00C8F5 100%)',
            color: '#FFFFFF',
            padding: '20px 24px',
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={26} color="var(--brand-cyan)" />
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#FFFFFF' }}>
                Bureau of Indian Standards (BIS) & ISO Certifications
              </h3>
              <span style={{ fontSize: '12px', color: '#E2E8F0' }}>
                Ayush Green Energy • High-Purity Automotive Fluid Compliance
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
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
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Certificate Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            
            {/* BIS / ISI Card */}
            <div 
              style={{
                backgroundColor: 'var(--bg-app)',
                borderRadius: '14px',
                padding: '20px',
                border: '1px solid var(--border-medium)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--brand-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    National Quality Standard
                  </span>
                  <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid #10B981', padding: '2px 8px', borderRadius: '50px', fontSize: '11px', fontWeight: 700 }}>
                    ✓ Valid & Certified
                  </span>
                </div>

                <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                  BIS License: IS 17042:2018 / IS 10522
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 10px 0' }}>
                  Licensed by the <strong>Bureau of Indian Standards</strong> for Automotive Grade Aqueous Urea Solution (DEF) under License No: <code>CM/L-84001923</code>.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={14} color="#10B981" />
                    <span>Authorized ISI Mark Embossing on every container</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={14} color="#10B981" />
                    <span>Quarterly BIS independent laboratory surveillance audit passed</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={14} color="#10B981" />
                    <span>Heavy metals &lt; 0.05 ppm (100% BS-VI SCR safe)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ISO 22241-1 Card */}
            <div 
              style={{
                backgroundColor: 'var(--bg-app)',
                borderRadius: '14px',
                padding: '20px',
                border: '1px solid var(--border-medium)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--brand-gold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    International Specification
                  </span>
                  <span style={{ backgroundColor: 'rgba(0, 200, 245, 0.15)', color: 'var(--brand-cyan)', border: '1px solid var(--brand-cyan)', padding: '2px 8px', borderRadius: '50px', fontSize: '11px', fontWeight: 700 }}>
                    Global Benchmark
                  </span>
                </div>

                <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                  ISO 22241-1 / Euro-VI Purity Standard
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 10px 0' }}>
                  Complies strictly with International Organization for Standardization specification for NOx reduction agent AUS 32.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={14} color="var(--brand-cyan)" />
                    <span>Precise 32.5% ± 0.3% urea concentration ratio</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={14} color="var(--brand-cyan)" />
                    <span>Triple 0.5µ micro-cartridge filtration</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={14} color="var(--brand-cyan)" />
                    <span>Zero calcium, magnesium, and biuret contamination</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Plant QA Laboratory Details */}
          <div 
            style={{
              backgroundColor: 'var(--bg-app)',
              borderRadius: '12px',
              padding: '16px 20px',
              border: '1px solid var(--border-medium)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div>
              <strong style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'block' }}>
                Bhadrak Plant In-House Quality Testing Laboratory
              </strong>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Equipped with Digital Refractometers, Density Meters, and ICP-OES Spectrometers for 100% batch release testing.
              </span>
            </div>

            <Button
              variant="secondary"
              size="sm"
              icon={Download}
              onClick={() => alert("Certified Master Quality Audit Dossier downloaded.")}
            >
              Download Audit Certificate PDF
            </Button>
          </div>

        </div>

        {/* Footer */}
        <div 
          style={{
            backgroundColor: 'var(--bg-app)',
            padding: '14px 24px',
            borderTop: '1px solid var(--border-medium)',
            borderBottomLeftRadius: '20px',
            borderBottomRightRadius: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            color: 'var(--text-muted)'
          }}
        >
          <span>Certified Manufacturer: <strong>Ayush Green Energy</strong></span>
          <Button variant="primary" size="sm" onClick={onClose}>
            Close Inspection
          </Button>
        </div>
      </div>
    </div>
  );
};
