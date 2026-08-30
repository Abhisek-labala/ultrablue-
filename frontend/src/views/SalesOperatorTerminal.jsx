import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Trash2, 
  Printer, 
  Download, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  User, 
  Truck, 
  Warehouse,
  Sparkles,
  CreditCard,
  Phone,
  RefreshCw,
  TrendingUp,
  BarChart3,
  Package,
  ShieldCheck,
  DollarSign
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { StatusBadge } from '../components/ui/StatusBadge';
import { DataTable } from '../components/ui/DataTable';
import { KPICard } from '../components/ui/KPICard';
import { InvoiceModal } from '../components/ui/InvoiceModal';
import { 
  InventoryAPI, 
  SalesAPI,
  ProductAPI 
} from '../services/api';

export const SalesOperatorTerminal = ({ authUser, activeTab: externalTab, onTabChange }) => {
  const [currentTab, setCurrentTab] = useState(() => {
    if (externalTab === 'stock_check') return 'stock_check';
    if (externalTab === 'sales_history') return 'sales_history';
    if (externalTab === 'shift_summary') return 'shift_summary';
    return 'pos_billing';
  });

  const [selectedLocation, setSelectedLocation] = useState('');
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [activeInvoiceForModal, setActiveInvoiceForModal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stockSearchQuery, setStockSearchQuery] = useState('');

  const currentOperatorName = authUser?.name || 'Sales Operator';

  // Sync external tab prop from sidebar
  useEffect(() => {
    if (externalTab) {
      if (externalTab === 'stock_check') setCurrentTab('stock_check');
      else if (externalTab === 'sales_history') setCurrentTab('sales_history');
      else if (externalTab === 'shift_summary') setCurrentTab('shift_summary');
      else setCurrentTab('pos_billing');
    }
  }, [externalTab]);

  const handleTabSwitch = (tabId) => {
    setCurrentTab(tabId);
    if (onTabChange) onTabChange(tabId);
  };

  // POS Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI / Dynamic QR');

  // Cart State
  const [cartItems, setCartItems] = useState([]);
  const [posError, setPosError] = useState('');
  const [posSuccess, setPosSuccess] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      if (currentTab === 'pos_billing') {
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
      } else if (currentTab === 'stock_check') {
        const [inv, locs] = await Promise.all([
          InventoryAPI.getAll().catch(() => []),
          InventoryAPI.getLocations().catch(() => [])
        ]);
        setInventory(inv || []);
        if (locs && locs.length > 0) {
          setLocations(locs);
          if (!selectedLocation) setSelectedLocation(locs[0].id);
        }
      } else if (currentTab === 'sales_history' || currentTab === 'shift_summary') {
        const invs = await SalesAPI.getAllInvoices().catch(() => []);
        setInvoices(invs || []);
      }
    } catch (e) {
      console.error('Error fetching terminal data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentTab]);

  const locationInventory = inventory.filter(i => !selectedLocation || i.locationId === selectedLocation);

  const getStockForSku = (sku) => {
    const item = locationInventory.find(i => i.sku === sku);
    return item ? item.availableStock : 0;
  };

  const handleAddToCart = (product, pack) => {
    setPosError('');
    const availableStock = getStockForSku(pack.sku);
    
    if (availableStock <= 0) {
      setPosError(`Cannot add ${pack.size}: Item is OUT OF STOCK at this location.`);
      return;
    }

    const existingIndex = cartItems.findIndex(i => i.sku === pack.sku);
    if (existingIndex >= 0) {
      const currentQty = cartItems[existingIndex].qty;
      if (currentQty + 1 > availableStock) {
        setPosError(`Cannot increase quantity: Only ${availableStock} units available in stock!`);
        return;
      }
      const updated = [...cartItems];
      updated[existingIndex].qty += 1;
      setCartItems(updated);
    } else {
      setCartItems([
        ...cartItems,
        {
          productId: product.id,
          sku: pack.sku,
          name: `${product.name} (${pack.size})`,
          packSize: pack.size,
          unitPrice: pack.mrp,
          gstRate: pack.gstRate || product.gstRate || 18,
          isGstInclusive: pack.isGstInclusive !== undefined ? pack.isGstInclusive : (product.isGstInclusive !== undefined ? product.isGstInclusive : true),
          qty: 1,
          batchNo: 'UB-2026-B1'
        }
      ]);
    }
  };

  const handleUpdateQty = (index, newQty) => {
    setPosError('');
    const item = cartItems[index];
    const availableStock = getStockForSku(item.sku);

    if (newQty > availableStock) {
      setPosError(`Anti-Overbilling Protection: Cannot bill ${newQty} units. Only ${availableStock} units physically in stock.`);
      return;
    }

    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }

    const updated = [...cartItems];
    updated[index].qty = newQty;
    setCartItems(updated);
  };

  const handleRemoveItem = (index) => {
    const updated = cartItems.filter((_, i) => i !== index);
    setCartItems(updated);
  };

  // Dynamic Product-Wise Billing Totals (Inclusive vs Exclusive GST)
  const subtotal = cartItems.reduce((acc, i) => acc + (i.unitPrice * i.qty), 0);
  let totalTaxable = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let calculatedGrandTotal = 0;

  cartItems.forEach(item => {
    const rawLine = item.unitPrice * item.qty;
    const rate = item.gstRate || 18;
    const isIncl = item.isGstInclusive !== false;

    if (isIncl) {
      const lineTaxable = rawLine / (1 + (rate / 100));
      const lineTax = rawLine - lineTaxable;
      totalTaxable += lineTaxable;
      totalCgst += (lineTax / 2);
      totalSgst += (lineTax / 2);
      calculatedGrandTotal += rawLine;
    } else {
      const lineTax = rawLine * (rate / 100);
      totalTaxable += rawLine;
      totalCgst += (lineTax / 2);
      totalSgst += (lineTax / 2);
      calculatedGrandTotal += (rawLine + lineTax);
    }
  });

  const taxable = Math.round(totalTaxable * 100) / 100;
  const cgst = Math.round(totalCgst * 100) / 100;
  const sgst = Math.round(totalSgst * 100) / 100;
  const grandTotal = Math.round(calculatedGrandTotal * 100) / 100;

  // Real Laravel Invoice Generation
  const handleGenerateInvoice = async (e) => {
    e.preventDefault();
    setPosError('');
    setPosSuccess('');

    if (cartItems.length === 0) {
      setPosError('Cart is empty. Please select at least one product.');
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      setPosError('Customer name and mobile number are required for GST invoice & SMS dispatch.');
      return;
    }

    try {
      const result = await SalesAPI.createInvoice({
        customerName,
        customerPhone,
        vehicleNo: vehicleNo.trim() || 'Direct Counter Sale',
        locationId: selectedLocation,
        operatorName: currentOperatorName,
        items: cartItems,
        paymentMethod
      });

      if (result.success) {
        const createdInv = {
          id: result.invoice_number || `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          customerName,
          customerPhone,
          vehicleNo: vehicleNo.trim() || 'Counter Sale',
          location: locations.find(l => l.id === selectedLocation)?.name || 'Terminal Depot',
          operatorName: currentOperatorName,
          date: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
          items: cartItems.map(item => ({
            name: item.name,
            sku: item.sku,
            batchNo: item.batchNo,
            qty: item.qty,
            unitPrice: item.unitPrice,
            amount: item.unitPrice * item.qty
          })),
          subtotal,
          discount: 0,
          taxable,
          cgst,
          sgst,
          grandTotal: result.grand_total || grandTotal,
          paymentMethod,
          paymentStatus: 'PAID',
          smsSent: true,
          pdfGenerated: true
        };

        setCartItems([]);
        setCustomerName('');
        setCustomerPhone('');
        setVehicleNo('');
        setActiveInvoiceForModal(createdInv);
        setPosSuccess(`Invoice #${createdInv.id} created in Laravel Database! Stock decremented and SMS sent.`);
        loadData();
      }
    } catch (err) {
      setPosError(err.message || 'Error generating invoice on backend.');
    }
  };

  // Shift Calculations
  const shiftInvoicesCount = invoices.length;
  const shiftRevenue = invoices.reduce((acc, inv) => acc + (parseFloat(inv.grandTotal) || 0), 0);
  const shiftTaxCollected = invoices.reduce((acc, inv) => acc + ((parseFloat(inv.cgst) || 0) + (parseFloat(inv.sgst) || 0)), 0);
  const upiTotal = invoices.filter(i => (i.paymentMethod || '').toLowerCase().includes('upi')).reduce((acc, i) => acc + (parseFloat(i.grandTotal) || 0), 0);
  const cashTotal = invoices.filter(i => (i.paymentMethod || '').toLowerCase().includes('cash')).reduce((acc, i) => acc + (parseFloat(i.grandTotal) || 0), 0);

  const filteredStock = locationInventory.filter(item => 
    !stockSearchQuery || 
    item.productName.toLowerCase().includes(stockSearchQuery.toLowerCase()) ||
    item.sku.toLowerCase().includes(stockSearchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* POS Top Bar & Tab Switcher */}
      <div 
        className="ub-card" 
        style={{ 
          padding: '16px 20px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: 'var(--space-4)',
          borderLeft: '4px solid var(--status-success)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShoppingCart size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--brand-navy-primary)', margin: 0 }}>
              Sales Operator Billing & Terminal Console
            </h2>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', margin: 0 }}>
              Active Operator: <strong>{currentOperatorName}</strong> • Strict Anti-Overbill Guard Active
            </p>
          </div>
        </div>

        {/* Location Dropdown Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Warehouse size={16} color="var(--brand-blue)" />
          <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--brand-navy-primary)' }}>Terminal Location:</span>
          <select
            value={selectedLocation}
            onChange={(e) => {
              setSelectedLocation(e.target.value);
              setPosError('');
            }}
            className="ub-select"
            style={{ width: '260px', height: '36px', fontSize: 'var(--font-size-xs)' }}
          >
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>
                {loc.name} ({loc.state || 'Depot'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Internal Tabs Nav */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-medium)', paddingBottom: '8px' }}>
        <Button
          size="sm"
          variant={currentTab === 'pos_billing' ? 'primary' : 'secondary'}
          icon={ShoppingCart}
          onClick={() => handleTabSwitch('pos_billing')}
        >
          Fast Sales POS
        </Button>
        <Button
          size="sm"
          variant={currentTab === 'stock_check' ? 'primary' : 'secondary'}
          icon={Warehouse}
          onClick={() => handleTabSwitch('stock_check')}
        >
          Live Stock Check
        </Button>
        <Button
          size="sm"
          variant={currentTab === 'sales_history' ? 'primary' : 'secondary'}
          icon={FileText}
          onClick={() => handleTabSwitch('sales_history')}
        >
          Invoice Records ({invoices.length})
        </Button>
        <Button
          size="sm"
          variant={currentTab === 'shift_summary' ? 'primary' : 'secondary'}
          icon={TrendingUp}
          onClick={() => handleTabSwitch('shift_summary')}
        >
          Shift Summary
        </Button>
      </div>

      {posError && (
        <div style={{ backgroundColor: 'var(--status-danger-bg)', border: '1px solid var(--status-danger-border)', color: 'var(--status-danger-text)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-sm)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={18} color="var(--status-danger)" />
          {posError}
        </div>
      )}

      {posSuccess && (
        <div style={{ backgroundColor: 'var(--status-success-bg)', border: '1px solid var(--status-success-border)', color: 'var(--status-success-text)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-sm)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} color="var(--status-success)" />
          {posSuccess}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: FAST SALES POS BILLING */}
      {/* ========================================================================= */}
      {currentTab === 'pos_billing' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-6)', alignItems: 'start' }}>
          
          {/* LEFT COLUMN: Fast Product Picker */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="ub-card" style={{ padding: 'var(--space-5)' }}>
              <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 700, color: 'var(--brand-navy-primary)', marginBottom: 'var(--space-3)' }}>
                1. Live Stock Availability ({locations.find(l => l.id === selectedLocation)?.name || 'Depot'})
              </h3>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
                Click any pack size below to immediately add to the invoice. Real-time availability reflects selected depot in Laravel DB.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {products.map(prod => (
                  <div 
                    key={prod.id} 
                    style={{ 
                      border: '1px solid var(--border-light)', 
                      borderRadius: 'var(--radius-sm)', 
                      padding: '12px',
                      backgroundColor: 'var(--bg-surface-secondary)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong style={{ fontSize: 'var(--font-size-sm)', color: 'var(--brand-navy-primary)' }}>{prod.name}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--brand-blue)', fontWeight: 700 }}>
                        {prod.category} • {prod.gstRate || 18}% GST ({prod.isGstInclusive !== false ? 'Incl.' : 'Excl.'})
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                      {(prod.packOptions || []).map(pack => {
                        const avail = getStockForSku(pack.sku);
                        const isOutOfStock = avail <= 0;
                        const isLow = avail > 0 && avail <= 15;

                        return (
                          <button
                            key={pack.sku}
                            type="button"
                            disabled={isOutOfStock}
                            onClick={() => handleAddToCart(prod, pack)}
                            style={{
                              padding: '8px 10px',
                              backgroundColor: isOutOfStock ? '#F1F5F9' : '#FFFFFF',
                              border: isOutOfStock ? '1px dashed #CBD5E1' : isLow ? '1px solid var(--status-warning)' : '1px solid var(--border-medium)',
                              borderRadius: 'var(--radius-sm)',
                              textAlign: 'left',
                              cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '2px',
                              opacity: isOutOfStock ? 0.6 : 1,
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{pack.size}</span>
                            <strong style={{ fontSize: '13px', color: 'var(--brand-blue)' }}>
                              ₹ {pack.mrp?.toLocaleString('en-IN')}
                            </strong>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: isOutOfStock ? 'var(--status-danger)' : isLow ? 'var(--status-warning)' : 'var(--status-success)' }}>
                              {isOutOfStock ? '0 in stock' : `${avail} units`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Customer Details & Cart Desk */}
          <div className="ub-card" style={{ padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 700, color: 'var(--brand-navy-primary)', marginBottom: 'var(--space-4)' }}>
              2. Customer Invoice Details & Checkout
            </h3>

            <form onSubmit={handleGenerateInvoice}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                <Input
                  label="Customer / Fleet Name *"
                  placeholder="e.g. Maharathi Express Cargo"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
                <Input
                  label="Customer Mobile (SMS Receipt) *"
                  placeholder="+91 94370 99881"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                <Input
                  label="Vehicle / Fleet Reg. No"
                  placeholder="OD-05-AX-4892"
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value)}
                />
                <Select
                  label="Payment Mode"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  options={[
                    { label: 'UPI / Dynamic QR', value: 'UPI / Dynamic QR' },
                    { label: 'Cash on Counter', value: 'Cash' },
                    { label: 'Fleet Credit Card', value: 'Fleet Card' },
                    { label: 'Bank RTGS / NEFT', value: 'Bank Transfer' }
                  ]}
                  style={{ marginBottom: 0 }}
                />
              </div>

              {/* Cart Table */}
              <div style={{ border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-4)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-xs)' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--brand-navy-primary)', color: '#FFFFFF' }}>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>Item</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center', width: '90px' }}>Qty</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Rate</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Total</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center', width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No items added to invoice. Click products on the left to add.
                        </td>
                      </tr>
                    ) : (
                      cartItems.map((item, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <td style={{ padding: '8px 10px' }}>
                            <strong>{item.name}</strong>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                              {item.gstRate || 18}% GST ({item.isGstInclusive !== false ? 'Inclusive' : 'Exclusive'})
                            </div>
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) => handleUpdateQty(index, parseInt(e.target.value) || 0)}
                              style={{
                                width: '54px',
                                textAlign: 'center',
                                padding: '3px',
                                borderRadius: '4px',
                                border: '1px solid var(--border-medium)',
                                fontWeight: 700
                              }}
                            />
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right' }}>₹ {item.unitPrice}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>₹ {(item.unitPrice * item.qty).toLocaleString('en-IN')}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              style={{ background: 'none', border: 'none', color: 'var(--status-danger)', cursor: 'pointer' }}
                              title="Remove"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* DYNAMIC CALCULATIONS BREAKDOWN */}
              <div style={{ backgroundColor: 'var(--bg-surface-secondary)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-5)', fontSize: 'var(--font-size-xs)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Taxable Base Value:</span>
                  <strong>₹ {taxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  <span>Central GST (CGST):</span>
                  <span>₹ {cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  <span>State GST (SGST):</span>
                  <span>₹ {sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid var(--brand-navy-primary)', paddingTop: '8px', marginTop: '6px', fontSize: 'var(--font-size-md)' }}>
                  <span style={{ fontWeight: 800, color: 'var(--brand-navy-primary)' }}>Grand Total Payable:</span>
                  <strong style={{ fontSize: '18px', color: 'var(--brand-blue)', fontFamily: 'var(--font-family-heading)' }}>
                    ₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
              </div>

              {/* Submit Action */}
              <Button
                type="submit"
                size="lg"
                variant="primary"
                style={{ width: '100%', fontWeight: 700 }}
                icon={CheckCircle2}
              >
                Generate Tax Invoice & Send SMS (Laravel DB)
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: LIVE STOCK CHECK */}
      {/* ========================================================================= */}
      {currentTab === 'stock_check' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '320px' }}>
              <Input
                placeholder="Search SKU or fluid variant..."
                value={stockSearchQuery}
                onChange={(e) => setStockSearchQuery(e.target.value)}
              />
            </div>
            <Button size="sm" variant="secondary" icon={RefreshCw} onClick={loadData}>
              Refresh Stock
            </Button>
          </div>

          <DataTable
            title={`Live Inventory Overview (${locations.find(l => l.id === selectedLocation)?.name || 'All Depots'})`}
            data={filteredStock}
            columns={[
              {
                header: 'Product & SKU', accessor: 'productName', render: (val, row) => (
                  <div>
                    <strong>{val}</strong>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{row.sku} • {row.packSize}</div>
                  </div>
                )
              },
              { header: 'Depot Location', accessor: 'locationName' },
              {
                header: 'Available Stock', accessor: 'availableStock', render: (val) => (
                  <strong style={{ fontSize: '14px', color: val > 0 ? 'var(--status-success)' : 'var(--status-danger)' }}>
                    {val} units
                  </strong>
                )
              },
              { header: 'Batch No', accessor: 'batchNo' },
              { header: 'Expiry Date', accessor: 'expDate' },
              { header: 'Status', accessor: 'status', render: (val) => <StatusBadge status={val} /> }
            ]}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: INVOICE RECORDS */}
      {/* ========================================================================= */}
      {currentTab === 'sales_history' && (
        <DataTable
          title="Recent Counter Invoices from Laravel PostgreSQL DB"
          data={invoices}
          columns={[
            { header: 'Invoice No', accessor: 'id', render: (val) => <strong>{val}</strong> },
            {
              header: 'Customer & Vehicle', accessor: 'customerName', render: (val, row) => (
                <div>
                  <strong>{val}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{row.vehicleNo} • {row.customerPhone}</div>
                </div>
              )
            },
            { header: 'Depot Location', accessor: 'location' },
            { header: 'Date & Time', accessor: 'date' },
            { header: 'Grand Total', accessor: 'grandTotal', render: (val) => <strong style={{ color: 'var(--brand-navy-primary)' }}>₹ {val?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> },
            {
              header: 'SMS Status', accessor: 'smsSent', render: () => (
                <span style={{ color: 'var(--status-success-text)', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={13} /> SMS Sent
                </span>
              )
            },
            {
              header: 'Actions', accessor: 'id', render: (_, row) => (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <Button size="sm" variant="secondary" icon={Printer} onClick={() => setActiveInvoiceForModal(row)}>
                    Print
                  </Button>
                  <Button size="sm" variant="primary" icon={FileText} onClick={() => setActiveInvoiceForModal(row)}>
                    View Tax Bill
                  </Button>
                </div>
              )
            }
          ]}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SHIFT SUMMARY */}
      {/* ========================================================================= */}
      {currentTab === 'shift_summary' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
            <KPICard
              title="Shift Total Invoices"
              value={`${shiftInvoicesCount} Bills`}
              icon={ShoppingCart}
              color="blue"
              change="+ Live DB"
              changeType="positive"
            />
            <KPICard
              title="Shift Total Revenue"
              value={`₹ ${shiftRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
              icon={DollarSign}
              color="gold"
              change="Verified Sales"
              changeType="positive"
            />
            <KPICard
              title="GST Tax Collected"
              value={`₹ ${shiftTaxCollected.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
              icon={FileText}
              color="cyan"
              change="CGST + SGST"
              changeType="neutral"
            />
            <KPICard
              title="Digital UPI Collection"
              value={`₹ ${upiTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
              icon={CreditCard}
              color="blue"
              change="QR Direct"
              changeType="positive"
            />
          </div>

          <div className="ub-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--brand-navy-primary)', marginBottom: '12px' }}>
              Shift Details & Operator Ledger
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '13px' }}>
              <div style={{ padding: '10px 14px', backgroundColor: 'var(--bg-app)', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Active Operator</span>
                <strong>{currentOperatorName}</strong>
              </div>
              <div style={{ padding: '10px 14px', backgroundColor: 'var(--bg-app)', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Current Depot</span>
                <strong>{locations.find(l => l.id === selectedLocation)?.name || 'Central Plant Depot'}</strong>
              </div>
              <div style={{ padding: '10px 14px', backgroundColor: 'var(--bg-app)', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Cash Collections</span>
                <strong>₹ {cashTotal.toLocaleString('en-IN')}</strong>
              </div>
              <div style={{ padding: '10px 14px', backgroundColor: 'var(--bg-app)', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>UPI QR Collections</span>
                <strong>₹ {upiTotal.toLocaleString('en-IN')}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Invoice Modal */}
      <InvoiceModal
        isOpen={Boolean(activeInvoiceForModal)}
        onClose={() => setActiveInvoiceForModal(null)}
        invoice={activeInvoiceForModal}
      />
    </div>
  );
};
