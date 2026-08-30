import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  Tag, 
  Sparkles, 
  Check, 
  Copy, 
  Smartphone, 
  Send, 
  Clock, 
  ShieldCheck,
  Percent,
  CheckCircle2
} from 'lucide-react';
import { Button } from './Button';
import { PromotionAPI } from '../../services/api';

export const OfferNotificationCenter = ({
  isOpen,
  onClose,
  onApplyPromo
}) => {
  const [offers, setOffers] = useState([]);
  const [pushEnabled, setPushEnabled] = useState(() => {
    return localStorage.getItem('ub_push_alerts') === 'true';
  });
  const [copiedCode, setCopiedCode] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [subscribedSuccess, setSubscribedSuccess] = useState(false);

  // Fetch dynamic promotions from DB
  useEffect(() => {
    const fetchPromos = async () => {
      try {
        const dbPromos = await PromotionAPI.getAll();
        if (dbPromos && Array.isArray(dbPromos)) {
          setOffers(dbPromos.map(p => ({
            id: p.id,
            title: p.title,
            description: p.description,
            badge: p.badge || 'Live Offer',
            promoCode: p.promo_code || 'UBP2026',
            discountPercent: p.discount_percent || 'Special Rate',
            targetProduct: p.target_product || 'UltraBlue+ Fluids',
            validUntil: '30-Sep-2026',
            isActive: true
          })));
        }
      } catch (e) {
        console.error('Error fetching promo offers:', e);
        setOffers([]);
      }
    };
    fetchPromos();
  }, []);

  const handleTogglePush = () => {
    const nextState = !pushEnabled;
    setPushEnabled(nextState);
    localStorage.setItem('ub_push_alerts', String(nextState));
    if (nextState && 'Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 3000);
  };

  const handleSubscribeWhatsapp = (e) => {
    e.preventDefault();
    if (whatsappPhone.trim().length >= 10) {
      setSubscribedSuccess(true);
      setTimeout(() => {
        setSubscribedSuccess(false);
        setWhatsappPhone('');
      }, 5000);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(3, 10, 24, 0.82)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 999999,
        display: 'flex',
        justifyContent: 'flex-end',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '460px',
          height: '100%',
          backgroundColor: 'var(--bg-card)',
          borderLeft: '1px solid var(--border-medium)',
          boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflowY: 'auto'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div 
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-medium)',
            background: 'linear-gradient(135deg, #06142F 0%, #0A2452 100%)',
            color: '#FFFFFF',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div 
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 200, 245, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(0, 200, 245, 0.4)'
              }}
            >
              <Bell size={18} color="var(--brand-cyan)" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#FFFFFF' }}>
                Offers & Fleet Updates
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--brand-cyan)' }}>
                {offers.length} Active Direct Factory Deals
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Notifications"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#FFFFFF',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Content Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '18px', flex: 1, overflowY: 'auto' }}>
          
          {/* Push Notifications Toggle Box */}
          <div 
            style={{
              backgroundColor: pushEnabled ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-app)',
              border: pushEnabled ? '1px solid #10B981' : '1px solid var(--border-medium)',
              borderRadius: '12px',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div>
              <strong style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'block' }}>
                Browser Push Notifications
              </strong>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {pushEnabled ? '✓ Enabled for instant price drop alerts' : 'Receive daily fleet pricing & flash offers'}
              </span>
            </div>

            <button
              onClick={handleTogglePush}
              style={{
                backgroundColor: pushEnabled ? '#10B981' : 'var(--border-medium)',
                border: 'none',
                borderRadius: '50px',
                width: '46px',
                height: '24px',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
                flexShrink: 0
              }}
            >
              <span 
                style={{
                  position: 'absolute',
                  top: '2px',
                  left: pushEnabled ? '24px' : '2px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  transition: 'left 0.2s ease'
                }}
              />
            </button>
          </div>

          {/* Offers List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {offers.map((offer) => (
              <div 
                key={offer.id}
                style={{
                  backgroundColor: 'var(--bg-app)',
                  borderRadius: '14px',
                  border: '1px solid var(--border-medium)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span 
                    style={{
                      backgroundColor: 'rgba(245, 180, 0, 0.15)',
                      color: 'var(--brand-gold)',
                      border: '1px solid rgba(245, 180, 0, 0.3)',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '50px'
                    }}
                  >
                    {offer.badge}
                  </span>

                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={11} />
                    <span>Valid until {offer.validUntil}</span>
                  </span>
                </div>

                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                  {offer.title}
                </h4>

                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {offer.description}
                </p>

                {/* Promo Code & Action Bar */}
                {offer.promoCode && (
                  <div 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px dashed var(--border-medium)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      marginTop: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Tag size={13} color="var(--brand-cyan)" />
                      <code style={{ fontSize: '12px', fontWeight: 800, color: 'var(--brand-blue)' }}>
                        {offer.promoCode}
                      </code>
                    </div>

                    <button
                      onClick={() => handleCopyCode(offer.promoCode)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: copiedCode === offer.promoCode ? '#10B981' : 'var(--brand-cyan)',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {copiedCode === offer.promoCode ? (
                        <>
                          <Check size={13} />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      onClose();
                      onApplyPromo?.(offer);
                    }}
                  >
                    Apply Deal to Quote Form
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* WhatsApp / SMS Subscribe Form */}
          <div 
            style={{
              backgroundColor: 'var(--bg-app)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid var(--border-medium)',
              marginTop: 'auto'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Smartphone size={16} color="#25D366" />
              <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                Subscribe to WhatsApp Flash Deals
              </strong>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
              Get direct factory rate sheets and tanker dispatch availability on your mobile.
            </p>

            {subscribedSuccess ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981', fontSize: '12px', fontWeight: 700 }}>
                <CheckCircle2 size={16} />
                <span>Subscribed! You will receive daily pricing updates on WhatsApp.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribeWhatsapp} style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="tel"
                  className="ub-input"
                  placeholder="+91 98536 75971"
                  value={whatsappPhone}
                  onChange={e => setWhatsappPhone(e.target.value)}
                  required
                  style={{ flex: 1, padding: '7px 10px', fontSize: '12px' }}
                />
                <Button type="submit" variant="gold" size="sm" icon={Send}>
                  Join
                </Button>
              </form>
            )}
          </div>

        </div>

        {/* Footer */}
        <div 
          style={{
            padding: '12px 24px',
            borderTop: '1px solid var(--border-medium)',
            backgroundColor: 'var(--bg-app)',
            fontSize: '11px',
            color: 'var(--text-muted)',
            textAlign: 'center'
          }}
        >
          Ayush Green Energy • 100% Genuine ISO 22241 & BIS Certified
        </div>
      </div>
    </div>
  );
};
