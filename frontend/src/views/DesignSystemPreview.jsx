import React, { useState } from 'react';
import { 
  Palette, 
  Type, 
  Square, 
  CheckCircle, 
  AlertCircle, 
  Layers, 
  FileText, 
  Sparkles, 
  Sliders, 
  ShieldCheck, 
  Warehouse, 
  Send,
  Eye,
  Copy,
  Info
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { KPICard } from '../components/ui/KPICard';
import { DataTable } from '../components/ui/DataTable';
import { Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { ProductCard } from '../components/ui/ProductCard';
import { SkeletonLoader, EmptyState, ErrorBanner } from '../components/ui/FeedbackStates';
import { ProductAPI, InventoryAPI } from '../services/api';

export const DesignSystemPreview = ({ activeTab = 'ds_preview', onTabChange }) => {
  const [activeSection, setActiveSection] = useState(() => {
    if (activeTab === 'ds_colors') return 'palette';
    if (activeTab === 'ds_components') return 'buttons';
    if (activeTab === 'ds_feedback') return 'feedback';
    return 'palette';
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedHex, setCopiedHex] = useState(null);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);

  useEffect(() => {
    if (activeTab === 'ds_colors') setActiveSection('palette');
    else if (activeTab === 'ds_components') setActiveSection('buttons');
    else if (activeTab === 'ds_feedback') setActiveSection('feedback');
  }, [activeTab]);

  // Lazily load dynamic items only when the relevant section is actually viewed
  useEffect(() => {
    if ((activeSection === 'products' || activeSection === 'all') && products.length === 0) {
      ProductAPI.getAll().then(setProducts).catch(() => setProducts([]));
    }
    if ((activeSection === 'tables' || activeSection === 'all') && inventory.length === 0) {
      InventoryAPI.getAll().then(setInventory).catch(() => setInventory([]));
    }
  }, [activeSection]);

  const copyToClipboard = (hex, name) => {
    navigator.clipboard?.writeText(hex);
    setCopiedHex(name);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  const colorPalette = [
    { name: 'Primary Deep Navy', hex: '#06142F', role: 'Structural Canvas, Navbars, 30% Base', textColor: '#FFFFFF', token: '--brand-navy-primary' },
    { name: 'Dark Navy Canvas', hex: '#020A1C', role: 'High-contrast backgrounds, borders', textColor: '#FFFFFF', token: '--brand-navy-dark' },
    { name: 'Electric Brand Blue', hex: '#008FE0', role: 'Primary CTA, Active States, Key Focus', textColor: '#FFFFFF', token: '--brand-blue' },
    { name: 'Luminous Cyan', hex: '#00C8F5', role: 'Droplet glow, highlights, stats', textColor: '#06142F', token: '--brand-cyan' },
    { name: 'Amber Gold Accent', hex: '#F5B400', role: 'Strict 10% accent: "+" mark & VIP Tier', textColor: '#020A1C', token: '--brand-gold' },
    { name: 'Pure White Surface', hex: '#FFFFFF', role: 'Cards, Modals, 60% Readability', textColor: '#172033', token: '--bg-surface' },
    { name: 'Off-White App BG', hex: '#F7F9FC', role: 'Application viewport background', textColor: '#172033', token: '--bg-app' },
    { name: 'Light Blue Accent Surface', hex: '#EEF8FD', role: 'Active row highlight, subtle tags', textColor: '#008FE0', token: '--brand-blue-light' },
    { name: 'Semantic Success', hex: '#10B981', role: 'Healthy stock, Paid, Approved', textColor: '#FFFFFF', token: '--status-success' },
    { name: 'Semantic Warning', hex: '#F59E0B', role: 'Low stock, Pending Review', textColor: '#FFFFFF', token: '--status-warning' },
    { name: 'Semantic Danger', hex: '#EF4444', role: 'Out of stock, Rejected, Expired', textColor: '#FFFFFF', token: '--status-danger' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      {/* Design System Header Banner */}
      <div 
        className="ub-card" 
        style={{ 
          background: 'linear-gradient(135deg, var(--brand-navy-primary) 0%, var(--brand-navy-surface) 100%)',
          color: '#FFFFFF',
          padding: 'var(--space-8)',
          border: '1px solid var(--brand-navy-border)',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-gold)', fontWeight: 700, fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
          <Sparkles size={16} />
          <span>Section 45 Deliverable • Master Design System Preview</span>
        </div>
        <h2 style={{ fontSize: 'var(--font-size-3xl)', color: '#FFFFFF', marginBottom: '8px', fontFamily: 'var(--font-family-heading)' }}>
          UltraBlue+ Enterprise UI/UX Design System
        </h2>
        <p style={{ color: 'var(--text-on-dark-secondary)', maxWidth: '820px', fontSize: 'var(--font-size-sm)', lineHeight: 1.6 }}>
          Standardized component specifications, 60/30/10 visual balance rules, semantic token architecture, and accessibility criteria engineered for Ayush Green Energy's enterprise ecosystem.
        </p>

        {/* 60/30/10 Rule Meter */}
        <div style={{ marginTop: 'var(--space-6)', backgroundColor: 'var(--brand-navy-dark)', padding: '16px 20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--brand-navy-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>
            <span style={{ color: '#FFFFFF' }}>Visual Weight Ratio: 60% Light Neutrals • 30% Deep Navy Structure • 10% Electric Blue & Amber Gold</span>
            <span style={{ color: 'var(--brand-gold)' }}>WCAG AA Compliant</span>
          </div>
          <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: '60%', backgroundColor: '#FFFFFF' }} title="60% Light Neutrals" />
            <div style={{ width: '30%', backgroundColor: '#06142F' }} title="30% Deep Navy" />
            <div style={{ width: '8%', backgroundColor: '#008FE0' }} title="8% Brand Electric Blue" />
            <div style={{ width: '2%', backgroundColor: '#F5B400' }} title="2% Gold Accent" />
          </div>
        </div>
      </div>

      {/* Navigation Filter Tabs for Design System Sections */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderBottom: '1px solid var(--border-medium)', paddingBottom: '12px' }}>
        {[
          { id: 'palette', label: 'A. Color Palette & Tokens', icon: Palette },
          { id: 'typography', label: 'B. Typography & Hierarchy', icon: Type },
          { id: 'buttons', label: 'C. Buttons & Actions', icon: Square },
          { id: 'inputs', label: 'D. Form Controls', icon: Sliders },
          { id: 'badges', label: 'E. Status Badges', icon: CheckCircle },
          { id: 'kpis', label: 'F. KPI Cards', icon: Layers },
          { id: 'tables', label: 'G. Standardized Table', icon: FileText },
          { id: 'products', label: 'H. Product Cards', icon: ShieldCheck },
          { id: 'feedback', label: 'I. Feedback States', icon: AlertCircle }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <Button
              key={tab.id}
              size="sm"
              variant={isActive ? 'primary' : 'secondary'}
              icon={Icon}
              onClick={() => setActiveSection(tab.id)}
            >
              {tab.label}
            </Button>
          );
        })}
      </div>

      {/* SECTION A: COLOR PALETTE */}
      {(activeSection === 'palette' || activeSection === 'all') && (
        <section>
          <h3 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-4)', color: 'var(--brand-navy-primary)' }}>
            A. UltraBlue+ Color Token Architecture
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-4)' }}>
            {colorPalette.map(color => (
              <div 
                key={color.name}
                className="ub-card"
                style={{ overflow: 'hidden', cursor: 'pointer' }}
                onClick={() => copyToClipboard(color.hex, color.name)}
              >
                <div 
                  style={{ 
                    height: '80px', 
                    backgroundColor: color.hex, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: color.textColor,
                    fontWeight: 800,
                    fontSize: 'var(--font-size-md)',
                    borderBottom: '1px solid var(--border-light)'
                  }}
                >
                  {color.hex}
                </div>
                <div style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: 'var(--font-size-sm)', color: 'var(--brand-navy-primary)' }}>{color.name}</strong>
                    {copiedHex === color.name ? (
                      <span style={{ fontSize: '10px', color: 'var(--status-success-text)', fontWeight: 700 }}>Copied!</span>
                    ) : (
                      <Copy size={13} color="var(--text-muted)" />
                    )}
                  </div>
                  <code style={{ fontSize: '11px', color: 'var(--brand-blue)', display: 'block', margin: '4px 0' }}>{color.token}</code>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', margin: 0 }}>{color.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION B: TYPOGRAPHY */}
      {(activeSection === 'typography' || activeSection === 'all') && (
        <section>
          <h3 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-4)', color: 'var(--brand-navy-primary)' }}>
            B. Typography Scale (Outfit & Inter)
          </h3>
          <div className="ub-card" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Display / Hero Heading (Outfit 36px ExtraBold)</span>
              <h1 style={{ fontSize: 'var(--font-size-display)', fontWeight: 800, color: 'var(--brand-navy-primary)' }}>
                UltraBlue+ ISO 22241 Diesel Exhaust Fluid
              </h1>
            </div>
            <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Heading 1 / Module Title (Outfit 24px Bold)</span>
              <h1>Multi-Location Inventory Management Matrix</h1>
            </div>
            <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Heading 2 / Card Header (Outfit 20px Bold)</span>
              <h2>Distributor Tier Pricing & Quotation Desk</h2>
            </div>
            <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Body Text (Inter 14px Regular)</span>
              <p style={{ color: 'var(--text-primary)', maxWidth: '780px' }}>
                UltraBlue+ delivers high-purity aqueous urea solution (32.5%) manufactured with closed-loop de-ionized water filtration to protect BS-VI & Euro-VI heavy commercial fleet SCR catalysts.
              </p>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Monospace / Batch & SKU Codes (JetBrains Mono 13px)</span>
              <div style={{ fontFamily: 'var(--font-family-mono)', color: 'var(--brand-navy-primary)', fontWeight: 600, background: 'var(--bg-surface-secondary)', padding: '8px 12px', borderRadius: '4px' }}>
                SKU: UB-DEF-20L | BATCH: UB-26H-882 | MFG: 2026-07-15 | EXP: 2027-07-15
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION C: BUTTONS */}
      {(activeSection === 'buttons' || activeSection === 'all') && (
        <section>
          <h3 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-4)', color: 'var(--brand-navy-primary)' }}>
            C. Enterprise Button Hierarchy
          </h3>
          <div className="ub-card" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
              <Button variant="primary">Primary CTA (Brand Blue)</Button>
              <Button variant="secondary">Secondary (Outlined)</Button>
              <Button variant="navy">Navy Authority</Button>
              <Button variant="gold">Gold Premium Highlight</Button>
              <Button variant="success">Success Action</Button>
              <Button variant="danger">Destructive Danger</Button>
              <Button variant="ghost">Ghost Action</Button>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
              <Button size="sm" variant="primary">Small Button</Button>
              <Button size="md" variant="primary">Standard Medium</Button>
              <Button size="lg" variant="primary">Large Hero CTA</Button>
              <Button variant="primary" loading>Processing...</Button>
              <Button variant="secondary" disabled>Disabled State</Button>
            </div>
          </div>
        </section>
      )}

      {/* SECTION D: INPUTS */}
      {(activeSection === 'inputs' || activeSection === 'all') && (
        <section>
          <h3 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-4)', color: 'var(--brand-navy-primary)' }}>
            D. Standardized Form Controls
          </h3>
          <div className="ub-card" style={{ padding: 'var(--space-6)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
              <Input
                label="Customer Fleet Name"
                placeholder="e.g. Maharathi Express Cargo"
                required
                hint="Registered transport company or individual vehicle owner"
              />
              <Input
                label="Vehicle / Fleet Number"
                placeholder="OD-05-AX-4892"
                suffix="VERIFIED"
              />
              <Select
                label="Assigned Depot Location"
                options={[
                  { value: 'bhd', label: 'Bhadrak Plant & Mother Depot' },
                  { value: 'ccu', label: 'Kolkata Central Logistics Hub' },
                  { value: 'bbi', label: 'Bhubaneswar Express Terminal' }
                ]}
                required
              />
              <Input
                label="Required Volume (Litres)"
                type="number"
                placeholder="1000"
                suffix="LTR"
                error="Exceeds current local available stock (Max: 480L)"
              />
            </div>
          </div>
        </section>
      )}

      {/* SECTION E: STATUS BADGES */}
      {(activeSection === 'badges' || activeSection === 'all') && (
        <section>
          <h3 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-4)', color: 'var(--brand-navy-primary)' }}>
            E. Semantic Status Indicator Badges
          </h3>
          <div className="ub-card" style={{ padding: 'var(--space-6)', display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
            <StatusBadge status="HEALTHY" label="Healthy Stock" />
            <StatusBadge status="LOW_STOCK" label="Low Stock Warning" />
            <StatusBadge status="OUT_OF_STOCK" label="Out of Stock" />
            <StatusBadge status="APPROVED" label="Distributor Approved" />
            <StatusBadge status="PENDING_REVIEW" label="Pending KYC Review" />
            <StatusBadge status="EXPIRED" label="Batch Expired" />
            <StatusBadge status="GOLD_TIER" label="Gold Tier Distributor" />
            <StatusBadge status="NEW_INQUIRY" label="New Bulk Inquiry" />
          </div>
        </section>
      )}

      {/* SECTION F: KPI CARDS */}
      {(activeSection === 'kpis' || activeSection === 'all') && (
        <section>
          <h3 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-4)', color: 'var(--brand-navy-primary)' }}>
            F. Enterprise KPI Metric Cards
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
            <KPICard
              title="Today's POS Sales"
              value="₹ 42,332.50"
              delta="+14.2%"
              isPositive={true}
              subtext="18 Invoices processed today"
              icon={Layers}
            />
            <KPICard
              title="Active Fleet Stock"
              value="718 Buckets"
              delta="-3.5%"
              isPositive={false}
              subtext="Across 3 regional logistics hubs"
              icon={Warehouse}
            />
            <KPICard
              title="Pending Distributor Requests"
              value="1 Application"
              subtext="Utkal Freightways (Jajpur Road)"
              icon={ShieldCheck}
              goldAccent={true}
            />
            <KPICard
              title="Low Stock Alert"
              value="1 Item"
              isPositive={false}
              delta="URGENT"
              subtext="Kolkata Hub (20L Bucket)"
              icon={AlertCircle}
              iconColor="var(--status-danger)"
              iconBg="var(--status-danger-bg)"
            />
          </div>
        </section>
      )}

      {/* SECTION G: DATA TABLE */}
      {(activeSection === 'tables' || activeSection === 'all') && (
        <section>
          <h3 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-4)', color: 'var(--brand-navy-primary)' }}>
            G. Standardized Enterprise Data Table
          </h3>
          <DataTable
            title="Live Inventory Overview"
            data={inventory}
            columns={[
              { header: 'Product & SKU', accessor: 'productName', render: (val, row) => (
                <div>
                  <strong>{val}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{row.sku}</div>
                </div>
              )},
              { header: 'Hub Location', accessor: 'locationName' },
              { header: 'Available Qty', accessor: 'availableStock', render: (val) => (
                <strong style={{ fontSize: '14px', color: val === 0 ? 'var(--status-danger)' : 'var(--brand-navy-primary)' }}>
                  {val} units
                </strong>
              )},
              { header: 'Batch Code', accessor: 'batchNo', render: (val) => (
                <code style={{ fontSize: '12px', background: 'var(--bg-surface-secondary)', padding: '2px 6px', borderRadius: '4px' }}>
                  {val}
                </code>
              )},
              { header: 'Expiry Date', accessor: 'expDate' },
              { header: 'Stock Status', accessor: 'status', render: (val) => <StatusBadge status={val} /> },
              { header: 'Action', accessor: 'id', render: () => (
                <Button size="sm" variant="secondary" onClick={() => setIsModalOpen(true)}>
                  Refill Stock
                </Button>
              )}
            ]}
          />
        </section>
      )}

      {/* SECTION H: PRODUCT CARDS */}
      {(activeSection === 'products' || activeSection === 'all') && (
        <section>
          <h3 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-4)', color: 'var(--brand-navy-primary)' }}>
            H. B2B & Public Product Cards
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)' }}>
            {products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                isDistributorView={false}
                onOrderClick={() => alert(`Order clicked for ${product.name}`)}
                onInquireClick={() => alert(`Inquiry initiated for ${product.name}`)}
              />
            ))}
          </div>
        </section>
      )}

      {/* SECTION I: FEEDBACK STATES */}
      {(activeSection === 'feedback' || activeSection === 'all') && (
        <section>
          <h3 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-4)', color: 'var(--brand-navy-primary)' }}>
            I. Feedback, Empty & Error States
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <ErrorBanner 
              title="PostgreSQL Inventory Sync Warning"
              message="Depot Central offline cache active. Transactions are queued for automatic synchronization."
              onRetry={() => alert('Retrying sync...')}
            />
            <EmptyState
              title="No Pending Orders"
              description="All B2B distributor dispatch orders for this cycle have been packed and invoiced."
              actionLabel="Create Dispatch Order"
              onActionClick={() => alert('New dispatch order modal')}
            />
            <SkeletonLoader type="card" count={2} />
          </div>
        </section>
      )}

      {/* Interactive Modal Demonstration */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Stock Refill Authorization"
        subtitle="PostgreSQL Batch Allocation Desk"
        icon={Warehouse}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => { alert('Stock refilled successfully!'); setIsModalOpen(false); }}>
              Confirm Refill
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Select
            label="Target Storage Depot"
            options={[
              { value: 'bhd', label: 'Bhadrak Plant & Mother Depot' },
              { value: 'ccu', label: 'Kolkata Central Logistics Hub' },
              { value: 'bbi', label: 'Bhubaneswar Express Terminal' }
            ]}
          />
          <Input label="Refill Batch Number" placeholder="UB-26H-991" required />
          <Input label="Quantity (Units / Litres)" type="number" placeholder="200" required />
        </div>
      </Modal>
    </div>
  );
};
