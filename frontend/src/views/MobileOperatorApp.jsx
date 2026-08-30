import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Scan, 
  ShoppingCart, 
  Printer, 
  Share2, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Plus, 
  Minus, 
  User, 
  Truck, 
  Warehouse, 
  RotateCcw,
  Sparkles,
  Search,
  Zap,
  CreditCard
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { InvoiceModal } from '../components/ui/InvoiceModal';
import { 
  InventoryAPI, 
  SalesAPI,
  ProductAPI
} from '../services/api';

export const MobileOperatorApp = ({ authUser }) => {
  const [selectedLocation, setSelectedLocation] = useState('');
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [activeInvoiceForModal, setActiveInvoiceForModal] = useState(null);

  const currentOperatorName = authUser?.name || 'Mobile Field Operator';

  // Mobile POS State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [scannerActive, setScannerActive] = useState(false);
  const [statusBanner, setStatusBanner] = useState(null);

  // Cart
  const [cart, setCart] = useState([]);

  const loadData = async () => {
    try {
      const [inv, prods, locs] = await Promise.all([
        InventoryAPI.getAll().catch(() => []),
        ProductAPI.getAll().catch(() => []),
        InventoryAPI.getLocations().catch(() => [])
      ]);
      setInventory(inv || []);
      setProducts(prods || []);
      if (locs && locs.length > 0) {
        setLocations(locs);
        if (!selectedLocation) setSelectedLocation(locs[0].id);
      }
    } catch (e) {
      console.error('Error loading mobile POS data:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const locationInventory = inventory.filter(i => i.locationId === selectedLocation);

  const getStock = (sku) => {
    const item = locationInventory.find(i => i.sku === sku);
    return item ? item.availableStock : 0;
  };

  const handleAddItem = (prod, pack) => {
    const stock = getStock(pack.sku);
    if (stock <= 0) {
      setStatusBanner({ type: 'error', text: `${pack.size} is OUT OF STOCK!` });
      return;
    }

    const existingIdx = cart.findIndex(c => c.sku === pack.sku);
    if (existingIdx >= 0) {
      if (cart[existingIdx].qty + 1 > stock) {
        setStatusBanner({ type: 'error', text: `Only ${stock} available!` });
        return;
      }
      const nextCart = [...cart];
      nextCart[existingIdx].qty += 1;
      setCart(nextCart);
    } else {
      setCart([
        ...cart,
        {
          sku: pack.sku,
          name: `${prod.category.includes('DEF') ? 'DEF' : 'Oil'} ${pack.size}`,
          unitPrice: pack.mrp,
          gstRate: pack.gstRate || prod.gstRate || 18,
          isGstInclusive: pack.isGstInclusive !== undefined ? pack.isGstInclusive : (prod.isGstInclusive !== undefined ? prod.isGstInclusive : true),
          qty: 1,
          batchNo: (locationInventory.find(i => i.sku === pack.sku)?.batchNo) || '-'
        }
      ]);
    }
    setStatusBanner({ type: 'success', text: `Added ${pack.size} to bill` });
  };

  const handleUpdateQty = (idx, delta) => {
    const item = cart[idx];
    const stock = getStock(item.sku);
    const newQty = item.qty + delta;

    if (newQty > stock) {
      setStatusBanner({ type: 'error', text: `Stock limit reached (${stock} units max)` });
      return;
    }

    if (newQty <= 0) {
      setCart(cart.filter((_, i) => i !== idx));
    } else {
      const nextCart = [...cart];
      nextCart[idx].qty = newQty;
      setCart(nextCart);
    }
  };

  // Simulate Barcode Scanner
  const handleSimulateScan = () => {
    setScannerActive(true);
    setTimeout(() => {
      setScannerActive(false);
      const availableProd = products.find(p => (p.packOptions || []).some(pk => getStock(pk.sku) > 0)) || products[0];
      if (availableProd && availableProd.packOptions && availableProd.packOptions.length > 0) {
        const pack = availableProd.packOptions.find(pk => getStock(pk.sku) > 0) || availableProd.packOptions[0];
        handleAddItem(availableProd, pack);
        setStatusBanner({ type: 'success', text: `Scanned Barcode: ${pack.sku} (${availableProd.name})` });
      } else {
        setStatusBanner({ type: 'error', text: 'No stock available to scan.' });
      }
    }, 1200);
  };

  // Dynamic Product-Wise Billing Totals (Inclusive vs Exclusive GST)
  const subtotal = cart.reduce((a, c) => a + (c.unitPrice * c.qty), 0);
  let totalTaxable = 0;
  let totalTax = 0;
  let calculatedGrandTotal = 0;

  cart.forEach(item => {
    const rawLine = item.unitPrice * item.qty;
    const rate = item.gstRate || 18;
    const isIncl = item.isGstInclusive !== false;

    if (isIncl) {
      const lineTaxable = rawLine / (1 + (rate / 100));
      const lineGst = rawLine - lineTaxable;
      totalTaxable += lineTaxable;
      totalTax += lineGst;
      calculatedGrandTotal += rawLine;
    } else {
      const lineGst = rawLine * (rate / 100);
      totalTaxable += rawLine;
      totalTax += lineGst;
      calculatedGrandTotal += (rawLine + lineGst);
    }
  });

  const tax = Math.round(totalTax * 100) / 100;
  const grandTotal = Math.round(calculatedGrandTotal * 100) / 100;

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setStatusBanner({ type: 'error', text: 'Cart is empty!' });
      return;
    }
    if (!customerPhone.trim()) {
      setStatusBanner({ type: 'error', text: 'Enter customer phone for SMS receipt' });
      return;
    }

    try {
      const res = await SalesAPI.createInvoice({
        customerName: customerName.trim() || 'Counter Customer',
        customerPhone,
        vehicleNo: vehicleNo.trim() || 'Direct Fleet Sale',
        locationId: selectedLocation,
        operatorName: currentOperatorName,
        items: cart,
        paymentMethod
      });

      if (res.success) {
        const createdInv = {
          id: res.invoice_number || `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          customerName: customerName.trim() || 'Counter Customer',
          customerPhone,
          vehicleNo: vehicleNo.trim() || 'Direct Fleet Sale',
          location: locations.find(l => l.id === selectedLocation)?.name || 'Depot Terminal',
          operatorName: currentOperatorName,
          date: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
          items: cart.map(i => ({ ...i, amount: i.unitPrice * i.qty })),
          subtotal,
          discount: 0,
          taxable: totalTaxable,
          cgst: tax / 2,
          sgst: tax / 2,
          grandTotal: res.grand_total || grandTotal,
          paymentMethod,
          paymentStatus: 'PAID',
          smsSent: true,
          pdfGenerated: true
        };

        setCart([]);
        setCustomerName('');
        setCustomerPhone('');
        setVehicleNo('');
        setActiveInvoiceForModal(createdInv);
        setStatusBanner({ type: 'success', text: `Bill #${createdInv.id} created in Laravel & SMS sent!` });
        loadData();
      }
    } catch (e) {
      setStatusBanner({ type: 'error', text: e.message || 'Error creating invoice.' });
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-4) 0' }}>
      {/* Smartphone Device Frame Simulator */}
      <div 
        style={{
          width: '390px',
          height: '780px',
          backgroundColor: '#F8FAFC',
          borderRadius: '40px',
          border: '12px solid #1E293B',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        {/* Android Top Speaker & Camera Notch */}
        <div style={{ width: '120px', height: '18px', backgroundColor: '#1E293B', margin: '0 auto', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px', zIndex: 10 }} />

        {/* Mobile Header Bar */}
        <div style={{ backgroundColor: 'var(--brand-navy-primary)', padding: '12px 16px', color: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', marginBottom: '4px' }}>
            <span>Operator: <strong>{currentOperatorName}</strong></span>
            <span style={{ color: 'var(--status-success)', fontWeight: 700 }}>● Connected</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ fontSize: '16px', color: '#FFFFFF', fontFamily: 'var(--font-family-heading)' }}>
                Sales Counter Desk
              </strong>
              <div style={{ fontSize: '11px', color: 'var(--brand-cyan)' }}>
                {locations.find(l => l.id === selectedLocation)?.name || 'Depot'}
              </div>
            </div>

            <button
              onClick={handleSimulateScan}
              style={{
                backgroundColor: scannerActive ? 'var(--status-warning)' : 'var(--brand-blue)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
            >
              <Scan size={14} />
              <span>{scannerActive ? 'Scanning...' : 'Scan QR'}</span>
            </button>
          </div>
        </div>

        {/* Feedback Banner */}
        {statusBanner && (
          <div 
            style={{
              backgroundColor: statusBanner.type === 'error' ? 'var(--status-danger-bg)' : 'var(--status-success-bg)',
              color: statusBanner.type === 'error' ? 'var(--status-danger-text)' : 'var(--status-success-text)',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {statusBanner.type === 'error' ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
            <span>{statusBanner.text}</span>
          </div>
        )}

        {/* Mobile Screen Body */}
        <div style={{ flex: 1, padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Quick Product Touch Grid */}
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
              Tap to Add Product:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {products.flatMap(prod => (prod.packOptions || []).map(pack => {
                const stock = getStock(pack.sku);
                return (
                  <button
                    key={pack.sku}
                    type="button"
                    onClick={() => handleAddItem(prod, pack)}
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1.5px solid #E2E8F0',
                      borderRadius: '10px',
                      padding: '10px 6px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                  >
                    <strong style={{ fontSize: '11px', color: '#0F172A', display: 'block' }}>{pack.size}</strong>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--brand-blue)', margin: '2px 0' }}>₹{pack.mrp}</div>
                    <span style={{ fontSize: '9px', fontWeight: 700, color: stock > 0 ? 'var(--status-success-text)' : 'var(--status-danger)' }}>
                      {stock > 0 ? `${stock} in stock` : 'Out of stock'}
                    </span>
                  </button>
                );
              }))}
            </div>
          </div>

          {/* Quick Customer Inputs */}
          <div style={{ backgroundColor: '#FFFFFF', padding: '10px 12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '10px', fontWeight: 700, color: '#64748B' }}>Customer Mobile *</label>
                <input
                  type="tel"
                  placeholder="+91 94370..."
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '10px', fontWeight: 700, color: '#64748B' }}>Vehicle Number</label>
                <input
                  placeholder="OD-05-AX..."
                  value={vehicleNo}
                  onChange={e => setVehicleNo(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                />
              </div>
            </div>
          </div>

          {/* Touch Cart List */}
          <div style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '10px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid #F1F5F9', paddingBottom: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>BILL ITEMS ({cart.length})</span>
              {cart.length > 0 && (
                <button onClick={() => setCart([])} style={{ border: 'none', background: 'none', color: '#EF4444', fontSize: '11px', cursor: 'pointer' }}>
                  Clear
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#94A3B8', fontSize: '12px' }}>
                Tap products above or scan QR barcode to add.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {cart.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px dashed #E2E8F0' }}>
                    <div>
                      <strong style={{ fontSize: '12px', color: '#0F172A', display: 'block' }}>{item.name}</strong>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>₹{item.unitPrice} each</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        onClick={() => handleUpdateQty(idx, -1)}
                        style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#F1F5F9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Minus size={12} />
                      </button>
                      <span style={{ fontWeight: 800, fontSize: '13px', minWidth: '18px', textAlign: 'center' }}>{item.qty}</span>
                      <button
                        onClick={() => handleUpdateQty(idx, 1)}
                        style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#F1F5F9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <strong style={{ fontSize: '13px', color: 'var(--brand-navy-primary)' }}>
                      ₹{(item.unitPrice * item.qty).toLocaleString('en-IN')}
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Method Selector */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {['UPI', 'Cash', 'Card'].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setPaymentMethod(m)}
                style={{
                  flex: 1,
                  padding: '6px 0',
                  borderRadius: '6px',
                  border: paymentMethod === m ? '1.5px solid var(--brand-blue)' : '1px solid #CBD5E1',
                  backgroundColor: paymentMethod === m ? 'var(--brand-blue-light)' : '#FFFFFF',
                  color: paymentMethod === m ? 'var(--brand-blue)' : '#0F172A',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

          {/* Bottom Checkout CTA */}
          <div 
            style={{
              backgroundColor: '#FFFFFF',
              borderTop: '1px solid #E2E8F0',
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#64748B' }}>Final Bill Amount:</span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--brand-navy-primary)', fontFamily: 'var(--font-family-heading)' }}>
                  ₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <span style={{ fontSize: '10px', color: 'var(--status-success-text)', backgroundColor: 'var(--status-success-bg)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                Instant SMS On
              </span>
            </div>

            <Button
              size="lg"
              variant="primary"
              style={{ width: '100%', borderRadius: '10px', fontWeight: 800 }}
              icon={CheckCircle2}
              onClick={handleCheckout}
            >
              Print Bill & Send SMS (Laravel API)
            </Button>
          </div>
        </div>

      {/* Invoice Receipt Modal */}
      <InvoiceModal
        isOpen={Boolean(activeInvoiceForModal)}
        onClose={() => setActiveInvoiceForModal(null)}
        invoice={activeInvoiceForModal}
      />
    </div>
  );
};
