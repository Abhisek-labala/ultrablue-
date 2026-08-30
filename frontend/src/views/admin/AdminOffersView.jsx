import React, { useState } from 'react';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Radio, 
  Tag, 
  Copy, 
  Megaphone 
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { PromotionAPI } from '../../services/api';

export const AdminOffersView = ({ 
  promotions = [], 
  products = [], 
  onRefresh, 
  onShowToast 
}) => {
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [promoForm, setPromoForm] = useState({
    title: '',
    promo_code: '',
    discount_percent: '10% OFF',
    description: '',
    target_product: 'All UltraBlue+ Fluids',
    target_audience: 'All Authorized Distributors & POS Terminals'
  });

  const handleSavePromo = async (e) => {
    e.preventDefault();
    try {
      await PromotionAPI.create({
        title: promoForm.title,
        description: promoForm.description,
        promo_code: promoForm.promo_code.toUpperCase(),
        discount_percent: promoForm.discount_percent,
        target_product: promoForm.target_product,
        target_audience: promoForm.target_audience
      });
      if (onShowToast) onShowToast(`Promotion "${promoForm.title}" broadcasted live!`);
      setIsPromoModalOpen(false);
      setPromoForm({
        title: '',
        promo_code: '',
        discount_percent: '10% OFF',
        description: '',
        target_product: 'All UltraBlue+ Fluids',
        target_audience: 'All Authorized Distributors & POS Terminals'
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Error broadcasting promotion.');
    }
  };

  const handleDeletePromo = async (promoId, promoTitle) => {
    if (!window.confirm(`Are you sure you want to remove promotion "${promoTitle}"?`)) return;
    try {
      await PromotionAPI.delete(promoId);
      if (onShowToast) onShowToast(`Promotion "${promoTitle}" removed.`);
      if (onRefresh) onRefresh();
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Error deleting promotion.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-card)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-medium)', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="var(--brand-gold)" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Dynamic Offers, Deals & Push Broadcast Hub</h3>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
            Broadcast real-time seasonal discounts, volume incentives, and promotional coupon codes to B2B distributors and POS terminals.
          </p>
        </div>

        <Button size="sm" variant="gold" icon={Plus} onClick={() => setIsPromoModalOpen(true)}>
          Create Promo Campaign
        </Button>
      </div>

      {/* Broadcast Channel Status Banner */}
      <div style={{ backgroundColor: 'rgba(0, 200, 245, 0.08)', border: '1px solid rgba(0, 200, 245, 0.3)', borderRadius: '10px', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--brand-cyan)', color: '#040D1E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Megaphone size={18} />
          </div>
          <div>
            <strong style={{ fontSize: '13px', display: 'block', color: 'var(--text-primary)' }}>
              Live Broadcast Push Channel: ACTIVE
            </strong>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Active promotions automatically stream to Distributor Order Portal, Operator POS terminals, and Public Web storefront.
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, backgroundColor: 'var(--bg-card)', padding: '4px 10px', borderRadius: '20px', border: '1px solid var(--border-medium)', color: 'var(--brand-blue)' }}>
            {promotions.length} Live Campaigns
          </span>
        </div>
      </div>

      {/* Active Factory Promotions Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {promotions.map(promo => (
          <div key={promo.id} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-sm)' }}>
            {/* Promo Card Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'linear-gradient(to right, rgba(255, 180, 0, 0.08), transparent)' }}>
              <div>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--brand-gold)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '2px' }}>
                  {promo.target_product || 'All Fluids'} • {promo.target_audience || 'All Portals'}
                </span>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>{promo.title}</h4>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 800, backgroundColor: 'rgba(255, 180, 0, 0.15)', color: 'var(--brand-gold)', border: '1px solid rgba(255, 180, 0, 0.3)', padding: '4px 10px', borderRadius: '20px' }}>
                {promo.discount_percent || 'OFFER'}
              </span>
            </div>

            {/* Promo Card Body */}
            <div style={{ padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {promo.description}
              </p>

              {/* Promo Code Box */}
              <div style={{ backgroundColor: 'var(--bg-app)', border: '1px dashed var(--border-medium)', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>COUPON CODE</span>
                  <code style={{ fontSize: '14px', fontWeight: 800, color: 'var(--brand-blue)', letterSpacing: '0.05em' }}>
                    {promo.promo_code}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(promo.promo_code);
                    if (onShowToast) onShowToast(`Copied ${promo.promo_code} to clipboard!`);
                  }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                  title="Copy coupon code"
                >
                  <Copy size={15} />
                </button>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Radio size={12} color="#10B981" />
                <span>Broadcasting active across regional depots</span>
              </div>
            </div>

            {/* Promo Card Footer */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-app)', display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                size="sm"
                variant="ghost"
                style={{ color: 'var(--status-danger)', fontSize: '11px' }}
                icon={Trash2}
                onClick={() => handleDeletePromo(promo.id, promo.title)}
              >
                Delete Campaign
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* BROADCAST PROMOTION MODAL */}
      <Modal
        isOpen={isPromoModalOpen}
        onClose={() => setIsPromoModalOpen(false)}
        title="Broadcast Dynamic Promotion & Push Offer"
      >
        <form onSubmit={handleSavePromo} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Offer Headline / Title *</label>
            <Input value={promoForm.title} onChange={e => setPromoForm({ ...promoForm, title: e.target.value })} placeholder="e.g. Monsoon Fleet Special: Flat 12% Off on DEF 20L" required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Promo Code *</label>
              <Input value={promoForm.promo_code} onChange={e => setPromoForm({ ...promoForm, promo_code: e.target.value.toUpperCase() })} placeholder="FLEET12" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Discount Tag *</label>
              <Input value={promoForm.discount_percent} onChange={e => setPromoForm({ ...promoForm, discount_percent: e.target.value })} placeholder="12% OFF" required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Target Product / Category</label>
              <Select
                value={promoForm.target_product}
                onChange={e => setPromoForm({ ...promoForm, target_product: e.target.value })}
                options={[
                  { label: 'All UltraBlue+ Fluids', value: 'All UltraBlue+ Fluids' },
                  ...products.map(p => ({ label: p.name, value: p.name }))
                ]}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Target Audience Channel</label>
              <Select
                value={promoForm.target_audience}
                onChange={e => setPromoForm({ ...promoForm, target_audience: e.target.value })}
                options={[
                  { label: 'All Distributors & POS Terminals', value: 'All Authorized Distributors & POS Terminals' },
                  { label: 'Distributor Portals Only', value: 'Distributor Portals Only' },
                  { label: 'Sales POS Operators Only', value: 'Sales POS Operators Only' }
                ]}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Offer Details & Terms *</label>
            <textarea
              value={promoForm.description}
              onChange={e => setPromoForm({ ...promoForm, description: e.target.value })}
              style={{ width: '100%', minHeight: '60px', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-medium)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)', fontSize: '13px' }}
              placeholder="Valid on factory dispatches across Odisha and Eastern Highway corridors..."
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button type="button" variant="secondary" onClick={() => setIsPromoModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="gold" icon={Sparkles}>Broadcast Promotion Live</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
