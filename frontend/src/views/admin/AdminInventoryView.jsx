import React, { useState, useEffect } from 'react';
import {
  Warehouse,
  Plus,
  Download,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Layers
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { InventoryAPI, ProductAPI } from '../../services/api';

export const AdminInventoryView = ({
  inventory = [],
  locations = [],
  products = [],
  onRefresh,
  onShowToast,
  exportToCSV
}) => {
  const [dynamicProducts, setDynamicProducts] = useState(products || []);
  const [isRefillModalOpen, setIsRefillModalOpen] = useState(false);
  const [refillLocation, setRefillLocation] = useState('');
  const [refillSku, setRefillSku] = useState('');
  const [refillBatch, setRefillBatch] = useState('');
  const [refillQty, setRefillQty] = useState(50);
  const [refillMfgDate, setRefillMfgDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [refillExpDate, setRefillExpDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });
  const [refillErrors, setRefillErrors] = useState({});
  const [selectedLocationFilter, setSelectedLocationFilter] = useState('ALL');

  // Load database products dynamically if not passed from parent
  useEffect(() => {
    if (Array.isArray(products) && products.length > 0) {
      setDynamicProducts(products);
    } else {
      ProductAPI.getAll()
        .then(prods => {
          if (Array.isArray(prods) && prods.length > 0) {
            setDynamicProducts(prods);
          }
        })
        .catch(() => { });
    }
  }, [products]);

  // Dynamically build SKU options from database products and their pack variants
  const skuOptions = [];
  dynamicProducts.forEach(p => {
    if (Array.isArray(p.packOptions) && p.packOptions.length > 0) {
      p.packOptions.forEach(po => {
        skuOptions.push({
          value: po.sku,
          label: `${p.name} — ${po.sku} (${po.size})`
        });
      });
    } else if (p.sku) {
      skuOptions.push({
        value: p.sku,
        label: `${p.name} — ${p.sku}`
      });
    }
  });

  // Synchronize first valid location ID and SKU dynamically from DB
  useEffect(() => {
    if (locations && locations.length > 0 && !refillLocation) {
      setRefillLocation(locations[0].id);
    }
  }, [locations, refillLocation]);

  useEffect(() => {
    if (skuOptions.length > 0 && !refillSku) {
      setRefillSku(skuOptions[0].value);
    }
  }, [skuOptions, refillSku]);

  const generateDynamicBatchNo = () => {
    const year = new Date().getFullYear();
    const rand = Math.floor(100 + Math.random() * 900);
    return `UBP-${year}-B${rand}`;
  };

  const handleOpenNewRefill = () => {
    const locId = locations.length > 0 ? locations[0].id : '';
    const initialSku = skuOptions.length > 0 ? skuOptions[0].value : '';
    const todayStr = new Date().toISOString().split('T')[0];
    const exp = new Date();
    exp.setFullYear(exp.getFullYear() + 1);

    setRefillLocation(locId);
    setRefillSku(initialSku);
    setRefillBatch(generateDynamicBatchNo());
    setRefillQty(50);
    setRefillMfgDate(todayStr);
    setRefillExpDate(exp.toISOString().split('T')[0]);
    setRefillErrors({});
    setIsRefillModalOpen(true);
  };

  const handleRefillSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    const targetLoc = refillLocation || locations[0]?.id;
    if (!targetLoc) {
      errors.location = 'Please select a destination depot location from DB.';
    }

    const targetSku = refillSku || skuOptions[0]?.value;
    if (!targetSku) {
      errors.sku = 'Please select a product SKU.';
    }

    if (!refillBatch || !refillBatch.trim()) {
      errors.batch = 'Batch number is required.';
    }

    const qtyNum = parseInt(refillQty, 10);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      errors.qty = 'Quantity must be at least 1 unit.';
    }

    if (!refillMfgDate) {
      errors.mfgDate = 'Manufacturing date is required.';
    }

    if (!refillExpDate) {
      errors.expDate = 'Expiry date is required.';
    }

    if (Object.keys(errors).length > 0) {
      setRefillErrors(errors);
      if (onShowToast) onShowToast('Please resolve the refill form errors.');
      return;
    }

    try {
      await InventoryAPI.refill({
        location_id: targetLoc,
        sku: targetSku,
        batch_no: refillBatch.trim(),
        quantity: qtyNum,
        mfg_date: refillMfgDate,
        expiry_date: refillExpDate
      });

      if (onShowToast) onShowToast(`Successfully authorized & added ${qtyNum} units of ${targetSku}!`);
      setIsRefillModalOpen(false);
      setRefillErrors({});
      setRefillQty(50);
      setRefillBatch(generateDynamicBatchNo());
      if (onRefresh) onRefresh();
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Error processing inventory refill.');
    }
  };

  const handleOpenRefillForSku = (sku, locId) => {
    setRefillSku(sku || (skuOptions[0]?.value || ''));
    setRefillLocation(locId || locations[0]?.id || '');
    setRefillBatch(generateDynamicBatchNo());
    setRefillErrors({});
    setIsRefillModalOpen(true);
  };

  const filteredInventory = inventory.filter(item => {
    if (selectedLocationFilter === 'ALL') return true;
    return item.locationId === selectedLocationFilter || item.locationName === selectedLocationFilter;
  });

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
            Real-time multi-depot stock monitoring across factory plants, regional depots, and highway dispenser hubs.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button size="sm" variant="secondary" icon={Download} onClick={() => exportToCSV('UltraBlue_Inventory_Stock', inventory)}>
            Export Stock CSV
          </Button>
          <Button
            size="sm"
            variant="gold"
            icon={Plus}
            onClick={handleOpenNewRefill}
          >
            Authorise Refill
          </Button>
        </div>
      </div>

      {/* Stock Matrix DataTable */}
      <DataTable
        title="Live Multi-Hub Stock Matrix with Batch Expiry Monitoring"
        data={filteredInventory}
        filterComponent={
          locations.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={14} color="var(--text-muted)" />
              <select
                value={selectedLocationFilter}
                onChange={e => setSelectedLocationFilter(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  border: '1px solid var(--border-medium)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">All Depots ({inventory.length})</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} {loc.city ? `(${loc.city})` : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : null
        }
        columns={[
          {
            header: 'Product & SKU',
            accessor: 'productName',
            render: (val, row) => (
              <div>
                <strong>{val || 'UltraBlue+ AUS 32 DEF'}</strong>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SKU: {row.sku} • {row.packSize || 'Standard'}</div>
              </div>
            )
          },
          {
            header: 'Depot Location',
            accessor: 'locationName',
            render: (val) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={13} color="var(--brand-cyan)" />
                <span style={{ fontWeight: 600 }}>{val}</span>
              </div>
            )
          },
          {
            header: 'Available Units',
            accessor: 'availableStock',
            render: (val, row) => (
              <div>
                <strong style={{ fontSize: 'var(--font-size-md)', color: val <= (row.minThreshold || 20) ? 'var(--status-danger)' : 'var(--text-primary)' }}>
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
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Mfg: {row.mfgDate || 'Recent'}</div>
              </div>
            )
          },
          {
            header: 'Expiry Date',
            accessor: 'expDate',
            render: (val) => <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{val || '12 Months'}</span>
          },
          {
            header: 'Health Status',
            accessor: 'status',
            render: (val) => <StatusBadge status={val} />
          },
          {
            header: 'Actions',
            accessor: 'id',
            render: (_, row) => (
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
        onClose={() => {
          setIsRefillModalOpen(false);
          setRefillErrors({});
        }}
        title="Authorise Factory Stock Refill"
      >
        <form noValidate onSubmit={handleRefillSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
              Depot / Hub Location *
            </label>
            <Select
              value={refillLocation || (locations[0]?.id || '')}
              onChange={e => {
                setRefillLocation(e.target.value);
                if (refillErrors.location) setRefillErrors(prev => ({ ...prev, location: null }));
              }}
              options={locations.map(loc => ({ label: `${loc.name} (${loc.city || 'Hub'})`, value: loc.id }))}
              error={refillErrors.location}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
              Product SKU & Pack Size *
            </label>
            <Select
              value={refillSku || (skuOptions[0]?.value || '')}
              onChange={e => {
                setRefillSku(e.target.value);
                if (refillErrors.sku) setRefillErrors(prev => ({ ...prev, sku: null }));
              }}
              options={skuOptions}
              error={refillErrors.sku}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                Batch Number *
              </label>
              <Input
                value={refillBatch}
                onChange={e => {
                  setRefillBatch(e.target.value);
                  if (refillErrors.batch) setRefillErrors(prev => ({ ...prev, batch: null }));
                }}
                placeholder="e.g. UBP-2026-B101"
                error={refillErrors.batch}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                Quantity to Add (Units) *
              </label>
              <Input
                type="number"
                min="1"
                value={refillQty}
                onChange={e => {
                  setRefillQty(e.target.value);
                  if (refillErrors.qty) setRefillErrors(prev => ({ ...prev, qty: null }));
                }}
                placeholder="50"
                error={refillErrors.qty}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                Manufacturing Date *
              </label>
              <Input
                type="date"
                value={refillMfgDate}
                onChange={e => {
                  const val = e.target.value;
                  setRefillMfgDate(val);
                  if (val) {
                    const d = new Date(val);
                    d.setFullYear(d.getFullYear() + 1);
                    setRefillExpDate(d.toISOString().split('T')[0]);
                  }
                  if (refillErrors.mfgDate) setRefillErrors(prev => ({ ...prev, mfgDate: null }));
                }}
                error={refillErrors.mfgDate}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                Expiry Date *
              </label>
              <Input
                type="date"
                value={refillExpDate}
                onChange={e => {
                  setRefillExpDate(e.target.value);
                  if (refillErrors.expDate) setRefillErrors(prev => ({ ...prev, expDate: null }));
                }}
                error={refillErrors.expDate}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button type="button" variant="secondary" onClick={() => {
              setIsRefillModalOpen(false);
              setRefillErrors({});
            }}>
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
