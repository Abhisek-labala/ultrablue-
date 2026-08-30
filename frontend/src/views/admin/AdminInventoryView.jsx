import React, { useState } from 'react';
import { 
  Warehouse, 
  Plus, 
  Download, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { InventoryAPI } from '../../services/api';

export const AdminInventoryView = ({ 
  inventory = [], 
  locations = [], 
  onRefresh, 
  onShowToast, 
  exportToCSV 
}) => {
  const [isRefillModalOpen, setIsRefillModalOpen] = useState(false);
  const [refillLocation, setRefillLocation] = useState(locations[0]?.id || 'BHADRAK_CENTRAL');
  const [refillSku, setRefillSku] = useState('UB-DEF-20L');
  const [refillBatch, setRefillBatch] = useState('UB-2026-B89');
  const [refillQty, setRefillQty] = useState(50);

  const handleRefillSubmit = async (e) => {
    e.preventDefault();
    try {
      await InventoryAPI.refill({
        location_id: refillLocation,
        sku: refillSku,
        batch_no: refillBatch,
        quantity: parseInt(refillQty, 10),
        mfg_date: new Date().toISOString().split('T')[0],
        exp_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });

      if (onShowToast) onShowToast(`Successfully authorized & added ${refillQty} units of ${refillSku}!`);
      setIsRefillModalOpen(false);
      setRefillQty(50);
      setRefillBatch(`UB-2026-B${Math.floor(100 + Math.random() * 900)}`);
      if (onRefresh) onRefresh();
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Error processing inventory refill.');
    }
  };

  const handleOpenRefillForSku = (sku, locId) => {
    setRefillSku(sku);
    setRefillLocation(locId || locations[0]?.id || 'BHADRAK_CENTRAL');
    setIsRefillModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-card)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-medium)', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Warehouse size={20} color="var(--brand-cyan)" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Multi-Hub Inventory Matrix & Batch Quality Tracking</h3>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
            Real-time multi-depot stock monitoring across Bhadrak Central Plant, Keonjhar Mining Hub, and Cuttack Highway Hub.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button size="sm" variant="secondary" icon={Download} onClick={() => exportToCSV('UltraBlue_Inventory_Stock', inventory)}>
            Export Stock CSV
          </Button>
          <Button size="sm" variant="gold" icon={Plus} onClick={() => setIsRefillModalOpen(true)}>
            Authorise Refill
          </Button>
        </div>
      </div>

      {/* Stock Matrix DataTable */}
      <DataTable
        title="Live Multi-Hub Stock Matrix with Batch Expiry Monitoring"
        data={inventory}
        columns={[
          { 
            header: 'Product & SKU', 
            accessor: 'productName', 
            render: (val, row) => (
              <div>
                <strong>{val}</strong>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SKU: {row.sku} • {row.packSize}</div>
              </div>
            )
          },
          { header: 'Depot Location', accessor: 'locationName' },
          { 
            header: 'Available Units', 
            accessor: 'availableStock', 
            render: (val, row) => (
              <div>
                <strong style={{ fontSize: 'var(--font-size-md)', color: val <= row.minThreshold ? 'var(--status-danger)' : 'var(--text-primary)' }}>
                  {val} Units
                </strong>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Reserved: {row.reservedStock || 0}</div>
              </div>
            )
          },
          { 
            header: 'Batch No & Mfg', 
            accessor: 'batchNo', 
            render: (val, row) => (
              <div>
                <code style={{ color: 'var(--brand-blue)', fontWeight: 600 }}>{val}</code>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Mfg: {row.mfgDate}</div>
              </div>
            )
          },
          { header: 'Expiry Date', accessor: 'expDate' },
          { 
            header: 'Health Status', 
            accessor: 'status', 
            render: (val) => <StatusBadge status={val} /> 
          },
          {
            header: 'Actions',
            accessor: 'id',
            render: (val, row) => (
              <Button 
                size="sm" 
                variant="secondary" 
                onClick={() => handleOpenRefillForSku(row.sku, row.locationId)}
              >
                Refill
              </Button>
            )
          }
        ]}
      />

      {/* STOCK REFILL MODAL */}
      <Modal
        isOpen={isRefillModalOpen}
        onClose={() => setIsRefillModalOpen(false)}
        title="Authorise Factory Stock Refill"
      >
        <form onSubmit={handleRefillSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
              Depot / Hub Location
            </label>
            <Select 
              value={refillLocation} 
              onChange={e => setRefillLocation(e.target.value)}
              options={locations.map(loc => ({ label: `${loc.name} (${loc.city || ''})`, value: loc.id }))}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
              Product SKU & Pack Size
            </label>
            <Select
              value={refillSku}
              onChange={e => setRefillSku(e.target.value)}
              options={[
                { label: 'UB-DEF-5L (5L Canister)', value: 'UB-DEF-5L' },
                { label: 'UB-DEF-20L (20L Bucket / Canister)', value: 'UB-DEF-20L' },
                { label: 'UB-DEF-210L (210L HDPE Barrel Drum)', value: 'UB-DEF-210L' },
                { label: 'UB-DEF-1000L (1000L Heavy IBC Tote)', value: 'UB-DEF-1000L' },
                { label: 'UB-LUB-15W40-20L (20L Engine Lubricant)', value: 'UB-LUB-15W40-20L' }
              ]}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                Batch Number
              </label>
              <Input 
                value={refillBatch} 
                onChange={e => setRefillBatch(e.target.value)} 
                required 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                Quantity to Add (Units)
              </label>
              <Input 
                type="number" 
                min="1" 
                value={refillQty} 
                onChange={e => setRefillQty(e.target.value)} 
                required 
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button type="button" variant="secondary" onClick={() => setIsRefillModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" icon={CheckCircle2}>
              Authorize & Commit Refill
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
