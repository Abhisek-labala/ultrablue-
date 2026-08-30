import React from 'react';
import { 
  TrendingUp, 
  Warehouse, 
  Users, 
  ShieldCheck, 
  ShoppingCart, 
  MessageSquare, 
  BarChart3, 
  Package, 
  ArrowRight,
  BadgePercent,
  Sparkles,
  FileText
} from 'lucide-react';
import { KPICard } from '../../components/ui/KPICard';
import { Button } from '../../components/ui/Button';

export const AdminExecutiveOverview = ({ 
  inventory = [], 
  distributors = [], 
  operators = [], 
  invoices = [], 
  inquiries = [], 
  products = [],
  promotions = [],
  reportSummary = null,
  onNavigate 
}) => {
  const pendingApprovalsCount = distributors.filter(d => d.accountStatus === 'PENDING_REVIEW' || d.status === 'PENDING_REVIEW').length;
  const activeOperatorsCount = operators.filter(o => o.status === 'ACTIVE').length;
  const lowStockCount = inventory.filter(i => i.status === 'LOW_STOCK' || i.status === 'OUT_OF_STOCK' || i.availableStock <= i.minThreshold).length;
  const totalSalesVal = invoices.reduce((a, c) => a + (Number(c.grandTotal) || 0), 0);
  const totalStockUnits = inventory.reduce((a, c) => a + (Number(c.availableStock) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Welcome & KPI Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-card)', padding: '20px 24px', borderRadius: '12px', border: '1px solid var(--border-medium)', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Ayush Green Energy • Executive Command Center
          </span>
          <h2 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: 800 }}>Master Plant & Operations Dashboard</h2>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button size="sm" variant="secondary" icon={Package} onClick={() => onNavigate('admin_products')}>
            Manage Products
          </Button>
          <Button size="sm" variant="gold" icon={BadgePercent} onClick={() => onNavigate('admin_prices')}>
            Pricing Engine
          </Button>
        </div>
      </div>

      {/* KPI Overview Matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <KPICard
          title="Aggregated Sales Revenue"
          value={`₹ ${totalSalesVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          delta="+24.8%"
          isPositive={true}
          subtext={`${invoices.length} Verified bills recorded`}
          icon={TrendingUp}
        />
        <KPICard
          title="Live Factory Inventory"
          value={`${totalStockUnits.toLocaleString('en-IN')} Units`}
          delta={lowStockCount > 0 ? `${lowStockCount} Low Stock Alert` : 'OPTIMAL'}
          isPositive={lowStockCount === 0}
          subtext="3 Multi-Hub Depots Monitored"
          icon={Warehouse}
          iconColor={lowStockCount > 0 ? 'var(--status-danger)' : 'var(--status-success)'}
          iconBg={lowStockCount > 0 ? 'var(--status-danger-bg)' : 'var(--status-success-bg)'}
        />
        <KPICard
          title="Distributor Accounts"
          value={`${distributors.length} Partners`}
          delta={pendingApprovalsCount > 0 ? `${pendingApprovalsCount} KYC Pending` : 'All Approved'}
          isPositive={pendingApprovalsCount === 0}
          subtext={pendingApprovalsCount > 0 ? 'Review & assign price tiers' : 'Active B2B Logistics Matrix'}
          icon={Users}
          goldAccent={pendingApprovalsCount > 0}
        />
        <KPICard
          title="Sales Operators"
          value={`${operators.length} Active`}
          delta={`${activeOperatorsCount} Terminals Online`}
          isPositive={true}
          subtext="Direct POS Dispensing Stations"
          icon={ShieldCheck}
          iconColor="var(--brand-cyan)"
        />
      </div>

      {/* Quick Access Matrix Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Card 1: Product & Pricing Engine Summary */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={18} color="var(--brand-blue)" />
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Catalogue & Pricing Matrix</h4>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{products.length} Products</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              Configured master products with pack sizes, GST inclusive/exclusive taxation modes, and multi-tier wholesale rates.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', backgroundColor: 'var(--bg-app)', padding: '10px', borderRadius: '8px', marginBottom: '14px' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Active SKUs:</span> <strong>{products.reduce((acc, p) => acc + (p.packOptions?.length || 0), 0)} Variants</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Avg Margin:</span> <strong style={{ color: 'var(--status-success)' }}>24.5% ROI</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>GST Standard:</span> <strong>18% AUS 32</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Active Offers:</span> <strong>{promotions.length} Live</strong></div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button size="sm" variant="secondary" icon={Package} onClick={() => onNavigate('admin_products')} style={{ flex: 1 }}>
              Products
            </Button>
            <Button size="sm" variant="gold" icon={BadgePercent} onClick={() => onNavigate('admin_prices')} style={{ flex: 1 }}>
              Pricing
            </Button>
          </div>
        </div>

        {/* Card 2: Sales & Inquiries Summary */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingCart size={18} color="var(--brand-cyan)" />
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>POS Billing & Leads</h4>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{invoices.length} Bills</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              Real-time POS invoice records from Bhadrak Depot and customer high-volume fleet inquiries across Odisha.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', backgroundColor: 'var(--bg-app)', padding: '10px', borderRadius: '8px', marginBottom: '14px' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Gross Invoiced:</span> <strong>₹{totalSalesVal.toLocaleString('en-IN')}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Tax Collected:</span> <strong>₹{(totalSalesVal * 0.18 / 1.18).toFixed(0)}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Inquiries:</span> <strong>{inquiries.length} Leads</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Distributors:</span> <strong>{distributors.length} Stockists</strong></div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button size="sm" variant="secondary" icon={ShoppingCart} onClick={() => onNavigate('admin_sales')} style={{ flex: 1 }}>
              Sales Bills
            </Button>
            <Button size="sm" variant="primary" icon={MessageSquare} onClick={() => onNavigate('admin_inquiries')} style={{ flex: 1 }}>
              Enquiries
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
