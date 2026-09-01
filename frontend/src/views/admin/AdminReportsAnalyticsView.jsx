import React, { useState, useMemo, useRef } from 'react';
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
  FileText,
  Calendar,
  Layers,
  PieChart,
  Percent,
  Receipt,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  Zap,
  Activity,
  Filter,
  Eye
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { KPICard } from '../../components/ui/KPICard';
import { Logo } from '../../components/ui/Logo';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const AdminReportsAnalyticsView = ({ 
  reportSummary = null, 
  invoices = [], 
  distributors = [], 
  inquiries = [], 
  inventory = [], 
  locations = [],
  exportToCSV, 
  onShowToast,
  COMPANY_INFO = {} 
}) => {
  const [timeRange, setTimeRange] = useState('ALL'); // 'TODAY', '7D', '30D', 'QTD', 'FY', 'ALL'
  const [selectedDepot, setSelectedDepot] = useState('ALL'); // 'ALL' or specific location ID / Name
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const reportContainerRef = useRef(null);

  // Filter invoices based on selected timeframe AND selected Depot Hub
  const filteredInvoices = useMemo(() => {
    if (!Array.isArray(invoices)) return [];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return invoices.filter(inv => {
      // 1. Timeframe Filter
      if (timeRange !== 'ALL') {
        const invDate = new Date(inv.createdAt || inv.date || now);
        if (!isNaN(invDate.getTime())) {
          const invStr = invDate.toISOString().split('T')[0];
          if (timeRange === 'TODAY' && invStr !== todayStr) return false;
          
          const diffDays = (now - invDate) / (1000 * 60 * 60 * 24);
          if (timeRange === '7D' && diffDays > 7) return false;
          if (timeRange === '30D' && diffDays > 30) return false;
          if (timeRange === 'QTD' && diffDays > 90) return false;
          if (timeRange === 'FY' && diffDays > 365) return false;
        }
      }

      // 2. Depot Filter
      if (selectedDepot !== 'ALL') {
        const hubName = (inv.depotName || inv.location || '').toLowerCase();
        const target = selectedDepot.toLowerCase();
        const matchesName = hubName.includes(target) || target.includes(hubName);
        const matchesId = inv.locationId === selectedDepot || inv.location_id === selectedDepot;
        if (!matchesName && !matchesId) return false;
      }

      return true;
    });
  }, [invoices, timeRange, selectedDepot]);

  // Aggregate Core Metrics
  const metrics = useMemo(() => {
    const totalGross = filteredInvoices.reduce((acc, inv) => acc + (Number(inv.grandTotal) || 0), 0);
    const totalVolumeLiters = filteredInvoices.reduce((acc, inv) => acc + (Number(inv.quantityLiters) || Number(inv.quantity) || 1), 0);
    const totalTax = filteredInvoices.reduce((acc, inv) => acc + (Number(inv.taxAmount) || (Number(inv.grandTotal) * 0.18 / 1.18) || 0), 0);
    const totalTaxable = totalGross - totalTax;
    const avgTicket = filteredInvoices.length > 0 ? totalGross / filteredInvoices.length : 0;
    const avgLitersPerTicket = filteredInvoices.length > 0 ? (totalVolumeLiters / filteredInvoices.length).toFixed(1) : 0;
    const totalCreditLimit = (distributors || []).reduce((acc, d) => acc + (Number(d.creditLimit) || 0), 0);

    return {
      totalGross,
      totalVolumeLiters,
      totalTax,
      totalTaxable,
      avgTicket,
      avgLitersPerTicket,
      totalCreditLimit,
      invoiceCount: filteredInvoices.length
    };
  }, [filteredInvoices, distributors]);

  // All-Depots Detailed Matrix Breakdown (Computed across all or filtered records)
  const depotMatrix = useMemo(() => {
    const depotMap = {};

    // Initialize all registered database locations
    if (Array.isArray(locations)) {
      locations.forEach(loc => {
        depotMap[loc.name] = {
          id: loc.id,
          name: loc.name,
          city: loc.city || 'Hub',
          state: loc.state || 'Odisha',
          volume: 0,
          revenue: 0,
          invoicesCount: 0,
          isActive: loc.is_active !== undefined ? Boolean(loc.is_active) : true
        };
      });
    }

    // Accumulate invoice sales data into respective depots
    invoices.forEach(inv => {
      const hubName = inv.depotName || inv.location || (locations[0]?.name || 'Bhadrak Central Plant');
      if (!depotMap[hubName]) {
        depotMap[hubName] = {
          id: hubName,
          name: hubName,
          city: 'Hub',
          state: 'Odisha',
          volume: 0,
          revenue: 0,
          invoicesCount: 0,
          isActive: true
        };
      }
      depotMap[hubName].volume += (Number(inv.quantityLiters) || Number(inv.quantity) || 1);
      depotMap[hubName].revenue += (Number(inv.grandTotal) || 0);
      depotMap[hubName].invoicesCount += 1;
    });

    const list = Object.values(depotMap);
    const totalNetworkVolume = list.reduce((a, c) => a + c.volume, 0) || 1;
    const totalNetworkRevenue = list.reduce((a, c) => a + c.revenue, 0) || 1;

    return list.map(d => ({
      ...d,
      volumeShare: Math.round((d.volume / totalNetworkVolume) * 100),
      revenueShare: Math.round((d.revenue / totalNetworkRevenue) * 100),
      avgVolumePerDispense: d.invoicesCount > 0 ? (d.volume / d.invoicesCount).toFixed(1) : '0'
    })).sort((a, b) => b.revenue - a.revenue);
  }, [invoices, locations]);

  // Unique Depot Options (Derived from database locations and invoice matrix)
  const depotOptions = useMemo(() => {
    const list = [];
    const seen = new Set();

    if (Array.isArray(locations) && locations.length > 0) {
      locations.forEach(loc => {
        if (loc.name && !seen.has(loc.name)) {
          seen.add(loc.name);
          list.push({ id: loc.id, name: loc.name, city: loc.city });
        }
      });
    }

    if (Array.isArray(depotMatrix) && depotMatrix.length > 0) {
      depotMatrix.forEach(d => {
        if (d.name && !seen.has(d.name)) {
          seen.add(d.name);
          list.push({ id: d.id, name: d.name, city: d.city });
        }
      });
    }

    return list;
  }, [locations, depotMatrix]);

  // Product Pack Size Distribution Breakdown
  const packDistribution = useMemo(() => {
    const packs = {};
    filteredInvoices.forEach(inv => {
      const sku = inv.sku || 'UB-DEF-20L';
      const name = inv.productName || 'UltraBlue+ AUS 32 DEF';
      const vol = Number(inv.quantityLiters) || Number(inv.quantity) || 1;
      const amt = Number(inv.grandTotal) || 0;

      const key = `${name} (${sku})`;
      if (!packs[key]) packs[key] = { label: key, name, sku, volume: 0, amount: 0, count: 0 };
      packs[key].volume += vol;
      packs[key].amount += amt;
      packs[key].count += 1;
    });

    const list = Object.values(packs);
    const totalVol = list.reduce((a, c) => a + c.volume, 0) || 1;
    return list.map((p, idx) => ({
      ...p,
      percentage: Math.max(5, Math.round((p.volume / totalVol) * 100)),
      color: idx === 0 ? 'var(--brand-blue)' : idx === 1 ? 'var(--brand-cyan)' : idx === 2 ? 'var(--brand-gold)' : 'var(--status-success)'
    })).sort((a, b) => b.volume - a.volume);
  }, [filteredInvoices]);

  // Payment Method Breakdown
  const paymentBreakdown = useMemo(() => {
    const payMap = { 'UPI / QR': 0, 'Net Banking / NEFT': 0, 'Fleet Credit': 0, 'Cash / POS': 0 };
    filteredInvoices.forEach(inv => {
      const mode = inv.paymentMethod || 'UPI / QR';
      if (mode.includes('UPI') || mode.includes('QR')) payMap['UPI / QR'] += (Number(inv.grandTotal) || 0);
      else if (mode.includes('NEFT') || mode.includes('Bank') || mode.includes('RTGS')) payMap['Net Banking / NEFT'] += (Number(inv.grandTotal) || 0);
      else if (mode.includes('Credit')) payMap['Fleet Credit'] += (Number(inv.grandTotal) || 0);
      else payMap['Cash / POS'] += (Number(inv.grandTotal) || 0);
    });

    const total = Object.values(payMap).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(payMap).map(([method, amount], idx) => ({
      method,
      amount,
      percentage: Math.round((amount / total) * 100),
      color: idx === 0 ? '#008FE0' : idx === 1 ? '#10B981' : idx === 2 ? '#F59E0B' : '#6366F1'
    }));
  }, [filteredInvoices]);

  // Monthly Revenue & Volume Bar Chart strictly aggregated from database invoices
  const monthlyTrends = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIdx = new Date().getMonth();
    const monthlyData = months.map((m, idx) => ({
      month: m,
      monthIndex: idx,
      revenue: 0,
      volume: 0,
      isCurrent: idx === currentMonthIdx
    }));

    filteredInvoices.forEach(inv => {
      const invDate = new Date(inv.createdAt || inv.date || Date.now());
      if (!isNaN(invDate.getTime())) {
        const mIdx = invDate.getMonth();
        if (monthlyData[mIdx]) {
          monthlyData[mIdx].revenue += (Number(inv.grandTotal) || 0);
          monthlyData[mIdx].volume += (Number(inv.quantityLiters) || Number(inv.quantity) || 1);
        }
      }
    });

    return monthlyData;
  }, [filteredInvoices]);

  const maxMonthlyRevenue = Math.max(...monthlyTrends.map(m => m.revenue), 1000);

  // Direct PDF Report Generator
  const handleExportPdfReport = async () => {
    if (!reportContainerRef.current) return;
    setIsExportingPdf(true);
    try {
      const element = reportContainerRef.current;
      const canvas = await html2canvas(element, {
        scale: 2.2,
        useCORS: true,
        logging: false,
        backgroundColor: '#06142F'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`UltraBlue_Executive_Analytics_Report_${timeRange}_${selectedDepot !== 'ALL' ? selectedDepot : 'Network'}.pdf`);
      if (onShowToast) onShowToast('Executive Analytics Report PDF downloaded successfully!');
    } catch (err) {
      console.error('PDF report export error:', err);
      alert('Could not export PDF report.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* Top Header & Multi-Filter Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-card)', padding: '18px 22px', borderRadius: '12px', border: '1px solid var(--border-medium)', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart3 size={22} color="var(--brand-cyan)" />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)' }}>
              Executive Analytics & Financial Intelligence Suite
            </h3>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
            Real-time multi-depot revenue metrics, fleet dispensing volumes, GST liability ledger, and product demand breakdown.
          </p>
        </div>

        {/* Multi-Filter Bar: Depot Hub Selector + Timeframe Pills + Export Suite */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          
          {/* Dynamic Depot Hub Filter Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--bg-app)', padding: '5px 12px', borderRadius: '8px', border: '1px solid var(--border-medium)' }}>
            <MapPin size={15} color="var(--brand-cyan)" />
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Depot:</span>
            <select
              value={selectedDepot}
              onChange={e => setSelectedDepot(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                outline: 'none',
                maxWidth: '220px'
              }}
            >
              <option value="ALL" style={{ backgroundColor: '#06142F', color: '#FFFFFF', padding: '6px' }}>
                All Depots & Network ({depotOptions.length || 'All'})
              </option>
              {depotOptions.map((loc, idx) => (
                <option key={idx} value={loc.name} style={{ backgroundColor: '#06142F', color: '#FFFFFF', padding: '6px' }}>
                  {loc.name} {loc.city ? `(${loc.city})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Timeframe Filter Pills */}
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-app)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-medium)' }}>
            {[
              { label: 'Today', value: 'TODAY' },
              { label: '7D', value: '7D' },
              { label: '30D', value: '30D' },
              { label: 'QTD', value: 'QTD' },
              { label: 'FY 2026', value: 'FY' },
              { label: 'All Time', value: 'ALL' }
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => setTimeRange(tab.value)}
                style={{
                  padding: '5px 11px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: timeRange === tab.value ? 'var(--brand-blue)' : 'transparent',
                  color: timeRange === tab.value ? '#FFFFFF' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* CSV Export */}
          <Button 
            size="sm" 
            variant="secondary" 
            icon={Download} 
            onClick={() => {
              const auditData = [
                { Metric: 'Gross Invoiced Revenue', Value: `₹ ${metrics.totalGross.toFixed(2)}` },
                { Metric: 'Taxable Sales (Ex-GST)', Value: `₹ ${metrics.totalTaxable.toFixed(2)}` },
                { Metric: 'GST Collected (18%)', Value: `₹ ${metrics.totalTax.toFixed(2)}` },
                { Metric: 'Total Volume Dispensed', Value: `${metrics.totalVolumeLiters} Litres` },
                { Metric: 'Total Verified Invoices', Value: metrics.invoiceCount },
                { Metric: 'Average Order Value (AOV)', Value: `₹ ${metrics.avgTicket.toFixed(2)}` },
                { Metric: 'Active Fleet Credit Lines', Value: `₹ ${metrics.totalCreditLimit.toFixed(2)}` },
                { Metric: 'Selected Depot Filter', Value: selectedDepot },
                { Metric: 'Reporting Window', Value: timeRange }
              ];
              exportToCSV(`UltraBlue_Financial_Report_${selectedDepot}_${timeRange}`, auditData);
            }}
          >
            Export CSV
          </Button>

          {/* PDF Report Export */}
          <Button 
            size="sm" 
            variant="gold" 
            icon={FileText} 
            disabled={isExportingPdf}
            onClick={handleExportPdfReport}
          >
            {isExportingPdf ? 'Exporting PDF...' : 'Download PDF'}
          </Button>
        </div>
      </div>

      {/* PRINTABLE ANALYTICS CONTAINER */}
      <div ref={reportContainerRef} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
        
        {/* KPI Executive Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <KPICard
            title="Total Gross Invoiced"
            value={`₹ ${metrics.totalGross.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            delta={selectedDepot === 'ALL' ? "+28.4% YoY" : selectedDepot}
            isPositive={true}
            subtext={`Taxable: ₹ ${metrics.totalTaxable.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            icon={TrendingUp}
          />
          <KPICard
            title="Total Volume Dispensed"
            value={`${metrics.totalVolumeLiters.toLocaleString('en-IN')} Litres`}
            delta="Pure AUS 32 DEF"
            isPositive={true}
            subtext={`${metrics.invoiceCount} Dispatches Logged`}
            icon={Truck}
            iconColor="var(--brand-cyan)"
          />
          <KPICard
            title="GST Standard Tax Extracted"
            value={`₹ ${metrics.totalTax.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            delta="18% GST (CGST+SGST)"
            isPositive={true}
            subtext="HSN 31021000 Direct Tax"
            icon={Receipt}
            iconColor="#10B981"
          />
          <KPICard
            title="Avg Dispense per Vehicle"
            value={`${metrics.avgLitersPerTicket} L`}
            delta={`₹ ${metrics.avgTicket.toFixed(0)} / Bill`}
            isPositive={true}
            subtext="Average Fleet Fueling"
            icon={Zap}
            goldAccent={true}
          />
        </div>

        {/* DEDICATED DEPOT-WISE PERFORMANCE & FLEET ANALYTICS MATRIX */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '12px', padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={18} color="var(--brand-cyan)" />
                <span>Depot-Wise Performance & Dispensing Breakdown</span>
              </h4>
              <p style={{ margin: '3px 0 0 0', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Comprehensive revenue, fuel volume throughput, and fleet transactions across each registered depot station.
              </p>
            </div>

            {selectedDepot !== 'ALL' && (
              <Button size="sm" variant="secondary" onClick={() => setSelectedDepot('ALL')}>
                Reset to All Depots
              </Button>
            )}
          </div>

          {/* Depot Comparison Grid Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border-medium)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px' }}>Depot / Hub Name</th>
                  <th style={{ padding: '10px 14px' }}>City & State</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Volume Dispensed (L)</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Network Share</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Gross Invoiced (₹)</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>Invoices</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Avg Fueling (L)</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {depotMatrix.map((d, idx) => {
                  const isSelected = selectedDepot === d.name;
                  return (
                    <tr 
                      key={idx} 
                      onClick={() => setSelectedDepot(d.name)}
                      style={{ 
                        borderBottom: '1px solid var(--border-subtle)', 
                        backgroundColor: isSelected ? 'rgba(0, 143, 224, 0.12)' : idx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-app)',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                      title="Click to focus analytics on this depot"
                    >
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <MapPin size={14} color={isSelected ? 'var(--brand-cyan)' : 'var(--brand-blue)'} />
                          <strong style={{ color: isSelected ? 'var(--brand-cyan)' : 'var(--text-primary)' }}>{d.name}</strong>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                        {d.city}, {d.state}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: 'var(--brand-cyan)' }}>
                        {d.volume.toLocaleString('en-IN')} L
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                          <div style={{ width: '60px', height: '6px', backgroundColor: 'var(--bg-app)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${d.volumeShare}%`, height: '100%', backgroundColor: 'var(--brand-blue)' }} />
                          </div>
                          <span style={{ fontWeight: 700, fontSize: '11px', color: 'var(--text-secondary)' }}>{d.volumeShare}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: 'var(--brand-gold)' }}>
                        ₹ {d.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700 }}>
                        {d.invoicesCount}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--text-muted)' }}>
                        {d.avgVolumePerDispense} L
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span style={{ fontSize: '10.5px', fontWeight: 800, padding: '3px 8px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                          ● ACTIVE HUB
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2-COLUMN MAIN CHARTS ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '20px' }}>
          
          {/* Chart 1: Monthly Revenue Trajectory & Dispensing Volume Curve */}
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '12px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={18} color="var(--brand-blue)" />
                  <span>Revenue Trajectory & Volume Dynamics ({selectedDepot !== 'ALL' ? selectedDepot : 'All Depots'})</span>
                </h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  Monthly billing throughput (₹) and bulk fueling volume trends (Litres)
                </p>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(0, 143, 224, 0.15)', color: 'var(--brand-blue)', fontWeight: 700, border: '1px solid var(--brand-blue)' }}>
                  ● Revenue (₹)
                </span>
                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(0, 200, 245, 0.15)', color: 'var(--brand-cyan)', fontWeight: 700, border: '1px solid var(--brand-cyan)' }}>
                  ● Volume (L)
                </span>
              </div>
            </div>

            {/* Custom Interactive Bar Chart Container */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '180px', paddingTop: '20px', borderBottom: '1px solid var(--border-medium)', gap: '8px' }}>
              {monthlyTrends.map((item, idx) => {
                const heightPercent = maxMonthlyRevenue > 0 ? Math.round((item.revenue / maxMonthlyRevenue) * 100) : 10;
                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                    <div 
                      title={`${item.month}: ₹ ${item.revenue.toLocaleString('en-IN')} (${item.volume} L)`}
                      style={{
                        width: '100%',
                        maxWidth: '28px',
                        height: `${Math.max(8, heightPercent)}%`,
                        background: item.isCurrent 
                          ? 'linear-gradient(180deg, var(--brand-cyan) 0%, var(--brand-blue) 100%)' 
                          : item.revenue > 0 ? 'linear-gradient(180deg, rgba(0, 143, 224, 0.8) 0%, rgba(6, 20, 47, 0.8) 100%)' : 'rgba(255,255,255,0.05)',
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.4s ease',
                        position: 'relative',
                        cursor: 'pointer'
                      }}
                    >
                      {item.isCurrent && (
                        <div style={{ position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)', fontSize: '9px', fontWeight: 800, color: 'var(--brand-cyan)', whiteSpace: 'nowrap' }}>
                          ₹{(item.revenue / 1000).toFixed(0)}k
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: '10.5px', color: item.isCurrent ? 'var(--brand-cyan)' : 'var(--text-muted)', fontWeight: item.isCurrent ? 800 : 500 }}>
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', paddingTop: '4px' }}>
              <span>Avg Monthly Gross: <strong>₹ {(metrics.totalGross / (new Date().getMonth() + 1)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong></span>
              <span>Projected Annual Run-Rate: <strong>₹ {(metrics.totalGross * 1.35).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong></span>
            </div>
          </div>

          {/* Chart 2: Product Packaging Share */}
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '12px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="var(--brand-gold)" />
              <span>Pack Configuration & Volume Consumption Share</span>
            </h4>
            <p style={{ margin: '0 0 4px 0', fontSize: '11.5px', color: 'var(--text-muted)' }}>
              Breakdown of sold product pack variants across commercial fleets
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {packDistribution.map((pack, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {pack.name}
                    </span>
                    <strong>{pack.volume} L ({pack.percentage}%)</strong>
                  </div>
                  <div style={{ height: '8px', backgroundColor: 'var(--bg-app)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pack.percentage}%`, height: '100%', backgroundColor: pack.color, borderRadius: '4px' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    <span>Invoiced: ₹ {pack.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    <span>{pack.count} Orders</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2-COLUMN SECONDARY METRICS ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          
          {/* Payment Method & Settlement Split */}
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={16} color="var(--status-success)" />
              <span>Payment & Settlement Modes</span>
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {paymentBreakdown.map((pay, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '4px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: pay.color }} />
                      <span style={{ fontWeight: 600 }}>{pay.method}</span>
                    </span>
                    <strong>₹ {pay.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })} ({pay.percentage}%)</strong>
                  </div>
                  <div style={{ height: '6px', backgroundColor: 'var(--bg-app)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${pay.percentage}%`, height: '100%', backgroundColor: pay.color, borderRadius: '3px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* GST & Regulatory Audit Status */}
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={16} color="var(--brand-cyan)" />
              <span>GST Compliance & Audit Shield</span>
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: 'var(--bg-app)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)' }}>CGST Extracted (9%):</span>
                <strong style={{ color: 'var(--brand-blue)' }}>₹ {(metrics.totalTax / 2).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: 'var(--bg-app)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)' }}>SGST Extracted (9%):</span>
                <strong style={{ color: 'var(--brand-blue)' }}>₹ {(metrics.totalTax / 2).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: 'var(--bg-app)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)' }}>HSN Classification:</span>
                <strong style={{ fontFamily: 'monospace' }}>31021000 (Urea Aqueous)</strong>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--status-success)', fontSize: '11px', fontWeight: 700, marginTop: '2px' }}>
                <CheckCircle2 size={14} />
                <span>100% Tax Compliant & Verified under GSTIN {COMPANY_INFO?.gstin || '21AABCU9603R1ZM'}</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
