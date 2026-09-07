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
  DollarSign,
  Tag,
  Percent,
  X,
  Minus
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { StatusBadge } from '../components/ui/StatusBadge';
import { DataTable } from '../components/ui/DataTable';
import { KPICard } from '../components/ui/KPICard';
import { InvoiceModal } from '../components/ui/InvoiceModal';
import { Modal } from '../components/ui/Modal';
import {
  InventoryAPI,
  SalesAPI,
  ProductAPI,
  PromotionAPI,
  DistributorOrderAPI,
  DistributorAPI
} from '../services/api';
import { ROLES } from '../config/roles';

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

  const currentOperatorName = authUser?.name || '';

  // Helper to extract assigned depot for sales operator
  const getOperatorAssignedDepot = () => {
    return authUser?.assignedDepot || authUser?.assigned_depot || authUser?.stationDepot || authUser?.organization || '';
  };

  const assignedDepotName = getOperatorAssignedDepot();
  const isOperator = authUser?.role === ROLES.OPERATOR;

  const filterLocationsForUser = (allLocs) => {
    if (!isOperator || !assignedDepotName) {
      return allLocs;
    }
    return allLocs.filter(l =>
      l.name.toLowerCase().trim() === assignedDepotName.toLowerCase().trim() ||
      l.name.toLowerCase().includes(assignedDepotName.toLowerCase()) ||
      assignedDepotName.toLowerCase().includes(l.name.toLowerCase())
    );
  };

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

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [partPaymentMethod, setPartPaymentMethod] = useState('UPI');
  const [paymentRef, setPaymentRef] = useState('');

  // Approved B2B Distributor Orders State
  const [approvedOrders, setApprovedOrders] = useState([]);
  const [selectedDistributorOrder, setSelectedDistributorOrder] = useState(null);
  const [isB2BModalOpen, setIsB2BModalOpen] = useState(false);
  const [b2bPaymentMode, setB2bPaymentMode] = useState('FULL_CREDIT'); // 'FULL_PAID' | 'FULL_CREDIT' | 'PART_CREDIT'
  const [partPaymentAmount, setPartPaymentAmount] = useState('');

  // Cart State
  const [cartItems, setCartItems] = useState([]);
  const [posError, setPosError] = useState('');
  const [posSuccess, setPosSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Discount & Coupon State
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [discountType, setDiscountType] = useState('none'); // 'none' | 'percent' | 'amount' | 'coupon'
  const [discountValue, setDiscountValue] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponError, setCouponError] = useState('');

  const handleApplyCouponByCode = (codeToApply) => {
    const code = (codeToApply || couponCodeInput).trim().toUpperCase();
    if (!code) {
      setCouponError('Please enter a coupon code.');
      return;
    }
    const found = availableCoupons.find(p => (p.promo_code || '').trim().toUpperCase() === code);
    if (!found) {
      setCouponError(`Coupon code "${code}" is not valid or expired.`);
      return;
    }
    setAppliedCoupon(found);
    setDiscountType('coupon');
    setCouponCodeInput('');
    setCouponError('');
  };

  const handleRemoveDiscount = () => {
    setDiscountType('none');
    setDiscountValue('');
    setAppliedCoupon(null);
    setCouponCodeInput('');
    setCouponError('');
  };

  // Strict Validation Rules
  const validateCustomerName = (val) => {
    if (!val || !val.trim()) return 'Customer / Fleet Name is required.';
    if (val.trim().length < 3) return 'Customer Name must be at least 3 characters.';
    if (!/^[a-zA-Z0-9\s\.\,\-\&]{3,100}$/.test(val.trim())) {
      return 'Customer Name contains invalid characters (letters, numbers, spaces, dots, &, - only).';
    }
    return '';
  };

  const validateCustomerPhone = (val) => {
    if (!val || !val.trim()) return 'Customer Mobile is required for SMS receipt.';
    const cleanDigits = val.replace(/\D/g, '');
    if (cleanDigits.length === 10 && /^[6-9]\d{9}$/.test(cleanDigits)) {
      return '';
    }
    if (cleanDigits.length === 12 && cleanDigits.startsWith('91') && /^[6-9]/.test(cleanDigits.slice(2))) {
      return '';
    }
    return 'Enter a valid 10-digit Indian mobile number starting with 6-9 (e.g. 9853675971).';
  };

  const validateVehicleNo = (val) => {
    if (!val || !val.trim()) return ''; // Optional
    const clean = val.trim().toUpperCase().replace(/[\s\-]/g, '');
    // Standard Indian vehicle plate: 2 letters (state) + 1-2 digits (RTO) + optional 0-3 letters (series) + 4 digits
    const standardPlate = /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/;
    // Bharat Series (BH): e.g. 22BH1234AA
    const bharatPlate = /^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$/;
    // Counter sale alias
    const counterKeyword = /^(COUNTER|WALKIN|DIRECT)$/i;

    if (!standardPlate.test(clean) && !bharatPlate.test(clean) && !counterKeyword.test(clean)) {
      return 'Invalid vehicle registration format (e.g. OD05AX4892, 22BH1234AA, or leave blank).';
    }
    return '';
  };

  const validatePaymentRef = (method, ref) => {
    if (method === 'Cash') return '';
    const trimmed = (ref || '').trim();
    if (!trimmed) {
      return method.includes('UPI')
        ? 'UPI UTR / Reference number is required.'
        : 'Bank UTR / Transaction Reference number is required.';
    }
    if (trimmed.length < 4) {
      return 'Reference / UTR must be at least 4 characters.';
    }
    return '';
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    setCustomerName(val);
    setFieldErrors(prev => ({ ...prev, customerName: validateCustomerName(val) }));
  };

  const handlePhoneChange = (e) => {
    // Strictly sanitize: permit only digits and leading +
    const raw = e.target.value;
    const sanitized = raw.replace(/[^\d\+\s\-]/g, '');
    setCustomerPhone(sanitized);
    setFieldErrors(prev => ({ ...prev, customerPhone: validateCustomerPhone(sanitized) }));
  };

  const handleVehicleChange = (e) => {
    // Strictly sanitize: auto uppercase and remove invalid punctuation
    const raw = e.target.value.toUpperCase();
    const sanitized = raw.replace(/[^A-Z0-9\s\-]/g, '');
    setVehicleNo(sanitized);
    if (sanitized.trim()) {
      setFieldErrors(prev => ({ ...prev, vehicleNo: validateVehicleNo(sanitized) }));
    } else {
      setFieldErrors(prev => ({ ...prev, vehicleNo: '' }));
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      if (currentTab === 'pos_billing') {
        const [inv, prods, locs, promos, invs, appOrders] = await Promise.all([
          InventoryAPI.getAll().catch(() => []),
          ProductAPI.getAll().catch(() => []),
          InventoryAPI.getLocations().catch(() => []),
          PromotionAPI.getAll().catch(() => []),
          SalesAPI.getAllInvoices().catch(() => []),
          DistributorOrderAPI.getAll({ status: 'APPROVED' }).catch(() => [])
        ]);
        setInventory(inv || []);
        setProducts(prods || []);
        setAvailableCoupons(promos || []);
        setInvoices(invs || []);
        setApprovedOrders(appOrders || []);
        if (locs && locs.length > 0) {
          const userLocs = filterLocationsForUser(locs);
          setLocations(userLocs);
          if (userLocs.length > 0) {
            if (!selectedLocation || !userLocs.some(l => l.id === selectedLocation)) {
              setSelectedLocation(userLocs[0].id);
            }
          }
        }
      } else if (currentTab === 'stock_check') {
        const [inv, locs] = await Promise.all([
          InventoryAPI.getAll().catch(() => []),
          InventoryAPI.getLocations().catch(() => [])
        ]);
        setInventory(inv || []);
        if (locs && locs.length > 0) {
          const userLocs = filterLocationsForUser(locs);
          setLocations(userLocs);
          if (userLocs.length > 0) {
            if (!selectedLocation || !userLocs.some(l => l.id === selectedLocation)) {
              setSelectedLocation(userLocs[0].id);
            }
          }
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

  const locationInventory = inventory.filter(i => {
    if (selectedLocation) {
      return i.locationId === selectedLocation;
    }
    if (assignedDepotName) {
      return (
        i.locationName?.toLowerCase().trim() === assignedDepotName.toLowerCase().trim() ||
        (i.locationName && i.locationName.toLowerCase().includes(assignedDepotName.toLowerCase())) ||
        (i.locationName && assignedDepotName.toLowerCase().includes(i.locationName.toLowerCase()))
      );
    }
    return true;
  });

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
      const batchItem = locationInventory.find(i => i.sku === pack.sku);
      const currentBatchNo = batchItem?.batchNo || '';

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
          batchNo: currentBatchNo
        }
      ]);
    }
  };

  const handleLoadDistributorOrder = (order) => {
    setSelectedDistributorOrder(order);
    setCustomerName(order.distributorCompany || order.distributorName || '');
    setCustomerPhone(order.distributorPhone || '');
    setVehicleNo('DEPOT DISPATCH');
    setPaymentMethod('Credit');
    setB2bPaymentMode('FULL_CREDIT');
    setPartPaymentAmount('');
    setPartPaymentMethod('UPI');
    setPaymentRef('');
    setPosError('');
    setFieldErrors({});

    // Load items at wholesale distributor base rates
    const newCart = (order.items || []).map(it => {
      const batchItem = locationInventory.find(i => i.sku === it.sku);
      return {
        sku: it.sku,
        name: `${it.productName} (${it.packSize})`,
        packSize: it.packSize,
        qty: parseInt(it.quantity, 10),
        unitPrice: parseFloat(it.unitPrice || 0),
        gstRate: 18,
        isGstInclusive: true,
        batchNo: batchItem?.batchNo || '',
        availableStock: batchItem?.availableStock ?? 0
      };
    });

    setCartItems(newCart);
    setIsB2BModalOpen(false);
    setPosSuccess(`Loaded approved B2B Order #${order.orderNumber} for ${order.distributorCompany}!`);
  };

  const handleClearDistributorOrder = () => {
    setSelectedDistributorOrder(null);
    setPaymentMethod('UPI');
    setB2bPaymentMode('FULL_CREDIT');
    setPartPaymentAmount('');
    setPartPaymentMethod('UPI');
    setCartItems([]);
    setCustomerName('');
    setCustomerPhone('');
    setVehicleNo('');
    setPaymentRef('');
    setFieldErrors({});
    setPosError('');
    setPosSuccess('');
  };

  const handleUpdateQtyRaw = (index, newQty) => {
    setPosError('');
    const item = cartItems[index];
    if (!item) return;

    if (newQty === '') {
      const updated = [...cartItems];
      updated[index].qty = '';
      setCartItems(updated);
      return;
    }

    const availableStock = getStockForSku(item.sku);
    if (newQty > availableStock) {
      setPosError(`Anti-Overbilling Protection: Cannot bill ${newQty} units. Only ${availableStock} units physically in stock.`);
      const updated = [...cartItems];
      updated[index].qty = availableStock;
      setCartItems(updated);
      return;
    }

    const updated = [...cartItems];
    updated[index].qty = Math.max(0, newQty);
    setCartItems(updated);
  };

  const handleDecrementQty = (index) => {
    const item = cartItems[index];
    const current = parseInt(item.qty, 10) || 1;
    if (current <= 1) {
      handleRemoveItem(index);
    } else {
      handleUpdateQtyRaw(index, current - 1);
    }
  };

  const handleIncrementQty = (index) => {
    const item = cartItems[index];
    const current = parseInt(item.qty, 10) || 0;
    handleUpdateQtyRaw(index, current + 1);
  };

  const handleRemoveItem = (index) => {
    const updated = cartItems.filter((_, i) => i !== index);
    setCartItems(updated);
  };

  // Dynamic Product-Wise Billing Totals with Discount Support
  const subtotal = cartItems.reduce((acc, i) => acc + (i.unitPrice * (parseInt(i.qty, 10) || 0)), 0);

  // Calculate discount
  let calculatedDiscount = 0;
  let discountLabel = '';

  if (discountType === 'percent') {
    const pct = Math.max(0, Math.min(100, parseFloat(discountValue) || 0));
    calculatedDiscount = (subtotal * pct) / 100;
    discountLabel = `${pct}% OFF`;
  } else if (discountType === 'amount') {
    const amt = Math.max(0, parseFloat(discountValue) || 0);
    calculatedDiscount = Math.min(subtotal, amt);
    discountLabel = `₹ ${amt} OFF`;
  } else if (discountType === 'coupon' && appliedCoupon) {
    const text = appliedCoupon.discount_percent || '';
    const matchPct = text.match(/(\d+(\.\d+)?)\s*%/);
    const matchAmt = text.match(/₹\s*(\d+(\.\d+)?)/);
    if (matchPct) {
      const pct = parseFloat(matchPct[1]);
      calculatedDiscount = (subtotal * pct) / 100;
      discountLabel = `Coupon ${appliedCoupon.promo_code} (${pct}%)`;
    } else if (matchAmt) {
      const amt = parseFloat(matchAmt[1]);
      calculatedDiscount = Math.min(subtotal, amt);
      discountLabel = `Coupon ${appliedCoupon.promo_code} (₹${amt})`;
    } else {
      calculatedDiscount = (subtotal * 10) / 100;
      discountLabel = `Coupon ${appliedCoupon.promo_code} (10%)`;
    }
  }
  calculatedDiscount = Math.round(calculatedDiscount * 100) / 100;

  const discountRatio = subtotal > 0 ? (calculatedDiscount / subtotal) : 0;
  let totalTaxable = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let calculatedGrandTotal = 0;

  cartItems.forEach(item => {
    const numQty = parseInt(item.qty, 10) || 0;
    const rawLine = item.unitPrice * numQty;
    const lineDiscount = rawLine * discountRatio;
    const lineNet = Math.max(0, rawLine - lineDiscount);
    const rate = item.gstRate || 18;
    const isIncl = item.isGstInclusive !== false;

    if (isIncl) {
      const lineTaxable = lineNet / (1 + (rate / 100));
      const lineTax = lineNet - lineTaxable;
      totalTaxable += lineTaxable;
      totalCgst += (lineTax / 2);
      totalSgst += (lineTax / 2);
      calculatedGrandTotal += lineNet;
    } else {
      const lineTax = lineNet * (rate / 100);
      totalTaxable += lineNet;
      totalCgst += (lineTax / 2);
      totalSgst += (lineTax / 2);
      calculatedGrandTotal += (lineNet + lineTax);
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

    const invalidQtyItem = cartItems.find(i => !i.qty || parseInt(i.qty, 10) <= 0);
    if (invalidQtyItem) {
      setPosError(`Please specify a valid quantity for "${invalidQtyItem.name}".`);
      return;
    }

    const nameErr = validateCustomerName(customerName);
    const phoneErr = validateCustomerPhone(customerPhone);
    const vehicleErr = validateVehicleNo(vehicleNo);

    // UTR validation based on Mode of Payment
    const isCredit = paymentMethod === 'Credit';
    const isFullCredit = isCredit && b2bPaymentMode === 'FULL_CREDIT';
    const activeRefMethod = isCredit
      ? (b2bPaymentMode === 'PART_CREDIT' ? partPaymentMethod : null)
      : paymentMethod;
    const refErr = (isFullCredit || !activeRefMethod || activeRefMethod === 'Cash')
      ? ''
      : validatePaymentRef(activeRefMethod, paymentRef);

    if (nameErr || phoneErr || vehicleErr || refErr) {
      setFieldErrors({
        customerName: nameErr,
        customerPhone: phoneErr,
        vehicleNo: vehicleErr,
        paymentRef: refErr
      });
      setPosError(nameErr || phoneErr || vehicleErr || refErr);
      return;
    }

    // Clean phone number for database / SMS dispatch
    let cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      cleanPhone = cleanPhone.slice(2);
    }
    const finalPhone = cleanPhone.length === 10 ? `+91${cleanPhone}` : customerPhone.trim();
    const finalVehicle = vehicleNo.trim() ? vehicleNo.trim().toUpperCase().replace(/\s+/g, '-') : '';

    // Payment Settlement & Credit Calculations
    let paidAmt = grandTotal;
    let creditAmt = 0;
    let effectivePaymentMethod = paymentMethod;

    if (isCredit) {
      if (b2bPaymentMode === 'FULL_CREDIT') {
        paidAmt = 0;
        creditAmt = grandTotal;
        effectivePaymentMethod = 'Revolving Credit (30 Days)';
      } else if (b2bPaymentMode === 'PART_CREDIT') {
        const inputPaid = parseFloat(partPaymentAmount || 0);
        if (isNaN(inputPaid) || inputPaid <= 0) {
          setPosError('Please enter a valid upfront payment amount for partial credit billing.');
          return;
        }
        if (inputPaid >= grandTotal) {
          setPosError('Upfront payment is equal to or greater than the grand total. Please choose Direct Cash/UPI for 100% upfront payment.');
          return;
        }
        paidAmt = inputPaid;
        creditAmt = Math.round((grandTotal - inputPaid) * 100) / 100;
        effectivePaymentMethod = `${partPaymentMethod} (₹${paidAmt.toLocaleString('en-IN')}) + Credit (₹${creditAmt.toLocaleString('en-IN')})`;
      }

      // Check Available Credit Limit
      if (creditAmt > 0 && selectedDistributorOrder) {
        const availableLimit = selectedDistributorOrder.availableCredit != null ? selectedDistributorOrder.availableCredit : 0;
        if (creditAmt > availableLimit) {
          setPosError(`Credit limit exceeded: Required credit ₹${creditAmt.toLocaleString('en-IN')} exceeds distributor's available limit ₹${availableLimit.toLocaleString('en-IN')}. Please collect an upfront payment of at least ₹${(creditAmt - availableLimit).toLocaleString('en-IN')}.`);
          return;
        }
      }
    } else {
      paidAmt = grandTotal;
      creditAmt = 0;
      effectivePaymentMethod = paymentMethod;
    }

    try {
      const result = await SalesAPI.createInvoice({
        customerName: customerName.trim(),
        customerPhone: finalPhone,
        vehicleNo: finalVehicle,
        locationId: selectedLocation,
        operatorName: currentOperatorName,
        items: cartItems,
        discountAmount: calculatedDiscount,
        discountType: discountType,
        couponCode: appliedCoupon?.promo_code || null,
        paymentMethod: effectivePaymentMethod,
        paymentRef: (isFullCredit || !activeRefMethod || activeRefMethod === 'Cash') ? '' : paymentRef.trim(),
        distributorId: selectedDistributorOrder?.distributorId || null,
        distributorOrderId: selectedDistributorOrder?.id || null,
        paymentMode: isCredit ? b2bPaymentMode : 'FULL_PAID',
        paidAmount: paidAmt,
        creditAmount: creditAmt
      });

      if (result.success) {
        const createdInv = {
          id: result.invoice_number,
          customerName: customerName.trim(),
          customerPhone: finalPhone,
          vehicleNo: finalVehicle,
          location: locations.find(l => l.id === selectedLocation)?.name || '',
          operatorName: currentOperatorName,
          date: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
          items: cartItems.map(item => {
            const price = parseFloat(item.unitPrice || 0);
            const q = parseInt(item.qty, 10) || 1;
            return {
              name: item.name,
              sku: item.sku,
              batchNo: item.batchNo || '',
              qty: q,
              unitPrice: price,
              amount: price * q,
              total: price * q
            };
          }),
          subtotal,
          discount: calculatedDiscount,
          taxable,
          cgst,
          sgst,
          grandTotal: result.grand_total || grandTotal,
          paymentMethod: effectivePaymentMethod,
          paymentStatus: creditAmt > 0 ? (paidAmt > 0 ? 'PART_CREDIT' : 'ON_CREDIT') : 'PAID',
          smsSent: true,
          pdfGenerated: true
        };

        // Reset form & B2B mode
        setSelectedDistributorOrder(null);
        setB2bPaymentMode('FULL_CREDIT');
        setPartPaymentAmount('');
        setCartItems([]);
        setCustomerName('');
        setCustomerPhone('');
        setVehicleNo('');
        setPaymentRef('');
        handleRemoveDiscount();
        setFieldErrors({});
        setActiveInvoiceForModal(createdInv);
        setPosSuccess(`Invoice #${createdInv.id} created successfully. Depot stock decremented and B2B order updated!`);
        loadData();
      }
    } catch (err) {
      setPosError(err.message || 'Error generating invoice on backend.');
    }
  };

  // Scoped Invoices for Operator
  const operatorInvoices = isOperator
    ? invoices.filter(inv => {
      const matchesLoc = assignedDepotName && (
        (inv.location && inv.location.toLowerCase().includes(assignedDepotName.toLowerCase())) ||
        (inv.location && assignedDepotName.toLowerCase().includes(inv.location.toLowerCase()))
      );
      const matchesOp = inv.operatorName && inv.operatorName.toLowerCase() === currentOperatorName.toLowerCase();
      return matchesLoc || matchesOp;
    })
    : invoices;

  // Shift Calculations
  const shiftInvoicesCount = operatorInvoices.length;
  const shiftRevenue = operatorInvoices.reduce((acc, inv) => acc + (parseFloat(inv.grandTotal) || 0), 0);
  const shiftTaxCollected = operatorInvoices.reduce((acc, inv) => acc + ((parseFloat(inv.cgst) || 0) + (parseFloat(inv.sgst) || 0)), 0);
  const upiTotal = operatorInvoices.filter(i => (i.paymentMethod || '').toLowerCase().includes('upi')).reduce((acc, i) => acc + (parseFloat(i.grandTotal) || 0), 0);
  const cashTotal = operatorInvoices.filter(i => (i.paymentMethod || '').toLowerCase().includes('cash')).reduce((acc, i) => acc + (parseFloat(i.grandTotal) || 0), 0);

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

        {/* Location Dropdown Switcher / Locked Assigned Hub */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Warehouse size={16} color="var(--brand-cyan)" />
          <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--brand-navy-primary)' }}>Terminal Location:</span>
          {isOperator ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                backgroundColor: 'var(--bg-surface-secondary)',
                border: '1px solid var(--border-medium)',
                borderRadius: '6px',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 700,
                color: 'var(--brand-navy-primary)'
              }}
              title="Assigned POS Dispenser Hub (Restricted to Authorized Station)"
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
              <span>{locations.find(l => l.id === selectedLocation)?.name || assignedDepotName || 'Assigned Station'}</span>
              <span style={{ fontSize: '10px', color: 'var(--brand-blue)', fontWeight: 700, backgroundColor: 'rgba(0, 200, 245, 0.12)', padding: '2px 8px', borderRadius: '4px' }}>
                Assigned Hub
              </span>
            </div>
          ) : (
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
          )}
        </div>
      </div>

      {/* Internal Tabs Nav */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-medium)', paddingBottom: '8px', flexWrap: 'wrap', overflowX: 'auto' }}>
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
        <Button
          size="sm"
          variant={approvedOrders.length > 0 ? 'gold' : 'secondary'}
          style={{
            marginLeft: 'auto',
            border: approvedOrders.length > 0 ? '1.5px solid var(--brand-gold)' : '1px solid var(--border-medium)',
            backgroundColor: approvedOrders.length > 0 ? 'rgba(6, 182, 212, 0.08)' : 'transparent',
            fontWeight: 700
          }}
          icon={Package}
          onClick={() => setIsB2BModalOpen(true)}
        >
          B2B Approved Orders {approvedOrders.length > 0 ? `(${approvedOrders.length})` : '(0)'}
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 'var(--space-6)', alignItems: 'start' }}>

          {/* LEFT COLUMN: Fast Product Picker */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="ub-card" style={{ padding: 'var(--space-5)' }}>
              <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 700, color: 'var(--brand-navy-primary)', marginBottom: 'var(--space-3)' }}>
                1. Live Stock Availability ({locations.find(l => l.id === selectedLocation)?.name || 'Depot'})
              </h3>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
                Click any pack size below to immediately add to the invoice. Real-time availability reflects selected depot.
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '4px' }}>
                      <strong style={{ fontSize: 'var(--font-size-sm)', color: 'var(--brand-navy-primary)' }}>{prod.name}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--brand-blue)', fontWeight: 700 }}>
                        {prod.category} • {prod.gstRate || 18}% GST ({prod.isGstInclusive !== false ? 'Incl.' : 'Excl.'})
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 120px), 1fr))', gap: '8px' }}>
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
                              padding: '10px 12px',
                              backgroundColor: isOutOfStock ? 'var(--bg-surface-secondary)' : 'var(--bg-surface)',
                              border: isOutOfStock ? '1px dashed var(--border-medium)' : isLow ? '1.5px solid var(--status-warning)' : '1.5px solid var(--border-medium)',
                              borderRadius: 'var(--radius-sm)',
                              textAlign: 'left',
                              cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '3px',
                              opacity: isOutOfStock ? 0.75 : 1,
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{pack.size}</span>
                            <strong style={{ fontSize: '14px', fontWeight: 800, color: 'var(--brand-blue)' }}>
                              ₹ {pack.mrp?.toLocaleString('en-IN')}
                            </strong>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: isOutOfStock ? '#EF4444' : isLow ? '#F59E0B' : '#10B981' }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 700, color: 'var(--brand-navy-primary)', margin: 0 }}>
                2. Customer Invoice Details & Checkout
              </h3>
              {approvedOrders.length > 0 && !selectedDistributorOrder && (
                <button
                  type="button"
                  onClick={() => setIsB2BModalOpen(true)}
                  style={{
                    backgroundColor: '#06B6D4',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '4px 12px',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(6, 182, 212, 0.3)'
                  }}
                >
                  <Package size={14} />
                  <span>{approvedOrders.length} Approved B2B Orders</span>
                </button>
              )}
            </div>

            {/* Active B2B Distributor Order Banner */}
            {selectedDistributorOrder && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'rgba(6, 182, 212, 0.12)',
                border: '1.5px solid #06B6D4',
                padding: '12px 14px',
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                <div>
                  <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#06B6D4', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Authorized B2B Distributor Dispatch Mode
                  </div>
                  <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                    {selectedDistributorOrder.orderNumber}: {selectedDistributorOrder.distributorCompany}
                  </strong>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Contact: {selectedDistributorOrder.distributorName} ({selectedDistributorOrder.distributorPhone}) • Avail Credit: <strong style={{ color: 'var(--brand-blue)' }}>₹{(selectedDistributorOrder.availableCredit ?? 0).toLocaleString('en-IN')}</strong>
                  </div>
                </div>
                <Button size="xs" variant="secondary" onClick={handleClearDistributorOrder}>
                  Cancel B2B Mode
                </Button>
              </div>
            )}

            <form onSubmit={handleGenerateInvoice}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                <Input
                  label="Customer / Fleet Name *"
                  placeholder="e.g. Maharathi Express Cargo"
                  value={customerName}
                  onChange={handleNameChange}
                  onBlur={() => setFieldErrors(prev => ({ ...prev, customerName: validateCustomerName(customerName) }))}
                  error={fieldErrors.customerName}
                  required
                />
                <Input
                  label="Customer Mobile (SMS Receipt) *"
                  placeholder="e.g. 9437099881 or +91 9437099881"
                  value={customerPhone}
                  onChange={handlePhoneChange}
                  onBlur={() => setFieldErrors(prev => ({ ...prev, customerPhone: validateCustomerPhone(customerPhone) }))}
                  error={fieldErrors.customerPhone}
                  maxLength={15}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                <Input
                  label="Vehicle / Fleet Reg. No"
                  placeholder="e.g. OD-05-AX-4892 (or leave blank)"
                  value={vehicleNo}
                  onChange={handleVehicleChange}
                  onBlur={() => setFieldErrors(prev => ({ ...prev, vehicleNo: validateVehicleNo(vehicleNo) }))}
                  error={fieldErrors.vehicleNo}
                  maxLength={20}
                />
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                    Mode of Payment
                  </label>
                  <Select
                    value={paymentMethod}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPaymentMethod(val);
                      if (val === 'Credit') {
                        setB2bPaymentMode('FULL_CREDIT');
                      } else {
                        setB2bPaymentMode('FULL_PAID');
                      }
                      setFieldErrors(prev => ({ ...prev, paymentRef: '' }));
                      setPosError('');
                    }}
                    options={[
                      { label: 'UPI / QR Transfer', value: 'UPI' },
                      { label: 'NEFT / RTGS Bank Transfer', value: 'Bank Transfer' },
                      { label: 'Direct Cash', value: 'Cash' },
                      { label: 'Credit (Revolving Credit)', value: 'Credit' }
                    ]}
                    style={{ marginBottom: 0 }}
                  />
                </div>
              </div>

              {/* Credit Settlement Options - Shown only when Mode of Payment is Credit */}
              {paymentMethod === 'Credit' && (
                <div style={{ backgroundColor: 'var(--bg-app)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-medium)', marginBottom: 'var(--space-3)' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Credit Settlement Options
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: b2bPaymentMode === 'PART_CREDIT' ? '10px' : 0 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setB2bPaymentMode('FULL_CREDIT');
                        setFieldErrors(prev => ({ ...prev, paymentRef: '' }));
                        setPosError('');
                      }}
                      style={{
                        padding: '8px 6px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        border: b2bPaymentMode === 'FULL_CREDIT' ? '2px solid var(--brand-blue)' : '1px solid var(--border-medium)',
                        backgroundColor: b2bPaymentMode === 'FULL_CREDIT' ? 'rgba(0, 143, 224, 0.12)' : 'var(--bg-surface)',
                        color: b2bPaymentMode === 'FULL_CREDIT' ? 'var(--text-link)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 150ms ease'
                      }}
                    >
                      100% Revolving Credit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setB2bPaymentMode('PART_CREDIT');
                        setPosError('');
                      }}
                      style={{
                        padding: '8px 6px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        border: b2bPaymentMode === 'PART_CREDIT' ? '2px solid var(--brand-blue)' : '1px solid var(--border-medium)',
                        backgroundColor: b2bPaymentMode === 'PART_CREDIT' ? 'rgba(0, 143, 224, 0.12)' : 'var(--bg-surface)',
                        color: b2bPaymentMode === 'PART_CREDIT' ? 'var(--text-link)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 150ms ease'
                      }}
                    >
                      Split Part Payment
                    </button>
                  </div>

                  {b2bPaymentMode === 'PART_CREDIT' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-medium)', alignItems: 'flex-start' }}>
                      <Input
                        label="Upfront Paid (₹) *"
                        type="number"
                        min="1"
                        step="any"
                        placeholder="e.g. 15000"
                        value={partPaymentAmount}
                        onChange={e => setPartPaymentAmount(e.target.value)}
                        required
                        style={{ marginBottom: 0 }}
                      />
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                          Upfront Mode *
                        </label>
                        <Select
                          value={partPaymentMethod}
                          onChange={e => {
                            setPartPaymentMethod(e.target.value);
                            setFieldErrors(prev => ({ ...prev, paymentRef: '' }));
                          }}
                          options={[
                            { label: 'UPI / QR', value: 'UPI' },
                            { label: 'Bank Transfer', value: 'Bank Transfer' },
                            { label: 'Direct Cash', value: 'Cash' }
                          ]}
                          style={{ marginBottom: 0 }}
                        />
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                          Remaining on Credit
                        </span>
                        <strong style={{ fontSize: '14px', color: '#EF4444', display: 'block', paddingTop: '6px' }}>
                          ₹ {Math.max(0, grandTotal - (parseFloat(partPaymentAmount) || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </strong>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Dynamic UTR / Payment Ref Input for Digital / Bank Payments */}
              {((paymentMethod !== 'Cash' && paymentMethod !== 'Credit') || (paymentMethod === 'Credit' && b2bPaymentMode === 'PART_CREDIT' && partPaymentMethod !== 'Cash')) && (
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <Input
                    label={
                      paymentMethod === 'Credit'
                        ? (partPaymentMethod.includes('UPI') ? 'Upfront UPI UTR / Transaction Ref No *' : 'Upfront Bank UTR / IMPS Reference No *')
                        : (paymentMethod.includes('UPI') ? 'UPI UTR / Transaction Ref No *' : 'Bank UTR / IMPS Reference No *')
                    }
                    placeholder={
                      (paymentMethod === 'Credit' ? partPaymentMethod : paymentMethod).includes('UPI')
                        ? 'e.g. 423456789012 (12-digit UPI UTR)'
                        : 'e.g. HDFCR5202609021234'
                    }
                    value={paymentRef}
                    onChange={(e) => {
                      setPaymentRef(e.target.value);
                      if (fieldErrors.paymentRef) {
                        setFieldErrors(prev => ({ ...prev, paymentRef: '' }));
                      }
                    }}
                    onBlur={() => {
                      const refMethod = paymentMethod === 'Credit' ? partPaymentMethod : paymentMethod;
                      setFieldErrors(prev => ({ ...prev, paymentRef: validatePaymentRef(refMethod, paymentRef) }));
                    }}
                    error={fieldErrors.paymentRef}
                    required
                    style={{ marginBottom: 0 }}
                  />
                </div>
              )}

              {/* Cart Table */}
              <div style={{ border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-4)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-xs)' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#0B1E40', color: '#FFFFFF' }}>
                      <th style={{ padding: '8px 10px', textAlign: 'left', color: '#FFFFFF' }}>Item</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center', width: '100px', color: '#FFFFFF' }}>Qty</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', color: '#FFFFFF' }}>Rate</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', color: '#FFFFFF' }}>Total</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center', width: '40px', color: '#FFFFFF' }}></th>
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
                          <td style={{ padding: '10px 12px' }}>
                            <strong style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'block' }}>{item.name}</strong>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '2px' }}>
                              {item.gstRate || 18}% GST ({item.isGstInclusive !== false ? 'Inclusive' : 'Exclusive'})
                            </div>
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--border-medium)', borderRadius: '4px', overflow: 'hidden', backgroundColor: 'var(--bg-surface)' }}>
                              <button
                                type="button"
                                onClick={() => handleDecrementQty(index)}
                                style={{
                                  width: '26px',
                                  height: '26px',
                                  border: 'none',
                                  backgroundColor: 'var(--bg-surface-secondary)',
                                  color: 'var(--text-primary)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'background-color 0.15s'
                                }}
                                title="Decrease Quantity (-)"
                              >
                                <Minus size={13} />
                              </button>
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={item.qty}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, '');
                                  if (val === '') {
                                    handleUpdateQtyRaw(index, '');
                                  } else {
                                    handleUpdateQtyRaw(index, parseInt(val, 10));
                                  }
                                }}
                                onBlur={() => {
                                  if (!item.qty || parseInt(item.qty, 10) < 1) {
                                    handleUpdateQtyRaw(index, 1);
                                  }
                                }}
                                style={{
                                  width: '40px',
                                  height: '26px',
                                  textAlign: 'center',
                                  padding: '0',
                                  border: 'none',
                                  borderLeft: '1px solid var(--border-light)',
                                  borderRight: '1px solid var(--border-light)',
                                  fontWeight: 700,
                                  fontSize: '13px',
                                  backgroundColor: 'var(--bg-surface)',
                                  color: 'var(--text-primary)'
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => handleIncrementQty(index)}
                                style={{
                                  width: '26px',
                                  height: '26px',
                                  border: 'none',
                                  backgroundColor: 'var(--bg-surface-secondary)',
                                  color: 'var(--text-primary)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'background-color 0.15s'
                                }}
                                title="Increase Quantity (+)"
                              >
                                <Plus size={13} />
                              </button>
                            </div>
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>₹ {item.unitPrice}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: 'var(--brand-blue)', fontSize: '14px' }}>₹ {(item.unitPrice * (parseInt(item.qty, 10) || 0)).toLocaleString('en-IN')}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                              title="Remove"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* DISCOUNT & COUPON SECTION */}
              <div style={{
                marginBottom: 'var(--space-4)',
                padding: '12px',
                backgroundColor: 'var(--bg-surface-secondary)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-medium)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Tag size={14} color="var(--brand-blue)" />
                    <strong style={{ fontSize: '12px', color: 'var(--brand-navy-primary)' }}>
                      Counter Discount & Coupons
                    </strong>
                  </div>
                  {discountType !== 'none' && (
                    <button
                      type="button"
                      onClick={handleRemoveDiscount}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--status-danger)',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}
                    >
                      <X size={12} /> Clear Discount
                    </button>
                  )}
                </div>

                {/* Type Selector Tabs */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', backgroundColor: 'var(--bg-surface)', padding: '3px', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                  {[
                    { id: 'none', label: 'No Discount' },
                    { id: 'percent', label: 'Percentage (%)' },
                    { id: 'amount', label: 'Fixed Amount (₹)' },
                    { id: 'coupon', label: 'Apply Coupon' }
                  ].map(mode => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => {
                        setDiscountType(mode.id);
                        if (mode.id === 'none') {
                          setDiscountValue('');
                          setAppliedCoupon(null);
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '5px 4px',
                        fontSize: '11px',
                        fontWeight: discountType === mode.id ? 700 : 500,
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: discountType === mode.id ? 'var(--brand-blue)' : 'transparent',
                        color: discountType === mode.id ? '#FFFFFF' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>

                {/* Mode 1: Percentage Input & Quick Preset Chips */}
                {discountType === 'percent' && (
                  <div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Discount % (e.g. 10)"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '6px 10px',
                          fontSize: '12px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-medium)',
                          fontWeight: 600
                        }}
                      />
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-blue)' }}>% OFF</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[5, 10, 15, 20].map(pct => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setDiscountValue(pct)}
                          style={{
                            padding: '3px 8px',
                            fontSize: '11px',
                            borderRadius: '4px',
                            border: Number(discountValue) === pct ? '1px solid var(--brand-blue)' : '1px solid var(--border-light)',
                            backgroundColor: Number(discountValue) === pct ? 'rgba(0, 143, 224, 0.2)' : 'var(--bg-surface)',
                            color: Number(discountValue) === pct ? 'var(--brand-blue-light, #00C8F5)' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mode 2: Fixed Amount Input & Quick Preset Chips */}
                {discountType === 'amount' && (
                  <div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                      <input
                        type="number"
                        min="0"
                        max={subtotal}
                        placeholder="Discount in ₹ (e.g. 100)"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '6px 10px',
                          fontSize: '12px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-medium)',
                          backgroundColor: 'var(--bg-surface)',
                          color: 'var(--text-primary)',
                          fontWeight: 600
                        }}
                      />
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-blue)' }}>₹ OFF</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[50, 100, 200, 500].map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setDiscountValue(amt)}
                          style={{
                            padding: '3px 8px',
                            fontSize: '11px',
                            borderRadius: '4px',
                            border: Number(discountValue) === amt ? '1px solid var(--brand-blue)' : '1px solid var(--border-light)',
                            backgroundColor: Number(discountValue) === amt ? 'rgba(0, 143, 224, 0.2)' : 'var(--bg-surface)',
                            color: Number(discountValue) === amt ? 'var(--brand-blue-light, #00C8F5)' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                        >
                          ₹ {amt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mode 3: Apply Coupon */}
                {discountType === 'coupon' && (
                  <div>
                    {appliedCoupon ? (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: 'var(--status-success-bg, rgba(16, 185, 129, 0.12))',
                        border: '1px solid var(--status-success-border, #10B981)',
                        padding: '8px 12px',
                        borderRadius: '6px'
                      }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Sparkles size={14} color="var(--status-success)" />
                            <strong style={{ fontSize: '12px', color: 'var(--status-success)' }}>
                              {appliedCoupon.promo_code} Applied!
                            </strong>
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {appliedCoupon.title} • {appliedCoupon.discount_percent || 'Special Deal'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveDiscount}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--status-danger, #DC2626)',
                            cursor: 'pointer',
                            padding: '2px'
                          }}
                          title="Remove Coupon"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                          <input
                            type="text"
                            placeholder="ENTER PROMO CODE (e.g. FESTIVE10)"
                            value={couponCodeInput}
                            onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                            style={{
                              flex: 1,
                              padding: '6px 10px',
                              fontSize: '11px',
                              borderRadius: '4px',
                              border: '1px solid var(--border-medium)',
                              backgroundColor: 'var(--bg-surface)',
                              color: 'var(--text-primary)',
                              fontWeight: 700,
                              textTransform: 'uppercase'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleApplyCouponByCode()}
                            style={{
                              padding: '6px 14px',
                              backgroundColor: 'var(--brand-blue)',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Apply
                          </button>
                        </div>
                        {couponError && (
                          <span style={{ fontSize: '11px', color: 'var(--status-danger)', display: 'block', marginBottom: '6px' }}>
                            {couponError}
                          </span>
                        )}

                        {/* Active Broadcast Coupons List */}
                        {availableCoupons.length > 0 && (
                          <div>
                            <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                              ACTIVE AVAILABLE COUPONS:
                            </span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {availableCoupons.map(promo => (
                                <button
                                  key={promo.id}
                                  type="button"
                                  onClick={() => handleApplyCouponByCode(promo.promo_code)}
                                  style={{
                                    padding: '4px 8px',
                                    backgroundColor: 'var(--bg-surface)',
                                    border: '1px dashed var(--brand-blue)',
                                    borderRadius: '4px',
                                    fontSize: '10px',
                                    color: 'var(--brand-blue-light, #00C8F5)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontWeight: 600
                                  }}
                                >
                                  <Sparkles size={10} />
                                  <strong>{promo.promo_code}</strong> ({promo.discount_percent || 'Offer'})
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* DYNAMIC CALCULATIONS BREAKDOWN */}
              <div style={{ backgroundColor: 'var(--bg-surface-secondary)', padding: '14px 16px', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-5)', fontSize: 'var(--font-size-xs)', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--text-primary)' }}>
                  <span style={{ fontWeight: 600 }}>Gross Subtotal:</span>
                  <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>₹ {subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                </div>
                {calculatedDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#10B981', fontWeight: 700 }}>
                    <span>Discount ({discountLabel}):</span>
                    <span>- ₹ {calculatedDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--text-primary)' }}>
                  <span style={{ fontWeight: 600 }}>Taxable Base Value:</span>
                  <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>₹ {taxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  <span style={{ fontWeight: 600 }}>Central GST (CGST):</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹ {cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  <span style={{ fontWeight: 600 }}>State GST (SGST):</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹ {sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid var(--border-medium)', paddingTop: '10px', marginTop: '8px', fontSize: 'var(--font-size-md)' }}>
                  <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Grand Total Payable:</span>
                  <strong style={{ fontSize: '20px', color: 'var(--brand-blue)', fontFamily: 'var(--font-family-heading)', fontWeight: 800 }}>
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
                Generate Tax Invoice & Send SMS
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
          title={isOperator ? `Recent Counter Invoices (${locations.find(l => l.id === selectedLocation)?.name || assignedDepotName || 'Assigned Depot'})` : "Recent Counter Invoices from Laravel PostgreSQL DB"}
          data={operatorInvoices}
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

      {/* Approved B2B Distributor Orders Modal */}
      <Modal
        isOpen={isB2BModalOpen}
        onClose={() => setIsB2BModalOpen(false)}
        title="Approved Distributor Requisitions (Ready for Billing)"
        subtitle="Select an admin-approved B2B order to load items and generate an official GST Tax Invoice."
        maxWidth="840px"
        icon={Package}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {approvedOrders.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', backgroundColor: 'var(--bg-app)', borderRadius: '8px' }}>
              <Package size={42} style={{ color: 'var(--text-muted)', margin: '0 auto 12px auto' }} />
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--brand-navy-primary)', marginBottom: '6px' }}>
                No Approved Orders Awaiting Billing
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto' }}>
                When distributors place purchase orders from their portal and Admin approves them, they will appear here ready to convert to an invoice and deduct depot stock.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {approvedOrders.map((order) => {
                const totalAmt = parseFloat(order.totalAmount || 0);
                const availCredit = parseFloat(order.availableCredit || 0);
                const hasSufficientCredit = availCredit >= totalAmt;

                return (
                  <div
                    key={order.id}
                    style={{
                      border: '1.5px solid var(--border-medium)',
                      borderRadius: '8px',
                      padding: '16px',
                      backgroundColor: 'var(--bg-surface)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      transition: 'border-color 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <strong style={{ fontSize: '15px', color: 'var(--brand-navy-primary)' }}>
                            {order.orderNumber}
                          </strong>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: 'rgba(16, 185, 129, 0.12)',
                            color: '#059669'
                          }}>
                            {order.status || 'APPROVED'}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {order.distributorCompany}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Contact: {order.distributorName} ({order.distributorPhone}) • Date: {order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-IN') : 'Recent'}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                          Order Total
                        </div>
                        <strong style={{ fontSize: '18px', color: 'var(--brand-blue)' }}>
                          ₹ {totalAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </strong>
                        <div style={{ fontSize: '11px', color: hasSufficientCredit ? '#059669' : '#EF4444', fontWeight: 600, marginTop: '2px' }}>
                          Credit Avail: ₹ {availCredit.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>

                    {/* Items table preview */}
                    <div style={{ backgroundColor: 'var(--bg-app)', borderRadius: '6px', padding: '8px 12px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Requested Requisition Items ({(order.items || []).length}):
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                        {(order.items || []).map((it, idx) => (
                          <div key={idx} style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-medium)', paddingBottom: '4px' }}>
                            <span style={{ color: 'var(--text-primary)' }}>
                              <strong>{it.quantity}x</strong> {it.productName} ({it.packSize})
                            </span>
                            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                              @ ₹{parseFloat(it.unitPrice || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {order.deliveryAddress && (
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        <strong>Dispatch Address:</strong> {order.deliveryAddress}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '6px', borderTop: '1px solid var(--border-light)' }}>
                      <Button
                        size="sm"
                        variant="primary"
                        icon={ShoppingCart}
                        onClick={() => handleLoadDistributorOrder(order)}
                      >
                        Convert to Bill & Dispense
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* Printable Invoice Modal */}
      <InvoiceModal
        isOpen={Boolean(activeInvoiceForModal)}
        onClose={() => setActiveInvoiceForModal(null)}
        invoice={activeInvoiceForModal}
      />
    </div>
  );
};
