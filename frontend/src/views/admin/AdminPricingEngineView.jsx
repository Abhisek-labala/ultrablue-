import React, { useState } from 'react';
import { 
  BadgePercent, 
  Search, 
  Download, 
  Edit3, 
  CheckCircle2, 
  Layers, 
  Percent, 
  TrendingUp, 
  ShieldCheck,
  FileText
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { ProductAPI } from '../../services/api';

export const AdminPricingEngineView = ({ 
  products = [], 
  onRefresh, 
  onShowToast, 
  exportToCSV 
}) => {
  const [pricingSearchQuery, setPricingSearchQuery] = useState('');
  const [isPriceEditModalOpen, setIsPriceEditModalOpen] = useState(false);
  const [priceEditForm, setPriceEditForm] = useState({
    productId: '',
    productName: '',
    hsnCode: '',
    gstRate: 18,
    isGstInclusive: true,
    packVariants: []
  });

  const handleOpenEditPrice = (product) => {
    setPriceEditForm({
      productId: product.id,
      productName: product.name,
      hsnCode: product.hsnCode || product.hsn_code || '',
      gstRate: product.gstRate !== undefined ? Number(product.gstRate) : 18,
      isGstInclusive: product.isGstInclusive !== undefined ? Boolean(product.isGstInclusive) : true,
      packVariants: (product.packOptions || []).map(po => ({
        sku: po.sku,
        pack_size: po.size,
        volume_in_litres: parseFloat(po.size) || 0,
        standard_mrp: po.mrp,
        distributor_base_price: po.distributorPrice,
        is_popular: Boolean(po.isPopular)
      }))
    });
    setIsPriceEditModalOpen(true);
  };

  const handleSavePrice = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        gst_rate: Number(priceEditForm.gstRate) || 18,
        is_gst_inclusive: Boolean(priceEditForm.isGstInclusive),
        pack_variants: priceEditForm.packVariants.map(pv => ({
          sku: pv.sku,
          pack_size: pv.pack_size,
          volume_in_litres: parseFloat(pv.volume_in_litres) || 20,
          standard_mrp: parseFloat(pv.standard_mrp) || 0,
          distributor_base_price: parseFloat(pv.distributor_base_price) || 0,
          is_popular: Boolean(pv.is_popular)
        }))
      };

      await ProductAPI.update(priceEditForm.productId, payload);
      if (onShowToast) onShowToast(`Pricing matrix updated for ${priceEditForm.productName}!`);
      setIsPriceEditModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Error updating pricing matrix.');
    }
  };

  const totalSKUs = products.reduce((acc, p) => acc + (p.packOptions?.length || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-card)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-medium)', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BadgePercent size={20} color="var(--brand-gold)" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Master Wholesale Pricing & Taxation Engine</h3>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
            Real-time price schedule matrix across standard MRP, base distributor rates, dealer margin spreads, and GST calculations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={pricingSearchQuery}
              onChange={(e) => setPricingSearchQuery(e.target.value)}
              placeholder="Search by SKU, product name..."
              style={{
                padding: '8px 12px 8px 30px',
                fontSize: '12px',
                borderRadius: '6px',
                border: '1px solid var(--border-medium)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
                width: '240px'
              }}
            />
          </div>

          <Button
            size="sm"
            variant="secondary"
            icon={Download}
            onClick={() => {
              const exportRows = [];
              products.forEach(p => {
                (p.packOptions || []).forEach(po => {
                  const rate = p.gstRate || 18;
                  const mrp = po.mrp || 0;
                  const base = po.distributorPrice || 0;
                  const isIncl = p.isGstInclusive !== false;
                  const taxable = isIncl ? (mrp / (1 + (rate / 100))) : mrp;
                  const gst = isIncl ? (mrp - taxable) : (mrp * (rate / 100));

                  exportRows.push({
                    Product: p.name,
                    Category: p.category,
                    SKU: po.sku,
                    PackSize: po.size,
                    HSN: p.hsnCode || '31021000',
                    StandardMRP: mrp,
                    DistributorBase: base,
                    TaxableBase: taxable.toFixed(2),
                    GSTAmount: gst.toFixed(2),
                    GSTRate: rate + '%',
                    TaxMode: isIncl ? 'Inclusive' : 'Exclusive'
                  });
                });
              });
              if (exportToCSV) {
                exportToCSV('UltraBlue_Master_Price_Matrix', exportRows);
              }
            }}
          >
            Export Price Schedule CSV
          </Button>
        </div>
      </div>

      {/* Pricing Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '10px', padding: '14px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Active Pack SKUs</span>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>{totalSKUs} Variants</div>
          <span style={{ fontSize: '11px', color: 'var(--brand-blue)' }}>Across {products.length} Master Products</span>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '10px', padding: '14px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Average Dealer Margin</span>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--status-success)', marginTop: '4px' }}>23.5% - 31.0%</div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>High distributor profitability</span>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '10px', padding: '14px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Default GST Configuration</span>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--brand-blue)', marginTop: '4px' }}>18% HSN 3102</div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Configured per product (Inclusive mode)</span>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '10px', padding: '14px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Wholesale Price Matrix</span>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--brand-cyan)', marginTop: '4px' }}>B2B Standard Rates</div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Authorized Factory Direct</span>
        </div>
      </div>

      {/* Master Price Matrix Table */}
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={16} color="var(--brand-blue)" />
            <span>Master SKU Price Schedule & Taxation Matrix</span>
          </h4>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Auto-calculated with live GST & margin formulas</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border-medium)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Product & Pack Size</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>SKU Code</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Standard MRP (₹)</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Distributor Base (₹)</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>GST Breakdown</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Dealer Margin Spread</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {products
                .filter(p => {
                  const q = pricingSearchQuery.toLowerCase();
                  if (!q) return true;
                  return p.name?.toLowerCase().includes(q) || (p.packOptions || []).some(po => po.sku?.toLowerCase().includes(q) || po.size?.toLowerCase().includes(q));
                })
                .map(prod => (
                  (prod.packOptions || []).map((po, idx) => {
                    const rate = prod.gstRate || 18;
                    const mrp = po.mrp || 0;
                    const base = po.distributorPrice || 0;
                    const isIncl = prod.isGstInclusive !== false;
                    const taxable = isIncl ? (mrp / (1 + (rate / 100))) : mrp;
                    const gst = isIncl ? (mrp - taxable) : (mrp * (rate / 100));
                    const dealerMargin = mrp - base;
                    const marginPct = base > 0 ? ((dealerMargin / base) * 100).toFixed(1) : 0;

                    return (
                      <tr key={`${prod.id}-${idx}`} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '12px 14px' }}>
                          <strong style={{ display: 'block', color: 'var(--text-primary)' }}>{prod.name}</strong>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{po.size} • {prod.category}</span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <code style={{ fontSize: '11px', color: 'var(--brand-blue)', fontWeight: 700, backgroundColor: 'rgba(0, 86, 210, 0.08)', padding: '2px 6px', borderRadius: '4px' }}>
                            {po.sku}
                          </code>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--brand-blue)' }}>
                          ₹{mrp.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 700 }}>
                          ₹{base.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontSize: '11px' }}>
                            Taxable: <strong>₹{taxable.toFixed(1)}</strong>
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            {rate}% GST: ₹{gst.toFixed(1)} ({isIncl ? 'Incl.' : 'Excl.'})
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--status-success)', fontSize: '12px' }}>
                            +₹{dealerMargin.toFixed(0)} ({marginPct}%)
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Gross spread</div>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={Edit3}
                            onClick={() => handleOpenEditPrice(prod)}
                            style={{ fontSize: '11px', padding: '4px 8px' }}
                          >
                            Quick Edit
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* QUICK PRICE & TAX CONFIGURATION MODAL */}
      <Modal
        isOpen={isPriceEditModalOpen}
        onClose={() => setIsPriceEditModalOpen(false)}
        title={`Configure Pricing & Tax Matrix: ${priceEditForm.productName}`}
      >
        <form onSubmit={handleSavePrice} style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '78vh', overflowY: 'auto' }}>
          <div style={{ backgroundColor: 'var(--bg-app)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-medium)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-blue)', marginBottom: '8px' }}>
              GST & Tax Calculation Engine
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>GST Rate (%)</label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[0, 5, 12, 18, 28].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setPriceEditForm(prev => ({ ...prev, gstRate: r }))}
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        borderRadius: '4px',
                        border: '1px solid',
                        borderColor: Number(priceEditForm.gstRate) === r ? 'var(--brand-blue)' : 'var(--border-medium)',
                        backgroundColor: Number(priceEditForm.gstRate) === r ? 'var(--brand-blue)' : 'var(--bg-card)',
                        color: Number(priceEditForm.gstRate) === r ? '#FFF' : 'var(--text-primary)',
                        cursor: 'pointer'
                      }}
                    >
                      {r}%
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>Tax Mode</label>
                <Select
                  value={priceEditForm.isGstInclusive ? 'INCLUSIVE' : 'EXCLUSIVE'}
                  onChange={e => setPriceEditForm(prev => ({ ...prev, isGstInclusive: e.target.value === 'INCLUSIVE' }))}
                  options={[
                    { label: 'Inclusive (MRP has GST)', value: 'INCLUSIVE' },
                    { label: 'Exclusive (+GST Added)', value: 'EXCLUSIVE' }
                  ]}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700 }}>Pack Variants Pricing ({(priceEditForm.packVariants || []).length}):</div>
            {(priceEditForm.packVariants || []).map((pv, idx) => {
              const rate = Number(priceEditForm.gstRate) || 18;
              const mrp = Number(pv.standard_mrp) || 0;
              const isIncl = priceEditForm.isGstInclusive !== false;
              const taxable = isIncl ? (mrp / (1 + (rate / 100))) : mrp;
              const gst = isIncl ? (mrp - taxable) : (mrp * (rate / 100));

              return (
                <div key={idx} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '12px' }}>{pv.pack_size} ({pv.sku})</strong>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Taxable: ₹{taxable.toFixed(1)} + GST: ₹{gst.toFixed(1)}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>Standard MRP (₹)</label>
                      <Input
                        type="number"
                        value={pv.standard_mrp}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          setPriceEditForm(prev => {
                            const updated = [...prev.packVariants];
                            updated[idx] = { ...updated[idx], standard_mrp: val };
                            return { ...prev, packVariants: updated };
                          });
                        }}
                        style={{ fontSize: '12px', padding: '6px 8px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>Distributor Base Price (₹)</label>
                      <Input
                        type="number"
                        value={pv.distributor_base_price}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          setPriceEditForm(prev => {
                            const updated = [...prev.packVariants];
                            updated[idx] = { ...updated[idx], distributor_base_price: val };
                            return { ...prev, packVariants: updated };
                          });
                        }}
                        style={{ fontSize: '12px', padding: '6px 8px' }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
            <Button type="button" variant="secondary" onClick={() => setIsPriceEditModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="gold" icon={CheckCircle2}>Save Pricing Matrix</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
