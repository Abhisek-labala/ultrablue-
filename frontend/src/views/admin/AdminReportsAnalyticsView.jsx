import React from 'react';
import { 
  BarChart3, 
  Download, 
  TrendingUp, 
  CreditCard, 
  Truck, 
  MapPin, 
  QrCode, 
  Clock, 
  CheckCircle2, 
  FileText 
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { KPICard } from '../../components/ui/KPICard';

export const AdminReportsAnalyticsView = ({ 
  reportSummary = null, 
  invoices = [], 
  distributors = [], 
  inquiries = [], 
  inventory = [], 
  exportToCSV, 
  onShowToast 
}) => {
  const totalSalesVal = invoices.reduce((a, c) => a + (Number(c.grandTotal) || 0), 0);
  const totalLiters = invoices.reduce((a, c) => a + (Number(c.quantityLiters) || Number(c.quantity) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-card)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-medium)', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={20} color="var(--brand-blue)" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Executive Audit Reports, Logistics Analytics & Fleet Settlement</h3>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
            Comprehensive reporting for multi-tier sales revenues, GST tax compliance, distributor credit ledger, and GPS tanker dispatches.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button size="sm" variant="secondary" icon={Download} onClick={() => {
            const auditData = [
              { Metric: 'Total Gross Invoiced', Value: `₹ ${totalSalesVal.toFixed(2)}` },
              { Metric: 'Total Volume Dispensed', Value: `${totalLiters.toFixed(2)} Litres` },
              { Metric: 'Total POS Invoices', Value: invoices.length },
              { Metric: 'Total Authorized Distributors', Value: distributors.length },
              { Metric: 'Total Commercial Inquiries', Value: inquiries.length },
              { Metric: 'Factory Hubs Monitored', Value: 3 },
              { Metric: 'GST Standard Tax Extracted', Value: `₹ ${(totalSalesVal * 0.18 / 1.18).toFixed(2)}` }
            ];
            exportToCSV('UltraBlue_Executive_Audit_Report', auditData);
          }}>
            Export Audit Suite (CSV)
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <KPICard
          title="Total Gross Invoiced"
          value={`₹ ${totalSalesVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          delta="+28.4% YoY"
          isPositive={true}
          subtext="Verified digital invoices"
          icon={TrendingUp}
        />
        <KPICard
          title="Volume Dispensed (Liters)"
          value={`${totalLiters.toLocaleString('en-IN')} L`}
          delta="Heavy Fleet Fueling"
          isPositive={true}
          subtext="AUS 32 DEF & Pure Fluid"
          icon={Truck}
          iconColor="var(--brand-cyan)"
        />
        <KPICard
          title="Active B2B Credit Extended"
          value={`₹ ${distributors.reduce((a, d) => a + (Number(d.creditLimit) || 0), 0).toLocaleString('en-IN')}`}
          delta="15-30 Days Cycle"
          isPositive={true}
          subtext="Authorized revolving lines"
          icon={CreditCard}
          goldAccent={true}
        />
      </div>

      {/* Volume Breakdown by Pack Size */}
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '12px', padding: '20px' }}>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart3 size={16} color="var(--brand-cyan)" />
          <span>Regional Fleet Consumption Breakdown by Pack Configuration</span>
        </h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span><strong>20L Canisters / Buckets</strong> (Primary Highway Fleet Demand)</span>
              <strong>58% (14,500 L)</strong>
            </div>
            <div style={{ height: '8px', backgroundColor: 'var(--bg-app)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: '58%', height: '100%', backgroundColor: 'var(--brand-blue)', borderRadius: '4px' }}></div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span><strong>210L HDPE Barrel Drums</strong> (Mining & Industrial Depots)</span>
              <strong>27% (6,750 L)</strong>
            </div>
            <div style={{ height: '8px', backgroundColor: 'var(--bg-app)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: '27%', height: '100%', backgroundColor: 'var(--brand-gold)', borderRadius: '4px' }}></div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span><strong>1000L Heavy IBC Totes & Direct Dispenser Pump Refills</strong></span>
              <strong>15% (3,750 L)</strong>
            </div>
            <div style={{ height: '8px', backgroundColor: 'var(--bg-app)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: '15%', height: '100%', backgroundColor: 'var(--brand-cyan)', borderRadius: '4px' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Online Payment & GPS Fleet Tracker Simulation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {/* Payment Simulator Card */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <QrCode size={18} color="var(--brand-cyan)" />
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>Real-Time UPI QR & Payment Engine</h4>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 16px 0' }}>
            Instant digital payment reconciliation for station dispensing terminals and distributor invoice settlements via UPI, NEFT/RTGS, and RuPay.
          </p>
          <div style={{ backgroundColor: 'var(--bg-app)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>UPI VPA Handler</span>
              <strong style={{ display: 'block', fontSize: '12px', color: 'var(--brand-blue)' }}>ayushgreenenergy@icici</strong>
            </div>
            <Button size="sm" variant="gold" onClick={() => { if (onShowToast) onShowToast('Simulated real-time payment webhook verification.'); }}>
              Test Settlement
            </Button>
          </div>
        </div>

        {/* GPS Fleet Delivery Card */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Truck size={18} color="var(--brand-gold)" />
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>Bulk Tanker Dispatch & GPS Tracker</h4>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 16px 0' }}>
            Dedicated stainless steel 15,000L and 25,000L insulated road tankers for bulk transport direct to distributor staging tanks.
          </p>
          <div style={{ backgroundColor: 'var(--bg-app)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Active Tanker OD-22-T-9841</span>
              <strong style={{ display: 'block', fontSize: '12px', color: '#10B981' }}>En Route: Bhadrak → Keonjhar Hub</strong>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-gold)' }}>Live GPS: 74 km</span>
          </div>
        </div>
      </div>
    </div>
  );
};
